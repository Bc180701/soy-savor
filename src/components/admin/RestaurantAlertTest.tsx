import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { Bell, Loader2 } from "lucide-react";

const RestaurantAlertTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  const handleTestAlert = async () => {
    if (!currentRestaurant) {
      toast({
        title: "Erreur",
        description: "Aucun restaurant sélectionné",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Créer d'abord une commande de test dans la base
      console.log('🧪 Création d\'une commande de test pour:', currentRestaurant.name);
      
      const testOrder = {
        restaurant_id: currentRestaurant.id,
        user_id: null,
        subtotal: 25.50,
        tax: 2.55,
        delivery_fee: 3.00,
        total: 31.05,
        order_type: 'delivery' as const,
        status: 'paid' as const,
        client_name: 'Test Client',
        client_phone: '0123456789',
        client_email: 'test@example.com',
        delivery_address: 'Adresse de test',
        delivery_city: 'Ville de test',
        delivery_postal_code: '13000',
        items_summary: '[{"n":"TEST","p":2550,"q":1}]',
        payment_method: 'card' as const,
        scheduled_for: new Date().toISOString()
      };

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erreur création commande test:', orderError);
        throw orderError;
      }

      console.log('✅ Commande test créée:', orderData.id);
      
      const { data, error } = await supabase.functions.invoke('send-restaurant-alert', {
        body: {
          orderId: orderData.id,
          restaurantId: currentRestaurant.id
        }
      });

      if (error) {
        console.error('❌ Erreur test alerte:', error);
        throw error;
      }

      console.log('✅ Réponse fonction test:', data);

      if (data?.success) {
        toast({
          title: "✅ Test réussi",
          description: "L'alerte SMS a été envoyée avec succès !",
        });
      } else {
        toast({
          title: "⚠️ Test partiellement réussi",
          description: data?.message || "Fonction appelée mais SMS non envoyé",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur test alerte restaurant:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de tester l'alerte restaurant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5" />
        Test d'alerte restaurant
      </h3>
      
      <p className="text-gray-600 mb-4">
        Teste l'envoi d'un SMS d'alerte au numéro configuré pour le restaurant {currentRestaurant?.name || 'sélectionné'}.
      </p>
      
      <Button 
        onClick={handleTestAlert}
        disabled={isLoading || !currentRestaurant}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Test en cours...
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            Tester l'alerte SMS
          </>
        )}
      </Button>
      
      {!currentRestaurant && (
        <p className="text-red-500 text-sm mt-2">
          Veuillez sélectionner un restaurant pour tester l'alerte.
        </p>
      )}
    </div>
  );
};

export default RestaurantAlertTest;