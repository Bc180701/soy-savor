import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Template pour les pages par code postal
interface PostalCodePageProps {
  postalCode: string;
  mainCity: string;
  description: string;
}

const generatePostalCodePage = ({ postalCode, mainCity, description }: PostalCodePageProps) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Sushi ${postalCode} - Restaurant Japonais ${mainCity}`,
    "description": `Restaurant japonais dans le ${postalCode}. ${description}`,
    "url": `${window.location.origin}/sushi-${postalCode}`,
    "address": {
      "@type": "PostalAddress",
      "postalCode": postalCode,
      "addressLocality": mainCity,
      "addressCountry": "FR"
    },
    "servesCuisine": "Japonaise"
  };

  return (
    <>
      <SEOHead 
        title={`Sushi ${postalCode} - Restaurant Japonais ${mainCity} | Sushieats`}
        description={`Restaurant japonais dans le ${postalCode}. ${description} Livraison rapide, commande en ligne.`}
        keywords={`sushi ${postalCode}, restaurant japonais ${postalCode}, livraison sushi ${mainCity}, makis ${postalCode}`}
        canonical={`${window.location.origin}/sushi-${postalCode}`}
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
            Sushi <span className="text-gold-500">{postalCode}</span>
          </h1>
          <p className="text-xl text-gray-600 mb-6">{description}</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="secondary">Zone {postalCode} couverte</Badge>
            <Badge variant="secondary">Livraison gratuite dès 25€</Badge>
            <Badge variant="secondary">Produits frais</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Sushis</h3>
              <p className="text-sm text-gray-600">Sélection premium de sushis frais</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Makis</h3>
              <p className="text-sm text-gray-600">Makis traditionnels et créatifs</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold mb-2">Poke Bowls</h3>
              <p className="text-sm text-gray-600">Bowls healthy et savoureux</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gold-600 hover:bg-gold-700">
              <a href="/menu">Découvrir le menu</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/commander">Commander dans le {postalCode}</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Pages pour tous les codes postaux
export const Sushi13630 = () => generatePostalCodePage({
  postalCode: "13630",
  mainCity: "Eyragues", 
  description: "Restaurant japonais de référence à Eyragues et environs."
});

export const Sushi13570 = () => generatePostalCodePage({
  postalCode: "13570",
  mainCity: "Barbentane",
  description: "Spécialités japonaises livrées à Barbentane."
});

export const Sushi13690 = () => generatePostalCodePage({
  postalCode: "13690", 
  mainCity: "Graveson",
  description: "Sushis frais et livraison rapide à Graveson."
});

export const Sushi13910 = () => generatePostalCodePage({
  postalCode: "13910",
  mainCity: "Maillane",
  description: "Restaurant japonais de qualité à Maillane."
});

export const Sushi13550 = () => generatePostalCodePage({
  postalCode: "13550",
  mainCity: "Noves", 
  description: "Livraison de spécialités japonaises à Noves."
});

export const Sushi13870 = () => generatePostalCodePage({
  postalCode: "13870",
  mainCity: "Rognonas",
  description: "Sushis et makis livrés rapidement à Rognonas."
});

export const Sushi13210 = () => generatePostalCodePage({
  postalCode: "13210",
  mainCity: "Saint-Rémy de Provence",
  description: "Restaurant japonais premium à Saint-Rémy de Provence."
});

export const Sushi13520 = () => generatePostalCodePage({
  postalCode: "13520",
  mainCity: "Paradou/Maussane-les-Alpilles",
  description: "Cuisine japonaise authentique dans les Alpilles."
});

export const Sushi13890 = () => generatePostalCodePage({
  postalCode: "13890", 
  mainCity: "Mouriès",
  description: "Spécialités sushi à Mouriès et alentours."
});

export const Sushi13200 = () => generatePostalCodePage({
  postalCode: "13200",
  mainCity: "Pont-de-Crau (Arles)",
  description: "Livraison sushi dans le secteur d'Arles."
});

export const Sushi13280 = () => generatePostalCodePage({
  postalCode: "13280",
  mainCity: "Raphèle-lès-Arles/Moulès", 
  description: "Restaurant japonais desservant Raphèle et Moulès."
});

export const Sushi13104 = () => generatePostalCodePage({
  postalCode: "13104",
  mainCity: "Mas-Thibert",
  description: "Sushis frais livrés à Mas-Thibert."
});

export default generatePostalCodePage;