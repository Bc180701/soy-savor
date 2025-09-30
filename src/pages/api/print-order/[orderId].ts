import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

// Fonction pour générer les commandes ESC/POS pour l'imprimante thermique
function generateESCPOSCommands(orderData: any): string {
  let commands = '';
  
  // Initialisation de l'imprimante
  commands += '\x1B\x40'; // ESC @ - Initialize printer
  commands += '\x1B\x61\x01'; // ESC a 1 - Center alignment
  
  // En-tête du restaurant
  commands += '\x1B\x21\x30'; // ESC ! 0 - Normal text
  commands += 'SOY SAVOR\n';
  commands += '16 cours Carnot\n';
  commands += '13160 Châteaurenard\n';
  commands += 'Tel: 04 90 24 00 00\n';
  commands += '================================\n';
  
  // Informations de la commande
  commands += '\x1B\x21\x10'; // ESC ! 16 - Double height
  commands += `COMMANDE #${orderData.id}\n`;
  commands += '\x1B\x21\x00'; // ESC ! 0 - Normal text
  
  commands += `Date: ${new Date(orderData.created_at).toLocaleString('fr-FR')}\n`;
  commands += `Type: ${orderData.order_type === 'delivery' ? 'LIVRAISON' : 'EMPORTE'}\n`;
  
  if (orderData.customer_name) {
    commands += `Client: ${orderData.customer_name}\n`;
  }
  
  if (orderData.delivery_address) {
    commands += `Adresse: ${orderData.delivery_address}\n`;
  }
  
  if (orderData.phone) {
    commands += `Tel: ${orderData.phone}\n`;
  }
  
  commands += '================================\n';
  
  // Articles de la commande
  commands += '\x1B\x21\x08'; // ESC ! 8 - Bold
  commands += 'ARTICLES COMMANDES\n';
  commands += '\x1B\x21\x00'; // ESC ! 0 - Normal text
  commands += '================================\n';
  
  // Utiliser cartBackupItems si disponible, sinon itemsSummary
  const items = orderData.cartBackupItems || orderData.itemsSummary || [];
  
  if (items.length > 0) {
    items.forEach((item: any) => {
      const itemName = item.menuItem?.name || item.name || 'Article';
      const quantity = item.quantity || 1;
      const price = item.menuItem?.price || item.price || 0;
      const totalPrice = (quantity * price).toFixed(2);
      
      // Nom de l'article
      commands += `\x1B\x21\x08`; // Bold
      commands += `${itemName}\n`;
      commands += `\x1B\x21\x00`; // Normal
      
      // Quantité et prix
      commands += `Qte: ${quantity} x ${price.toFixed(2)}€ = ${totalPrice}€\n`;
      
      // Instructions spéciales si présentes
      if (item.specialInstructions || item.special_instructions) {
        commands += `Note: ${item.specialInstructions || item.special_instructions}\n`;
      }
      
      // Description pour les créations personnalisées
      if (item.itemDescription) {
        commands += `Composition: ${item.itemDescription}\n`;
      }
      
      commands += '--------------------------------\n';
    });
  } else {
    commands += 'Aucun article trouvé\n';
  }
  
  // Totaux
  commands += '================================\n';
  commands += '\x1B\x21\x08'; // Bold
  commands += `SOUS-TOTAL: ${orderData.subtotal?.toFixed(2) || '0.00'}€\n`;
  
  if (orderData.delivery_fee && orderData.delivery_fee > 0) {
    commands += `FRAIS DE LIVRAISON: ${orderData.delivery_fee.toFixed(2)}€\n`;
  }
  
  if (orderData.discount && orderData.discount > 0) {
    commands += `REMISE: -${orderData.discount.toFixed(2)}€\n`;
  }
  
  commands += `TOTAL: ${orderData.total?.toFixed(2) || '0.00'}€\n`;
  commands += '\x1B\x21\x00'; // Normal text
  
  // Mode de paiement
  if (orderData.payment_method) {
    commands += '================================\n';
    commands += `Paiement: ${orderData.payment_method.toUpperCase()}\n`;
  }
  
  // Instructions spéciales de la commande
  if (orderData.special_instructions) {
    commands += '================================\n';
    commands += 'INSTRUCTIONS SPECIALES:\n';
    commands += `${orderData.special_instructions}\n`;
  }
  
  // Pied de page
  commands += '================================\n';
  commands += 'Merci pour votre commande !\n';
  commands += 'Bon appetit !\n';
  commands += '\n\n\n'; // Espace pour couper
  
  // Couper le papier
  commands += '\x1D\x56\x00'; // GS V 0 - Full cut
  
  return commands;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    
    if (!orderId) {
      return new NextResponse('Order ID required', { status: 400 });
    }
    
    // Récupérer les détails de la commande depuis Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        cart_backup:cart_backup(
          id,
          menu_item_id,
          quantity,
          special_instructions,
          item_description,
          menu_items(
            name,
            price
          )
        )
      `)
      .eq('id', orderId)
      .single();
    
    if (error || !order) {
      return new NextResponse('Order not found', { status: 404 });
    }
    
    // Transformer les données cart_backup pour correspondre au format attendu
    const cartBackupItems = order.cart_backup?.map((item: any) => ({
      quantity: item.quantity,
      specialInstructions: item.special_instructions,
      itemDescription: item.item_description,
      menuItem: {
        name: item.menu_items?.name || 'Article',
        price: item.menu_items?.price || 0
      }
    })) || [];
    
    // Ajouter les cartBackupItems à l'objet order
    const orderWithItems = {
      ...order,
      cartBackupItems
    };
    
    // Générer les commandes ESC/POS
    const escposCommands = generateESCPOSCommands(orderWithItems);
    
    // Retourner le contenu en tant que texte brut
    return new NextResponse(escposCommands, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Error generating print content:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
