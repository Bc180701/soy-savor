
import { X, Trash } from "lucide-react";
import { Link } from "react-router-dom";
import { CartItem } from "@/types";
import { formatEuro } from "@/utils/formatters";

interface CartItemListProps {
  items: CartItem[];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

export const CartItemList = ({ items, removeItem, updateQuantity }: CartItemListProps) => {
  // Fonction pour extraire et formater les détails des produits personnalisés
  const formatCustomProduct = (description: string | undefined) => {
    if (!description) return null;
    
    // Vérifier si c'est un produit personnalisé
    if (!description.includes('Enrobage:') && !description.includes('Ingrédients:')) {
      return null;
    }
    
    // Extraire les différentes parties
    const parts = description.split(', ');
    
    // Pour les sushis personnalisés
    if (description.includes('Enrobage:')) {
      const enrobage = parts.find(p => p.startsWith('Enrobage:'))?.replace('Enrobage: ', '');
      const base = parts.find(p => p.startsWith('Base:'))?.replace('Base: ', '');
      const garnitures = parts.find(p => p.startsWith('Garnitures:'))?.replace('Garnitures: ', '');
      const topping = parts.find(p => p.startsWith('Topping:'))?.replace('Topping: ', '');
      const sauce = parts.find(p => p.startsWith('Sauce:'))?.replace('Sauce: ', '');
      
      return (
        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
          {enrobage && <p><span className="font-semibold">Enrobage:</span> {enrobage}</p>}
          {base && <p><span className="font-semibold">Base:</span> {base}</p>}
          {garnitures && <p><span className="font-semibold">Garnitures:</span> {garnitures}</p>}
          {topping && <p><span className="font-semibold">Topping:</span> {topping}</p>}
          {sauce && <p><span className="font-semibold">Sauce:</span> {sauce}</p>}
        </div>
      );
    }
    
    // Pour les pokés personnalisés
    if (description.includes('Ingrédients:')) {
      const ingredients = parts.find(p => p.startsWith('Ingrédients:'))?.replace('Ingrédients: ', '');
      const proteine = parts.find(p => p.startsWith('Protéine:'))?.replace('Protéine: ', '');
      const sauce = parts.find(p => p.startsWith('Sauce:'))?.replace('Sauce: ', '');
      
      return (
        <div className="mt-1 space-y-0.5 text-xs text-gray-600">
          {ingredients && <p><span className="font-semibold">Ingrédients:</span> {ingredients}</p>}
          {proteine && <p><span className="font-semibold">Protéine:</span> {proteine}</p>}
          {sauce && <p><span className="font-semibold">Sauce:</span> {sauce}</p>}
        </div>
      );
    }
    
    return null;
  };

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
              src={item.menuItem.imageUrl}
              alt={item.menuItem.name}
              className="w-16 h-16 object-cover rounded mr-4"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium">{item.menuItem.name}</h3>
            
            {/* Affichage des détails de composition pour les produits personnalisés */}
            {formatCustomProduct(item.menuItem.description)}
            
            {item.specialInstructions && (
              <p className="text-sm text-gray-500 mt-1">{item.specialInstructions}</p>
            )}
            <div className="flex items-center mt-2">
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
