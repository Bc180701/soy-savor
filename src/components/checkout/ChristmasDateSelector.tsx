import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChristmasDateSelectorProps {
  eventDate: string; // Format: "2025-12-24"
  eventName: string;
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

export const ChristmasDateSelector = ({
  eventDate,
  eventName,
  selectedDate,
  onDateSelect,
}: ChristmasDateSelectorProps) => {
  const parsedDate = parseISO(eventDate);
  const formattedDate = format(parsedDate, "EEEE d MMMM yyyy", { locale: fr });
  const isSelected = selectedDate === eventDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-medium">Date de retrait</h3>
        <Badge className="bg-gradient-to-r from-red-500 to-green-600 text-white animate-pulse">
          🎄 {eventName}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Ce produit spécial n'est disponible que pour le{' '}
        <span className="font-semibold text-foreground">{formattedDate}</span>
      </p>

      <Button
        variant={isSelected ? "default" : "outline"}
        className={`w-full justify-start gap-3 h-auto py-4 ${
          isSelected 
            ? "bg-gradient-to-r from-red-500 to-green-600 hover:from-red-600 hover:to-green-700 text-white border-0" 
            : "hover:border-red-300 hover:bg-red-50"
        }`}
        onClick={() => onDateSelect(eventDate)}
      >
        <Calendar className="h-5 w-5" />
        <div className="flex flex-col items-start">
          <span className="font-semibold capitalize">{formattedDate}</span>
          <span className={`text-xs ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
            Commande spéciale {eventName}
          </span>
        </div>
        {isSelected && (
          <Badge className="ml-auto bg-white/20 text-white">
            ✓ Sélectionné
          </Badge>
        )}
      </Button>

      {isSelected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <p className="font-medium">🎁 Parfait !</p>
          <p>Votre commande sera prête pour le {formattedDate}. Vous pourrez choisir votre créneau horaire à l'étape suivante.</p>
        </div>
      )}
    </div>
  );
};
