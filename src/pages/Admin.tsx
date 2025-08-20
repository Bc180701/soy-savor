
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RestaurantProvider } from "@/hooks/useRestaurantContext";
import AdminManager from "@/components/admin/AdminManager";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useSessionStability } from "@/hooks/useSessionStability";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Hooks de performance et stabilité
  const { measureAsync } = usePerformanceMonitor();
  const { checkSessionHealth, getSessionStats, forceSessionRefresh } = useSessionStability();

  useEffect(() => {
    const checkAuth = async () => {
      await measureAsync('admin_auth_check', async () => {
        try {
          console.log("🔐 Vérification authentification admin...");
          
          // Vérifier la santé de la session d'abord
          const sessionHealthy = await checkSessionHealth();
          if (!sessionHealthy) {
            console.warn("⚠️ Session instable, tentative de rafraîchissement...");
            const refreshed = await forceSessionRefresh();
            if (!refreshed) {
              throw new Error("Impossible de rafraîchir la session");
            }
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          console.log("Session récupérée:", !!session, session?.user?.email);
          
          if (!session) {
            console.log("❌ Aucune session trouvée, redirection vers login");
            setIsAuthenticated(false);
            setIsLoading(false);
            navigate("/login");
            return;
          }
          
          setIsAuthenticated(true);
          
          // Vérifier le rôle admin avec timeout et fallback
          console.log("👤 Vérification rôle admin pour:", session.user.email);
          
          let finalIsAdmin = false;
          
          try {
            const { data: hasAdminRole, error: roleError } = await Promise.race([
              supabase.rpc('has_role', { user_id: session.user.id, role: 'administrateur' }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout RPC role')), 5000))
            ]) as any;
            
            if (roleError) {
              throw roleError;
            }
            
            finalIsAdmin = !!hasAdminRole;
            console.log("✅ Vérification rôle réussie:", finalIsAdmin);
            
          } catch (roleError: any) {
            console.warn("⚠️ Erreur RPC role:", roleError.message, "- Utilisation du fallback");
            
            // Fallback robuste
            const { data: fallbackRoleData, error: fallbackError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .eq('role', 'administrateur')
              .single();
            
            if (fallbackError && fallbackError.code !== 'PGRST116') {
              console.error("❌ Erreur fallback role:", fallbackError);
              throw fallbackError;
            }
            
            finalIsAdmin = !!fallbackRoleData;
            console.log("🔄 Rôle vérifié via fallback:", finalIsAdmin);
          }
          
          setIsAdmin(finalIsAdmin);

          if (!finalIsAdmin) {
            console.log("🚫 Accès refusé - pas admin");
            toast({
              title: "Accès refusé",
              description: "Vous n'avez pas les permissions pour accéder à cette page.",
              variant: "destructive"
            });
            navigate("/");
          } else {
            console.log("✅ Accès admin autorisé");
            
            // Afficher les stats de session en mode debug
            const stats = getSessionStats();
            console.log("📊 Stats session:", stats);
          }
          
        } catch (error: any) {
          console.error("💥 Erreur critique auth admin:", error);
          toast({
            title: "Erreur d'authentification",
            description: `Erreur lors de la vérification: ${error.message}`,
            variant: "destructive"
          });
          navigate("/");
        } finally {
          setIsLoading(false);
        }
      });
    };
    
    checkAuth();
  }, [navigate, toast, measureAsync, checkSessionHealth, forceSessionRefresh, getSessionStats]);

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
      <AdminManager />
    </RestaurantProvider>
  );
};

export default Admin;
