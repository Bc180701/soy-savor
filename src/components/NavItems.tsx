
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AdminLink from "./AdminLink";

const NavItems = () => {
  return (
    <div className="hidden md:flex items-center space-x-1">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/">Accueil</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/menu">Menu</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/commander">Commander</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link to="/contact">Contact</Link>
      </Button>
      <AdminLink />
    </div>
  );
};

export default NavItems;
