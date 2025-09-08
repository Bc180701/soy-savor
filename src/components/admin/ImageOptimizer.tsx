import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image, Zap } from "lucide-react";

export const ImageOptimizer = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const optimizeTestImage = async () => {
    setIsOptimizing(true);
    setResult(null);

    try {
      console.log("🚀 Démarrage de l'optimisation test...");

      const { data, error } = await supabase.functions.invoke('optimize-image', {
        body: { 
          productName: 'LE GRILLÉ'
        }
      });

      if (error) throw error;

      console.log("✅ Redimensionnement réussi:", data);
      setResult(data);
      
      toast({
        title: "Redimensionnement réussi",
        description: `Image redimensionnée pour ${data.original?.fileName}`,
      });

    } catch (error: any) {
      console.error("❌ Erreur de redimensionnement:", error);
      toast({
        title: "Erreur de redimensionnement",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Test de redimensionnement d'image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Teste le redimensionnement sur le produit "LE GRILLÉ". L'image originale sera remplacée par la version redimensionnée.
        </div>

        <Button 
          onClick={optimizeTestImage}
          disabled={isOptimizing}
          className="w-full"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redimensionnement en cours...
            </>
          ) : (
            <>
              <Image className="mr-2 h-4 w-4" />
              Redimensionner l'image test
            </>
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Résultat du redimensionnement :</h4>
            
            <div className="space-y-2 text-sm">
              <div>
                <strong>Fichier traité :</strong> {result.original?.fileName}
              </div>
              <div>
                <strong>Taille originale :</strong> {result.original?.size ? `${(result.original.size / 1024).toFixed(1)} KB` : 'N/A'}
              </div>
              <div>
                <strong>URL de l'image :</strong> 
                <a 
                  href={result.original?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Voir l'image redimensionnée
                </a>
              </div>
            </div>

            <div className="mt-3 p-2 bg-white border rounded text-xs">
              <strong>Note :</strong> L'image a été redimensionnée et remplace maintenant l'original dans le stockage.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};