
import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useHomepageData } from "@/hooks/useHomepageData";
import { openingHoursService, DayOpeningHours } from "@/services/openingHoursService";

const Footer = () => {
  const { data: homepageData } = useHomepageData();
  const [openingHours, setOpeningHours] = useState<DayOpeningHours[]>([]);
  const [todayHours, setTodayHours] = useState<string>("");

  useEffect(() => {
    const fetchOpeningHours = async () => {
      try {
        const hours = await openingHoursService.getOpeningHours();
        setOpeningHours(hours);
        
        const today = await openingHoursService.getTodayHours();
        setTodayHours(today);
      } catch (error) {
        console.error("Error loading opening hours:", error);
      }
    };

    fetchOpeningHours();
  }, []);

  const getDayName = (day: string): string => {
    const dayNames: {[key: string]: string} = {
      "monday": "Lundi",
      "tuesday": "Mardi", 
      "wednesday": "Mercredi",
      "thursday": "Jeudi",
      "friday": "Vendredi",
      "saturday": "Samedi",
      "sunday": "Dimanche"
    };
    return dayNames[day] || day;
  };

  const formatHours = (hours: DayOpeningHours): string => {
    if (!hours.is_open) {
      return "Fermé";
    }
    return `${hours.open_time} - ${hours.close_time}`;
  };

  const contactInfo = homepageData?.contact_info || {
    address: "16 cours Carnot, 13160 Châteaurenard",
    phone: "04 90 00 00 00",
    email: "contact@sushieats.fr"
  };

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coordonnées */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gold-500">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gold-500" />
                <span className="text-sm">{contactInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-500" />
                <span className="text-sm">{contactInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-500" />
                <span className="text-sm">{contactInfo.email}</span>
              </div>
            </div>
          </div>

          {/* Horaires d'ouverture */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gold-500">Horaires d'ouverture</h3>
            <div className="space-y-2">
              {todayHours && (
                <div className="flex items-center gap-3 mb-3 p-2 bg-gold-500/10 rounded">
                  <Clock className="w-5 h-5 text-gold-500" />
                  <span className="text-sm font-semibold">Aujourd'hui: {todayHours}</span>
                </div>
              )}
              {openingHours.map((hours) => (
                <div key={hours.day} className="flex justify-between text-sm">
                  <span>{getDayName(hours.day)}</span>
                  <span>{formatHours(hours)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* À propos */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gold-500">Sushi Eats</h3>
            <p className="text-sm text-gray-300 mb-4">
              Restaurant japonais authentique à Châteaurenard. Découvrez nos sushis frais, 
              nos pokés colorés et nos spécialités japonaises préparées avec passion.
            </p>
            <div className="flex space-x-4">
              {/* Réseaux sociaux - à ajouter si nécessaire */}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            © 2024 Sushi Eats. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
