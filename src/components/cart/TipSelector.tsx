
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEuro } from "@/utils/formatters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (tipAmount: number) => void;
  currentTip: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export const TipSelector = ({ 
  subtotal, 
  onTipChange, 
  currentTip, 
  isOpen, 
  onOpenChange,
  onContinue 
}: TipSelectorProps) => {
  const [tipType, setTipType] = useState<"percentage" | "custom">(currentTip > 0 ? "custom" : "percentage");
  const [percentage, setPercentage] = useState<number>(
    currentTip > 0 ? Math.round((currentTip / subtotal) * 100) : 0
  );
  const [customAmount, setCustomAmount] = useState<string>(
    currentTip > 0 ? currentTip.toFixed(2) : "0.00"
  );

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTipType(currentTip > 0 ? "custom" : "percentage");
      setPercentage(currentTip > 0 ? Math.round((currentTip / subtotal) * 100) : 0);
      setCustomAmount(currentTip > 0 ? currentTip.toFixed(2) : "0.00");
    }
  }, [isOpen, currentTip, subtotal]);

  // Predefined tip percentages
  const tipOptions = [0, 5, 10, 15];

  const handlePercentageSelect = (value: string) => {
    const percentValue = parseInt(value);
    setPercentage(percentValue);
    setTipType("percentage");
    const tipAmount = (subtotal * percentValue) / 100;
    onTipChange(tipAmount);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setCustomAmount(value);
      setTipType("custom");
      const tipAmount = parseFloat(value) || 0;
      onTipChange(tipAmount);
    }
  };

  const handleConfirm = () => {
    let finalTip = 0;
    if (tipType === "percentage") {
      finalTip = (subtotal * percentage) / 100;
    } else {
      finalTip = parseFloat(customAmount) || 0;
    }
    onTipChange(finalTip);
    onOpenChange(false);
    onContinue();
  };

  const handleSkip = () => {
    onTipChange(0);
    onOpenChange(false);
    onContinue();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Ajouter un pourboire ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous pouvez ajouter un pourboire pour remercier l'équipe qui prépare votre commande.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <Label>Choisissez un pourcentage</Label>
            <RadioGroup
              value={tipType === "percentage" ? percentage.toString() : "custom"}
              onValueChange={handlePercentageSelect}
              className="flex flex-wrap gap-3"
            >
              {tipOptions.map((option) => (
                <div key={option} className="flex items-center">
                  <RadioGroupItem 
                    value={option.toString()} 
                    id={`tip-${option}`}
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={`tip-${option}`}
                    className={`px-4 py-2 rounded-md border cursor-pointer hover:bg-muted transition-colors ${
                      tipType === "percentage" && percentage === option
                        ? "bg-gold-500 text-black border-gold-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {option}% {option > 0 && `(${formatEuro((subtotal * option) / 100)})`}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-tip">Ou saisissez un montant personnalisé</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="custom-tip"
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                onClick={() => setTipType("custom")}
                className={`text-right ${
                  tipType === "custom" ? "border-gold-500" : ""
                }`}
                placeholder="0.00"
              />
              <span>€</span>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2 flex-col sm:flex-row">
          <AlertDialogCancel onClick={handleSkip}>
            Passer
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className="bg-gold-500 hover:bg-gold-600 text-black"
          >
            Confirmer et continuer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
