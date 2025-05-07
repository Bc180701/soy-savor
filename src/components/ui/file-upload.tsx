
import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onChange: (value: string) => void;
  onUpload?: (file: File) => Promise<string | null>;
  value?: string;
  accept?: string;
  disabled?: boolean;
  buttonText?: string;
}

const FileUpload = ({ 
  onChange, 
  onUpload, 
  value, 
  accept, 
  disabled = false,
  buttonText = "Choisir un fichier"
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleClick = () => {
    if (!disabled && fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Utilisation de l'API Lovable pour télécharger l'image
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Échec de l'upload:", errorText);
        throw new Error(`Échec du téléchargement de l'image (${response.status})`);
      }
      
      // S'assurer que la réponse est bien du JSON valide
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Réponse non-JSON:", await response.text());
        throw new Error("Format de réponse invalide");
      }
      
      const data = await response.json();
      
      if (data && data.url) {
        onChange(data.url);
        toast({
          title: "Image téléchargée",
          description: "L'image a été téléchargée avec succès"
        });
        return data.url;
      } else {
        console.error("Données de réponse incomplètes:", data);
        throw new Error("URL de l'image non reçue");
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "Erreur lors du téléchargement");
      toast({
        variant: "destructive",
        title: "Échec du téléchargement",
        description: error.message || "Impossible de télécharger l'image"
      });
      
      // Utiliser la fonction onUpload comme fallback si disponible
      if (onUpload) {
        try {
          const url = await onUpload(files[0]);
          if (url) {
            onChange(url);
            return url;
          }
        } catch (fallbackError) {
          console.error("Fallback upload also failed:", fallbackError);
        }
      }
      return null;
    } finally {
      setIsUploading(false);
      // Reset le champ de fichier pour permettre la sélection du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
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
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
