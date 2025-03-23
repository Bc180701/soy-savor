
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrder } from "@/hooks/use-order";
import { Calendar, Package, Settings, User } from "lucide-react";

const Compte = () => {
  const { order } = useOrder();

  // Formulaire dummy pour simuler un compte utilisateur
  const profileInfo = {
    name: "Jean Dupont",
    email: "jean.dupont@exemple.fr",
    phone: "06 12 34 56 78",
    address: "123 Rue du Sushi, 75001 Paris"
  };

  // Historique factice des commandes
  const orderHistory = order ? [order] : [];

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

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet</Label>
                      <Input id="name" defaultValue={profileInfo.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={profileInfo.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" defaultValue={profileInfo.phone} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" defaultValue={profileInfo.address} />
                    </div>
                  </div>
                  <Button className="bg-akane-600 hover:bg-akane-700">Sauvegarder les modifications</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Historique des commandes</CardTitle>
              </CardHeader>
              <CardContent>
                {orderHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
                    <p className="text-gray-600">
                      Vous n'avez pas encore passé de commande
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orderHistory.map((order, index) => (
                      <div key={index} className="border rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">Commande #{index + 1000}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.date).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Livrée
                          </span>
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} €</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t mt-4 pt-4 flex justify-between font-medium">
                          <span>Total</span>
                          <span>{order.total.toFixed(2)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button className="bg-akane-600 hover:bg-akane-700">Mettre à jour le mot de passe</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Compte;
