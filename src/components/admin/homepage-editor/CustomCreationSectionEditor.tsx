
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import FileUpload from "@/components/ui/file-upload";
import { CustomCreationSection } from "@/hooks/useHomepageData";
import { Loader2 } from "lucide-react";

interface CustomCreationSectionEditorProps {
  data?: CustomCreationSection;
  onSave: (data: CustomCreationSection) => Promise<void>;
}

const DEFAULT_DATA: CustomCreationSection = {
  title: "Composez vos créations",
  subtitle: "Laissez libre cours à votre créativité avec nos options de personnalisation",
  background_image: "",
  sushi_button_text: "Créer mes sushis",
  sushi_button_link: "/composer-sushi",
  poke_button_text: "Créer mon poké",
  poke_button_link: "/composer-poke"
};

const CustomCreationSectionEditor = ({ data, onSave }: CustomCreationSectionEditorProps) => {
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(data?.background_image || null);
  
  const form = useForm({
    defaultValues: {
      title: data?.title || DEFAULT_DATA.title,
      subtitle: data?.subtitle || DEFAULT_DATA.subtitle,
      background_image: data?.background_image || DEFAULT_DATA.background_image,
      sushi_button_text: data?.sushi_button_text || DEFAULT_DATA.sushi_button_text,
      sushi_button_link: data?.sushi_button_link || DEFAULT_DATA.sushi_button_link,
      poke_button_text: data?.poke_button_text || DEFAULT_DATA.poke_button_text,
      poke_button_link: data?.poke_button_link || DEFAULT_DATA.poke_button_link,
    }
  });
  
  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      await onSave(values as CustomCreationSection);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Composez vos créations" />
                  </FormControl>
                  <FormDescription>
                    Le titre principal de la section
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Sous-titre</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Laissez libre cours à votre créativité..." 
                      rows={3}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="background_image"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Image de fond</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image/*"
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setPreviewImage(value);
                      }}
                      buttonText="Choisir une image"
                    />
                  </FormControl>
                  <FormDescription>
                    Image de fond pour la section (optionnelle)
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          
          <div>
            {previewImage && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Aperçu de l'image de fond</p>
                <div className="border rounded-md overflow-hidden h-48">
                  <img 
                    src={previewImage} 
                    alt="Aperçu" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormField
                  control={form.control}
                  name="sushi_button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte bouton Sushi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Créer mes sushis" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sushi_button_link"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Lien bouton Sushi</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="/composer-sushi" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="poke_button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texte bouton Poké</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Créer mon poké" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="poke_button_link"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Lien bouton Poké</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="/composer-poke" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="bg-gold-600 hover:bg-gold-700 text-white"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : "Enregistrer les modifications"}
        </Button>
      </form>
    </Form>
  );
};

export default CustomCreationSectionEditor;
