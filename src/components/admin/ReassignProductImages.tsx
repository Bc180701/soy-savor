import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";

export const ReassignProductImages = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleReassignImages = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      // 1. Récupérer tous les produits
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .not('image_url', 'is', null);

      if (productsError) {
        throw new Error(`Erreur lors de la récupération des produits: ${productsError.message}`);
      }

      // 2. Récupérer tous les fichiers du bucket products
      const { data: files, error: filesError } = await supabase.storage
        .from('products')
        .list();

      if (filesError) {
        throw new Error(`Erreur lors de la récupération des fichiers: ${filesError.message}`);
      }

      const processResults: any[] = [];

      // 3. Pour chaque produit, trouver l'image correspondante
      for (const product of products) {
        try {
          // Nettoyer le nom du produit pour la recherche
          const sanitizedProductName = (product as any).name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();

          // Chercher un fichier qui correspond au nom du produit
          const matchingFile = files.find(file => {
            const fileName = file.name.toLowerCase();
            const fileNameWithoutExt = fileName.split('.')[0];
            
            // Vérification exacte
            if (fileNameWithoutExt === sanitizedProductName) {
              return true;
            }
            
            // Vérification partielle
            if (fileNameWithoutExt.includes(sanitizedProductName) || 
                sanitizedProductName.includes(fileNameWithoutExt)) {
              return true;
            }
            
            return false;
          });

          if (matchingFile) {
            // Construire la nouvelle URL
            const newImageUrl = `https://tdykegnmomyyucbhslok.supabase.co/storage/v1/object/public/products/${matchingFile.name}`;
            
            // Mettre à jour le produit avec la nouvelle URL
            const { error: updateError } = await supabase
              .from('products')
              .update({ image_url: newImageUrl } as any)
              .eq('id', (product as any).id);

            if (updateError) {
              processResults.push({
                product: (product as any).name,
                status: 'error',
                error: updateError.message,
                suggestedFile: matchingFile.name
              });
            } else {
              processResults.push({
                product: (product as any).name,
                status: 'success',
                oldUrl: (product as any).image_url,
                newUrl: newImageUrl,
                matchedFile: matchingFile.name
              });
            }
          } else {
            processResults.push({
              product: (product as any).name,
              status: 'no_match',
              searchName: sanitizedProductName,
              availableFiles: files.map(f => f.name).slice(0, 5) // Montrer quelques fichiers disponibles
            });
          }
        } catch (error: any) {
          processResults.push({
            product: (product as any).name,
            status: 'error',
            error: error.message
          });
        }
      }

      setResults(processResults);

      const successCount = processResults.filter(r => r.status === 'success').length;
      const errorCount = processResults.filter(r => r.status === 'error').length;
      const noMatchCount = processResults.filter(r => r.status === 'no_match').length;

      toast({
        title: "Réassignation terminée",
        description: `${successCount} succès, ${errorCount} erreurs, ${noMatchCount} sans correspondance`,
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'no_match':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Réassigner les images aux produits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Cet outil va analyser tous les produits et tenter de les associer avec les images 
          correspondantes dans le storage en se basant sur leurs noms.
        </div>

        <Button 
          onClick={handleReassignImages} 
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Réassignation en cours...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réassigner les images
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold">Résultats de la réassignation:</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-medium">{result.product}</div>
                      <Badge variant={getBadgeVariant(result.status)} className="mt-1">
                        {result.status === 'success' ? 'Succès' : 
                         result.status === 'error' ? 'Erreur' : 
                         result.status === 'no_match' ? 'Aucune correspondance' : result.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {result.status === 'success' && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Fichier associé: {result.matchedFile}</div>
                    </div>
                  )}
                  
                  {result.status === 'error' && (
                    <div className="mt-2 text-xs text-red-600">
                      Erreur: {result.error}
                    </div>
                  )}
                  
                  {result.status === 'no_match' && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Recherché: {result.searchName}</div>
                      {result.availableFiles && (
                        <div>Fichiers disponibles: {result.availableFiles.join(', ')}...</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};