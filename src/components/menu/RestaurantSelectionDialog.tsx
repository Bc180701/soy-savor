
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";
import { MapPin, Clock } from "lucide-react";

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

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    onRestaurantSelected(restaurant);
    onOpenChange(false);
  };

  if (isLoading) {
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
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleRestaurantSelect(restaurant)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{restaurant.name}</h3>
                  {restaurant.address && (
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{restaurant.address}</span>
                      {restaurant.city && <span>, {restaurant.city}</span>}
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestaurantSelect(restaurant);
                  }}
                >
                  Sélectionner
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantSelectionDialog;
