
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Truck } from "lucide-react";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Restaurant } from "@/types/restaurant";

interface DeliveryMethodProps {
  defaultValue?: "delivery" | "pickup";
  onChange: (value: "delivery" | "pickup") => void;
  restaurant?: Restaurant | null;
}

const DeliveryMethod = ({ defaultValue = "delivery", onChange, restaurant }: DeliveryMethodProps) => {
  const { currentRestaurant } = useRestaurantContext();
  const r = restaurant ?? currentRestaurant;
  const settings = (r?.settings as Record<string, any>) ?? {};
  const isDeliveryBlocked = settings?.delivery_blocked === true;
  const isPickupBlocked = settings?.pickup_blocked === true;
  
  console.log("🚚 DeliveryMethod - Restaurant:", r?.name, "Settings:", { 
    delivery_blocked: settings?.delivery_blocked, 
    pickup_blocked: settings?.pickup_blocked 
  });
  
  const handleSelect = (method: "delivery" | "pickup") => {
    if ((method === "delivery" && isDeliveryBlocked) || (method === "pickup" && isPickupBlocked)) {
      console.log("❌ Option bloquée:", method, "isDeliveryBlocked:", isDeliveryBlocked, "isPickupBlocked:", isPickupBlocked);
      return; // Option indisponible
    }
    console.log("✅ Sélection mode:", method);
    onChange(method);
  };

  // Si la valeur par défaut est indisponible, basculer automatiquement vers l'option disponible
  useEffect(() => {
    console.log("🔄 Vérification auto-switch:", { defaultValue, isDeliveryBlocked, isPickupBlocked });
    
    if (defaultValue === "delivery" && isDeliveryBlocked && !isPickupBlocked) {
      console.log("🔄 Auto-switch: delivery → pickup");
      onChange("pickup");
    } else if (defaultValue === "pickup" && isPickupBlocked && !isDeliveryBlocked) {
      console.log("🔄 Auto-switch: pickup → delivery");
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
              : deliveryDisabled 
                ? "border-red-200 bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
          } ${deliveryDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
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
                <p className="text-xs text-red-600 font-medium mt-1">❌ Indisponible pour ce restaurant</p>
              )}
            </div>
          </div>
        </Card>

        <Card
          className={`flex-1 p-4 border-2 transition-all ${
            defaultValue === "pickup" && !pickupDisabled
              ? "border-gold-500 bg-gold-50"
              : pickupDisabled 
                ? "border-red-200 bg-red-50" 
                : "border-gray-200 hover:border-gray-300"
          } ${pickupDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
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
                <p className="text-xs text-red-600 font-medium mt-1">❌ Indisponible pour ce restaurant</p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryMethod;
