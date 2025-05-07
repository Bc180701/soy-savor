
import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface FileUploadProps {
  onChange: (value: string) => void;
  value?: string;
  accept?: string;
  disabled?: boolean;
  buttonText?: string;
}

const FileUpload = ({ 
  onChange, 
  value, 
  accept = "image/*", 
  disabled = false,
  buttonText = "Choisir un fichier"
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleClick = () => {
    if (!disabled && fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      console.log("Téléchargement du fichier:", file.name, "type:", file.type, "taille:", file.size);
      
      // Créer le bucket 'images' s'il n'existe pas déjà
      const { data: buckets } = await supabase.storage.listBuckets();
      const imagesBucketExists = buckets?.some(bucket => bucket.name === 'images');
      
      if (!imagesBucketExists) {
        console.log("Le bucket 'images' n'existe pas, tentative de création...");
        const { data, error } = await supabase.storage.createBucket('images', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (error) {
          console.error("Erreur lors de la création du bucket:", error);
          // Continue anyway, the bucket might exist but not be accessible via listBuckets
        } else {
          console.log("Bucket 'images' créé avec succès!");
        }
      }
      
      // Générer un nom unique pour le fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = fileName;
      
      console.log("Envoi du fichier vers Supabase Storage...");
      
      // Télécharger vers le bucket "images" de Supabase
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error("Erreur de téléchargement:", error);
        throw error;
      }
      
      console.log("Fichier téléversé avec succès:", data);
      
      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
        
      console.log("Image téléchargée avec succès:", publicUrlData.publicUrl);
      
      // Mettre à jour avec l'URL
      onChange(publicUrlData.publicUrl);
      
      toast({
        title: "Succès",
        description: "L'image a été téléchargée avec succès",
        variant: "success"
      });
    } catch (error: any) {
      console.error("Erreur d'upload:", error);
      toast({
        title: "Échec du téléchargement",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input pour permettre de sélectionner à nouveau le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      {value && (
        <div className="relative w-full h-40 rounded-md overflow-hidden border border-gray-200">
          <img
            src={value}
            alt="Image téléchargée"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Erreur de chargement d'image:", value);
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="w-full border-dashed"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Téléchargement...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
};

export default FileUpload;
