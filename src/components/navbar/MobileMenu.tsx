import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield } from "lucide-react";
import { useHomepageData } from "@/hooks/useHomepageData";
import { checkAdminRole } from "@/utils/adminUtils";

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
  const { data: homepageData } = useHomepageData();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const isAdmin = await checkAdminRole(user.id);
      setIsAdmin(isAdmin);
    };
    
    checkAdminStatus();
  }, [user]);
  
  // Use configured texts or fall back to defaults
  const getNavLinkText = (path: string, defaultText: string) => {
    if (!homepageData?.header_section) return defaultText;
    
    switch (path) {
      case "/":
        return homepageData.header_section.nav_links.home;
      case "/menu":
        return homepageData.header_section.nav_links.menu;
      case "/commander":
        return homepageData.header_section.nav_links.order;
      case "/contact":
        return homepageData.header_section.nav_links.contact;
      default:
        return defaultText;
    }
  };
  
  if (!isOpen || !isMobile) return null;
  
  const handleLinkClick = () => {
    onClose();
  };
  
  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
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
                {getNavLinkText(link.path, link.name)}
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
                  onClick={handleLogoutClick}
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
                {homepageData?.header_section?.buttons?.login || "Se connecter"}
              </Link>
            )}
            <Link to="/commander" className="pt-4" onClick={handleLinkClick}>
              <Button className="bg-gold-500 hover:bg-gold-600 text-black w-full py-6 text-lg">
                {homepageData?.header_section?.buttons?.order || "Commander maintenant"}
              </Button>
            </Link>
          </nav>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileMenu;
