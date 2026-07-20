import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem, ProductSupplement } from "@/types";

interface SupplementDialogProps {
  item: MenuItem | null;
  onClose: () => void;
  onSelect: (supplement: ProductSupplement | null) => void;
}

const SupplementDialog = ({ item, onClose, onSelect }: SupplementDialogProps) => {
  if (!item) return null;
  const supplements = (item.supplements || []).filter(s => s.name && s.name.trim() !== "");

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un supplément ?</DialogTitle>
          <DialogDescription>
            Choisissez un supplément pour votre {item.name}, ou continuez sans.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-2">
          {supplements.map((s, i) => (
            <Button
              key={i}
              variant="outline"
              className="justify-between h-auto py-3"
              onClick={() => onSelect(s)}
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-gold-600">+{Number(s.price).toFixed(2)}€</span>
            </Button>
          ))}
          <Button variant="ghost" className="mt-2" onClick={() => onSelect(null)}>
            Non merci
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplementDialog;
