import SEOHead from "@/components/SEOHead";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PushRollProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

const CHATEAU_ID = "11111111-1111-1111-1111-111111111111";

const SushiPushRollProvence = () => {
  const [products, setProducts] = useState<PushRollProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPushRolls = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", CHATEAU_ID)
        .ilike("name", "%push roll%");

      const catIds = (cats || []).map((c) => c.id);
      if (catIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, description")
        .eq("restaurant_id", CHATEAU_ID)
        .in("category_id", catIds)
        .eq("is_hidden", false)
        .order("name");

      setProducts(data || []);
      setLoading(false);
    };
    fetchPushRolls();
  }, []);

  const villes = [
    "Châteaurenard", "Saint-Martin-de-Crau", "Arles", "Saint-Rémy-de-Provence",
    "Eyragues", "Barbentane", "Graveson", "Maillane", "Noves", "Rognonas",
    "Maussane-les-Alpilles", "Paradou", "Mouriès", "Raphèle-les-Arles",
    "Pont-de-Crau", "Mas-Thibert", "Moulès"
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Sushi Push Roll Provence",
    "description": "Sushi Push Roll - concept exclusif de sushi à emporter, disponible en livraison et retrait dans toute la Provence (Bouches-du-Rhône).",
    "brand": { "@type": "Brand", "name": "SushiEats" },
    "category": "Sushi à emporter",
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": "Provence - Bouches-du-Rhône"
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceCurrency": "EUR",
      "url": `${window.location.origin}/push-roll`
    }
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Qu'est-ce qu'un Sushi Push Roll ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le Sushi Push Roll est un sushi à emporter présenté dans un format pratique et nomade. C'est un concept exclusif disponible chez SushiEats en Provence."
        }
      },
      {
        "@type": "Question",
        "name": "Où peut-on commander un Sushi Push Roll en Provence ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le Sushi Push Roll est disponible en livraison et retrait dans tout le département des Bouches-du-Rhône depuis nos restaurants de Châteaurenard et Saint-Martin-de-Crau."
        }
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Sushi Push Roll Provence | Sushi à Emporter Bouches-du-Rhône"
        description="Sushi Push Roll en Provence : le concept exclusif de sushi à emporter SushiEats. Livraison & retrait dans tout les Bouches-du-Rhône. Châteaurenard, Arles, Saint-Martin-de-Crau."
        keywords="sushi push roll Provence, sushi à emporter Provence, push roll Bouches-du-Rhône, sushi push roll Châteaurenard, push roll Arles, sushi à emporter Châteaurenard, SushiEats push roll"
        canonical={`${window.location.origin}/push-roll`}
        structuredData={structuredData}
      />

      <div className="container mx-auto py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gold-500 text-white">Concept exclusif SushiEats</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Sushi <span className="text-gold-500">Push Roll</span> Provence
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Le concept exclusif de sushi à emporter en Provence
            </p>
            <p className="text-md text-gray-500 mb-6">
              Livraison & retrait dans tout les Bouches-du-Rhône
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white px-8 py-3 text-lg">
                <a href="/commander">Commander un Push Roll</a>
              </Button>
              <Button asChild variant="outline" className="px-8 py-3 text-lg">
                <a href="/carte">Voir tous les Push Rolls</a>
              </Button>
            </div>
          </div>

          {/* Présentation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-gold-500" />
                Qu'est-ce qu'un Sushi Push Roll ?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                Le <strong>Sushi Push Roll</strong> est un <strong>sushi à emporter</strong> présenté
                dans un format pratique et nomade. C'est un <strong>concept exclusif</strong> que vous
                ne trouverez que chez SushiEats en Provence : un sushi pensé pour être dégusté partout,
                facilement, sans compromis sur la qualité.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Disponible en plusieurs variantes (saumon, thon, poulet croustillant, veggie, ou même
                version sucrée chocolat), le Push Roll se commande en livraison ou en retrait depuis
                nos restaurants de <strong>Châteaurenard</strong> et <strong>Saint-Martin-de-Crau</strong>.
              </p>
            </CardContent>
          </Card>

          {/* Liste des Push Rolls disponibles */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-gold-500" />
                Nos Sushi Push Roll disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-gray-500 py-8">Chargement des Push Rolls...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun Push Roll disponible pour le moment.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="overflow-hidden h-full flex flex-col">
                        {product.image_url && (
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            <img
                              src={product.image_url}
                              alt={`Sushi Push Roll ${product.name} - SushiEats Châteaurenard`}
                              loading="lazy"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 flex-1">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xl font-bold text-gold-600">
                              {product.price.toFixed(2)} €
                            </span>
                            <Button asChild size="sm" className="bg-gold-600 hover:bg-gold-700 text-white">
                              <a href="/commander">Commander</a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="h-10 w-10 text-gold-500 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Sushi à emporter</h3>
                <p className="text-sm text-gray-600">
                  Format nomade pensé pour la dégustation partout
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Sparkles className="h-10 w-10 text-gold-500 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Concept exclusif</h3>
                <p className="text-sm text-gray-600">
                  Disponible uniquement chez SushiEats en Provence
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Truck className="h-10 w-10 text-gold-500 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Livré en Provence</h3>
                <p className="text-sm text-gray-600">
                  Livraison rapide dans tout les Bouches-du-Rhône (13)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Villes desservies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-gold-500" />
                Sushi Push Roll livré partout en Provence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Commandez votre <strong>Sushi Push Roll</strong> depuis nos deux restaurants
                provençaux : <strong>Châteaurenard</strong> et <strong>Saint-Martin-de-Crau</strong>.
                Nous livrons dans toutes ces communes des Bouches-du-Rhône :
              </p>
              <div className="flex flex-wrap gap-2">
                {villes.map((ville) => (
                  <Badge key={ville} variant="secondary" className="text-sm py-1.5 px-3">
                    {ville}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Questions fréquentes - Push Roll Provence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold mb-1">Qu'est-ce qu'un Sushi Push Roll ?</h3>
                <p className="text-gray-600 text-sm">
                  Un sushi à emporter au format nomade, concept exclusif SushiEats, disponible
                  uniquement dans nos restaurants en Provence.
                </p>
              </div>
              <div>
                <h3 className="font-bold mb-1">Où commander un Push Roll en Provence ?</h3>
                <p className="text-gray-600 text-sm">
                  Directement en ligne sur SushiEats, en livraison ou retrait depuis Châteaurenard
                  ou Saint-Martin-de-Crau, dans tout le département des Bouches-du-Rhône.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA final */}
          <div className="text-center bg-gradient-to-br from-gold-50 to-gold-100 rounded-2xl p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Goûtez le Sushi Push Roll en Provence
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Découvrez le concept exclusif SushiEats. Commandez en quelques clics
              et dégustez votre Push Roll chez vous, partout dans les Bouches-du-Rhône.
            </p>
            <Button asChild className="bg-gold-600 hover:bg-gold-700 text-white px-8 py-3 text-lg">
              <a href="/commander">Commander mon Push Roll</a>
            </Button>
          </div>

          {/* FAQ structured data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
          />
        </motion.div>
      </div>
    </>
  );
};

export default SushiPushRollProvence;
