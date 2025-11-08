
// Importer correctement format et fr depuis date-fns et sa locale
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
 * Formate une date selon le format français SANS conversion de timezone
 */
export const formatDate = (date: Date | string): string => {
  // Si c'est une string ISO, extraire directement la date/heure
  if (typeof date === 'string') {
    const [datePart, timePart] = date.split('T');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = (timePart || '00:00').split(':');
    
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
    return `${day} ${monthNames[parseInt(month) - 1]} ${year} ${hours}:${minutes}`;
  }
  return format(date, 'dd MMMM yyyy HH:mm', { locale: fr });
};

/**
 * Formate une heure selon le format français
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm', { locale: fr });
};

/**
 * Formate une date courte selon le format français
 */
export const formatShortDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy', { locale: fr });
};
