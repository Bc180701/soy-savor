
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut, Shield } from "lucide-react";
import { useCartCounter } from "@/hooks/useCartCounter";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHomepageData } from "@/hooks/useHomepageData";

interface UserActionsProps {
  user: any;
  handleLogout: () => Promise<void>;
}

const UserActions = ({ user, handleLogout }: UserActionsProps) => {
  const { itemCount } = useCartCounter();
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const { data: homepageData } = useHomepageData();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        // Vérifier si l'utilisateur a le rôle d'administrateur ou super_administrateur
        const [adminResult, superAdminResult] = await Promise.all([
          supabase.rpc('has_role', { user_id: user.id, role: 'administrateur' }),
          supabase.rpc('has_role', { user_id: user.id, role: 'super_administrateur' })
        ]);
        
        if (adminResult.error && superAdminResult.error) {
          throw adminResult.error || superAdminResult.error;
        }
        
        const isAdmin = !!adminResult.data || !!superAdminResult.data;
        setIsAdmin(isAdmin);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  return (
    <div className="hidden md:flex items-center space-x-4">
      {user ? (
        <>
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-800 hover:text-gold-500 hover:bg-gray-100"
              >
                <Shield size={20} />
              </Button>
            </Link>
          )}
          <Link to="/compte">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-800 hover:text-gold-500 hover:bg-gray-100"
            >
              <User size={20} />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-800 hover:text-gold-500 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut size={20} />
          </Button>
        </>
      ) : (
        <Link to="/login">
          <Button className="bg-white text-black border border-gold-200 hover:bg-gray-50">
            {homepageData?.header_section?.buttons?.login || "Se connecter"}
          </Button>
        </Link>
      )}
      <Link to="/panier">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-800 hover:text-gold-500 hover:bg-gray-100 relative"
        >
          <ShoppingCart size={20} />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gold-500 text-black rounded-full text-xs">
            {itemCount || 0}
          </span>
        </Button>
      </Link>
      <Link to="/commander">
        <Button className="bg-gold-500 hover:bg-gold-600 text-black">
          {homepageData?.header_section?.buttons?.order || "Commander"}
        </Button>
      </Link>
    </div>
  );
};

export default UserActions;
