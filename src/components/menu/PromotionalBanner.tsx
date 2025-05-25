
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PromotionalBanner = () => {
  return (
    <motion.div 
      className="mb-8 bg-gradient-to-r from-gold-500 to-gold-300 p-6 rounded-lg shadow-lg text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Badge className="bg-white text-gold-600 mb-2">OFFRE SPÉCIALE</Badge>
      <h3 className="text-white text-xl font-bold mb-2">-10% sur votre première commande</h3>
      <p className="text-white/90 mb-4">Créez un compte maintenant pour profiter de cette promotion exclusive</p>
      <Button asChild className="bg-white hover:bg-gray-100 text-gold-600">
        <Link to="/register">Créer un compte</Link>
      </Button>
    </motion.div>
  );
};

export default PromotionalBanner;
