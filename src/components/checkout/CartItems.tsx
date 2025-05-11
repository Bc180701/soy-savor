
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Trash2 } from "lucide-react";
import { CartItem } from "@/types";

interface CartItemsProps {
  items: CartItem[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}

const CartItems = ({ items, onIncrement, onDecrement, onRemove }: CartItemsProps) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Articles ({items.length})</h2>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.menuItem.id} className="py-6 px-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                    <img
                      src={item.menuItem.imageUrl || '/placeholder.svg'}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium">{item.menuItem.name}</h3>
                    <p className="text-gold-600 font-semibold mt-1">
                      {item.menuItem.price.toFixed(2)} €
                    </p>
                    {item.specialInstructions && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDecrement(item.menuItem.id)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onIncrement(item.menuItem.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => onRemove(item.menuItem.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
};

export default CartItems;
