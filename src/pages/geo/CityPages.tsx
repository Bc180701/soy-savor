import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Template pour générer rapidement les pages de villes
interface CityPageProps {
  cityName: string;
  postalCode: string;
  region: string;
  restaurantName: string;
}

const generateCityPage = ({ cityName, postalCode, region, restaurantName }: CityPageProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Livraison Sushi ${cityName} - Sushieats`,
    "description": `Livraison de sushis, makis et poke bowls à ${cityName} (${postalCode}). Restaurant japonais avec commande en ligne.`,
    "url": `${window.location.origin}/livraison-sushi-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "postalCode": postalCode,
      "addressCountry": "FR"
    },
    "servesCuisine": "Japonaise",
    "hasMenu": `${window.location.origin}/menu`
  };

  return (
    <>
      <SEOHead 
        title={`Livraison Sushi ${cityName} ${postalCode} - Commande en Ligne | Sushieats`}
        description={`Livraison de sushis, makis et poke bowls à ${cityName} (${postalCode}). Commande en ligne rapide, livraison à domicile en 30-45min.`}
        keywords={`livraison sushi ${cityName}, sushi ${postalCode}, restaurant japonais ${cityName}, makis ${cityName}, poke bowl ${cityName}`}
        canonical={`${window.location.origin}/livraison-sushi-${cityName.toLowerCase().replace(/\s+/g, '-')}`}
        structuredData={structuredData}
      />
      
      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Livraison Sushi à <span className="text-gold-500">{cityName}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Vos spécialités japonaises livrées rapidement dans le {postalCode}
          </p>
          <p className="text-gray-600 mb-8">
            Restaurant {restaurantName} • Livraison gratuite dès 25€ • 30-45min
          </p>
          
          <div className="space-y-4 mb-8">
            <p>🍣 Sushis frais préparés quotidiennement</p>
            <p>🥢 Large choix de makis et california rolls</p>
            <p>🥗 Poke bowls healthy et savoureux</p>
            <p>🚚 Livraison rapide à {cityName}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gold-600 hover:bg-gold-700">
              <a href="/menu">Voir le menu</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/commander">Commander à {cityName}</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Composants pour chaque ville
export const LivraisonEyragues = () => generateCityPage({
  cityName: "Eyragues",
  postalCode: "13630", 
  region: "Bouches-du-Rhône",
  restaurantName: "Châteaurenard"
});

export const LivraisonBarbentane = () => generateCityPage({
  cityName: "Barbentane",
  postalCode: "13570",
  region: "Bouches-du-Rhône", 
  restaurantName: "Châteaurenard"
});

export const LivraisonGraveson = () => generateCityPage({
  cityName: "Graveson",
  postalCode: "13690",
  region: "Bouches-du-Rhône",
  restaurantName: "Châteaurenard"
});

export const LivraisonMaillane = () => generateCityPage({
  cityName: "Maillane", 
  postalCode: "13910",
  region: "Bouches-du-Rhône",
  restaurantName: "Châteaurenard"
});

export const LivraisonNoves = () => generateCityPage({
  cityName: "Noves",
  postalCode: "13550", 
  region: "Bouches-du-Rhône",
  restaurantName: "Châteaurenard"
});

export const LivraisonRognonas = () => generateCityPage({
  cityName: "Rognonas",
  postalCode: "13870",
  region: "Bouches-du-Rhône",
  restaurantName: "Châteaurenard"
});

export const LivraisonSaintRemyDeProvence = () => generateCityPage({
  cityName: "Saint-Rémy de Provence",
  postalCode: "13210",
  region: "Bouches-du-Rhône", 
  restaurantName: "Châteaurenard"
});

export const LivraisonParadou = () => generateCityPage({
  cityName: "Paradou",
  postalCode: "13520",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonMaussanelesAlpilles = () => generateCityPage({
  cityName: "Maussane-les-Alpilles", 
  postalCode: "13520",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonMouries = () => generateCityPage({
  cityName: "Mouriès",
  postalCode: "13890",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonPontdeCrau = () => generateCityPage({
  cityName: "Pont-de-Crau",
  postalCode: "13200", 
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonRapheleLesArles = () => generateCityPage({
  cityName: "Raphèle-lès-Arles",
  postalCode: "13280",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonMoules = () => generateCityPage({
  cityName: "Moulès", 
  postalCode: "13280",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export const LivraisonMasThibert = () => generateCityPage({
  cityName: "Mas-Thibert",
  postalCode: "13104",
  region: "Bouches-du-Rhône",
  restaurantName: "Saint-Martin-de-Crau"
});

export default generateCityPage;