import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  orderId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId }: OrderConfirmationRequest = await req.json();
    console.log('📧 Envoi email confirmation pour commande:', orderId);

    // Récupérer les détails de la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, restaurants(name, address, city, phone)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Erreur récupération commande:', orderError);
      throw new Error('Commande non trouvée');
    }

    if (!order.client_email) {
      console.log('⚠️ Pas d\'email client pour la commande:', orderId);
      return new Response(JSON.stringify({ success: false, reason: 'No email' }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Décoder les articles de la commande
    const { data: decodedItems } = await supabase
      .rpc('decode_items_summary', { encoded_summary: order.items_summary });

    const items = decodedItems || order.items_summary || [];

    // Préparer les informations de livraison/retrait
    const orderTypeText = order.order_type === 'delivery' ? 'Livraison' : 
                         order.order_type === 'pickup' ? 'À emporter' : 'Sur place';
    
    const addressText = order.order_type === 'delivery' && order.delivery_street ? 
      `${order.delivery_street}, ${order.delivery_city} ${order.delivery_postal_code}` : '';

    // Formater la date de livraison/retrait
    const scheduledDate = new Date(order.scheduled_for);
    const dateText = scheduledDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Créer le HTML de l'email
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de commande</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 32px 24px; text-align: center; }
            .content { padding: 32px 24px; }
            .order-number { font-size: 24px; font-weight: bold; color: #dc2626; margin-bottom: 16px; }
            .section { margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
            .section:last-child { border-bottom: none; }
            .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
            .item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
            .item-name { font-weight: 500; }
            .item-price { font-weight: 600; color: #dc2626; }
            .total-line { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-line.grand-total { font-size: 18px; font-weight: bold; color: #dc2626; border-top: 2px solid #dc2626; padding-top: 12px; margin-top: 12px; }
            .info-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Confirmation de commande</h1>
              <p>Merci pour votre commande chez ${order.restaurants?.name || 'Sushi Eats'} !</p>
            </div>
            
            <div class="content">
              <div class="order-number">Commande n° ${order.id.slice(-8).toUpperCase()}</div>
              
              <div class="section">
                <div class="section-title">Informations de ${orderTypeText.toLowerCase()}</div>
                <p><strong>Type :</strong> ${orderTypeText}</p>
                <p><strong>Prévu pour :</strong> ${dateText}</p>
                ${addressText ? `<p><strong>Adresse :</strong> ${addressText}</p>` : ''}
                ${order.customer_notes ? `<p><strong>Instructions :</strong> ${order.customer_notes}</p>` : ''}
              </div>

              <div class="section">
                <div class="section-title">Détail de la commande</div>
                ${items.map((item: any) => `
                  <div class="item">
                    <div>
                      <div class="item-name">${item.name}</div>
                      ${item.description ? `<div style="color: #6b7280; font-size: 14px;">${item.description}</div>` : ''}
                    </div>
                    <div class="item-price">${item.quantity}x ${item.price.toFixed(2)}€</div>
                  </div>
                `).join('')}
              </div>

              <div class="section">
                <div class="section-title">Récapitulatif</div>
                <div class="total-line">
                  <span>Sous-total</span>
                  <span>${order.subtotal.toFixed(2)}€</span>
                </div>
                ${order.delivery_fee > 0 ? `
                  <div class="total-line">
                    <span>Frais de livraison</span>
                    <span>${order.delivery_fee.toFixed(2)}€</span>
                  </div>
                ` : ''}
                ${order.tip > 0 ? `
                  <div class="total-line">
                    <span>Pourboire</span>
                    <span>${order.tip.toFixed(2)}€</span>
                  </div>
                ` : ''}
                ${order.discount > 0 ? `
                  <div class="total-line" style="color: #059669;">
                    <span>Réduction</span>
                    <span>-${order.discount.toFixed(2)}€</span>
                  </div>
                ` : ''}
                <div class="total-line grand-total">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}€</span>
                </div>
              </div>

              <div class="info-box">
                <p><strong>Votre commande est confirmée !</strong></p>
                <p>Vous recevrez un SMS lorsque votre commande sera prête.</p>
              </div>

              ${order.restaurants ? `
                <div class="section">
                  <div class="section-title">Informations du restaurant</div>
                  <p><strong>${order.restaurants.name}</strong></p>
                  ${order.restaurants.address ? `<p>${order.restaurants.address}, ${order.restaurants.city}</p>` : ''}
                  ${order.restaurants.phone ? `<p>Téléphone : ${order.restaurants.phone}</p>` : ''}
                </div>
              ` : ''}
            </div>

            <div class="footer">
              <p>Merci de votre confiance !</p>
              <p>L'équipe ${order.restaurants?.name || 'Sushi Eats'}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Envoyer l'email
    const emailResponse = await resend.emails.send({
      from: `SushiEats - ${order.restaurants?.name || 'Restaurant'} <confirmation@emailsend.clwebdesign.fr>`,
      to: [order.client_email],
      subject: `SushiEats - Confirmation de commande n° ${order.id.slice(-8).toUpperCase()}`,
      html: emailHTML,
    });

    console.log("✅ Email de confirmation envoyé:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur envoi email de confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);