
import { useEffect } from "react";
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  Tag, 
  Home, 
  UserCheck, 
  Settings,
  Clock,
  MapPin,
  ChefHat,
  Utensils,
  X as XIcon,
  CreditCard,
  Shield,
  Printer,
  Bluetooth
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import RestaurantSelector from "./RestaurantSelector";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navigationItems = [
  { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
  { id: "orders", label: "Commandes", icon: ShoppingCart },
  { id: "products", label: "Produits", icon: Package },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "blocked-slots", label: "Créneaux bloqués", icon: Clock },
  { id: "promotions", label: "Promotions", icon: Tag },
  { id: "homepage", label: "Page d'accueil", icon: Home },
  { id: "admins", label: "Administrateurs", icon: UserCheck },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "stripe-keys", label: "Clés Stripe", icon: CreditCard },
  { id: "printers", label: "Imprimantes", icon: Printer },
  { id: "bluetooth", label: "Bluetooth Mobile", icon: Bluetooth },
  { id: "settings", label: "Paramètres", icon: Settings },
];

const AdminSidebar = ({ activeSection, onSectionChange, isOpen, onClose }: AdminSidebarProps) => {
  const { isSuperAdmin, canAccessSection, loading, refreshPermissions } = useAdminPermissions();
  
  // Écouter les changements de permissions pour rafraîchir la sidebar
  useEffect(() => {
    const handlePermissionsChanged = (event: CustomEvent) => {
      console.log('🔄 Événement permissions changées reçu - rafraîchissement sidebar:', event.detail);
      refreshPermissions();
    };

    const handleCurrentUserPermissionsChanged = (event: CustomEvent) => {
      console.log('🔄 Permissions utilisateur actuel changées - rafraîchissement sidebar:', event.detail);
      refreshPermissions();
    };

    window.addEventListener('admin-permissions-changed', handlePermissionsChanged as EventListener);
    window.addEventListener('current-user-permissions-changed', handleCurrentUserPermissionsChanged as EventListener);
    
    return () => {
      window.removeEventListener('admin-permissions-changed', handlePermissionsChanged as EventListener);
      window.removeEventListener('current-user-permissions-changed', handleCurrentUserPermissionsChanged as EventListener);
    };
  }, [refreshPermissions]);
  
  // Afficher un loader si les permissions sont en cours de chargement
  if (loading) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50",
          "lg:relative lg:transform-none lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Administration</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Restaurant Selector */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <RestaurantSelector />
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-500">Chargement des permissions...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50",
        "lg:relative lg:transform-none lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Administration</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Restaurant Selector */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <RestaurantSelector />
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navigationItems
              .filter((item) => {
                const canAccess = canAccessSection(item.id);
                console.log(`🔍 Filtrage section ${item.id}:`, {
                  isSuperAdmin,
                  canAccess,
                  loading,
                  finalResult: item.id === 'permissions' ? isSuperAdmin : canAccess
                });
                
                // Les permissions ne sont visibles que pour les super-admins
                if (item.id === 'permissions') {
                  return isSuperAdmin;
                }
                // Pour les autres sections, vérifier les permissions
                return canAccess;
              })
              .map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onSectionChange(item.id);
                        onClose();
                      }}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        activeSection === item.id
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default AdminSidebar;
