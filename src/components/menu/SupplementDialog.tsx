import { useState, useEffect, useMemo } from "react";
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
  // Suppléments optionnels (cases à cocher)
  const [selected, setSelected] = useState<string[]>([]);
  // Choix de groupe (ex: "Base" → "Lait de Vache" | "Lait d'avoine")
  const [groupChoices, setGroupChoices] = useState<Record<string, string>>({});

  const supplements = useMemo(
    () => (item?.supplements || []).filter((s) => s?.name && s.name.trim() !== ""),
    [item?.supplements]
  );

  const isOut = (s: ProductSupplement) => !!s.soldOut;

  // Groupes de choix uniques (un seul choix possible par groupe)
  const groups = useMemo(() => {
    const map = new Map<string, ProductSupplement[]>();
    supplements.forEach((s) => {
      const g = (s.group || "").trim();
      if (!g) return;
      map.set(g, [...(map.get(g) || []), s]);
    });
    return Array.from(map.entries());
  }, [supplements]);

  const optionals = useMemo(
    () => supplements.filter((s) => !(s.group || "").trim()),
    [supplements]
  );

  // Pré-sélection : l'option "incluse" (ou la première en stock) de chaque groupe
  useEffect(() => {
    setSelected([]);
    const defaults: Record<string, string> = {};
    groups.forEach(([groupName, choices]) => {
      const available = choices.filter((c) => !c.soldOut);
      const preselected = available.find((c) => c.isDefault) || available[0];
      if (preselected) defaults[groupName] = preselected.name;
    });
    setGroupChoices(defaults);
  }, [item?.id, groups]);

  if (!item) return null;

  const toggleOptional = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const chosenGroupSupplements = groups
    .map(([groupName, choices]) => choices.find((c) => c.name === groupChoices[groupName]))
    .filter(Boolean) as ProductSupplement[];

  const chosenOptionals = optionals.filter((s) => selected.includes(s.name));

  const allChoices = [...chosenGroupSupplements, ...chosenOptionals];
  const totalExtra = allChoices.reduce((sum, s) => sum + Number(s.price || 0), 0);

  const allGroupsChosen = groups.every(([groupName]) => !!groupChoices[groupName]);
  const hasGroups = groups.length > 0;

  const handleConfirm = () => {
    if (!allGroupsChosen) return;
    onSelect(allChoices);
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Personnalisez votre {item.name}</DialogTitle>
          <DialogDescription>
            {hasGroups
              ? "Choisissez votre base, puis ajoutez des options si vous le souhaitez."
              : `Choisissez un ou plusieurs suppléments pour votre ${item.name}, ou continuez sans.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {groups.map(([groupName, choices]) => (
            <div key={groupName}>
              <p className="font-medium mb-2">{groupName}</p>
              <div className="flex flex-col gap-2">
                {choices.map((c) => {
                  const isSelected = groupChoices[groupName] === c.name;
                  const isFree = Number(c.price || 0) === 0;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setGroupChoices((prev) => ({ ...prev, [groupName]: c.name }))}
                      className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                        isSelected ? "border-gold-600 bg-gold-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-gold-600" : "border-gray-400"
                          }`}
                        >
                          {isSelected && <span className="h-2 w-2 rounded-full bg-gold-600" />}
                        </span>
                        <span className={isSelected ? "font-medium" : ""}>{c.name}</span>
                      </div>
                      <span className={isFree ? "text-gray-500 text-sm" : "text-gold-600"}>
                        {isFree ? "Inclus" : `+${Number(c.price).toFixed(2)}€`}
                      </span>
                    </button>
                  );
                })}
                {choices.length === 1 && (
                  <p className="text-xs text-gray-500">
                    Les autres options ne sont pas disponibles actuellement.
                  </p>
                )}
              </div>
            </div>
          ))}

          {optionals.length > 0 && (
            <div>
              {hasGroups && <p className="font-medium mb-2">Options supplémentaires</p>}
              <div className="flex flex-col gap-2">
                {optionals.map((s) => {
                  const isChecked = selected.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => toggleOptional(s.name)}
                      className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors ${
                        isChecked ? "border-gold-600 bg-gold-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleOptional(s.name)} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <span className="text-gold-600">+{Number(s.price).toFixed(2)}€</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex flex-row gap-2 sm:justify-between">
          {!hasGroups && (
            <Button variant="ghost" onClick={() => onSelect([])}>
              Non merci
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={!allGroupsChosen || (!hasGroups && selected.length === 0)}
            className={hasGroups ? "w-full" : ""}
          >
            Ajouter{totalExtra > 0 ? ` (+${totalExtra.toFixed(2)}€)` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplementDialog;
