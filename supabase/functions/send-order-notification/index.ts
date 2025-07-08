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
  statusMessage: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Début fonction send-order-notification');
    
    const { email, name, orderId, status, statusMessage } = await req.json() as NotificationRequest;
    console.log('📋 Données reçues:', { email, name, orderId, status });
    
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      console.error('❌ Clé API Brevo manquante');
      throw new Error("Clé API Brevo manquante");
    }
    
    console.log('✅ Clé Brevo présente');
    
    // Préparer le contenu de l'email
    const subject = `Mise à jour de votre commande #${orderId}`;
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
              Mise à jour de votre commande
            </h1>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Nous vous informons que votre commande <strong>#${orderId}</strong> ${statusMessage}.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Statut actuel :</strong> <span style="color: #27ae60; font-weight: bold;">${status}</span></p>
            </div>
            <p>Merci de nous faire confiance !</p>
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe SushiEats</strong>
            </p>
          </div>
        </body>
      </html>
    `;
    
    // Envoyer l'email via l'API Brevo transactionnelle
    console.log('🌐 Envoi via API Brevo transactionnelle...');
    
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
    console.log("✅ Email envoyé avec succès:", result);
    
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