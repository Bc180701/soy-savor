
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import FileUpload from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";

interface HeroSectionData {
  background_image: string;
  title: string;
  subtitle: string;
}

interface HeroSectionEditorProps {
  data: HeroSectionData;
  onSave: (data: HeroSectionData) => void;
}

const HeroSectionEditor = ({ data, onSave }: HeroSectionEditorProps) => {
  const [formData, setFormData] = useState<HeroSectionData>(data);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    try {
      setUploading(true);
      const file = files[0];
      
      // Create a local preview
      setPreview(URL.createObjectURL(file));
      
      // Upload to Supabase Storage
      const fileName = `hero-section-${Date.now()}.${file.name.split('.').pop()}`;
      const { error, data } = await supabase.storage
        .from('homepage')
        .upload(fileName, file);
        
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('homepage')
        .getPublicUrl(fileName);
        
      setFormData(prev => ({
        ...prev,
        background_image: publicUrl
      }));
      
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormItem>
          <FormLabel>Image d'arrière-plan</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <div className="bg-black rounded-lg overflow-hidden h-64 relative">
                <img 
                  src={preview || formData.background_image} 
                  alt="Aperçu de l'image d'arrière-plan"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              </div>
              
              <FileUpload 
                accept="image/*" 
                onChange={handleImageUpload}
                disabled={uploading}
              />
              
              {uploading && (
                <div className="text-center py-2">
                  <span className="text-sm text-muted-foreground">Téléchargement en cours...</span>
                </div>
              )}
            </div>
          </FormControl>
          <FormDescription>
            Image de fond pour la section principale (format recommandé : 1920x1080px)
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Titre principal</FormLabel>
          <FormControl>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Titre principal"
            />
          </FormControl>
          <FormDescription>
            Vous pouvez utiliser des balises HTML simples (span, em, strong)
          </FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Sous-titre</FormLabel>
          <FormControl>
            <Textarea
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="Sous-titre"
              rows={3}
            />
          </FormControl>
        </FormItem>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" className="bg-gold-600 hover:bg-gold-700 text-white">
          Enregistrer les modifications
        </Button>
      </div>
    </form>
  );
};

export default HeroSectionEditor;
