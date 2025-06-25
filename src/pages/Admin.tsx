
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import RestaurantSelector from "@/components/admin/RestaurantSelector";
import AdminManager from "@/components/admin/AdminManager";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Vérifier le rôle admin
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'administrateur')
          .single();
        
        if (roleError && roleError.code !== 'PGRST116') {
          console.error("Erreur lors de la vérification du rôle:", roleError);
          throw roleError;
        }
        
        setIsAdmin(!!roleData);
        
        if (!roleData) {
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
      }
    };
    
    checkAuth();
  }, [navigate, toast]);

  if (isAuthenticated === null || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <RestaurantProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
              <RestaurantSelector />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-6">
          <AdminManager />
        </div>
      </div>
    </RestaurantProvider>
  );
};

export default Admin;
