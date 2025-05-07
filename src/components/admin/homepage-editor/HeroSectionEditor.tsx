
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const heroSectionSchema = z.object({
  background_image: z.string().min(1, "L'image de fond est requise"),
  title: z.string().min(1, "Le titre est requis"),
  subtitle: z.string().min(1, "Le sous-titre est requis"),
  overlay_image: z.string().optional(),
});

type HeroSectionData = z.infer<typeof heroSectionSchema>;

interface HeroSectionEditorProps {
  data: {
    background_image: string;
    title: string;
    subtitle: string;
    overlay_image?: string;
  };
  onSave: (data: HeroSectionData) => void;
}

const HeroSectionEditor = ({ data, onSave }: HeroSectionEditorProps) => {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  // Loguer les données reçues pour le débogage
  console.log("HeroSectionEditor - données reçues:", data);
  
  const form = useForm<HeroSectionData>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      background_image: data?.background_image || "",
      title: data?.title || "",
      subtitle: data?.subtitle || "",
      overlay_image: data?.overlay_image || "",
    },
  });

  // Mettre à jour le formulaire quand les données changent
  useEffect(() => {
    console.log("HeroSectionEditor - useEffect - data:", data);
    
    if (data) {
      // S'assurer que toutes les propriétés sont définies avant de les utiliser
      const background_image = data.background_image || "";
      const title = data.title || "";
      const subtitle = data.subtitle || "";
      const overlay_image = data.overlay_image || "";
      
      console.log("HeroSectionEditor - Mise à jour du formulaire avec:", {
        background_image,
        title,
        subtitle,
        overlay_image
      });
      
      form.reset({
        background_image,
        title,
        subtitle,
        overlay_image,
      });
    }
  }, [data, form]);

  const onSubmit = async (formData: HeroSectionData) => {
    setSaving(true);
    try {
      console.log("Enregistrement des données de la section principale:", formData);
      await onSave(formData);
      toast({
        title: "Modifications enregistrées",
        description: "Les changements ont été sauvegardés avec succès",
        variant: "success"
      });
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la section principale:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'enregistrement",
        description: error.message || "Impossible de sauvegarder les modifications"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-gray-200">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="background_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image de fond</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        accept="image/*"
                        buttonText="Changer l'image de fond"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="overlay_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image en superposition (optionnel)</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        accept="image/*"
                        buttonText="Ajouter une image en superposition"
                        allowRemove={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre de la section principale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-titre</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Sous-titre de la section principale"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <h3 className="text-sm font-semibold mb-2">Aperçu de la section</h3>
                <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                  {form.watch("background_image") && (
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={form.watch("background_image")} 
                        alt="Aperçu du fond" 
                        className="w-full h-full object-cover"
                      />
                      {form.watch("overlay_image") && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img 
                            src={form.watch("overlay_image")} 
                            alt="Aperçu de l'image en superposition" 
                            className="max-h-full max-w-full object-contain p-4"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-gold-600 hover:bg-gold-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default HeroSectionEditor;
