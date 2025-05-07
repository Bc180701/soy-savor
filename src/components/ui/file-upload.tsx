
import { ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

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
      // Utiliser Lovable pour télécharger directement l'image
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Échec du téléchargement de l'image");
      }
      
      const { url } = await response.json();
      
      if (url) {
        onChange(url);
        return url;
      } else if (onUpload) {
        // Fallback à la méthode personnalisée si l'upload direct échoue
        const uploadedUrl = await onUpload(files[0]);
        if (uploadedUrl) {
          onChange(uploadedUrl);
        }
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "Erreur lors du téléchargement");
      
      // Si l'upload échoue et qu'on a une méthode personnalisée, essayer celle-ci
      if (onUpload) {
        try {
          const url = await onUpload(files[0]);
          if (url) {
            onChange(url);
          }
        } catch (fallbackError) {
          console.error("Fallback upload also failed:", fallbackError);
        }
      }
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
