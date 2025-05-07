
import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
      // Création du FormData pour l'upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload vers l'API de Lovable
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Échec de l'upload (${response.status})`);
      }
      
      // Traiter la réponse
      const data = await response.json();
      
      if (data && data.url) {
        onChange(data.url);
        toast({
          title: "Succès",
          description: "L'image a été téléchargée avec succès",
          variant: "success"
        });
      } else {
        throw new Error("URL non reçue dans la réponse");
      }
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
