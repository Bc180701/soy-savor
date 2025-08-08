
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Truck } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface DeliveryMethodProps {
  defaultValue?: "delivery" | "pickup";
  onChange: (value: "delivery" | "pickup") => void;
}

const DeliveryMethod = ({ defaultValue = "delivery", onChange }: DeliveryMethodProps) => {
  const { currentRestaurant } = useRestaurantContext();
  const settings = (currentRestaurant?.settings as Record<string, any>) ?? {};
  const isDeliveryBlocked = settings?.delivery_blocked === true;
  const isPickupBlocked = settings?.pickup_blocked === true;

  const handleSelect = (method: "delivery" | "pickup") => {
    if ((method === "delivery" && isDeliveryBlocked) || (method === "pickup" && isPickupBlocked)) {
      return; // Option indisponible
    }
    onChange(method);
  };

  // Si la valeur par défaut est indisponible, basculer automatiquement vers l'option disponible
  useEffect(() => {
    if (defaultValue === "delivery" && isDeliveryBlocked && !isPickupBlocked) {
      onChange("pickup");
    } else if (defaultValue === "pickup" && isPickupBlocked && !isDeliveryBlocked) {
      onChange("delivery");
    }
  }, [defaultValue, isDeliveryBlocked, isPickupBlocked, onChange]);

  const deliveryDisabled = isDeliveryBlocked;
  const pickupDisabled = isPickupBlocked;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Mode de livraison</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <Card
          className={`flex-1 p-4 border-2 transition-all ${
            defaultValue === "delivery" && !deliveryDisabled
              ? "border-gold-500 bg-gold-50"
              : "border-gray-200 hover:border-gray-300"
          } ${deliveryDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => handleSelect("delivery")}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                defaultValue === "delivery" && !deliveryDisabled ? "bg-gold-100" : "bg-gray-100"
              }`}
            >
              <Truck
                className={`h-5 w-5 ${
                  defaultValue === "delivery" && !deliveryDisabled ? "text-gold-500" : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <h4 className="font-medium">Livraison à domicile</h4>
              <p className="text-sm text-gray-500">Livraison en 30-45 minutes environ</p>
              {deliveryDisabled && (
                <p className="text-xs text-gray-500 mt-1">Indisponible pour ce restaurant</p>
              )}
            </div>
          </div>
        </Card>

        <Card
          className={`flex-1 p-4 border-2 transition-all ${
            defaultValue === "pickup" && !pickupDisabled
              ? "border-gold-500 bg-gold-50"
              : "border-gray-200 hover:border-gray-300"
          } ${pickupDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => handleSelect("pickup")}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                defaultValue === "pickup" && !pickupDisabled ? "bg-gold-100" : "bg-gray-100"
              }`}
            >
              <ShoppingBag
                className={`h-5 w-5 ${
                  defaultValue === "pickup" && !pickupDisabled ? "text-gold-500" : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <h4 className="font-medium">À emporter</h4>
              <p className="text-sm text-gray-500">Prêt en 15-20 minutes environ</p>
              {pickupDisabled && (
                <p className="text-xs text-gray-500 mt-1">Indisponible pour ce restaurant</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryMethod;
