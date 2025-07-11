
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import DashboardStats from "./DashboardStats";
import ProductManager from "./ProductManager";
import OrderList from "../OrderList";
import UsersList from "./UsersList";
import PromotionsManager from "./PromotionsManager";
import HomepageEditor from "./HomepageEditor";
import OpeningHoursManager from "./OpeningHoursManager";
import DeliveryZonesManager from "./DeliveryZonesManager";
import IngredientsManager from "./IngredientsManager";
import OrderingLockControl from "./OrderingLockControl";
import RestaurantSelector from "./RestaurantSelector";

const AdminManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administration</h1>
        <RestaurantSelector />
      </div>
      
      <Separator />
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1">
          <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="homepage">Page d'accueil</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardStats />
        </TabsContent>
        
        <TabsContent value="orders" className="space-y-4">
          <OrderList />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <ProductManager />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="promotions" className="space-y-4">
          <PromotionsManager />
        </TabsContent>
        
        <TabsContent value="homepage" className="space-y-4">
          <HomepageEditor />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6">
            <OrderingLockControl />
            <OpeningHoursManager />
            <DeliveryZonesManager />
            <IngredientsManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminManager;
