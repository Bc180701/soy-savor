import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Logo from "@/components/navbar/Logo";
import DesktopNavLinks from "@/components/navbar/DesktopNavLinks";
import UserActions from "@/components/navbar/UserActions";
import MobileActions from "@/components/navbar/MobileActions";
import MobileMenu from "@/components/navbar/MobileMenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
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
    try {
      // Forcer la déconnexion locale même si la session serveur échoue
      setUser(null);
      
      // Nettoyer le localStorage
      localStorage.removeItem('sb-tdykegnmomyyucbhslok-auth-token');
      
      const { error } = await supabase.auth.signOut();
      
      // Ne pas bloquer sur les erreurs de session expirée/inexistante
      if (error && !error.message.includes('Session') && !error.message.includes('session')) {
        console.error("Erreur lors de la déconnexion:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors de la déconnexion. Veuillez réessayer.",
        });
        return;
      }
      
      // Toujours afficher le message de succès et rediriger
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      
      // Rediriger vers la page d'accueil
      navigate("/");
    } catch (err) {
      console.error("Exception lors de la déconnexion:", err);
      // Forcer la déconnexion locale même en cas d'erreur
      setUser(null);
      localStorage.removeItem('sb-tdykegnmomyyucbhslok-auth-token');
      
      toast({
        title: "Déconnexion forcée",
        description: "Vous avez été déconnecté localement",
      });
      
      navigate("/");
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Accueil", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Commander", path: "/commander" },
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
        <Logo />

        {/* Navigation pour desktop */}
        <DesktopNavLinks navLinks={navLinks} />

        {/* Boutons actions */}
        <UserActions user={user} handleLogout={handleLogout} />

        {/* Bouton menu mobile */}
        <MobileActions isOpen={isOpen} toggleMenu={toggleMenu} />
      </div>

      {/* Menu mobile */}
      <MobileMenu 
        isOpen={isOpen} 
        navLinks={navLinks} 
        user={user}
        handleLogout={handleLogout}
        onClose={closeMenu}
      />
    </header>
  );
};

export default Navbar;
