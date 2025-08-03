import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LivraisonStMartinDeCrau = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Livraison Sushi Saint-Martin-de-Crau - Sushieats",
    "description": "Livraison de sushis, makis et poke bowls à Saint-Martin-de-Crau (13310). Commande en ligne, livraison rapide à domicile.",
    "url": `${window.location.origin}/livraison-sushi-saint-martin-de-crau`,
    "telephone": "+33-XXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Centre ville",
      "addressLocality": "Saint-Martin-de-Crau",
      "postalCode": "13310",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.6400",
      "longitude": "4.8100"
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "11:30",
        "closes": "22:00"
      }
    ],
    "servesCuisine": "Japonaise",
    "priceRange": "€€",
    "hasMenu": `${window.location.origin}/menu`,
    "acceptsReservations": true
  };

  return (
    <>
      <SEOHead 
        title="Livraison Sushi Saint-Martin-de-Crau 13310 - Commande en Ligne | Sushieats"
        description="Livraison de sushis, makis et poke bowls à Saint-Martin-de-Crau (13310). Commande en ligne rapide, livraison à domicile en 30-45min. Frais de port offerts dès 25€."
        keywords="livraison sushi Saint-Martin-de-Crau, sushi 13310, livraison japonais Saint-Martin-de-Crau, commande sushi en ligne, makis Saint-Martin-de-Crau"
        canonical={`${window.location.origin}/livraison-sushi-saint-martin-de-crau`}
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Livraison Sushi à <span className="text-gold-500">Saint-Martin-de-Crau</span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Vos spécialités japonaises livrées rapidement à domicile dans le 13310
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <Truck className="w-4 h-4 mr-2" />
                Livraison 30-45min
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <MapPin className="w-4 h-4 mr-2" />
                Zone 13310
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                Gratuit dès 25€
              </Badge>
            </div>
            <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white px-8 py-3 text-lg">
              <a href="/commander">Commander maintenant</a>
            </Button>
          </div>

          {/* Zones de livraison */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gold-500" />
                Zones de livraison à Saint-Martin-de-Crau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Centre-ville</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Place de la République</li>
                    <li>• Avenue Frédéric Mistral</li>
                    <li>• Rue de la Mairie</li>
                    <li>• Boulevard Victor Hugo</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quartiers résidentiels</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Les Marais</li>
                    <li>• Route d'Arles</li>
                    <li>• Lotissement des Pins</li>
                    <li>• Zone pavillonnaire</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horaires et infos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gold-500" />
                  Horaires de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Lundi - Samedi</span>
                    <span className="font-medium">11h30 - 22h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="font-medium">18h00 - 22h00</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-gold-500" />
                  Frais de livraison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Commande dès 25€</span>
                    <Badge variant="secondary">GRATUIT</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Commande moins de 25€</span>
                    <span className="font-medium">2,50€</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    Temps de livraison estimé : 30-45 minutes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Spécialités populaires */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Nos spécialités les plus commandées à Saint-Martin-de-Crau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Plateau Famille</h3>
                  <p className="text-sm text-gray-600 mb-2">32 pièces variées</p>
                  <p className="font-bold text-gold-600">39,90€</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Poke Bowl Thon</h3>
                  <p className="text-sm text-gray-600 mb-2">Riz, thon, avocat</p>
                  <p className="font-bold text-gold-600">13,90€</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Assortiment Makis</h3>
                  <p className="text-sm text-gray-600 mb-2">16 makis variés</p>
                  <p className="font-bold text-gold-600">16,90€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA final */}
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Commandez vos sushis à Saint-Martin-de-Crau</h2>
            <p className="text-gray-600 mb-6">
              Livraison rapide et produits frais garantis dans tout le 13310
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gold-600 hover:bg-gold-700">
                <a href="/menu">Voir le menu</a>
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

export default LivraisonStMartinDeCrau;