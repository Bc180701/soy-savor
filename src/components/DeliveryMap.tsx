
import { useState } from "react";
import { MapPin } from "lucide-react";
import { useHomepageData } from "@/hooks/useHomepageData";

interface DeliveryMapProps {
  deliveryZones: string[];
}

export const DeliveryMap = ({ deliveryZones }: DeliveryMapProps) => {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const { data: homepageData } = useHomepageData();
  
  // Récupérer l'image de superposition depuis les données de la page d'accueil
  const overlayImage = homepageData?.hero_section?.overlay_image || "";

  // Vérifier si les zones de livraison sont disponibles et non vides
  const hasZones = Array.isArray(deliveryZones) && deliveryZones.length > 0;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Zones de livraison</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nous livrons dans les communes suivantes autour de Châteaurenard. Commandez en ligne et recevez vos sushis directement chez vous !
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
            {/* Placeholder for a real map - Implement real map integration if needed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className={`bg-white bg-opacity-90 p-6 rounded-lg max-w-md text-center relative ${
                  overlayImage ? 'bg-cover bg-center' : ''
                }`}
                style={{
                  backgroundImage: overlayImage ? `url('${overlayImage}')` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="relative z-10 bg-white bg-opacity-90 p-4 rounded-lg">
                  <MapPin className="mx-auto h-10 w-10 text-gold-600 mb-2" />
                  <h3 className="text-xl font-bold mb-2">SushiEats Châteaurenard</h3>
                  <p className="text-gray-600 mb-2">16 cours Carnot, 13160 Châteaurenard</p>
                  <p className="text-sm text-gold-600 font-medium">Point de départ des livraisons</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/4.8535,43.8828,11,0/800x600?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja3g1d3BjN3YwMjN5Mm9vMzlpbjVteXcyIn0.80YJbLlH2XxjUQITTCLR3g")' }}></div>
          </div>
          
          {hasZones ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {deliveryZones.map((zone, index) => (
                <div 
                  key={`zone-${index}-${zone}`}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    activeZone === zone 
                      ? 'bg-gold-100 text-gold-800 border border-gold-300' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setActiveZone(zone === activeZone ? null : zone)}
                >
                  <div className="flex items-center justify-center">
                    <MapPin size={14} className={activeZone === zone ? "text-gold-600 mr-1" : "text-gray-500 mr-1"} />
                    <span className="text-sm font-medium">{zone}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune zone de livraison n'est actuellement définie.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
