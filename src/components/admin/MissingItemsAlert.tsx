import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types";

interface MissingItemsAlertProps {
  order: Order;
}

export const MissingItemsAlert = ({ order }: MissingItemsAlertProps) => {
  if (order.items && order.items.length > 0) {
    return null;
  }

  const handleContactCustomer = () => {
    if (order.clientPhone) {
      window.open(`tel:${order.clientPhone}`, '_self');
    }
  };

  const handleEmailCustomer = () => {
    if (order.clientEmail) {
      const subject = `Commande ${order.id.slice(0, 8)} - Clarification nécessaire`;
      const body = `Bonjour ${order.clientName},\n\nNous avons bien reçu votre commande du ${order.createdAt.toLocaleDateString()} d'un montant de ${order.total}€.\n\nCependant, nous rencontrons un problème technique et nous avons besoin de clarifier les articles de votre commande.\n\nPouvez-vous nous rappeler ce que vous aviez commandé ?\n\nCordialement,\nL'équipe Sushi Eats`;
      window.open(`mailto:${order.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
    }
  };

  return (
    <Alert className="border-destructive bg-destructive/10 mb-4">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="space-y-3">
        <div className="font-semibold text-destructive">
          ⚠️ COMMANDE SANS ARTICLES - ACTION URGENTE REQUISE
        </div>
        <div className="text-sm">
          Cette commande ne contient aucun article en base de données. 
          Il s'agit probablement d'un problème technique survenu lors de la création de la commande.
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleContactCustomer}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={!order.clientPhone}
          >
            <Phone className="h-3 w-3 mr-1" />
            Appeler: {order.clientPhone}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleEmailCustomer}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={!order.clientEmail}
          >
            <Mail className="h-3 w-3 mr-1" />
            Email: {order.clientEmail}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Contactez immédiatement le client pour connaître sa commande et préparer manuellement.
        </div>
      </AlertDescription>
    </Alert>
  );
};