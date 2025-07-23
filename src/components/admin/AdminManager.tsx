
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, Users, ShoppingCart, Settings, MapPin, Calendar, Clock, Gift, Home, Utensils, ChefHat } from "lucide-react";
import DashboardStats from "./DashboardStats";
import ProductManager from "./ProductManager";
import UsersList from "./UsersList";
import RestaurantsManager from "./RestaurantsManager";
import DeliveryZonesManager from "./DeliveryZonesManager";
import OpeningHoursManager from "./OpeningHoursManager";
import RestaurantClosuresManager from "./RestaurantClosuresManager";
import PromotionsManager from "./PromotionsManager";
import HomepageEditor from "./HomepageEditor";
import IngredientsManager from "./IngredientsManager";
import FeaturedProductsManager from "./FeaturedProductsManager";
import AdminSidebar from "./AdminSidebar";
import AdminInviteManager from "./AdminInviteManager";
import StripeKeysManager from "./StripeKeysManager";
import OrderingLockControl from "./OrderingLockControl";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminManager = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Administration
              </CardTitle>
              <CardDescription>
                L'interface d'administration n'est pas disponible sur mobile. Veuillez utiliser un ordinateur pour accéder à toutes les fonctionnalités.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">Gérez votre restaurant et vos commandes</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
              <TabsTrigger value="products">Produits</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
              <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
              <TabsTrigger value="delivery-zones">Zones de livraison</TabsTrigger>
              <TabsTrigger value="opening-hours">Horaires</TabsTrigger>
              <TabsTrigger value="closures">Fermetures</TabsTrigger>
              <TabsTrigger value="promotions">Promotions</TabsTrigger>
              <TabsTrigger value="homepage">Page d'accueil</TabsTrigger>
              <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
              <TabsTrigger value="featured">Produits phares</TabsTrigger>
              <TabsTrigger value="admin-users">Administrateurs</TabsTrigger>
              <TabsTrigger value="stripe">Configuration Stripe</TabsTrigger>
              <TabsTrigger value="ordering-lock">Verrouillage commandes</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <DashboardStats />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <ProductManager />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UsersList />
            </TabsContent>

            <TabsContent value="restaurants" className="space-y-6">
              <RestaurantsManager />
            </TabsContent>

            <TabsContent value="delivery-zones" className="space-y-6">
              <DeliveryZonesManager />
            </TabsContent>

            <TabsContent value="opening-hours" className="space-y-6">
              <OpeningHoursManager />
            </TabsContent>

            <TabsContent value="closures" className="space-y-6">
              <RestaurantClosuresManager />
            </TabsContent>

            <TabsContent value="promotions" className="space-y-6">
              <PromotionsManager />
            </TabsContent>

            <TabsContent value="homepage" className="space-y-6">
              <HomepageEditor />
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-6">
              <IngredientsManager />
            </TabsContent>

            <TabsContent value="featured" className="space-y-6">
              <FeaturedProductsManager />
            </TabsContent>

            <TabsContent value="admin-users" className="space-y-6">
              <AdminInviteManager />
            </TabsContent>

            <TabsContent value="stripe" className="space-y-6">
              <StripeKeysManager />
            </TabsContent>

            <TabsContent value="ordering-lock" className="space-y-6">
              <OrderingLockControl />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminManager;
