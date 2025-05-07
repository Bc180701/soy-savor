
import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

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

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || files.length === 0) return;
    
    try {
      if (onUpload) {
        // Wait for the upload to complete and get the URL
        const url = await onUpload(files[0]);
        if (url) {
          onChange(url);
        }
      } else {
        // For direct handling without upload (e.g. in case of using FileReader)
        onChange(files[0].name);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      // Reset the file input so the same file can be selected again if needed
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
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className="w-full border-dashed"
      >
        <Upload className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
    </div>
  );
};

export default FileUpload;
