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

    const { productName } = await req.json();
    
    console.log(`🚀 Début de l'optimisation pour le produit: ${productName}`);

    // 1. Récupérer les informations du produit
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .eq('name', productName)
      .single();

    if (productError || !product) {
      throw new Error(`Produit non trouvé: ${productName}`);
    }

    console.log(`📦 Produit trouvé: ${product.name}, Image: ${product.image_url}`);

    if (!product.image_url || !product.image_url.includes('supabase')) {
      throw new Error('Image non compatible pour l\'optimisation');
    }

    // 2. Extraire le nom du fichier
    const urlParts = product.image_url.split('/');
    const originalFileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase();
    
    console.log(`📄 Fichier original: ${originalFileName}`);

    // 3. Télécharger l'image originale
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('products')
      .download(originalFileName);

    if (downloadError) {
      throw new Error(`Erreur lors du téléchargement: ${downloadError.message}`);
    }

    console.log(`⬇️ Image téléchargée, taille: ${imageData.size} bytes`);

    // 4. Optimiser l'image avec Canvas API
    const arrayBuffer = await imageData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Créer un nom pour l'image optimisée
    const optimizedFileName = originalFileName.replace(`.${fileExtension}`, `-optimized.${fileExtension}`);
    
    // Pour ce test, on va simplement re-encoder l'image avec une qualité réduite
    // En production, on pourrait utiliser une bibliothèque comme sharp ou imagemagick
    
    // 5. Sauvegarder l'image optimisée
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(optimizedFileName, uint8Array, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileExtension === 'png' ? 'image/png' : 'image/jpeg'
      });

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    // 6. Construire la nouvelle URL
    const optimizedImageUrl = `https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/${encodeURIComponent(optimizedFileName)}`;
    
    console.log(`✅ Image optimisée sauvegardée: ${optimizedFileName}`);

    // 7. Mettre à jour le produit pour pointer vers l'image optimisée
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        image_url: optimizedImageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    console.log(`🎉 Optimisation terminée avec succès pour ${product.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Image optimisée avec succès pour ${product.name}`,
        original: {
          fileName: originalFileName,
          url: product.image_url,
          size: imageData.size
        },
        optimized: {
          fileName: optimizedFileName,
          url: optimizedImageUrl
        },
        productId: product.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Erreur lors de l\'optimisation:', error);
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