import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  orderId: string;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Début envoi notification de commande');
    
    const { email, name, orderId, status } = await req.json() as NotificationRequest;
    console.log('📋 Données reçues:', { email, name, orderId, status });
    
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      console.error('❌ Clé API Brevo manquante');
      throw new Error("Configuration manquante: clé API Brevo");
    }
    
    // Messages selon le statut
    const statusMessages: Record<string, string> = {
      'confirmée': 'a été confirmée et est en cours de préparation',
      'en_preparation': 'est actuellement en préparation dans nos cuisines',
      'prête': 'est prête ! Vous pouvez venir la récupérer',
      'en_livraison': 'est en cours de livraison et arrivera bientôt chez vous',
      'livrée': 'a été livrée avec succès',
      'récupérée': 'a été récupérée avec succès'
    };
    
    const statusMessage = statusMessages[status] || 'a été mise à jour';
    const subject = `Mise à jour de votre commande #${orderId}`;
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">SushiEats</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Mise à jour de votre commande</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Nous vous informons que votre commande <strong>#${orderId}</strong> ${statusMessage}.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4ecdc4;">
              <p style="margin: 0;"><strong>Statut actuel :</strong> <span style="color: #27ae60; font-weight: bold;">${status.replace('_', ' ')}</span></p>
            </div>
          </div>
          
          <p>Merci de nous faire confiance pour vos repas japonais !</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p><strong>SushiEats</strong> - L'art du sushi à Châteaurenard</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          </div>
        </body>
      </html>
    `;
    
    console.log('🌐 Envoi via API Brevo...');
    
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "SushiEats",
          email: "noreply@brevo.com"
        },
        to: [{
          email: email,
          name: name
        }],
        subject: subject,
        htmlContent: htmlContent
      })
    });
    
    console.log('📡 Status Brevo:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur Brevo:", errorData);
      throw new Error(`Erreur Brevo: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    console.log("✅ Email de notification envoyé:", result);
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.messageId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("💥 Erreur:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});