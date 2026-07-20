import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MenuItem, ProductSupplement } from "@/types";

interface SupplementDialogProps {
  item: MenuItem | null;
  onClose: () => void;
  onSelect: (supplements: ProductSupplement[]) => void;
}

const SupplementDialog = ({ item, onClose, onSelect }: SupplementDialogProps) => {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected([]);
  }, [item?.id]);

  if (!item) return null;
  const supplements = (item.supplements || []).filter(s => s.name && s.name.trim() !== "");

  const toggle = (index: number) => {
    setSelected(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const totalExtra = selected.reduce((sum, i) => sum + Number(supplements[i]?.price || 0), 0);

  const handleConfirm = () => {
    onSelect(selected.map(i => supplements[i]));
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter des suppléments ?</DialogTitle>
          <DialogDescription>
            Choisissez un ou plusieurs suppléments pour votre {item.name}, ou continuez sans.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {supplements.map((s, i) => {
            const isChecked = selected.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                  isChecked ? "border-gold-600 bg-gold-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onCheckedChange={() => toggle(i)} />
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="text-gold-600">+{Number(s.price).toFixed(2)}€</span>
              </button>
            );
          })}
        </div>
        <DialogFooter className="mt-4 flex flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => onSelect([])}>
            Non merci
          </Button>
          <Button onClick={handleConfirm} disabled={selected.length === 0}>
            Ajouter{totalExtra > 0 ? ` (+${totalExtra.toFixed(2)}€)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplementDialog;
