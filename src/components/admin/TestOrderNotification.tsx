import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Bell } from "lucide-react";

const TestOrderNotification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  const simulateOrder = async () => {
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un restaurant",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Créer une commande de test
      const testOrder = {
        restaurant_id: currentRestaurant.id,
        user_id: null, // Commande anonyme pour le test
        subtotal: 25.50,
        tax: 2.55,
        delivery_fee: 3.00,
        total: 31.05,
        order_type: 'delivery',
        payment_method: 'card',
        payment_status: 'pending',
        status: 'pending',
        scheduled_for: new Date().toISOString(),
        client_name: 'Test Client',
        client_email: 'test@example.com',
        client_phone: '0123456789',
        delivery_street: '123 Rue de Test',
        delivery_city: 'Testville',
        delivery_postal_code: '13000'
      };

      const { error } = await supabase
        .from('orders')
        .insert(testOrder);

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Commande de test créée",
        description: "La notification devrait apparaître dans les autres onglets admin ouverts",
        duration: 3000,
      });

    } catch (error) {
      console.error('Erreur lors de la création de la commande de test:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande de test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Créez une commande de test pour tester les notifications en temps réel. 
        Ouvrez plusieurs onglets admin pour voir les notifications apparaître.
      </p>
      
      <Button 
        onClick={simulateOrder}
        disabled={isLoading || !currentRestaurant}
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        {isLoading ? "Création..." : "Simuler une nouvelle commande"}
      </Button>
      
      {!currentRestaurant && (
        <p className="text-sm text-orange-600">
          ⚠️ Sélectionnez un restaurant pour pouvoir tester
        </p>
      )}
    </div>
  );
};

export default TestOrderNotification;