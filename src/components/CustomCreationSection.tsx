
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CustomCreationSection as CustomCreationSectionType } from "@/hooks/useHomepageData";

interface CustomCreationSectionProps {
  data: CustomCreationSectionType;
}

export const CustomCreationSection = ({ data }: CustomCreationSectionProps) => {
  // Utilisation directe des images sélectionnées sans valeurs par défaut
  const sushiImage = data.sushi_image || "";
  const pokeImage = data.poke_image || "";
  
  return (
    <section className="py-16 relative">
      {data.background_image && (
        <div className="absolute inset-0 z-0">
          <img 
            src={data.background_image} 
            alt="Fond de création personnalisée" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${data.background_image ? 'text-white' : 'text-gray-900'}`}>
            {data.title}
          </h2>
          <p className={`text-lg ${data.background_image ? 'text-white/80' : 'text-gray-600'}`}>
            {data.subtitle}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sushi Creation Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="relative h-56">
              {sushiImage ? (
                <img 
                  src={sushiImage}
                  alt="Créer vos sushis" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Image non disponible</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <h3 className="text-2xl font-bold text-white">Sushi Créa</h3>
                <p className="text-white/80">Composez vos propres sushis selon vos envies</p>
              </div>
            </div>
            <div className="p-6 flex justify-center">
              <Button asChild size="lg" className="bg-gold-600 hover:bg-gold-700 text-white font-semibold">
                <Link to={data.sushi_button_link}>{data.sushi_button_text}</Link>
              </Button>
            </div>
          </motion.div>
          
          {/* Poke Creation Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
          >
            <div className="relative h-56">
              {pokeImage ? (
                <img 
                  src={pokeImage} 
                  alt="Créer votre poké" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">Image non disponible</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <h3 className="text-2xl font-bold text-white">Poké Créa</h3>
                <p className="text-white/80">Composez votre poké bowl idéal</p>
              </div>
            </div>
            <div className="p-6 flex justify-center">
              <Button asChild size="lg" className="bg-gold-600 hover:bg-gold-700 text-white font-semibold">
                <Link to={data.poke_button_link}>{data.poke_button_text}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
