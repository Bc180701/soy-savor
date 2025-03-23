
import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrder } from "@/hooks/use-order";

const Compte = () => {
  const { orders, clearOrders } = useOrder();
  const [activeTab, setActiveTab] = useState("profil");

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
                <CardTitle>Information Personnelles</CardTitle>
                <CardDescription>
                  Modifiez vos informations personnelles ici
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Cette section est en cours de développement.</p>
                <p className="text-gray-500 mt-4">
                  Vous pourrez bientôt mettre à jour vos informations de contact, 
                  adresses de livraison et préférences.
                </p>
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
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
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
                      Effacer l'historique
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Vous n'avez pas encore passé de commande.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Compte;
