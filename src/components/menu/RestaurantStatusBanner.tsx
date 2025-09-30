
import { useState, useEffect } from "react";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";
import { isRestaurantOpenNow, getNextOpenDay, DayOpeningHours } from "@/services/openingHoursService";

const RestaurantStatusBanner = () => {
  // Composant désactivé - Ne plus afficher le statut d'ouverture/fermeture
  return null;
};

export default RestaurantStatusBanner;
