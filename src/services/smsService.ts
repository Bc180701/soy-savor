
import { supabase } from "@/integrations/supabase/client";

export interface SMSNotification {
  phoneNumber: string;
  orderId: string;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  status: string;
  customerName?: string;
}

export const sendOrderStatusSMS = async ({
  phoneNumber,
  orderId,
  orderType,
  status,
  customerName = "Client"
}: SMSNotification): Promise<{ success: boolean; error?: string }> => {
  try {
    // Générer le message en fonction du statut et du type de commande
    let message = `Bonjour ${customerName}, `;
    
    switch (status) {
      case 'out-for-delivery':
        message += `votre commande #${orderId.substring(0, 6)} est partie en livraison ! Votre livreur arrive bientôt. Merci de votre confiance - SushiEats`;
        break;
      case 'ready':
        if (orderType === 'pickup') {
          message += `votre commande #${orderId.substring(0, 6)} est prête ! Vous pouvez venir la récupérer en restaurant. Merci de votre confiance - SushiEats`;
        } else {
          message += `votre commande #${orderId.substring(0, 6)} est prête ! Merci de votre confiance - SushiEats`;
        }
        break;
      case 'delivered':
        message += `votre commande #${orderId.substring(0, 6)} a été livrée ! Nous espérons que vous vous régalerez. Merci de votre confiance - SushiEats`;
        break;
      case 'completed':
        message += `merci d'avoir récupéré votre commande #${orderId.substring(0, 6)} ! Nous espérons que vous vous régalerez. Merci de votre confiance - SushiEats`;
        break;
      default:
        message += `le statut de votre commande #${orderId.substring(0, 6)} a été mis à jour. Merci de votre confiance - SushiEats`;
    }

    console.log(`📱 Préparation SMS pour ${phoneNumber}:`, message);

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
