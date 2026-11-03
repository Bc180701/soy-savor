/**
 * Service d'impression vers serveur OVH
 * Envoie les commandes à l'imprimante Epson via le serveur PHP
 */

import { Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { getOrderBackupItems, snapshotToPrintItems } from "@/utils/orderSnapshot";
import { loadOrderPurchaseSnapshot } from '@/services/orderPurchaseSnapshot';

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

    // Always read the purchase snapshot by order ID, before any local/cart data.
    const { data: dbOrder, error: snapshotError } = await supabase
      .from('orders')
      .select('items_summary')
      .eq('id', order.id)
      .single();

    if (snapshotError) {
      return { success: false, message: 'Impossible de vérifier les articles de cette commande. Réessayez.' };
    }

    const summary = Array.isArray(dbOrder?.items_summary) ? dbOrder.items_summary : [];
    const items: PrintItem[] = [];
    if (summary.length > 0) {
      const decodedSummary = await loadOrderPurchaseSnapshot(order.id, summary);
      items.push(...snapshotToPrintItems(decodedSummary));
    } else {
      // Legacy orders: only sources explicitly bound to this order are safe.
      const { data: legacyItems, error: legacyError } = await supabase
        .from('order_items')
        .select('quantity, price, special_instructions, products(name, description)')
        .eq('order_id', order.id);
      if (legacyError) throw legacyError;
      for (const item of legacyItems || []) {
        items.push({
          name: item.products?.name || 'Produit',
          quantity: item.quantity,
          price: item.price,
          description: item.products?.description || '',
          specialInstructions: item.special_instructions || '',
        });
      }
      if (items.length === 0) {
        const { data: backups, error: backupError } = await supabase
          .from('cart_backup')
          .select('order_id, cart_items')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (backupError) throw backupError;
        for (const item of getOrderBackupItems(order.id, backups || [])) {
          items.push({
            name: item.menuItem?.name || 'Produit',
            quantity: item.quantity ?? 1,
            price: item.menuItem?.price ?? 0,
            description: item.menuItem?.description || '',
            specialInstructions: item.specialInstructions || '',
          });
        }
      }
    }

    if (items.length === 0) {
      return {
        success: false,
        message: 'Impression annulée : aucun article trouvé pour cette commande',
      };
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

    if (!response.ok) {
      throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
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
