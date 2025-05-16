
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface OrdersKitchenViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

const OrdersKitchenView = ({ 
  orders, 
  onViewDetails, 
  onUpdateStatus 
}: OrdersKitchenViewProps) => {
  // Filtrer uniquement les commandes pertinentes pour la cuisine
  // (commandes confirmées ou en préparation)
  const kitchenOrders = orders.filter(order => 
    order.status === 'confirmed' || 
    order.status === 'preparing'
  );

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-blue-500">À préparer</Badge>;
      case 'preparing':
        return <Badge className="bg-purple-500">En préparation</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
        <div className="mt-2 space-y-1 text-xs border-l-2 border-gold-500 pl-2">
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
        <div className="mt-2 space-y-1 text-xs border-l-2 border-wasabi-500 pl-2">
          {ingredients && <p><span className="font-semibold">Ingrédients:</span> {ingredients}</p>}
          {proteine && <p><span className="font-semibold">Protéine:</span> {proteine}</p>}
          {sauce && <p><span className="font-semibold">Sauce:</span> {sauce}</p>}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Vue Cuisine ({kitchenOrders.length})</h2>
      
      {kitchenOrders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Pas de commandes à préparer pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kitchenOrders.map(order => (
            <Card key={order.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    Commande #{order.id.substring(0, 6)}
                  </CardTitle>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatTime(order.scheduledFor)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-700">
                    {order.orderType === 'delivery' ? 'Livraison' : 
                     order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              
              <CardContent className="py-2">
                <ul className="space-y-3">
                  {order.items.map((item, index) => (
                    <li key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {item.quantity}× {item.menuItem.name}
                        </span>
                      </div>
                      
                      {/* Afficher les détails des produits personnalisés */}
                      {formatCustomProduct(item.menuItem.description)}
                      
                      {/* Afficher les instructions spéciales s'il y en a */}
                      {item.specialInstructions && (
                        <div className="mt-1 text-xs italic text-gray-600">
                          Note: {item.specialInstructions}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {order.customerNotes && (
                  <div className="mt-2 p-2 bg-amber-50 rounded-md text-sm">
                    <span className="font-medium">Note:</span> {order.customerNotes}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>
                
                {order.status === 'confirmed' && (
                  <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={() => onUpdateStatus(order.id, 'preparing')}
                  >
                    Commencer préparation
                  </Button>
                )}
                
                {order.status === 'preparing' && (
                  <Button
                    size="sm"
                    className="bg-gold-500 hover:bg-gold-600 text-black"
                    onClick={() => onUpdateStatus(order.id, order.orderType === 'delivery' ? 'out-for-delivery' : 'ready')}
                  >
                    {order.orderType === 'delivery' ? 'Prêt pour livraison' : 'Prêt à emporter'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersKitchenView;
