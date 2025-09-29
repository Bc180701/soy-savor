
import { useState, useEffect } from "react";
import { Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHomepageData } from "@/hooks/useHomepageData";

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

// Exemples d'avis (à remplacer par de vrais avis via l'API Google)
const SAMPLE_REVIEWS: Review[] = [
  {
    id: 1,
    author: "Marie L.",
    rating: 5,
    comment: "Excellent sushi, très frais et savoureux. Service impeccable !",
    date: "Il y a 2 semaines"
  },
  {
    id: 2,
    author: "Pierre M.",
    rating: 5,
    comment: "Meilleur restaurant japonais de Châteaurenard. Je recommande vivement !",
    date: "Il y a 1 mois"
  },
  {
    id: 3,
    author: "Sophie D.",
    rating: 4,
    comment: "Très bon accueil et plats délicieux. Livraison rapide.",
    date: "Il y a 3 semaines"
  }
];

const GoogleReviewsSection = () => {
  const { data: homepageData } = useHomepageData();
  const [reviews, setReviews] = useState<Review[]>([]);

  // Récupérer les données de configuration depuis l'admin
  const googleReviewsConfig = homepageData?.google_reviews_section || {
    title: "Nos avis clients",
    description: "Découvrez ce que nos clients pensent de notre restaurant",
    google_business_url: "",
    average_rating: 4.5,
    total_reviews: 0,
    button_text: "Voir tous nos avis Google",
    review_button_text: "Laisser un avis"
  };

  useEffect(() => {
    // Pour l'instant, utiliser les avis d'exemple
    setReviews(SAMPLE_REVIEWS);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  const averageRating = googleReviewsConfig.average_rating || 4.5;
  const totalReviews = googleReviewsConfig.total_reviews || SAMPLE_REVIEWS.length;
  const googleBusinessUrl = googleReviewsConfig.google_business_url || "#";

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 better-times-gold">
            {googleReviewsConfig.title}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-gray-600">({totalReviews} avis)</span>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            {googleReviewsConfig.description}
          </p>
          
          {googleBusinessUrl && googleBusinessUrl !== "" && googleBusinessUrl !== "#" && (
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <a 
                href={googleBusinessUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                {googleReviewsConfig.button_text}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}

          {(!googleBusinessUrl || googleBusinessUrl === "" || googleBusinessUrl === "#") && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Configurez votre URL Google Business dans l'administration pour activer les liens vers vos avis
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex">{renderStars(review.rating)}</div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
                <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {review.author.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-900">{review.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-4">
            Vous avez déjà visité notre restaurant ?
          </p>
          
          {googleBusinessUrl && googleBusinessUrl !== "" && googleBusinessUrl !== "#" && (
            <Button
              asChild
              variant="outline"
              className="border-gold-500 text-gold-600 hover:bg-gold-50"
            >
              <a 
                href={googleBusinessUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {googleReviewsConfig.review_button_text}
              </a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsSection;
