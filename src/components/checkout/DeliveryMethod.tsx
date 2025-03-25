
import { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { calculateDeliveryFee, getDeliveryLocations } from "@/services/deliveryService";

interface DeliveryMethodProps {
  subtotal: number;
  onMethodChange: (method: "delivery" | "pickup", fee: number) => void;
}

const DeliveryMethod = ({ subtotal, onMethodChange }: DeliveryMethodProps) => {
  const [method, setMethod] = useState<"delivery" | "pickup">("pickup");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [locations, setLocations] = useState<{city: string, postalCode: string}[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      const locationsData = await getDeliveryLocations();
      setLocations(locationsData);
    };
    
    fetchLocations();
  }, []);

  useEffect(() => {
    // Calculate delivery fee based on subtotal
    const fee = method === "delivery" ? calculateDeliveryFee(subtotal) : 0;
    setDeliveryFee(fee);
    onMethodChange(method, fee);
  }, [method, subtotal, onMethodChange]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Mode de réception</h3>
      
      <RadioGroup
        value={method}
        onValueChange={(value: "delivery" | "pickup") => setMethod(value)}
        className="space-y-3"
      >
        <div className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
          <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="pickup" className="font-medium">Retrait en magasin</Label>
            <p className="text-sm text-gray-500 mt-1">
              Venez retirer votre commande directement à notre restaurant
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2 p-3 border rounded-md hover:bg-gray-50">
          <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="delivery" className="font-medium">Livraison à domicile</Label>
            <p className="text-sm text-gray-500 mt-1">
              Nous livrons votre commande à votre adresse
            </p>
            {method === "delivery" && deliveryFee > 0 && (
              <div className="mt-2 text-akane-600 font-medium">
                Frais de livraison: {deliveryFee.toFixed(2)} €
              </div>
            )}
            {method === "delivery" && deliveryFee === 0 && (
              <div className="mt-2 text-green-600 font-medium">
                Livraison gratuite !
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      {method === "delivery" && (
        <Alert variant="outline" className="bg-blue-50">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription>
            {locations.length > 0 ? (
              <>
                <p className="font-medium">Zones de livraison disponibles :</p>
                <ul className="mt-1 text-sm list-disc list-inside">
                  {locations.map((loc, index) => (
                    <li key={index}>{loc.city} ({loc.postalCode})</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm font-medium">
                  {subtotal < 30 ? 
                    `Livraison offerte à partir de 30€ (il vous manque ${(30 - subtotal).toFixed(2)}€)` : 
                    'Livraison offerte pour votre commande !'}
                </p>
              </>
            ) : (
              <p>Chargement des zones de livraison...</p>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DeliveryMethod;
