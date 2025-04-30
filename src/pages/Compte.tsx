import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/use-order";
import { Order } from "@/types";
import { getOrdersByUser } from "@/services/orderService";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileForm from "@/components/profile/ProfileForm";

const Compte = () => {
  const { orders: localOrders, clearOrders } = useOrder();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("profil");
  const { toast } = useToast();

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!!session) {
        loadOrders();
      }
    };
    
    checkAuth();
  }, []);

  // Fonction pour charger les commandes
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const { orders: fetchedOrders, error } = await getOrdersByUser();
      
      if (error) {
        console.error("Erreur lors du chargement des commandes:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos commandes."
        });
        return;
      }
      
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Erreur inattendue lors du chargement des commandes:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des commandes."
      });
    } finally {
      setIsLoading(false);
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

  const handleProfileUpdated = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès."
    });
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Mon Compte</h1>
        <p className="text-gray-600 text-center mb-12">
          Gérez vos informations personnelles et suivez vos commandes
        </p>

        {isAuthenticated === false ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-gray-300" />
                <h2 className="text-2xl font-semibold">Vous n'êtes pas connecté</h2>
                <p className="text-gray-600 mb-6">
                  Connectez-vous pour accéder à votre compte et voir vos commandes
                </p>
                <Button asChild className="bg-akane-600 hover:bg-akane-700">
                  <a href="/login">
                    Se connecter
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs
            defaultValue="profil"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="profil">Mon Profil</TabsTrigger>
              <TabsTrigger value="commandes">Mes Commandes</TabsTrigger>
            </TabsList>

            <TabsContent value="profil">
              <Card>
                <CardHeader>
                  <CardTitle>Informations Personnelles</CardTitle>
                  <CardDescription>
                    Modifiez vos informations personnelles et adresses de livraison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm onProfileUpdated={handleProfileUpdated} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commandes">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des commandes</CardTitle>
                  <CardDescription>
                    Voici la liste de vos commandes passées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-medium">Commande #{order.id.substring(0, 8)}</span>
                              <Badge className="ml-2" variant={getStatusBadgeVariant(order.status)}>
                                {translateStatus(order.status)}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            Total: {order.total.toFixed(2)} €
                          </p>
                          <p className="text-gray-600">
                            Type: {order.orderType === 'delivery' ? 'Livraison' : 
                                  order.orderType === 'pickup' ? 'À emporter' : 'Sur place'}
                          </p>
                          <p className="text-gray-600">
                            Paiement: {order.paymentMethod === 'credit-card' ? 'Carte de crédit' : 
                                      order.paymentMethod === 'cash' ? 'Espèces' : 'PayPal'}
                          </p>
                        </div>
                      ))}
                      <Button 
                        onClick={loadOrders} 
                        className="mt-4 bg-akane-600 hover:bg-akane-700"
                      >
                        Rafraîchir
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {localOrders.length > 0 ? (
                        <div className="space-y-4">
                          <p className="text-gray-500 mb-4">
                            Vos commandes précédentes (stockées localement) :
                          </p>
                          {localOrders.map((order, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex justify-between mb-2">
                                <span className="font-medium">Commande #{index + 1}</span>
                                <span>{order.date}</span>
                              </div>
                              <p className="text-gray-600">
                                Total: {order.total.toFixed(2)} €
                              </p>
                              <p className="text-gray-600">
                                Nombre d'articles: {order.items.length}
                              </p>
                            </div>
                          ))}
                          <Button 
                            variant="destructive" 
                            onClick={clearOrders}
                            className="mt-4"
                          >
                            Effacer l'historique local
                          </Button>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          Vous n'avez pas encore passé de commande.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
};

export default Compte;
