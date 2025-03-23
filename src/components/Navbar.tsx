
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/hooks/use-cart";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const cart = useCart();

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
            className="text-2xl font-japanese font-bold"
          >
            <span className="text-akane-600">Sushi</span>
            <span className="text-black">Eats</span>
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
                  ? "text-akane-600"
                  : "text-gray-800 hover:text-akane-600"
              }`}
            >
              {link.name}
              <motion.span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-akane-600 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
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
          <Link to="/compte">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-800 hover:text-akane-600 hover:bg-gray-100"
            >
              <User size={20} />
            </Button>
          </Link>
          <Link to="/panier">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-800 hover:text-akane-600 hover:bg-gray-100 relative"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-akane-600 text-white rounded-full text-xs">
                {cart.itemCount || 0}
              </span>
            </Button>
          </Link>
          <Link to="/commander">
            <Button className="bg-akane-600 hover:bg-akane-700 text-white">
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
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-akane-600 text-white rounded-full text-xs">
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
                        ? "text-akane-600 font-medium"
                        : "text-gray-800"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <Link
                  to="/compte"
                  className="text-xl py-3 border-b border-gray-100 text-gray-800"
                >
                  Mon compte
                </Link>
                <Link to="/commander" className="pt-4">
                  <Button className="bg-akane-600 hover:bg-akane-700 text-white w-full py-6 text-lg">
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
