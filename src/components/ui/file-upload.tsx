import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  bucketName: string
  folderPath: string
  onUploadComplete?: (url: string) => void
}

const FileUpload: React.FC<FileUploadProps> = ({ bucketName, folderPath, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImageUrl(URL.createObjectURL(file))
    }
  }

  const handleOpenChange = () => {
    setOpen(!open)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const filePath = `${folderPath}/${selectedFile.name}`

    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile)

      if (error) {
        console.error("Erreur lors du téléversement du fichier:", error)
        toast({
          title: "Erreur",
          description: `Erreur lors du téléversement du fichier: ${error.message}`,
          variant: "destructive",
        })
      } else {
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath)
        
        toast({
          title: "Succès",
          description: "Fichier téléversé avec succès!",
        })
        
        if (onUploadComplete) {
          onUploadComplete(publicUrlData.publicUrl);
        }
      }
    } catch (error: any) {
      console.error("Erreur inattendue:", error)
      toast({
        title: "Erreur",
        description: `Erreur inattendue: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setOpen(false)
    }
  }

  return (
    <div>
      <Button onClick={handleOpenChange}>Téléverser une image</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Téléverser une image</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier depuis votre ordinateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="picture" className="text-right">
                Image
              </Label>
              <Input
                type="file"
                id="picture"
                className="col-span-3"
                onChange={handleFileChange}
              />
            </div>
            {imageUrl && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="picture" className="text-right">
                  Aperçu
                </Label>
                <div className="col-span-3">
                  <img src={imageUrl} alt="Aperçu" className="max-h-40" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleUpload} disabled={uploading}>
              {uploading ? "Téléversement..." : "Téléverser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FileUpload

