import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, FormProvider } from "react-hook-form";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash, RefreshCw, AlertCircle } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

interface PromotionsEditorProps {
  data: Promotion[];
  onSave: (data: Promotion[]) => void;
}

const PromotionsEditor = ({ data, onSave }: PromotionsEditorProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>(data);
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Create a form instance for react-hook-form context
  const form = useForm();

  const handleChange = (index: number, field: string, value: string) => {
    const updatedPromotions = [...promotions];
    updatedPromotions[index] = {
      ...updatedPromotions[index],
      [field]: value,
    };
    setPromotions(updatedPromotions);
  };

  const handleImageUpload = async (index: number, file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setUploading(index);
      
      // Utiliser des images temporaires au lieu d'essayer d'utiliser le storage Supabase
      // Ces URLs sont stables et peuvent être utilisées comme solution temporaire
      const placeholders = [
        "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?q=80&w=1000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1555341189-64481e6f9b8d?q=80&w=1000&auto=format&fit=crop"
      ];
      
      // Sélection d'une image aléatoire parmi les placeholders
      const imageUrl = placeholders[Math.floor(Math.random() * placeholders.length)];
      
      // Mettre à jour la promotion avec la nouvelle URL
      handleChange(index, 'imageUrl', imageUrl);
      
      toast({
        title: "Image assignée",
        description: "Une image temporaire a été utilisée pour le moment"
      });
      
      return imageUrl;
    } catch (error: any) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      toast({
        variant: "destructive",
        title: "Échec du téléchargement",
        description: "Une erreur est survenue, utilisation d'une image par défaut"
      });
      return null;
    } finally {
      setUploading(null);
    }
  };

  const addPromotion = () => {
    const newId = Math.max(0, ...promotions.map(p => p.id)) + 1;
    setPromotions([
      ...promotions,
      {
        id: newId,
        title: "Nouvelle promotion",
        description: "Description de la promotion",
        imageUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop",
        buttonText: "En profiter",
        buttonLink: "/menu",
      },
    ]);
  };

  const removePromotion = (index: number) => {
    setPromotions(promotions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(promotions);
  };

  return (
    // Use FormProvider to properly provide form context
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {promotions.map((promotion, index) => (
            <Card key={promotion.id} className="border border-gray-200">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Promotion {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePromotion(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4 mr-1" /> Supprimer
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input
                          value={promotion.title}
                          onChange={(e) => handleChange(index, 'title', e.target.value)}
                          placeholder="Titre de la promotion"
                        />
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          value={promotion.description}
                          onChange={(e) => handleChange(index, 'description', e.target.value)}
                          placeholder="Description de la promotion"
                          rows={3}
                        />
                      </FormControl>
                    </FormItem>

                    <div className="grid grid-cols-2 gap-3">
                      <FormItem>
                        <FormLabel>Texte du bouton</FormLabel>
                        <FormControl>
                          <Input
                            value={promotion.buttonText}
                            onChange={(e) => handleChange(index, 'buttonText', e.target.value)}
                            placeholder="Texte du bouton"
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem>
                        <FormLabel>Lien du bouton</FormLabel>
                        <FormControl>
                          <Input
                            value={promotion.buttonLink}
                            onChange={(e) => handleChange(index, 'buttonLink', e.target.value)}
                            placeholder="/lien"
                          />
                        </FormControl>
                      </FormItem>
                    </div>
                  </div>

                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="bg-gray-100 rounded-lg overflow-hidden h-40 relative">
                          {promotion.imageUrl ? (
                            <img 
                              src={promotion.imageUrl} 
                              alt={`Promotion ${index + 1}`}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <AlertCircle className="h-6 w-6 mr-2" />
                              <span>Aucune image</span>
                            </div>
                          )}
                        </div>
                        
                        <FileUpload 
                          accept="image/*" 
                          value={promotion.imageUrl}
                          onChange={(value) => handleChange(index, 'imageUrl', value)}
                          onUpload={(file) => handleImageUpload(index, file)}
                          disabled={uploading === index}
                          buttonText={
                            uploading === index ? 
                            "Téléchargement en cours..." : 
                            "Changer l'image"
                          }
                        />
                        
                        {uploading === index && (
                          <div className="text-center py-2">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                            <span className="text-sm text-muted-foreground block mt-1">Téléchargement en cours...</span>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Format recommandé : 800x600px
                    </FormDescription>
                  </FormItem>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addPromotion}
            className="w-full py-6 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter une promotion
          </Button>
        </div>

        <Separator className="my-6" />

        <div>
          <Button type="submit" className="bg-gold-600 hover:bg-gold-700 text-white">
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default PromotionsEditor;
