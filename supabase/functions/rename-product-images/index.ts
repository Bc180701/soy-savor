import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Démarrage du renommage des images de produits...');

    // Récupérer tous les produits avec des images Supabase
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%supabase%');

    if (productsError) {
      throw new Error(`Erreur lors de la récupération des produits: ${productsError.message}`);
    }

    console.log(`📊 ${products.length} produits trouvés avec des images`);

    const results = [];
    const processedFiles = new Set(); // Pour éviter de traiter le même fichier plusieurs fois

    for (const product of products) {
      try {
        // Extraire le nom du fichier de l'URL
        const urlParts = product.image_url.split('/');
        const oldFileName = urlParts[urlParts.length - 1].split('?')[0]; // Retirer les paramètres de requête
        
        // Si ce fichier a déjà été traité, passer au suivant
        if (processedFiles.has(oldFileName)) {
          console.log(`⏭️ Fichier ${oldFileName} déjà traité, passage au suivant`);
          continue;
        }

        // Créer le nouveau nom de fichier basé sur le nom du produit
        const fileExtension = oldFileName.split('.').pop();
        let sanitizedProductName = product.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Retirer les caractères spéciaux
          .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
          .trim();
        
        const newFileName = `${sanitizedProductName}.${fileExtension}`;
        
        console.log(`🔄 Renommage: ${oldFileName} -> ${newFileName}`);

        // Télécharger le fichier existant
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('products')
          .download(oldFileName);

        if (downloadError) {
          console.error(`❌ Erreur lors du téléchargement de ${oldFileName}:`, downloadError);
          results.push({
            product: product.name,
            oldFileName,
            newFileName,
            status: 'error_download',
            error: downloadError.message
          });
          continue;
        }

        // Uploader le fichier avec le nouveau nom
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(newFileName, fileData, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`❌ Erreur lors de l'upload de ${newFileName}:`, uploadError);
          results.push({
            product: product.name,
            oldFileName,
            newFileName,
            status: 'error_upload',
            error: uploadError.message
          });
          continue;
        }

        // Supprimer l'ancien fichier
        const { error: deleteError } = await supabase.storage
          .from('products')
          .remove([oldFileName]);

        if (deleteError) {
          console.error(`⚠️ Avertissement: Impossible de supprimer l'ancien fichier ${oldFileName}:`, deleteError);
        }

        // Construire la nouvelle URL
        const newImageUrl = `https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/${newFileName}`;

        // Mettre à jour tous les produits qui utilisent cette image
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: newImageUrl })
          .eq('image_url', product.image_url);

        if (updateError) {
          console.error(`❌ Erreur lors de la mise à jour de l'URL pour le produit ${product.name}:`, updateError);
          results.push({
            product: product.name,
            oldFileName,
            newFileName,
            status: 'error_update',
            error: updateError.message
          });
          continue;
        }

        processedFiles.add(oldFileName);
        results.push({
          product: product.name,
          oldFileName,
          newFileName,
          newUrl: newImageUrl,
          status: 'success'
        });

        console.log(`✅ Succès: ${product.name} -> ${newFileName}`);

      } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${product.name}:`, error);
        results.push({
          product: product.name,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status !== 'success').length;

    console.log(`🎉 Renommage terminé: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Renommage terminé: ${successCount} fichiers renommés avec succès, ${errorCount} erreurs`,
        results,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});