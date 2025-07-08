import { useEffect, useState } from "react";
import { CheckCircle, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";

const CommandeConfirmee = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-gray-600">
            Merci pour votre commande. Votre paiement a été traité avec succès.
          </p>
        </div>

        {sessionId && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Détails de votre commande</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Numéro de session : <span className="font-mono">{sessionId}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Préparation</h3>
              <p className="text-sm text-gray-600">
                Votre commande est maintenant en cours de préparation par nos chefs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Truck className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Livraison</h3>
              <p className="text-sm text-gray-600">
                Vous recevrez une notification quand votre commande sera prête ou en cours de livraison.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/compte">
              Voir mes commandes
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/menu">
              Continuer mes achats
            </Link>
          </Button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Besoin d'aide ?</strong> Contactez-nous au{" "}
            <a href="tel:0490947120" className="font-semibold underline">
              04 90 94 71 20
            </a>{" "}
            ou par email à{" "}
            <a href="mailto:contact@sushieats.fr" className="font-semibold underline">
              contact@sushieats.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommandeConfirmee;