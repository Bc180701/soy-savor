import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  console.log("🔧 Test Brevo API démarré");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("📧 Email de test pour:", email);
    
    console.log("🔑 Clé API Brevo:", BREVO_API_KEY ? "PRÉSENTE" : "MANQUANTE");
    
    if (!BREVO_API_KEY) {
      throw new Error("Clé API Brevo manquante dans les variables d'environnement");
    }
    
    console.log("🌐 Envoi via API REST Brevo...");
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: 'SushiEats',
          email: '73ea12001@smtp-brevo.com'
        },
        to: [
          {
            email: email,
            name: 'Destinataire'
          }
        ],
        subject: '🍣 Test Brevo API - SushiEats',
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50; text-align: center;">🍣 Test Brevo API réussi !</h2>
                <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès via l'API Brevo depuis votre système SushiEats.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
                  <p><strong>🌐 Méthode:</strong> API REST Brevo</p>
                  <p><strong>🔧 Endpoint:</strong> https://api.brevo.com/v3/smtp/email</p>
                  <p><strong>👤 Expéditeur:</strong> 73ea12001@smtp-brevo.com</p>
                  <p><strong>📧 Destinataire:</strong> ${email}</p>
                </div>
                
                <p style="color: #27ae60; font-weight: bold; text-align: center;">
                  ✅ Si vous recevez cet email, la configuration Brevo fonctionne parfaitement !
                </p>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                
                <p style="font-size: 14px; color: #666; text-align: center;">
                  Cet email a été envoyé automatiquement par votre système de test SushiEats via l'API Brevo.<br>
                  Ne pas répondre à cet email.
                </p>
              </div>
            </body>
          </html>
        `
      })
    });
    
    const responseData = await response.json();
    console.log("📧 Statut de la réponse Brevo:", response.status);
    console.log("📧 Données de réponse:", responseData);
    
    if (!response.ok) {
      console.error("❌ Erreur API Brevo:", responseData);
      throw new Error(`Erreur API Brevo: ${response.status} - ${JSON.stringify(responseData)}`);
    }
    
    console.log("✅ Email envoyé avec succès via l'API Brevo");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès via l'API Brevo !",
      method: "API REST Brevo",
      messageId: responseData.messageId,
      debugInfo: {
        hasApiKey: !!BREVO_API_KEY,
        timestamp: new Date().toISOString(),
        senderEmail: "73ea12001@smtp-brevo.com",
        apiEndpoint: "https://api.brevo.com/v3/smtp/email",
        messageId: responseData.messageId
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("💥 Erreur dans test-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      method: "API REST Brevo",
      stack: error.stack,
      debugInfo: {
        timestamp: new Date().toISOString(),
        hasApiKey: !!BREVO_API_KEY,
        apiEndpoint: "https://api.brevo.com/v3/smtp/email",
        senderEmail: "73ea12001@smtp-brevo.com"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});