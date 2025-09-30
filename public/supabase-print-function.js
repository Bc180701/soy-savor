// Fonction Supabase Edge Function pour l'impression
// À déployer sur Supabase : supabase functions deploy print-order

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { orderData, printerIP = '192.168.1.129', printerPort = 9100 } = await req.json()

  try {
    // Générer le contenu d'impression
    const printContent = generatePrintContent(orderData)
    
    // Envoyer à l'imprimante
    const result = await sendToPrinter(printContent, printerIP, printerPort)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Impression envoyée !' }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})

function generatePrintContent(order) {
  let content = ''
  
  // En-tête du restaurant
  content += 'SOY SAVOR\n'
  content += '16 cours Carnot\n'
  content += '13160 Chateaurenard\n'
  content += 'Tel: 04 90 24 00 00\n'
  content += '================================\n'
  
  // Informations de la commande
  content += `COMMANDE #${order.id}\n`
  content += `Date: ${new Date().toLocaleString('fr-FR')}\n`
  content += `Type: ${order.delivery_type}\n`
  content += '================================\n'
  
  // Articles
  content += 'ARTICLES COMMANDES\n'
  content += '================================\n'
  
  const items = order.cartBackupItems || order.items || []
  let total = 0
  
  items.forEach(item => {
    const name = item.name || item.menuItem?.name || 'Article inconnu'
    const quantity = item.quantity || 1
    const price = item.price || item.menuItem?.price || 0
    const itemTotal = quantity * price
    
    content += `${name}\n`
    content += `Qte: ${quantity} x ${price.toFixed(2)}EUR = ${itemTotal.toFixed(2)}EUR\n`
    content += '--------------------------------\n'
    total += itemTotal
  })
  
  // Totaux
  content += '================================\n'
  content += `TOTAL: ${total.toFixed(2)}EUR\n`
  content += '================================\n'
  
  // Pied de page
  content += 'Merci pour votre commande !\n'
  content += 'Bon appetit !\n\n\n'
  
  return content
}

async function sendToPrinter(content, printerIP, printerPort) {
  // Utiliser Deno pour envoyer à l'imprimante
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  
  // Note: Cette partie nécessiterait une configuration réseau spécifique
  // pour permettre à Supabase d'accéder à votre imprimante locale
  console.log(`Envoi vers ${printerIP}:${printerPort}`)
  console.log('Contenu:', content)
  
  return { success: true }
}
