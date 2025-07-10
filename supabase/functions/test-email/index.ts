
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔧 Début du test d'envoi d'email via SMTP");
  
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json() as TestEmailRequest;
    console.log("📧 Email de test pour:", email);
    
    // Récupération de la clé API Brevo (mot de passe SMTP)
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    console.log("🔑 Clé API Brevo:", brevoApiKey ? "PRÉSENTE" : "MANQUANTE");
    
    if (!brevoApiKey) {
      throw new Error("Clé API Brevo manquante dans les variables d'environnement");
    }
    
    console.log("🌐 Configuration du client SMTP Brevo...");
    
    // Configuration SMTP avec les BONS paramètres de votre compte
    const client = new SMTPClient({
      connection: {
        hostname: "smtp-relay.brevo.com",
        port: 587,
        tls: true,
        auth: {
          username: "clweb@hotmail.com", // Votre vrai identifiant SMTP
          password: brevoApiKey, // Votre clé API Brevo sert de mot de passe
        },
      },
    });
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #2c3e50; text-align: center;">🍣 Test SMTP Brevo réussi !</h2>
            <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès via SMTP Brevo depuis votre système SushiEats.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>🌐 Méthode:</strong> SMTP Brevo</p>
              <p><strong>🔧 Serveur:</strong> smtp-relay.brevo.com:587</p>
              <p><strong>👤 Identifiant:</strong> clweb@hotmail.com</p>
              <p><strong>📧 Destinataire:</strong> ${email}</p>
            </div>
            
            <p style="color: #27ae60; font-weight: bold; text-align: center;">
              ✅ Si vous recevez cet email, la configuration SMTP Brevo fonctionne parfaitement !
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              Cet email a été envoyé automatiquement par votre système de test SushiEats via SMTP.<br>
              Ne pas répondre à cet email.
            </p>
          </div>
        </body>
      </html>
    `;
    
    console.log("📤 Envoi de l'email via SMTP...");
    
    await client.send({
      from: "clweb@hotmail.com", // Utilisation de votre identifiant SMTP comme expéditeur
      to: email,
      subject: "🍣 Test SMTP Brevo - SushiEats (Configuration corrigée)",
      content: htmlContent,
      html: htmlContent,
    });
    
    console.log("✅ Email envoyé avec succès via SMTP Brevo");
    
    // Fermer la connexion SMTP
    await client.close();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès via SMTP Brevo !",
      method: "SMTP",
      server: "smtp-relay.brevo.com:587",
      username: "clweb@hotmail.com",
      deliveryTips: [
        "Vérifiez votre dossier Spam/Indésirables",
        "Vérifiez le dossier Promotions (Gmail)",
        "L'email peut prendre quelques minutes à arriver",
        "SMTP Brevo offre généralement une meilleure délivrabilité",
        "Ajoutez clweb@hotmail.com à vos contacts"
      ],
      debugInfo: {
        hasApiKey: !!brevoApiKey,
        timestamp: new Date().toISOString(),
        senderEmail: "clweb@hotmail.com",
        smtpServer: "smtp-relay.brevo.com",
        port: 587,
        authUsername: "clweb@hotmail.com"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("💥 Erreur dans test-email SMTP:", error);
    console.error("💥 Stack trace:", error.stack);
    
    let errorMessage = error.message;
    let suggestions = [
      "Vérifiez votre configuration SMTP Brevo",
      "Vérifiez que la clé API est correcte",
      "Vérifiez que l'identifiant clweb@hotmail.com est correct"
    ];
    
    // Messages d'erreur spécifiques selon le type d'erreur
    if (error.message.includes("authentication") || error.message.includes("auth")) {
      suggestions = [
        "Erreur d'authentification SMTP - Vérifiez votre clé API Brevo",
        "Assurez-vous que l'identifiant clweb@hotmail.com est correct",
        "La clé API sert de mot de passe pour l'authentification SMTP"
      ];
    } else if (error.message.includes("connection") || error.message.includes("timeout")) {
      suggestions = [
        "Problème de connexion au serveur SMTP Brevo",
        "Vérifiez votre connexion internet",
        "Le serveur smtp-relay.brevo.com:587 doit être accessible"
      ];
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      method: "SMTP",
      stack: error.stack,
      suggestions: suggestions,
      debugInfo: {
        timestamp: new Date().toISOString(),
        hasApiKey: !!Deno.env.get("BREVO_API_KEY"),
        smtpServer: "smtp-relay.brevo.com",
        port: 587,
        authUsername: "clweb@hotmail.com"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
