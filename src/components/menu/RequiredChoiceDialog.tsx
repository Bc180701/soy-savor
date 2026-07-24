import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem, RequiredOption } from "@/types";

interface RequiredChoiceDialogProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (choices: { label: string; value: string }[]) => void;
}

const RequiredChoiceDialog = ({ item, onClose, onConfirm }: RequiredChoiceDialogProps) => {
  const [selected, setSelected] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelected({});
  }, [item?.id]);

  if (!item) return null;
  const options: RequiredOption[] = (item.requiredOptions || []).filter(
    (o) => o?.label && Array.isArray(o.choices) && o.choices.length > 0
  );

  const allChosen = options.every((o) => selected[o.label]);

  const handleConfirm = () => {
    if (!allChosen) return;
    onConfirm(options.map((o) => ({ label: o.label, value: selected[o.label] })));
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personnalisez votre {item.name}</DialogTitle>
          <DialogDescription>
            Merci de faire un choix pour continuer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          {options.map((opt) => (
            <div key={opt.label}>
              <p className="font-medium mb-2">{opt.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {opt.choices.map((c) => {
                  const isSelected = selected[opt.label] === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelected((prev) => ({ ...prev, [opt.label]: c }))}
                      className={`rounded-md border p-3 text-left transition-colors ${
                        isSelected ? "border-gold-600 bg-gold-50 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={handleConfirm} disabled={!allChosen} className="w-full">
            Confirmer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequiredChoiceDialog;
