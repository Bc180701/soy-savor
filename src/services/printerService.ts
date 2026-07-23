/**
 * Service d'impression vers serveur OVH
 * Envoie les commandes à l'imprimante Epson via le serveur PHP
 */

import { Order } from "@/types";
import { supabase } from "@/integrations/supabase/client";

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
    
    // Log des sources de données disponibles pour debug
    console.log('🔍 [PRINT] Sources de données disponibles:', {
      cartBackupItems: order.cartBackupItems?.length || 0,
      itemsSummary: order.itemsSummary?.length || 0,
      items: order.items?.length || 0
    });
    
    // Utiliser cart_backup en priorité (le plus complet)
    if (order.cartBackupItems && order.cartBackupItems.length > 0) {
      console.log('📦 [PRINT] Utilisation de cartBackupItems');
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
    // Sinon utiliser itemsSummary (fallback principal)
    else if (order.itemsSummary && order.itemsSummary.length > 0) {
      console.log('📦 [PRINT] Utilisation de itemsSummary (fallback)');
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
    // Fallback sur items (dernier recours)
    else if (order.items && order.items.length > 0) {
      console.log('📦 [PRINT] Utilisation de items (dernier recours)');
      order.items.forEach((item: any) => {
        items.push({
          name: item.name || 'Produit',
          quantity: item.quantity || 1,
          price: item.price || 0,
          description: item.description || '',
          specialInstructions: item.special_instructions || '',
        });
      });
    } else {
      console.warn('⚠️ [PRINT] Aucune source locale, fallback DB sur orders.items_summary');
      try {
        const { data: dbOrder, error: dbErr } = await supabase
          .from('orders')
          .select('items_summary')
          .eq('id', order.id)
          .single();

        if (dbErr) {
          console.error('❌ [PRINT] Erreur fallback DB:', dbErr);
        } else if (dbOrder?.items_summary && Array.isArray(dbOrder.items_summary) && dbOrder.items_summary.length > 0) {
          console.log('📦 [PRINT] Utilisation items_summary depuis DB:', dbOrder.items_summary.length, 'articles');
          (dbOrder.items_summary as any[]).forEach((item: any) => {
            items.push({
              name: item.name || 'Produit',
              quantity: item.quantity || 1,
              price: item.price ?? item.unit_price ?? 0,
              description: item.description || '',
              specialInstructions: item.special_instructions || '',
            });
          });
        } else {
          console.error('❌ [PRINT] Aucune source de données pour les articles, même en DB !');
        }
      } catch (e) {
        console.error('❌ [PRINT] Exception fallback DB:', e);
      }
    }

    // Enrichir les descriptions manquantes (surtout Sushi Créa / Poké Créa) depuis cart_backup en DB
    const needsEnrichment = items.some(
      (it) =>
        !it.description &&
        (/sushi\s+cr[ée]a/i.test(it.name) || /pok[ée]\s+cr[ée]a/i.test(it.name))
    );

    if (needsEnrichment && order.clientEmail) {
      try {
        const orderTime = new Date((order as any).createdAt || order.scheduledFor).getTime();
        const windowStart = new Date(orderTime - 3 * 60 * 60 * 1000).toISOString();
        const windowEnd = new Date(orderTime + 15 * 60 * 1000).toISOString();

        const { data: backups } = await supabase
          .from('cart_backup')
          .select('cart_items, created_at')
          .eq('session_id', order.clientEmail)
          .gte('created_at', windowStart)
          .lte('created_at', windowEnd)
          .order('created_at', { ascending: false });

        const normalize = (s: string) =>
          (s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');

        // Trouver le backup avec le meilleur score de correspondance
        let bestBackup: any[] | null = null;
        let bestScore = 0;
        for (const b of backups || []) {
          const backupItems = (b.cart_items as any[]) || [];
          let score = 0;
          for (const it of items) {
            const n = normalize(it.name);
            if (backupItems.some((bi: any) => normalize(bi.menuItem?.name || '') === n)) {
              score++;
            }
          }
          if (score > bestScore) {
            bestScore = score;
            bestBackup = backupItems;
          }
        }

        if (bestBackup && bestScore > 0) {
          console.log('📦 [PRINT] Enrichissement descriptions depuis cart_backup (score:', bestScore, ')');
          for (const it of items) {
            if (it.description) continue;
            const n = normalize(it.name);
            const match = bestBackup.find((bi: any) => normalize(bi.menuItem?.name || '') === n);
            if (match?.menuItem?.description) {
              it.description = match.menuItem.description;
            }
          }
        }
      } catch (e) {
        console.error('❌ [PRINT] Exception enrichissement descriptions:', e);
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
