import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import OrderList from "@/components/OrderList";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const AdminCommandesContent = () => {
  const { currentRestaurant } = useRestaurantContext();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  // Enable order notifications for admins/kitchen
  const { hasNewOrders, audioEnabled, enableAudio, clearNotifications } = useOrderNotifications(true, currentRestaurant?.id);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Force re-render of OrderList by updating a key
      window.location.reload();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Clear notifications when page is focused
  useEffect(() => {
    const handleFocus = () => {
      clearNotifications();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [clearNotifications]);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Commandes Cuisine
              {hasNewOrders && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  Nouvelles commandes !
                </span>
              )}
            </h1>
            {currentRestaurant && (
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {currentRestaurant.name}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {!audioEnabled && (
              <Button 
                onClick={enableAudio}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                Activer le son
              </Button>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Dernière mise à jour: {lastRefresh.toLocaleTimeString()}</span>
              <Button
                onClick={handleManualRefresh}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Auto-actualisation:</label>
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
              >
                {autoRefresh ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <OrderList defaultTab="kitchen" />
      </div>
    </div>
  );
};

const AdminCommandes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/login");
          return;
        }
        
        setIsAuthenticated(true);
        
        // Vérifier si l'utilisateur est admin ou cuisinier
        const { data: hasAdminRole, error: adminError } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        const { data: hasKitchenRole, error: kitchenError } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'cuisinier' }
        );
        
        const isAuthorized = hasAdminRole || hasKitchenRole;
        setIsAuthorized(isAuthorized);

        if (!isAuthorized) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions pour accéder à cette page.",
            variant: "destructive"
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la vérification des permissions.",
          variant: "destructive"
        });
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantProvider>
      <AdminCommandesContent />
    </RestaurantProvider>
  );
};

export default AdminCommandes;