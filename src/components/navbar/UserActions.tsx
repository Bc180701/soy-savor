
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface UserActionsProps {
  user: any;
  handleLogout: () => Promise<void>;
}

const UserActions = ({ user, handleLogout }: UserActionsProps) => {
  const cart = useCart();
  
  return (
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
  );
};

export default UserActions;
