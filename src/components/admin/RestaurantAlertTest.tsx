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
      // Générer un ID de commande fictif pour le test
      const fakeOrderId = crypto.randomUUID();
      
      console.log('🧪 Test d\'alerte restaurant pour:', currentRestaurant.name);
      
      const { data, error } = await supabase.functions.invoke('send-restaurant-alert', {
        body: {
          orderId: fakeOrderId,
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