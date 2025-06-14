
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useHomepageData } from "@/hooks/useHomepageData";

interface MobileActionsProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const MobileActions = ({ isOpen, toggleMenu }: MobileActionsProps) => {
  const cart = useCart();
  const { data: homepageData } = useHomepageData();
  
  return (
    <div className="md:hidden flex items-center justify-between w-full">
      {/* Panier à gauche */}
      <Link to="/panier">
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

      {/* Bouton Commander au centre */}
      <Link to="/commander">
        <Button className="bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 text-sm font-medium">
          {homepageData?.header_section?.buttons?.order || "Commander"}
        </Button>
      </Link>

      {/* Menu hamburger à droite */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        className="relative z-20 text-gray-800"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
    </div>
  );
};

export default MobileActions;
