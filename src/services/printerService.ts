/**
 * Service d'impression vers serveur OVH
 * Envoie les commandes à l'imprimante Epson via le serveur PHP
 */

import { Order } from "@/types";

// URLs des serveurs OVH par restaurant
const OVH_SERVER_URL = "https://sushieats.fr/add-order.php";

// IDs des restaurants
const RESTAURANT_CHATEAURENARD = "11111111-1111-1111-1111-111111111111";
const RESTAURANT_ST_MARTIN = "22222222-2222-2222-2222-222222222222";

interface PrintOrderData {
  id: string;
  restaurant_id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  orderType: string;
  scheduledFor: string;
  items: PrintItem[];
  subtotal: number;
  tax: number;
  deliveryFee?: number;
  tip?: number;
  discount?: number;
  total: number;
  deliveryInstructions?: string;
  customerNotes?: string;
  allergies?: string[];
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
}

interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  description?: string;
  specialInstructions?: string;
}

/**
 * Envoie une commande au serveur OVH pour impression
 */
export async function sendOrderToPrinter(order: Order): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('🖨️ Envoi commande au serveur OVH:', order.id);

    // Préparer les articles à imprimer
    const items: PrintItem[] = [];
    
    // Utiliser cart_backup en priorité (le plus complet)
    if (order.cartBackupItems && order.cartBackupItems.length > 0) {
      order.cartBackupItems.forEach((item: any) => {
        items.push({
          name: item.menuItem?.name || 'Produit',
          quantity: item.quantity || 1,
          price: item.menuItem?.price || 0,
          description: item.menuItem?.description || '',
          specialInstructions: item.specialInstructions || '',
        });
      });
    } 
    // Sinon utiliser itemsSummary
    else if (order.itemsSummary && order.itemsSummary.length > 0) {
      order.itemsSummary.forEach((item: any) => {
        items.push({
          name: item.name || 'Produit',
          quantity: item.quantity || 1,
          price: item.price || 0,
          description: item.description || '',
          specialInstructions: item.special_instructions || '',
        });
      });
    }
    // Fallback sur items
    else if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        items.push({
          name: item.name || 'Produit',
          quantity: item.quantity || 1,
          price: item.price || 0,
          description: item.description || '',
          specialInstructions: item.special_instructions || '',
        });
      });
    }

    // Préparer les données de la commande avec l'ID du restaurant
    const printData: PrintOrderData = {
      id: order.id,
      restaurant_id: order.restaurant_id || RESTAURANT_CHATEAURENARD,
      clientName: order.clientName || 'Client',
      clientPhone: order.clientPhone || '',
      clientEmail: order.clientEmail,
      orderType: order.orderType,
      scheduledFor: order.scheduledFor.toISOString(),
      items: items,
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      tip: order.tip,
      discount: order.discount,
      total: order.total,
      deliveryInstructions: order.deliveryInstructions,
      customerNotes: order.customerNotes,
      allergies: order.allergies,
      deliveryStreet: order.deliveryStreet,
      deliveryCity: order.deliveryCity,
      deliveryPostalCode: order.deliveryPostalCode,
    };

    console.log('📤 Données envoyées:', printData);

    // Envoyer au serveur OVH
    const response = await fetch(OVH_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printData),
    });

    console.log('📡 Statut réponse:', response.status);
    console.log('📡 Headers réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Réponse erreur serveur:', errorText);
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
    }

    // Vérifier le Content-Type de la réponse
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Réponse non-JSON du serveur:', textResponse.substring(0, 500));
      throw new Error(`Le serveur a retourné du ${contentType || 'contenu inconnu'} au lieu de JSON. Vérifiez les logs du serveur PHP.`);
    }

    const result = await response.json();
    console.log('✅ Réponse serveur:', result);

    if (result.status === 'ok') {
      return {
        success: true,
        message: 'Commande envoyée à l\'imprimante avec succès',
      };
    } else {
      throw new Error(result.message || 'Erreur inconnue');
    }
  } catch (error: any) {
    console.error('❌ Erreur envoi impression:', error);
    
    // Messages d'erreur user-friendly
    let errorMessage = 'Impossible d\'envoyer à l\'imprimante';
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Serveur d\'impression inaccessible. Vérifiez votre connexion.';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'Erreur de configuration serveur (CORS). Contactez le support.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Délai d\'attente dépassé. Le serveur ne répond pas.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Vérifie si le serveur d'impression est accessible
 */
export async function checkPrinterServerStatus(): Promise<boolean> {
  try {
    const response = await fetch(OVH_SERVER_URL, {
      method: 'HEAD',
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Serveur d\'impression inaccessible:', error);
    return false;
  }
}
