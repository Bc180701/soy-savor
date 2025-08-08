import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PokeSauceDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (sauceLabel: string, sauceValue: string) => void;
}

const PokeSauceDialog = ({ open, onClose, onConfirm }: PokeSauceDialogProps) => {
  const [value, setValue] = useState<string>("pas_de_sauce");

  const labelFor = (v: string) => {
    switch (v) {
      case "soja_sucree":
        return "Soja sucrée";
      case "soja_salee":
        return "Soja salée";
      default:
        return "Pas de sauce";
    }
  };

  const handleConfirm = () => {
    onConfirm(labelFor(value), value);
    onClose();
    setValue("pas_de_sauce");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choix de la sauce</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <RadioGroup value={value} onValueChange={setValue} className="space-y-3">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="soja_sucree" id="soja_sucree" />
              <Label htmlFor="soja_sucree">Soja sucrée</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="soja_salee" id="soja_salee" />
              <Label htmlFor="soja_salee">Soja salée</Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="pas_de_sauce" id="pas_de_sauce" />
              <Label htmlFor="pas_de_sauce">Pas de sauce</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConfirm}>Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PokeSauceDialog;
