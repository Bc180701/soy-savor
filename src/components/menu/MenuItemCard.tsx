
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
}

const MenuItemCard = ({ item, onAddToCart }: MenuItemCardProps) => {
  return (
    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/4 h-32 overflow-hidden">
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-full md:w-3/4 p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.isVegetarian && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Végétarien
                    </Badge>
                  )}
                  {item.isSpicy && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Épicé
                    </Badge>
                  )}
                  {item.isNew && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Nouveau
                    </Badge>
                  )}
                  {item.isBestSeller && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Populaire
                    </Badge>
                  )}
                  {item.pieces && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {item.pieces} pièces
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-akane-600">
                  {item.price.toFixed(2)} €
                </Badge>
              </div>
            </div>
            <Button 
              onClick={() => onAddToCart(item)} 
              className="mt-4 bg-akane-600 hover:bg-akane-700 w-full md:w-auto self-end float-right"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter au panier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
