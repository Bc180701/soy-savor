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
    console.log('🔍 Diagnostic avant récupération pour commande:', order.id);
    console.log('📋 Order.itemsSummary:', order.itemsSummary);
    console.log('📦 Order.items:', order.items);
    console.log('💰 Order.total:', order.total);
    
    setIsRecovering(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('recover-order-items', {
        body: { orderId: order.id }
      });

      if (error) {
        console.error('❌ Erreur lors de la récupération:', error);
        toast({
          title: "Erreur de récupération",
          description: "Impossible de récupérer les articles automatiquement",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Résultat de la récupération:', data);

      if (data?.success) {
        toast({
          title: "Articles récupérés",
          description: `${data.recovered_items || 0} articles récupérés avec succès`,
          variant: "default"
        });
        
        console.log('🔄 Récupération terminée, mise à jour des données...');
        
        // FORCER un refresh complet avec cache vidé
        if (onClearCache) {
          console.log('🗑️ Vidage du cache...');
          onClearCache();
        }
        
        // Refresh immédiat puis refresh retardé pour s'assurer
        if (onOrderRefresh) {
          console.log('🔄 Refresh immédiat...');
          onOrderRefresh();
          
          // Deuxième refresh après 1 seconde pour être sûr
          setTimeout(() => {
            console.log('🔄 Refresh retardé...');
            onOrderRefresh();
          }, 1000);
        }
        
        // Forcer un reload de la page en dernier recours si rien ne marche
        setTimeout(() => {
          const hasItemsAfter = (order.itemsSummary && order.itemsSummary.length > 0) || 
                               (order.items && order.items.length > 0);
          if (!hasItemsAfter) {
            console.log('⚠️ Les articles ne sont toujours pas visibles, reload forcé dans 2s...');
            setTimeout(() => {
              console.log('🔄 RELOAD FORCÉ DE LA PAGE');
              window.location.reload();
            }, 2000);
          }
        }, 1500);
        
      } else {
        toast({
          title: "Récupération impossible",
          description: data?.message || "Aucun article à récupérer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('💥 Erreur lors de la récupération:', error);
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