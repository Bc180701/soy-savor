
import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { useHomepageData } from "@/hooks/useHomepageData";
import { getDeliveryLocations } from "@/services/deliveryService";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

interface DeliveryMapProps {
  deliveryZones?: string[];
}

export const DeliveryMap = ({ deliveryZones }: DeliveryMapProps) => {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [restaurantDeliveryZones, setRestaurantDeliveryZones] = useState<{city: string, postalCode: string}[]>([]);
  const { data: homepageData } = useHomepageData();
  const { currentRestaurant } = useRestaurantContext();
  
  // Récupérer les données de la section de carte de livraison
  const deliveryMapSection = homepageData?.delivery_map_section;
  const overlayImage = homepageData?.hero_section?.overlay_image || "";

  // Charger les zones de livraison spécifiques au restaurant
  useEffect(() => {
    const loadRestaurantDeliveryZones = async () => {
      if (currentRestaurant) {
        const zones = await getDeliveryLocations(currentRestaurant.id);
        setRestaurantDeliveryZones(zones);
      }
    };
    loadRestaurantDeliveryZones();
  }, [currentRestaurant]);

  // Utiliser les zones du restaurant si disponibles, sinon utiliser les zones par défaut
  const zonesToDisplay = restaurantDeliveryZones.length > 0 
    ? restaurantDeliveryZones.map(zone => `${zone.city} (${zone.postalCode})`)
    : deliveryZones || [];

  // Vérifier si les zones de livraison sont disponibles et non vides
  const hasZones = Array.isArray(zonesToDisplay) && zonesToDisplay.length > 0;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 better-times-gold">
            {deliveryMapSection?.title || "Zones de livraison"}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {currentRestaurant ? (
              `Nous livrons dans les communes suivantes depuis notre restaurant de ${currentRestaurant.name}. Commandez en ligne et recevez vos sushis directement chez vous !`
            ) : (
              deliveryMapSection?.subtitle || "Nous livrons dans les communes suivantes. Commandez en ligne et recevez vos sushis directement chez vous !"
            )}
          </p>
          {currentRestaurant && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
              <span className="text-sm text-blue-800">Restaurant sélectionné:</span>
              <span className="font-semibold text-blue-900">{currentRestaurant.name}</span>
            </div>
          )}
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
            {/* Placeholder for a real map - Implement real map integration if needed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="relative w-full h-full flex items-center justify-center"
                style={{
                  backgroundImage: `url('${overlayImage}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="bg-white bg-opacity-80 p-6 rounded-lg shadow-md text-center">
                  <MapPin className="mx-auto h-10 w-10 text-gold-600 mb-2" />
                  <h3 className="text-xl font-bold mb-2 better-times-gold">
                    {currentRestaurant ? currentRestaurant.name : (deliveryMapSection?.restaurant_info?.name || "SushiEats")}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {currentRestaurant ? currentRestaurant.address : (deliveryMapSection?.restaurant_info?.address || "Adresse du restaurant")}
                  </p>
                  <p className="text-sm text-gold-600 font-medium">
                    {deliveryMapSection?.restaurant_info?.subtitle || "Point de départ des livraisons"}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/light-v10/static/4.8535,43.8828,11,0/800x600?access_token=pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJja3g1d3BjN3YwMjN5Mm9vMzlpbjVteXcyIn0.80YJbLlH2XxjUQITTCLR3g")' }}></div>
          </div>
          
          {hasZones ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {zonesToDisplay.map((zone, index) => (
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
              <p className="text-gray-500">
                {currentRestaurant ? (
                  `Aucune zone de livraison n'est actuellement définie pour ${currentRestaurant.name}.`
                ) : (
                  deliveryMapSection?.no_zones_message || "Aucune zone de livraison n'est actuellement définie."
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
