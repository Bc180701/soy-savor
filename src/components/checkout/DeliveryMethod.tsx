
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Truck } from "lucide-react";

interface DeliveryMethodProps {
  defaultValue?: "delivery" | "pickup";
  onChange: (value: "delivery" | "pickup") => void;
}

const DeliveryMethod = ({ defaultValue = "delivery", onChange }: DeliveryMethodProps) => {
  const handleSelect = (method: "delivery" | "pickup") => {
    onChange(method);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Mode de livraison</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <Card
          className={`flex-1 p-4 cursor-pointer border-2 transition-all ${
            defaultValue === "delivery"
              ? "border-gold-500 bg-gold-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => handleSelect("delivery")}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                defaultValue === "delivery"
                  ? "bg-gold-100"
                  : "bg-gray-100"
              }`}
            >
              <Truck
                className={`h-5 w-5 ${
                  defaultValue === "delivery"
                    ? "text-gold-500"
                    : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <h4 className="font-medium">Livraison à domicile</h4>
              <p className="text-sm text-gray-500">
                Livraison en 30-45 minutes environ
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`flex-1 p-4 cursor-pointer border-2 transition-all ${
            defaultValue === "pickup"
              ? "border-gold-500 bg-gold-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => handleSelect("pickup")}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                defaultValue === "pickup"
                  ? "bg-gold-100"
                  : "bg-gray-100"
              }`}
            >
              <ShoppingBag
                className={`h-5 w-5 ${
                  defaultValue === "pickup"
                    ? "text-gold-500"
                    : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <h4 className="font-medium">À emporter</h4>
              <p className="text-sm text-gray-500">
                Prêt en 15-20 minutes environ
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryMethod;
