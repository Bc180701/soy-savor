
// Importer correctement format et fr depuis date-fns et sa locale
import { format as dateFormat } from "date-fns";
import fr from "date-fns/locale/fr";

/**
 * Formate un nombre en devise Euro
 */
export const formatEuro = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

/**
 * Formate une date selon le format français
 */
export const formatDate = (date: Date): string => {
  return dateFormat(date, 'dd MMMM yyyy HH:mm', { locale: fr });
};

/**
 * Formate une heure selon le format français
 */
export const formatTime = (date: Date): string => {
  return dateFormat(date, 'HH:mm', { locale: fr });
};

/**
 * Formate une date courte selon le format français
 */
export const formatShortDate = (date: Date): string => {
  return dateFormat(date, 'dd/MM/yyyy', { locale: fr });
};
