
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdminLink = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur ou super_administrateur
        const [adminResult, superAdminResult] = await Promise.all([
          supabase.rpc('has_role', { user_id: session.user.id, role: 'administrateur' }),
          supabase.rpc('has_role', { user_id: session.user.id, role: 'super_administrateur' })
        ]);
        
        if (adminResult.error && superAdminResult.error) {
          throw adminResult.error || superAdminResult.error;
        }
        
        const isAdmin = !!adminResult.data || !!superAdminResult.data;
        setIsAdmin(isAdmin);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || !isAdmin) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin" className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tableau de bord administrateur</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AdminLink;
