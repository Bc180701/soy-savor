import React, { useState } from "react";
import { Order } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ChefHat, Truck } from "lucide-react";
import OrdersAccountingView from "./OrdersAccountingView";
import OrdersKitchenView from "./OrdersKitchenView";
import OrdersDeliveryView from "./OrdersDeliveryView";
import { useIsMobile } from "@/hooks/use-mobile";

interface OrdersEventViewProps {
  orders: Order[];
  eventName: string;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
}

const OrdersEventView: React.FC<OrdersEventViewProps> = ({
  orders,
  eventName,
  onViewDetails,
  onUpdateStatus,
}) => {
  const [subView, setSubView] = useState<string>("kitchen");
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders.length} commande{orders.length > 1 ? 's' : ''} pour {eventName}
        </p>
      </div>

      <Tabs value={subView} onValueChange={setSubView} className="w-full">
        <TabsList 
          variant={isMobile ? "horizontal" : "default"} 
          className={`${isMobile ? 'w-full rounded-none border-b bg-white p-0 h-auto' : 'mb-4'}`}
        >
          <TabsTrigger 
            variant={isMobile ? "horizontal" : "default"}
            value="accounting" 
            className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-2 text-xs' : 'text-sm'}`}
          >
            <FileText className="h-3 w-3" />
            <span>Comptable</span>
          </TabsTrigger>
          <TabsTrigger 
            variant={isMobile ? "horizontal" : "default"}
            value="kitchen" 
            className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-2 text-xs' : 'text-sm'}`}
          >
            <ChefHat className="h-3 w-3" />
            <span>Cuisine</span>
          </TabsTrigger>
          <TabsTrigger 
            variant={isMobile ? "horizontal" : "default"}
            value="delivery" 
            className={`flex items-center gap-2 ${isMobile ? 'flex-1 py-2 text-xs' : 'text-sm'}`}
          >
            <Truck className="h-3 w-3" />
            <span>Livraison</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounting" className="mt-0">
          <OrdersAccountingView 
            orders={orders} 
            onViewDetails={onViewDetails} 
            onUpdateStatus={onUpdateStatus} 
          />
        </TabsContent>
        
        <TabsContent value="kitchen" className="mt-0">
          <OrdersKitchenView 
            orders={orders} 
            onViewDetails={onViewDetails} 
            onUpdateStatus={onUpdateStatus} 
          />
        </TabsContent>
        
        <TabsContent value="delivery" className="mt-0">
          <OrdersDeliveryView 
            orders={orders} 
            onViewDetails={onViewDetails} 
            onUpdateStatus={onUpdateStatus} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersEventView;
