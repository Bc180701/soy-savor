
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const cart = useCart();
  const { toast } = useToast();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fermer le menu quand on change de page
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Détecter le scroll pour changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      navigate("/");
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Commander", path: "/commander" },
    { name: "À propos", path: "/a-propos" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-sm shadow-sm py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <img 
              src="/lovable-uploads/80663134-a018-4c55-8a81-5ee048c700e3.png" 
              alt="SushiEats Logo" 
              className="h-12 w-auto"
            />
          </motion.div>
        </Link>

        {/* Navigation pour desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium relative overflow-hidden group ${
                location.pathname === link.path
                  ? "text-gold-500"
                  : "text-gray-800 hover:text-gold-500"
              }`}
            >
              {link.name}
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
                initial={false}
                animate={
                  location.pathname === link.path ? { scaleX: 1 } : { scaleX: 0 }
                }
                transition={{ duration: 0.3 }}
              />
            </Link>
          ))}
        </nav>

        {/* Boutons actions */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
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
                Se connecter
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
                {cart.itemCount || 0}
              </span>
            </Button>
          </Link>
          <Link to="/commander">
            <Button className="bg-gold-500 hover:bg-gold-600 text-black">
              Commander
            </Button>
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <div className="md:hidden flex items-center">
          <Link to="/panier" className="mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-800 relative"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-gold-500 text-black rounded-full text-xs">
                {cart.itemCount || 0}
              </span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMenu}
            className="relative z-20 text-gray-800"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {isOpen && isMobile && (
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
                  >
                    {link.name}
                  </Link>
                ))}
                {user ? (
                  <>
                    <Link
                      to="/compte"
                      className="text-xl py-3 border-b border-gray-100 text-gray-800"
                    >
                      Mon compte
                    </Link>
                    <Button
                      className="text-xl py-3 justify-start border-b border-gray-100 text-gray-800 hover:text-gold-500 bg-transparent"
                      onClick={handleLogout}
                    >
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="text-xl py-3 border-b border-gray-100 text-gray-800"
                  >
                    Se connecter
                  </Link>
                )}
                <Link to="/commander" className="pt-4">
                  <Button className="bg-gold-500 hover:bg-gold-600 text-black w-full py-6 text-lg">
                    Commander maintenant
                  </Button>
                </Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
