
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePromotions } from "@/hooks/usePromotions";
import { getDayName } from "@/services/promotionService";

const PromotionalBanner = () => {
  const { activePromotions } = usePromotions();
  
  if (activePromotions.length === 0) {
    return null;
  }

  const mainPromotion = activePromotions[0];
  const today = new Date();
  const todayName = getDayName(today.getDay());

  // Vérifier si c'est l'offre gourmande pour afficher le message spécial
  const isOffreGourmande = mainPromotion.title.toLowerCase().includes('gourmande');

  return (
    <motion.div 
      className="mb-8 bg-gradient-to-r from-red-500 to-red-400 p-6 rounded-lg shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Badge className="bg-white text-red-600 mb-2 animate-pulse">
        PROMOTION {todayName.toUpperCase()}
      </Badge>
      <h3 className="text-white text-xl font-bold mb-2">
        {mainPromotion.title}
      </h3>
      <p className="text-white/90 mb-4">
        {mainPromotion.description}
      </p>
      {isOffreGourmande && (
        <div className="bg-white/20 border border-white/30 rounded-lg p-3 mb-4">
          <p className="text-white font-semibold text-sm">
            ⚠️ Offre valable uniquement pour les commandes à emporter
          </p>
        </div>
      )}
      {mainPromotion.startTime && mainPromotion.endTime && (
        <div className="text-white/80 text-sm mb-4">
          Horaires: {mainPromotion.startTime} - {mainPromotion.endTime}
        </div>
      )}
      <Button asChild className="bg-white hover:bg-gray-100 text-red-600">
        <Link to="/commander">Profiter de l'offre</Link>
      </Button>
    </motion.div>
  );
};

export default PromotionalBanner;
