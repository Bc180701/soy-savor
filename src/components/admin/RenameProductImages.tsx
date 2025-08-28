import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const RenameProductImages = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleRenameImages = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      toast({
        title: "Démarrage du renommage",
        description: "Récupération des produits avec images...",
      });

      // Récupérer tous les produits avec des images Supabase
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .not('image_url', 'is', null)
        .like('image_url', '%supabase%');

      if (productsError) {
        throw new Error(`Erreur lors de la récupération des produits: ${productsError.message}`);
      }

      console.log(`${products.length} produits trouvés avec des images`);

      const processResults = [];
      const processedFiles = new Set(); // Pour éviter de traiter le même fichier plusieurs fois

      for (const product of products) {
        try {
          // Extraire le nom du fichier de l'URL
          const urlParts = (product as any).image_url.split('/');
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0]; // Retirer les paramètres de requête
          
          // Si ce fichier a déjà été traité, passer au suivant
          if (processedFiles.has(oldFileName)) {
            console.log(`Fichier ${oldFileName} déjà traité, passage au suivant`);
            continue;
          }

          // Créer le nouveau nom de fichier basé sur le nom du produit
          const fileExtension = oldFileName.split('.').pop();
          let sanitizedProductName = (product as any).name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Retirer les caractères spéciaux
            .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
            .trim();
          
          const newFileName = `${sanitizedProductName}.${fileExtension}`;
          
          console.log(`Renommage: ${oldFileName} -> ${newFileName}`);

          // Télécharger le fichier existant
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('products')
            .download(oldFileName);

          if (downloadError) {
            console.error(`Erreur lors du téléchargement de ${oldFileName}:`, downloadError);
            processResults.push({
          product: (product as any).name,
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
            console.error(`Erreur lors de l'upload de ${newFileName}:`, uploadError);
            processResults.push({
          product: (product as any).name,
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
            console.error(`Avertissement: Impossible de supprimer l'ancien fichier ${oldFileName}:`, deleteError);
          }

          // Construire la nouvelle URL
          const newImageUrl = `https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/${newFileName}`;

          // Mettre à jour tous les produits qui utilisent cette image
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: newImageUrl } as any)
            .eq('image_url', (product as any).image_url);

          if (updateError) {
            console.error(`Erreur lors de la mise à jour de l'URL pour le produit ${(product as any).name}:`, updateError);
            processResults.push({
              product: (product as any).name,
              oldFileName,
              newFileName,
              status: 'error_update',
              error: updateError.message
            });
            continue;
          }

          processedFiles.add(oldFileName);
          processResults.push({
            product: (product as any).name,
            oldFileName,
            newFileName,
            newUrl: newImageUrl,
            status: 'success'
          });

          console.log(`Succès: ${(product as any).name} -> ${newFileName}`);

        } catch (error: any) {
          console.error(`Erreur lors du traitement de ${(product as any).name}:`, error);
          processResults.push({
            product: (product as any).name,
            status: 'error',
            error: error.message
          });
        }
      }

      const successCount = processResults.filter(r => r.status === 'success').length;
      const errorCount = processResults.filter(r => r.status !== 'success').length;

      setResults(processResults);

      toast({
        title: "Renommage terminé",
        description: `${successCount} fichiers renommés avec succès, ${errorCount} erreurs`,
      });

    } catch (error: any) {
      console.error('Erreur générale:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Renommer les images de produits</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Renomme tous les fichiers d'images dans le storage Supabase avec le nom du produit correspondant.
        </p>
        
        <Button 
          onClick={handleRenameImages} 
          disabled={isProcessing}
          className="mb-4"
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isProcessing ? "Renommage en cours..." : "Démarrer le renommage"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Résultats du renommage :</h4>
          
          <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
            {results.map((result, index) => (
              <div key={index} className={`p-2 rounded mb-2 text-sm ${
                result.status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium">{result.product}</div>
                {result.status === 'success' ? (
                  <div className="text-green-700">
                    ✅ {result.oldFileName} → {result.newFileName}
                  </div>
                ) : (
                  <div className="text-red-700">
                    ❌ Erreur: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total: {results.length} | 
            Succès: {results.filter(r => r.status === 'success').length} | 
            Erreurs: {results.filter(r => r.status !== 'success').length}
          </div>
        </div>
      )}
    </div>
  );
};