
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  navLinks: { name: string; path: string }[];
  user: any;
  handleLogout: () => Promise<void>;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, navLinks, user, handleLogout, onClose }: MobileMenuProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: user.id, role: 'administrateur' }
        );
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  if (!isOpen || !isMobile) return null;
  
  const handleLinkClick = () => {
    onClose();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "100vh" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-10 bg-white pt-20"
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xl py-3 border-b border-gray-100 ${
                  location.pathname === link.path
                    ? "text-gold-500 font-medium"
                    : "text-gray-800"
                }`}
                onClick={handleLinkClick}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/compte"
                  className="text-xl py-3 border-b border-gray-100 text-gray-800"
                  onClick={handleLinkClick}
                >
                  Mon compte
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-xl py-3 border-b border-gray-100 text-gray-800 flex items-center"
                    onClick={handleLinkClick}
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Administration
                  </Link>
                )}
                <Button
                  className="text-xl py-3 justify-start border-b border-gray-100 text-gray-800 hover:text-gold-500 bg-transparent"
                  onClick={() => {
                    handleLogout();
                    onClose();
                  }}
                >
                  Se déconnecter
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-xl py-3 border-b border-gray-100 text-gray-800"
                onClick={handleLinkClick}
              >
                Se connecter
              </Link>
            )}
            <Link to="/commander" className="pt-4" onClick={handleLinkClick}>
              <Button className="bg-gold-500 hover:bg-gold-600 text-black w-full py-6 text-lg">
                Commander maintenant
              </Button>
            </Link>
          </nav>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileMenu;
