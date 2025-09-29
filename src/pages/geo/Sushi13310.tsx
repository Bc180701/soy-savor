import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { MapPin, Clock, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SushiCodePostal13310 = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Sushi 13310 - Livraison Saint-Martin-de-Crau - Sushieats",
    "description": "Restaurant japonais avec livraison dans le code postal 13310. Sushis, makis, poke bowls livrés à domicile.",
    "url": `${window.location.origin}/sushi-13310`,
    "address": {
      "@type": "PostalAddress",
      "postalCode": "13310",
      "addressLocality": "Saint-Martin-de-Crau",
      "addressCountry": "FR"
    },
    "servesCuisine": "Japonaise",
    "hasMenu": `${window.location.origin}/carte`
  };

  return (
    <>
      <SEOHead 
        title="Sushi 13310 - Restaurant Japonais Livraison Saint-Martin-de-Crau | Sushieats"
        description="Restaurant japonais dans le 13310. Livraison de sushis, makis et poke bowls à Saint-Martin-de-Crau. Commande en ligne rapide, produits frais."
        keywords="sushi 13310, restaurant japonais 13310, livraison sushi Saint-Martin-de-Crau, makis 13310, poke bowl Saint-Martin-de-Crau"
        canonical={`${window.location.origin}/sushi-13310`}
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Sushi <span className="text-gold-500">13310</span> - Saint-Martin-de-Crau
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Restaurant japonais de référence dans le code postal 13310
            </p>
            <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white px-8 py-3 text-lg">
              <a href="/commander">Commander dans le 13310</a>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Pourquoi choisir Sushieats dans le 13310 ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Spécialiste du sushi à Saint-Martin-de-Crau</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Livraison rapide dans tout le 13310</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Produits frais et authentiques</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Service client de qualité</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Couverture du 13310</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">✓ Tout Saint-Martin-de-Crau couvert</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Centre-ville</li>
                    <li>• Quartiers résidentiels</li>
                    <li>• Zone pavillonnaire</li>
                    <li>• Périphérie</li>
                  </ul>
                  <div className="mt-4 p-3 bg-gold-50 rounded-lg">
                    <p className="text-sm"><strong>Livraison gratuite</strong> dès 25€ dans tout le 13310</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nos spécialités dans le 13310</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">Sushi Premium</h3>
                  <p className="text-gray-600 mb-3">Sélection de nos meilleurs sushis</p>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-2xl font-bold text-gold-600">22,90€</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href="/commander">Commander</a>
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">Maki Assortment</h3>
                  <p className="text-gray-600 mb-3">Variété de makis classiques et créatifs</p>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-2xl font-bold text-gold-600">18,90€</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href="/commander">Commander</a>
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">Poke Healthy</h3>
                  <p className="text-gray-600 mb-3">Bowl équilibré et nutritif</p>
                  <div className="bg-gray-50 p-3 rounded-lg mb-3">
                    <p className="text-2xl font-bold text-gold-600">13,90€</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href="/commander">Commander</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Livraison sushi rapide dans le 13310</h2>
            <p className="text-gray-600 mb-6">
              Commandez en ligne et profitez de nos spécialités japonaises livrées chez vous
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gold-600 hover:bg-gold-700">
                <a href="/carte">Découvrir la carte</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/commander">Commander maintenant</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SushiCodePostal13310;