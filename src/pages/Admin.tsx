
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Settings,
  AlertCircle,
  Eye,
  PlusCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllOrders, updateOrderStatus } from "@/services/orderService";
import { simulateOrder } from "@/utils/simulateOrder";
import { Order } from "@/types";

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast: toastHook } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        const { data, error } = await supabase.rpc(
          'has_role',
          { user_id: session.user.id, role: 'administrateur' }
        );
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Erreur lors de la vérification du statut admin:", error);
        toastHook({
          variant: "destructive",
          title: "Erreur d'accès",
          description: "Impossible de vérifier vos autorisations."
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [toastHook]);

  // Fonction pour charger les commandes
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const { orders: fetchedOrders, error } = await getAllOrders();
      
      if (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        toastHook({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les commandes."
        });
        return;
      }
      
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Erreur inattendue lors du chargement des commandes:", error);
      toastHook({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des commandes."
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fonction pour simuler une commande
  const handleSimulateOrder = async () => {
    try {
      setIsSimulating(true);
      const { success, orderId, error } = await simulateOrder();
      
      if (!success) {
        toastHook({
          variant: "destructive",
          title: "Erreur",
          description: error || "Impossible de simuler la commande."
        });
        return;
      }
      
      toast.success("Commande simulée avec succès", {
        description: `ID de commande: ${orderId?.substring(0, 8)}...`
      });
      
      // Recharger les commandes
      loadOrders();
    } catch (error) {
      console.error("Erreur lors de la simulation de commande:", error);
      toastHook({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la simulation de commande."
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Fonction pour mettre à jour le statut d'une commande
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { success, error } = await updateOrderStatus(orderId, newStatus);
      
      if (!success) {
        toastHook({
          variant: "destructive",
          title: "Erreur",
          description: error || "Impossible de mettre à jour le statut de la commande."
        });
        return;
      }
      
      // Mettre à jour la liste des commandes
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any } 
          : order
      ));
      
      toastHook({
        title: "Succès",
        description: "Le statut de la commande a été mis à jour."
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      toastHook({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut."
      });
    }
  };

  // Charger les commandes quand la tab est activée
  const handleTabChange = (value: string) => {
    if (value === "commandes") {
      loadOrders();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    // Don't call toast here, as it causes re-renders
    return <Navigate to="/" replace />;
  }

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return "default";
      case 'confirmed':
        return "secondary";
      case 'preparing':
        return "outline";
      case 'ready':
        return "secondary";
      case 'out-for-delivery':
        return "outline";
      case 'delivered':
        return "success";
      case 'completed':
        return "success";
      case 'cancelled':
        return "destructive";
      default:
        return "default";
    }
  };

  // Traduire le statut en français
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'preparing': 'En préparation',
      'ready': 'Prête',
      'out-for-delivery': 'En livraison',
      'delivered': 'Livrée',
      'completed': 'Terminée',
      'cancelled': 'Annulée'
    };
    
    return statusMap[status] || status;
  };

  // Statuts disponibles pour la mise à jour
  const availableStatuses = [
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'out-for-delivery',
    'delivered',
    'completed',
    'cancelled'
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
      </div>

      <Tabs defaultValue="commandes" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span>Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="utilisateurs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="statistiques" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="parametres" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="commandes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestion des commandes</CardTitle>
                <CardDescription>
                  Gérez les commandes récentes et modifiez leur statut.
                </CardDescription>
              </div>
              <Button 
                onClick={handleSimulateOrder} 
                disabled={isSimulating}
                className="bg-akane-600 hover:bg-akane-700 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {isSimulating ? "Simulation..." : "Simuler une commande"}
              </Button>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Paiement</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString('fr-FR')}</TableCell>
                          <TableCell>{order.total.toFixed(2)} €</TableCell>
                          <TableCell>
                            {order.orderType === 'delivery' ? 'Livraison' : 
                             order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {translateStatus(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'outline'}>
                              {order.paymentStatus === 'paid' ? 'Payé' : 
                               order.paymentStatus === 'pending' ? 'En attente' : 'Échoué'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <select 
                                className="text-xs border rounded p-1"
                                value={order.status}
                                onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              >
                                {availableStatuses.map(status => (
                                  <option key={status} value={status}>
                                    {translateStatus(status)}
                                  </option>
                                ))}
                              </select>
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune commande trouvée</p>
                  <Button 
                    onClick={loadOrders} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Rafraîchir
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Mettez à jour les statuts des commandes pour tenir les clients informés.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilisateurs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>
                Gérez les comptes utilisateurs et leurs autorisations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les utilisateurs s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Ajoutez, modifiez ou supprimez des comptes utilisateurs.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistiques" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques de vente</CardTitle>
              <CardDescription>
                Consultez les statistiques de vente et les tendances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les statistiques s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Consultez les données analytiques pour optimiser vos ventes.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="parametres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du site</CardTitle>
              <CardDescription>
                Configurez les paramètres généraux du site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Les paramètres s'afficheront ici</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Ajustez les configurations pour optimiser l'expérience utilisateur.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
