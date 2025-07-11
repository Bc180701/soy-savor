
import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { isRestaurantOpenNow, getNextOpenDay, DayOpeningHours } from "@/services/openingHoursService";

const RestaurantStatusBanner = () => {
  const { currentRestaurant } = useRestaurantContext();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [nextOpenDay, setNextOpenDay] = useState<DayOpeningHours | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Vérification statut pour restaurant:", currentRestaurant.name, "ID:", currentRestaurant.id);
        setLoading(true);
        const restaurantIsOpen = await isRestaurantOpenNow(currentRestaurant.id);
        console.log("📊 Résultat statut restaurant:", currentRestaurant.name, "ouvert:", restaurantIsOpen);
        setIsOpen(restaurantIsOpen);
        
        if (!restaurantIsOpen) {
          const nextDay = await getNextOpenDay(currentRestaurant.id);
          setNextOpenDay(nextDay);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut:", error);
        setIsOpen(true); // Par défaut, considérer comme ouvert en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [currentRestaurant]);

  if (loading || !currentRestaurant) {
    return null;
  }

  const getDayName = (day: string): string => {
    const dayNames: {[key: string]: string} = {
      "monday": "lundi",
      "tuesday": "mardi", 
      "wednesday": "mercredi",
      "thursday": "jeudi",
      "friday": "vendredi",
      "saturday": "samedi",
      "sunday": "dimanche"
    };
    return dayNames[day] || day;
  };

  if (isOpen) {
    return (
      <Alert className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>{currentRestaurant.name}</strong> est actuellement ouvert et accepte les commandes.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4" />
          <strong>{currentRestaurant.name}</strong> est actuellement fermé.
        </div>
        {nextOpenDay && (
          <p className="text-sm">
            Prochaine ouverture : {getDayName(nextOpenDay.day)} de {nextOpenDay.open_time} à {nextOpenDay.close_time}
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default RestaurantStatusBanner;
