
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import RestaurantSelector from "@/components/admin/RestaurantSelector";
import AdminManager from "@/components/admin/AdminManager";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Vérification de l'authentification admin...");
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Session récupérée:", !!session);
        
        if (!session) {
          console.log("Aucune session trouvée, redirection vers login");
          setIsAuthenticated(false);
          setIsLoading(false);
          navigate("/login");
          return;
        }
        
        setIsAuthenticated(true);
        
        // Vérifier le rôle admin avec la fonction RPC
        console.log("Vérification du rôle admin pour:", session.user.id);
        const { data: hasAdminRole, error: roleError } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        if (roleError) {
          console.error("Erreur lors de la vérification du rôle:", roleError);
          // Fallback: vérifier directement dans la table user_roles
          const { data: roleData, error: fallbackError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'administrateur')
            .single();
          
          if (fallbackError && fallbackError.code !== 'PGRST116') {
            console.error("Erreur lors de la vérification fallback du rôle:", fallbackError);
            throw fallbackError;
          }
          
          setIsAdmin(!!roleData);
        } else {
          setIsAdmin(!!hasAdminRole);
        }
        
        console.log("Utilisateur admin:", !!hasAdminRole || !!roleData);
        
        if (!hasAdminRole && !roleData) {
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

  if (!isAuthenticated || !isAdmin) {
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
