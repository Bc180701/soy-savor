
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

interface PromotionCardProps {
  promotion: Promotion;
}

export const PromotionCard = ({ promotion }: PromotionCardProps) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative pb-[60%]">
        <img 
          src={promotion.imageUrl} 
          alt={promotion.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="font-bold text-xl mb-1">{promotion.title}</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-gray-600 mb-4">{promotion.description}</p>
        <Button asChild>
          <Link to={promotion.buttonLink}>{promotion.buttonText}</Link>
        </Button>
      </div>
    </motion.div>
  );
};
