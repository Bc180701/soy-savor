import { CartItem } from "@/types";
import { formatEuro } from "@/utils/formatters";
import { TicketPercent } from "lucide-react";

interface OrderSummaryDetailsProps {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  tip?: number; // Add tip property
  appliedPromoCode: {
    code: string;
    discount: number;
    isPercentage: boolean;
  } | null;
  deliveryInfo: {
    orderType: "delivery" | "pickup";
    name: string;
    email: string;
    phone: string;
    street?: string;
    city?: string;
    postalCode?: string;
    pickupTime?: string;
    notes?: string;
    allergies: string[];
  };
  allergyOptions: {
    id: string;
    name: string;
  }[];
}

export const OrderSummaryDetails = ({ 
  items, 
  subtotal, 
  tax, 
  deliveryFee, 
  discount,
  tip = 0, // Add default value
  appliedPromoCode,
  deliveryInfo,
  allergyOptions
}: OrderSummaryDetailsProps) => {
  const orderTotal = subtotal + deliveryFee + (tip || 0) - discount; // TVA incluse dans les prix

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Récapitulatif des articles */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Articles</h3>
        {items.map((item) => (
          <div key={`${item.menuItem.id}-${item.specialInstructions}`} className="flex justify-between py-2 border-b">
            <div>
              <span className="font-medium">{item.quantity}x</span> {item.menuItem.name}
              {item.specialInstructions && (
                <p className="text-sm text-gray-500">{item.specialInstructions}</p>
              )}
            </div>
            <span>{formatEuro(item.menuItem.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      
      {/* Informations de livraison */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Livraison</h3>
        <p className="mb-1">
          <span className="font-medium">Méthode :</span>{" "}
          {deliveryInfo.orderType === "delivery" ? "Livraison à domicile" : "Retrait en magasin"}
        </p>
        {deliveryInfo.orderType === "delivery" && (
          <p className="mb-1">
            <span className="font-medium">Adresse :</span>{" "}
            {deliveryInfo.street}, {deliveryInfo.postalCode} {deliveryInfo.city}
          </p>
        )}
        <p>
          <span className="font-medium">Horaire :</span>{" "}
          {deliveryInfo.pickupTime} aujourd'hui
        </p>
      </div>
      
      {/* Code promo appliqué */}
      {appliedPromoCode && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Code promo</h3>
          <p className="flex items-center">
            <TicketPercent className="h-4 w-4 mr-2 text-green-500" />
            <span className="font-medium">{appliedPromoCode.code}</span>
            <span className="ml-2 text-green-600">
              ({appliedPromoCode.isPercentage
                ? `${appliedPromoCode.discount}% de réduction`
                : `${formatEuro(appliedPromoCode.discount)} de réduction`})
            </span>
          </p>
        </div>
      )}
      
      {/* Informations de contact */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Contact</h3>
        <p className="mb-1">
          <span className="font-medium">Nom :</span> {deliveryInfo.name}
        </p>
        <p className="mb-1">
          <span className="font-medium">Téléphone :</span> {deliveryInfo.phone}
        </p>
        <p>
          <span className="font-medium">Email :</span> {deliveryInfo.email}
        </p>
      </div>
      
      {/* Notes et allergies */}
      {(deliveryInfo.notes || deliveryInfo.allergies.length > 0) && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Informations complémentaires</h3>
          {deliveryInfo.notes && (
            <p className="mb-1">
              <span className="font-medium">Notes :</span> {deliveryInfo.notes}
            </p>
          )}
          {deliveryInfo.allergies.length > 0 && (
            <p>
              <span className="font-medium">Allergies :</span>{" "}
              {deliveryInfo.allergies
                .map((id) => allergyOptions.find((a) => a.id === id)?.name)
                .join(", ")}
            </p>
          )}
        </div>
      )}
      
      {/* Récapitulatif des coûts */}
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between mb-2">
          <span>Sous-total</span>
          <span>{formatEuro(subtotal)}</span>
        </div>
        {deliveryInfo.orderType === "delivery" && (
          <div className="flex justify-between mb-2">
            <span>Frais de livraison</span>
            <span>{formatEuro(deliveryFee)}</span>
          </div>
        )}
        {tip > 0 && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Pourboire</span>
            <span>{formatEuro(tip)}</span>
          </div>
        )}
        {appliedPromoCode && (
          <div className="flex justify-between mb-2 text-green-600">
            <span>Réduction</span>
            <span>-{formatEuro(discount)}</span>
          </div>
        )}
        {/* TVA incluse - affichage informatif */}
        <div className="flex justify-between mb-2 text-gray-600 text-sm">
          <span>dont TVA incluse (10%)</span>
          <span>{formatEuro(tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-4">
          <span>Total TTC</span>
          <span>{formatEuro(orderTotal)}</span>
        </div>
      </div>
    </div>
  );
};
