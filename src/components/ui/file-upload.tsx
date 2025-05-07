
import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface FileUploadProps {
  onChange: (files: FileList) => void;
  accept?: string;
  disabled?: boolean;
}

const FileUpload = ({ onChange, accept, disabled = false }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (!files || files.length === 0) return;
    onChange(files);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className="w-full border-dashed"
      >
        <Upload className="h-4 w-4 mr-2" />
        {disabled ? "Téléchargement en cours..." : "Choisir un fichier"}
      </Button>
    </div>
  );
};

export default FileUpload;
