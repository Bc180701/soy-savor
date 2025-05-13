
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
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        // Since we're using a mock, this will always return null
        const { data: hasRole, error } = await supabase.rpc('has_role');
        
        if (error) throw error;
        setIsAdmin(!!hasRole);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    
    // Écouter les changements d'état d'authentification
    const { data } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => {
      data.subscription.unsubscribe();
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
