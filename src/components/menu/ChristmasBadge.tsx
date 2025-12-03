import { Badge } from '@/components/ui/badge';
import { Gift } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ChristmasBadgeProps {
  eventDate: string;
  eventName?: string;
  size?: 'sm' | 'md';
}

export const ChristmasBadge = ({ 
  eventDate, 
  eventName = "Noël",
  size = 'md' 
}: ChristmasBadgeProps) => {
  const parsedDate = parseISO(eventDate);
  const formattedDate = format(parsedDate, "d MMM", { locale: fr });

  if (size === 'sm') {
    return (
      <Badge className="bg-gradient-to-r from-red-500 to-green-600 text-white text-xs gap-1">
        🎄 {formattedDate}
      </Badge>
    );
  }

  return (
    <Badge className="bg-gradient-to-r from-red-500 to-green-600 text-white gap-1.5 py-1 animate-pulse">
      <Gift className="h-3 w-3" />
      <span>🎄 {eventName} - {formattedDate}</span>
    </Badge>
  );
};
