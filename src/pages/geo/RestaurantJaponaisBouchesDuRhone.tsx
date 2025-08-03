import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { MapPin, Clock, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const RestaurantJaponaisBouchesDuRhone = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Restaurant Japonais Bouches-du-Rhône - Sushieats",
    "description": "Restaurant japonais dans les Bouches-du-Rhône. Livraison de sushis dans tout le département 13.",
    "url": `${window.location.origin}/restaurant-japonais-bouches-du-rhone`,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Bouches-du-Rhône",
      "addressCountry": "FR"
    },
    "servesCuisine": "Japonaise",
    "hasMenu": `${window.location.origin}/menu`,
    "areaServed": [
      "Châteaurenard", "Saint-Martin-de-Crau", "Eyragues", "Barbentane", 
      "Graveson", "Maillane", "Noves", "Rognonas", "Saint-Rémy de Provence"
    ]
  };

  return (
    <>
      <SEOHead 
        title="Restaurant Japonais Bouches-du-Rhône 13 - Livraison Sushi | Sushieats"
        description="Restaurant japonais dans les Bouches-du-Rhône. Livraison de sushis, makis et poke bowls dans tout le département 13. Commande en ligne rapide."
        keywords="restaurant japonais Bouches-du-Rhône, sushi département 13, livraison sushi PACA, restaurant japonais Provence"
        canonical={`${window.location.origin}/restaurant-japonais-bouches-du-rhone`}
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
              Restaurant Japonais <span className="text-gold-500">Bouches-du-Rhône</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Votre spécialiste sushi dans tout le département 13
            </p>
            <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white px-8 py-3 text-lg">
              <a href="/commander">Commander maintenant</a>
            </Button>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gold-500" />
                Nos zones de livraison dans les Bouches-du-Rhône
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-gold-600">Restaurant Châteaurenard</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Châteaurenard (13160)</li>
                    <li>• Eyragues (13630)</li>
                    <li>• Barbentane (13570)</li>
                    <li>• Graveson (13690)</li>
                    <li>• Maillane (13910)</li>
                    <li>• Noves (13550)</li>
                    <li>• Rognonas (13870)</li>
                    <li>• Saint-Rémy de Provence (13210)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gold-600">Restaurant St-Martin-de-Crau</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Saint-Martin-de-Crau (13310)</li>
                    <li>• Paradou (13520)</li>
                    <li>• Maussane-les-Alpilles (13520)</li>
                    <li>• Mouriès (13890)</li>
                    <li>• Pont-de-Crau (13200)</li>
                    <li>• Raphèle-lès-Arles (13280)</li>
                    <li>• Moulès (13280)</li>
                    <li>• Mas-Thibert (13104)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-gold-600">Avantages</h3>
                  <ul className="text-sm space-y-1">
                    <li>• Livraison gratuite dès 25€</li>
                    <li>• Temps de livraison 30-45min</li>
                    <li>• Produits frais quotidiens</li>
                    <li>• Commande en ligne facile</li>
                    <li>• Large choix de spécialités</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Pourquoi choisir Sushieats dans le 13 ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>2 restaurants dans les Bouches-du-Rhône</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Couverture étendue du département</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Expertise japonaise authentique</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-3">✓</Badge>
                  <span>Service de qualité depuis plusieurs années</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nos spécialités régionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Plateau Provence</span>
                    <Badge variant="outline">Nouveauté</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Poke Bowl Méditerranéen</span>
                    <Badge variant="outline">Populaire</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sushi aux herbes de Provence</span>
                    <Badge variant="outline">Signature</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Le goût du Japon dans les Bouches-du-Rhône</h2>
            <p className="text-gray-600 mb-6">
              Découvrez nos restaurants japonais et profitez de la livraison dans tout le département 13
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gold-600 hover:bg-gold-700">
                <a href="/menu">Voir nos spécialités</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/commander">Trouver mon restaurant</a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RestaurantJaponaisBouchesDuRhone;