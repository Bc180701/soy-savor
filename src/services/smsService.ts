
import { supabase } from "@/integrations/supabase/client";

export interface SMSNotification {
  phoneNumber: string;
  orderId: string;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  status: string;
  customerName?: string;
  restaurantId?: string;
}

export const sendOrderStatusSMS = async ({
  phoneNumber,
  orderId,
  orderType,
  status,
  customerName = "Client",
  restaurantId
}: SMSNotification): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`📱 Préparation SMS pour ${phoneNumber} - Status: ${status}, Type: ${orderType}`);
    
    // Récupérer le nom du restaurant si un ID est fourni
    let restaurantName = "";
    if (restaurantId) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', restaurantId)
        .single();
      
      restaurantName = restaurant?.name || "";
    }
    
    // Générer le message en fonction du statut et du type de commande
    let message = `Bonjour ${customerName}, `;
    
    switch (status) {
      case 'out-for-delivery':
        message += `votre commande part en livraison ! Votre livreur arrive bientôt. Merci de votre confiance - SushiEats`;
        break;
      case 'ready':
        if (orderType === 'pickup') {
          if (restaurantName) {
            message += `votre commande est prête ! Vous pouvez venir la récupérer au restaurant de ${restaurantName}. Merci de votre confiance - SushiEats`;
          } else {
            message += `votre commande est prête ! Vous pouvez venir la récupérer en restaurant. Merci de votre confiance - SushiEats`;
          }
        } else {
          message += `votre commande est prête ! Merci de votre confiance - SushiEats`;
        }
        break;
      default:
        message += `le statut de votre commande a été mis à jour. Merci de votre confiance - SushiEats`;
    }

    console.log(`📱 Message SMS généré:`, message);

    // Appeler l'edge function pour envoyer le SMS
    const { data, error } = await supabase.functions.invoke('send-sms-notification', {
      body: {
        phoneNumber,
        message,
        orderId
      }
    });

    if (error) {
      console.error('❌ Erreur lors de l\'envoi du SMS:', error);
      return { success: false, error: error.message };
    }

    if (!data.success) {
      console.error('❌ Échec de l\'envoi SMS:', data.error);
      return { success: false, error: data.error };
    }

    console.log('✅ SMS envoyé avec succès pour la commande', orderId);
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur inattendue lors de l\'envoi du SMS:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi du SMS"
    };
  }
};
