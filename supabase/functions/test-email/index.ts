import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const SMTP_CONFIG = {
  hostname: "smtp-relay.brevo.com",
  port: 587,
  username: "73ea12001@smtp-brevo.com",
  password: "9I6kKprqhZLMydva"
};

serve(async (req) => {
  console.log("🔧 Test SMTP Brevo démarré");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    console.log("📧 Email de test pour:", email);
    
    console.log("🌐 Configuration SMTP:", {
      hostname: SMTP_CONFIG.hostname,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      hasPassword: !!SMTP_CONFIG.password
    });
    
    const client = new SmtpClient();
    
    console.log("🔗 Connexion au serveur SMTP...");
    await client.connectTLS({
      hostname: SMTP_CONFIG.hostname,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.username,
      password: SMTP_CONFIG.password,
    });
    
    console.log("📤 Envoi de l'email...");
    await client.send({
      from: "73ea12001@smtp-brevo.com",
      to: email,
      subject: "🍣 Test SMTP Brevo - SushiEats",
      content: "Test réussi !",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2c3e50; text-align: center;">🍣 Test SMTP Brevo réussi !</h2>
              <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès via SMTP Brevo depuis votre système SushiEats.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>🌐 Méthode:</strong> SMTP Brevo</p>
                <p><strong>🔧 Serveur:</strong> ${SMTP_CONFIG.hostname}:${SMTP_CONFIG.port}</p>
                <p><strong>👤 Expéditeur:</strong> ${SMTP_CONFIG.username}</p>
                <p><strong>📧 Destinataire:</strong> ${email}</p>
              </div>
              
              <p style="color: #27ae60; font-weight: bold; text-align: center;">
                ✅ Si vous recevez cet email, la configuration SMTP Brevo fonctionne parfaitement !
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Cet email a été envoyé automatiquement par votre système de test SushiEats via SMTP Brevo.<br>
                Ne pas répondre à cet email.
              </p>
            </div>
          </body>
        </html>
      `,
    });
    
    console.log("🔐 Fermeture de la connexion SMTP...");
    await client.close();
    
    console.log("✅ Email envoyé avec succès via SMTP Brevo");
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès via SMTP Brevo !",
      method: "SMTP Brevo",
      debugInfo: {
        timestamp: new Date().toISOString(),
        smtpServer: `${SMTP_CONFIG.hostname}:${SMTP_CONFIG.port}`,
        senderEmail: SMTP_CONFIG.username,
        recipientEmail: email
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("💥 Erreur SMTP:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      method: "SMTP Brevo",
      stack: error.stack,
      debugInfo: {
        timestamp: new Date().toISOString(),
        smtpServer: `${SMTP_CONFIG.hostname}:${SMTP_CONFIG.port}`,
        senderEmail: SMTP_CONFIG.username
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});