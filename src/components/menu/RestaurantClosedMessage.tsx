
import { useState, useEffect } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { openingHoursService } from "@/services/openingHoursService";

const RestaurantClosedMessage = () => {
  const [todayHours, setTodayHours] = useState<string>("");

  useEffect(() => {
    const fetchTodayHours = async () => {
      try {
        const hours = await openingHoursService.getTodayHours();
        setTodayHours(hours);
      } catch (error) {
        console.error("Error loading today's hours:", error);
        setTodayHours("Horaires non disponibles");
      }
    };

    fetchTodayHours();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16">
      <Alert className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Restaurant actuellement fermé</h3>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Horaires d'aujourd'hui : {todayHours}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vous pouvez consulter notre menu et passer commande pour plus tard.
              Nous vous contacterons pour confirmer votre créneau de livraison ou de retrait.
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RestaurantClosedMessage;
