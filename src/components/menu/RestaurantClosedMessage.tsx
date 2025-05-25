
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface RestaurantClosedMessageProps {
  nextOpenDay: any;
}

const RestaurantClosedMessage = ({ nextOpenDay }: RestaurantClosedMessageProps) => {
  // Fonction auxiliaire pour formater le nom du jour
  function getFormattedDayName(day: string): string {
    const dayNames: {[key: string]: string} = {
      "monday": "lundi",
      "tuesday": "mardi", 
      "wednesday": "mercredi",
      "thursday": "jeudi",
      "friday": "vendredi",
      "saturday": "samedi",
      "sunday": "dimanche"
    };
    return dayNames[day] || day;
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="flex justify-center mb-6">
          <Clock size={80} className="text-amber-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Restaurant Fermé Aujourd'hui</h1>
        
        <Alert className="mb-8 border-amber-500">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertTitle>Commandes indisponibles</AlertTitle>
          <AlertDescription>
            Notre restaurant est actuellement fermé. Nous sommes ouverts de mardi à samedi.
          </AlertDescription>
        </Alert>
        
        {nextOpenDay && (
          <p className="text-gray-600 mb-8">
            Nous serons ouverts à nouveau {getFormattedDayName(nextOpenDay.day)} de {nextOpenDay.open_time} à {nextOpenDay.close_time}.
            Nous serons ravis de vous accueillir prochainement !
          </p>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button asChild variant="outline">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild>
            <Link to="/contact">Nous contacter</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default RestaurantClosedMessage;
