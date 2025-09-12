import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Phone, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MissingItemsAlertProps {
  order: Order;
  onOrderRefresh?: () => void;
  onClearCache?: () => void;
}

export const MissingItemsAlert = ({ order, onOrderRefresh, onClearCache }: MissingItemsAlertProps) => {
  const { toast } = useToast();
  const [isRecovering, setIsRecovering] = useState(false);

  // Vérifier s'il y a des articles (itemsSummary ou items)
  const hasItems = (order.itemsSummary && order.itemsSummary.length > 0) || 
                   (order.items && order.items.length > 0);
  
  if (hasItems) {
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

  const handleRecoverItems = async () => {
    setIsRecovering(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('recover-order-items', {
        body: { orderId: order.id }
      });

      if (error) {
        console.error('Erreur lors de la récupération:', error);
        toast({
          title: "Erreur de récupération",
          description: "Impossible de récupérer les articles automatiquement",
          variant: "destructive"
        });
        return;
      }

      if (data?.success) {
        toast({
          title: "Articles récupérés",
          description: `${data.recovered_items || 0} articles récupérés avec succès`,
          variant: "default"
        });
        
        // Vider le cache pour forcer le rechargement
        if (onClearCache) {
          onClearCache();
        }
        
        // Rafraîchir les détails de la commande
        if (onOrderRefresh) {
          onOrderRefresh();
        }
      } else {
        toast({
          title: "Récupération impossible",
          description: data?.message || "Aucun article à récupérer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      toast({
        title: "Erreur technique",
        description: "Une erreur est survenue lors de la récupération",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
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
            variant="default" 
            onClick={handleRecoverItems}
            disabled={isRecovering}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Récupération...' : 'Récupérer automatiquement'}
          </Button>
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
          Essayez d'abord la récupération automatique. Si elle échoue, contactez le client pour connaître sa commande.
        </div>
      </AlertDescription>
    </Alert>
  );
};