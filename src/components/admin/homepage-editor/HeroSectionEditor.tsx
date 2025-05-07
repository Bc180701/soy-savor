
import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const heroSectionSchema = z.object({
  background_image: z.string().min(1, "L'image de fond est requise"),
  title: z.string().min(1, "Le titre est requis"),
  subtitle: z.string().min(1, "Le sous-titre est requis"),
});

type HeroSectionData = z.infer<typeof heroSectionSchema>;

interface HeroSectionEditorProps {
  data: {
    background_image: string;
    title: string;
    subtitle: string;
  };
  onSave: (data: HeroSectionData) => void;
}

const HeroSectionEditor = ({ data, onSave }: HeroSectionEditorProps) => {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<HeroSectionData>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      background_image: data?.background_image || "",
      title: data?.title || "",
      subtitle: data?.subtitle || "",
    },
  });

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      
      // Vérifier si le bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error("Erreur lors de la vérification des buckets:", bucketsError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de vérifier les buckets de stockage"
        });
        throw bucketsError;
      }

      const homepageBucketExists = buckets?.some(bucket => bucket.name === 'homepage');
      
      // Si le bucket n'existe pas, on essaie de le créer
      if (!homepageBucketExists) {
        try {
          const { error: createError } = await supabase.storage.createBucket('homepage', { public: true });
          if (createError) {
            console.error("Error creating homepage bucket:", createError);
            toast({
              variant: "destructive",
              title: "Erreur de configuration",
              description: "Impossible de créer le bucket de stockage"
            });
            throw createError;
          }
        } catch (error) {
          console.error("Error creating homepage bucket:", error);
          toast({
            variant: "destructive",
            title: "Erreur de configuration",
            description: "Impossible de créer le bucket de stockage"
          });
          throw error;
        }
      }
      
      const fileName = `hero-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('homepage')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error("Erreur détaillée de téléchargement:", uploadError);
        toast({
          variant: "destructive",
          title: "Erreur de téléchargement",
          description: uploadError.message || "Impossible de télécharger l'image"
        });
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('homepage')
        .getPublicUrl(fileName);
      
      toast({
        title: "Image téléchargée",
        description: "L'image a été téléchargée avec succès"
      });
      
      form.setValue('background_image', publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Échec du téléchargement",
        description: error.message || "Une erreur est survenue lors du téléchargement de l'image"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  const onSubmit = async (formData: HeroSectionData) => {
    setSaving(true);
    try {
      await onSave(formData);
      toast({
        title: "Modifications enregistrées",
        description: "Les changements ont été sauvegardés avec succès"
      });
    } catch (error: any) {
      console.error("Error saving hero section:", error);
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
                    <div className="space-y-4">
                      {field.value && (
                        <div className="relative w-full h-40 rounded-md overflow-hidden">
                          <img
                            src={field.value}
                            alt="Fond de la section principale"
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          onUpload={handleUpload}
                          disabled={uploading}
                          accept="image/*"
                          buttonText={uploading ? "Téléchargement..." : "Changer l'image"}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
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
            </div>
          </CardContent>
        </Card>
        
        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={saving || uploading}
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
