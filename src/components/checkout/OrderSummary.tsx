
import React from "react";
import { CreditCard } from "lucide-react";
import { CartItem } from "@/types";
import { DeliveryAddressData } from "@/components/checkout/DeliveryAddressForm";
import { FreeProduct } from "@/components/checkout/FreeProductSelector";

interface OrderSummaryProps {
  items: CartItem[];
  orderType: "delivery" | "pickup";
  deliveryAddress: DeliveryAddressData | null;
  deliveryTime: string;
  isPromotionApplicable: boolean;
  selectedFreeProduct: string | null;
  freeProducts: FreeProduct[];
}

const OrderSummary = ({
  items,
  orderType,
  deliveryAddress,
  deliveryTime,
  isPromotionApplicable,
  selectedFreeProduct,
  freeProducts
}: OrderSummaryProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Récapitulatif de la commande</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium">Articles</h4>
          <ul className="mt-2 space-y-2">
            {items.map((item) => (
              <li key={item.menuItem.id} className="flex justify-between">
                <span>{item.quantity} x {item.menuItem.name}</span>
                <span>{(item.menuItem.price * item.quantity).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Affichage de la promotion si applicable */}
        {isPromotionApplicable && selectedFreeProduct && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800">Promotion spéciale</h4>
            <p className="text-sm text-amber-700 mt-1">
              Produit offert : {freeProducts.find(p => p.id === selectedFreeProduct)?.name}
            </p>
          </div>
        )}
        
        <div>
          <h4 className="text-lg font-medium">Mode de réception</h4>
          <p className="mt-1">{orderType === "delivery" ? "Livraison à domicile" : "Retrait en magasin"}</p>
          {orderType === "delivery" && deliveryAddress && (
            <div className="mt-2">
              <p className="font-medium">Adresse de livraison:</p>
              <p>{deliveryAddress.name}</p>
              <p>{deliveryAddress.street}</p>
              <p>{deliveryAddress.postalCode} {deliveryAddress.city}</p>
              <p>Tél: {deliveryAddress.phone}</p>
              <p>Email: {deliveryAddress.email}</p>
              {deliveryAddress.instructions && (
                <p className="mt-1 text-sm italic">Instructions: {deliveryAddress.instructions}</p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-lg font-medium">Horaire</h4>
          <p className="mt-1">
            {orderType === "delivery" ? 
              "Livraison prévue à " + deliveryTime : 
              `Retrait prévu à ${deliveryTime}`}
          </p>
        </div>
        
        <div>
          <h4 className="text-lg font-medium">Paiement</h4>
          <div className="mt-2 flex items-center bg-gray-50 p-3 rounded-md border">
            <CreditCard className="mr-2 text-gold-600" />
            <p>Carte bancaire</p>
            <div className="ml-auto flex space-x-2">
              <img src="/visa.svg" alt="Visa" className="h-6" />
              <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">Paiement sécurisé en ligne uniquement</p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
