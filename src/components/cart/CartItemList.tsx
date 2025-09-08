
import { X, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { CartItem } from "@/types";
import { formatEuro } from "@/utils/formatters";
import { formatCustomProduct } from "@/utils/formatCustomProduct";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";

interface CartItemListProps {
  items: CartItem[];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

export const CartItemList = ({ items, removeItem, updateQuantity }: CartItemListProps) => {

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">Votre panier est vide.</p>
        <Link to="/menu" className="mt-4 inline-block text-gold-500 hover:text-gold-600">
          Parcourir le menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {items.map((item) => (
        <div key={`${item.menuItem.id}-${item.specialInstructions}`} className="flex items-start border-b py-4">
          {item.menuItem.imageUrl && (
            <img
              src={generateProductImageUrl(item.menuItem.name, item.menuItem.imageUrl)}
              alt={generateProductImageAlt(item.menuItem.name)}
              className="w-16 h-16 object-cover rounded mr-4"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium">{item.menuItem.name}</h3>
            
            {/* Affichage des détails de composition pour les produits personnalisés */}
            {formatCustomProduct(item.menuItem.description, "mt-1 text-xs text-gray-600")}
            
            {item.specialInstructions && (
              <p className="text-sm text-gray-500 mt-1">{item.specialInstructions}</p>
            )}
            <div className="flex items-center mt-2">
              {/* Masquer les contrôles de quantité pour les accompagnements */}
              {!["Sauce", "Accompagnement", "Accessoire"].includes(item.menuItem.category) ? (
                <>
                  <button
                    className="w-6 h-6 flex items-center justify-center border rounded-full"
                    onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
                  >
                    -
                  </button>
                  <span className="mx-2">{item.quantity}</span>
                  <button
                    className="w-6 h-6 flex items-center justify-center border rounded-full"
                    onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-600">Quantité: {item.quantity}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatEuro(item.menuItem.price * item.quantity)}</p>
            <button
              className="text-red-500 hover:text-red-700 text-sm mt-1"
              onClick={() => removeItem(item.menuItem.id)}
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
