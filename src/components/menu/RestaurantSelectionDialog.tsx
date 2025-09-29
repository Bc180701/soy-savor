
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";
import { MapPin, Clock } from "lucide-react";
import { isRestaurantOpenNow, isRestaurantOpenToday } from "@/services/openingHoursService";

interface RestaurantSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestaurantSelected: (restaurant: Restaurant) => void;
}

const RestaurantSelectionDialog = ({ 
  open, 
  onOpenChange, 
  onRestaurantSelected 
}: RestaurantSelectionDialogProps) => {
  const { restaurants, isLoading } = useRestaurantContext();
  const [restaurantStatus, setRestaurantStatus] = useState<{[key: string]: boolean}>({});
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    const checkRestaurantStatus = async () => {
      if (!restaurants.length) return;
      
      console.log("🔍 Vérification statut pour", restaurants.length, "restaurants");
      setStatusLoading(true);
      const statusMap: {[key: string]: boolean} = {};
      
      for (const restaurant of restaurants) {
        console.log("🔍 Vérification restaurant:", restaurant.name, "ID:", restaurant.id);
        const isOpen = await isRestaurantOpenToday(restaurant.id);
        statusMap[restaurant.id] = isOpen;
        console.log("📊 Restaurant", restaurant.name, "ouvert aujourd'hui:", isOpen);
      }
      
      setRestaurantStatus(statusMap);
      setStatusLoading(false);
      console.log("✅ Statuts finaux:", statusMap);
    };

    if (open && restaurants.length > 0) {
      checkRestaurantStatus();
    }
  }, [open, restaurants]);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    const isOpen = restaurantStatus[restaurant.id];
    if (!isOpen) return; // Empêcher la sélection si fermé
    
    onRestaurantSelected(restaurant);
    onOpenChange(false);
  };

  if (isLoading || statusLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisir votre restaurant</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir votre restaurant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {restaurants.map((restaurant) => {
            const isOpen = restaurantStatus[restaurant.id];
            const isDisabled = !isOpen;
            
            return (
              <div
                key={restaurant.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isDisabled 
                    ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60' 
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => handleRestaurantSelect(restaurant)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold text-lg ${isDisabled ? 'text-gray-500' : ''}`}>
                        {restaurant.name}
                      </h3>
                      {isDisabled && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          FERMÉ
                        </span>
                      )}
                    </div>
                    {restaurant.address && (
                      <div className={`flex items-center text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{restaurant.address}</span>
                        {restaurant.city && <span>, {restaurant.city}</span>}
                      </div>
                    )}
                    {restaurant.phone && (
                      <div className={`flex items-center text-sm mt-1 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestaurantSelect(restaurant);
                    }}
                  >
                    {isDisabled ? 'Fermé' : 'Sélectionner'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSelectionDialog;
