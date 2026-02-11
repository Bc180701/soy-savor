
import { X, Trash, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { CartItem } from "@/types";
import { formatEuro } from "@/utils/formatters";
import { formatCustomProduct } from "@/utils/formatCustomProduct";
import { generateProductImageUrl, generateProductImageAlt } from "@/utils/productImageUtils";
import { useEventFreeDesserts } from "@/hooks/useEventFreeDesserts";
import { useCartRestaurant } from "@/hooks/useCartRestaurant";

interface CartItemListProps {
  items: CartItem[];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  plateauCount?: number;
}

export const CartItemList = ({ items, removeItem, updateQuantity, plateauCount = 0 }: CartItemListProps) => {
  const { cartRestaurant } = useCartRestaurant();
  const { freeDessertsEnabled, eventName, eventProductsCount, getFreeDessertInfo } = useEventFreeDesserts(cartRestaurant?.id);

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">Votre panier est vide.</p>
        <Link to="/carte" className="mt-4 inline-block text-gold-500 hover:text-gold-600">
          Parcourir le menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Banner desserts offerts */}
      {freeDessertsEnabled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-green-600" />
          <p className="text-green-800 text-sm font-medium">
            🎉 Offre active : {eventProductsCount} dessert{eventProductsCount > 1 ? 's' : ''} offert{eventProductsCount > 1 ? 's' : ''} avec {eventName} !
          </p>
        </div>
      )}

      {items.map((item) => {
        const freeDessertInfo = getFreeDessertInfo(item as any);
        const { freeQuantity } = freeDessertInfo;
        const paidQuantity = item.quantity - freeQuantity;
        
        return (
          <div key={`${item.menuItem.id}-${item.specialInstructions}`} className="flex items-start border-b py-4">
            {item.menuItem.imageUrl && (
              <img
                src={generateProductImageUrl(item.menuItem.name, item.menuItem.imageUrl)}
                alt={generateProductImageAlt(item.menuItem.name)}
                className="w-16 h-16 object-cover rounded mr-4"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{item.menuItem.name}</h3>
                {freeDessertInfo.isFreeDessert && freeQuantity > 0 && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {freeQuantity} offert{freeQuantity > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Affichage des détails de composition pour les produits personnalisés */}
              {formatCustomProduct(item.menuItem.description, "mt-1 text-xs text-gray-600")}
              
              {item.specialInstructions && (
                <p className="text-sm text-gray-500 mt-1">{item.specialInstructions}</p>
              )}
              <div className="flex items-center mt-2">
                {/* Masquer les contrôles de quantité pour les accompagnements */}
              {!["Sauce", "Accompagnement", "Accessoire"].includes(item.menuItem.category) ? (
                  (() => {
                    const isFreeDessertItem = item.specialInstructions?.includes('Dessert offert');
                    const maxQty = isFreeDessertItem ? plateauCount : Infinity;
                    const canIncrease = item.quantity < maxQty;
                    return (
                      <>
                        <button
                          className="w-6 h-6 flex items-center justify-center border rounded-full"
                          onClick={() => updateQuantity(item.menuItem.id, Math.max(1, item.quantity - 1))}
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button
                          className="w-6 h-6 flex items-center justify-center border rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={() => canIncrease && updateQuantity(item.menuItem.id, item.quantity + 1)}
                          disabled={!canIncrease}
                        >
                          +
                        </button>
                        {isFreeDessertItem && (
                          <span className="text-xs text-muted-foreground ml-2">max {maxQty}</span>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <span className="text-sm text-muted-foreground">Quantité: {item.quantity}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              {freeDessertInfo.isFreeDessert && freeQuantity > 0 ? (
                <div>
                  {paidQuantity > 0 ? (
                    <>
                      <p className="font-medium">{formatEuro(item.menuItem.price * paidQuantity)}</p>
                      <p className="text-sm text-green-600">
                        + {freeQuantity} gratuit{freeQuantity > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-400 line-through">
                        {formatEuro(item.menuItem.price * item.quantity)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-green-600">Gratuit</p>
                      <p className="text-sm text-gray-400 line-through">
                        {formatEuro(freeDessertInfo.originalPrice * item.quantity)}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="font-medium">{formatEuro(item.menuItem.price * item.quantity)}</p>
              )}
              <button
                className="text-red-500 hover:text-red-700 text-sm mt-1"
                onClick={() => removeItem(item.menuItem.id)}
              >
                <Trash className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
