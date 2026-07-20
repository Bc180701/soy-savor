import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import FileUpload from "@/components/ui/file-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PopupSection } from "@/hooks/useHomepageData";

interface Props {
  data: PopupSection;
  onSave: (data: PopupSection) => void;
}

const defaultPopup: PopupSection = {
  enabled: false,
  display_on: "home",
  image_url: "",
  title: "",
  description: "",
  button_text: "En savoir plus",
  button_link: "/commander",
};


const PopupSectionEditor = ({ data, onSave }: Props) => {
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<PopupSection>({ ...defaultPopup, ...data });
  const { toast } = useToast();

  useEffect(() => {
    setValues({ ...defaultPopup, ...data });
  }, [data]);

  const update = <K extends keyof PopupSection>(key: K, value: PopupSection[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(values);
      toast({
        title: "Modifications enregistrées",
        description: "Le pop-up a été mis à jour.",
        variant: "success",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de sauvegarder",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-gray-200">
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Activer le pop-up</Label>
              <p className="text-sm text-muted-foreground">
                Le pop-up s'affichera aux visiteurs (une fois par session).
              </p>
            </div>
            <Switch
              checked={values.enabled}
              onCheckedChange={(v) => update("enabled", v)}
            />
          </div>

          <div className="space-y-2">
            <Label>Afficher sur</Label>
            <Select
              value={values.display_on}
              onValueChange={(v) => update("display_on", v as PopupSection["display_on"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Page d'accueil</SelectItem>
                <SelectItem value="commander">
                  Page Commander (après sélection du restaurant)
                </SelectItem>
                <SelectItem value="both">Les deux pages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Image (format vertical recommandé)</Label>
            <FileUpload
              value={values.image_url}
              onChange={(url) => update("image_url", url)}
              accept="image/*"
              buttonText="Choisir une image"
              allowRemove
            />
          </div>

          <div className="space-y-2">
            <Label>Titre (optionnel)</Label>
            <Input
              value={values.title || ""}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex : Offre spéciale"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              value={values.description || ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Décrivez votre offre..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Texte du bouton</Label>
              <Input
                value={values.button_text}
                onChange={(e) => update("button_text", e.target.value)}
                placeholder="En savoir plus"
              />
            </div>
            <div className="space-y-2">
              <Label>Lien de destination</Label>
              <Input
                value={values.button_link}
                onChange={(e) => update("button_link", e.target.value)}
                placeholder="/commander ou https://..."
              />
            </div>
          </div>

          {values.image_url && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-2">Aperçu</h3>
              <div className="mx-auto w-full max-w-[350px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                <img
                  src={values.image_url}
                  alt="Aperçu pop-up"
                  className="w-full h-auto block"
                />
                <div className="p-4 space-y-3">
                  {values.title && (
                    <h2 className="text-lg font-semibold text-gray-900 text-center">
                      {values.title}
                    </h2>
                  )}
                  {values.description && (
                    <p className="text-sm text-gray-600 text-center whitespace-pre-line">
                      {values.description}
                    </p>
                  )}
                  <Button type="button" className="bg-gold-600 hover:bg-gold-700 text-white w-full">
                    {values.button_text || "En savoir plus"}
                  </Button>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="bg-gold-600 hover:bg-gold-700 text-white">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer les modifications"
        )}
      </Button>
    </form>
  );
};

export default PopupSectionEditor;
