
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  MapPin, 
  Calendar, 
  Clock, 
  Gift, 
  Home, 
  Utensils, 
  ChefHat,
  CreditCard,
  Lock
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
    { id: "products", label: "Produits", icon: Package },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "restaurants", label: "Restaurants", icon: Utensils },
    { id: "delivery-zones", label: "Zones de livraison", icon: MapPin },
    { id: "opening-hours", label: "Horaires", icon: Clock },
    { id: "closures", label: "Fermetures", icon: Calendar },
    { id: "promotions", label: "Promotions", icon: Gift },
    { id: "homepage", label: "Page d'accueil", icon: Home },
    { id: "ingredients", label: "Ingrédients", icon: ChefHat },
    { id: "featured", label: "Produits phares", icon: Package },
    { id: "admin-users", label: "Administrateurs", icon: Settings },
    { id: "stripe", label: "Configuration Stripe", icon: CreditCard },
    { id: "ordering-lock", label: "Verrouillage commandes", icon: Lock },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Administration</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start text-left",
                  activeTab === item.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
