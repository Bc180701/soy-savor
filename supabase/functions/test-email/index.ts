
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    
    console.log("🌐 Tentative d'envoi via l'API Brevo...");
    
    // Utilisation de l'API Brevo au lieu de SMTP pour éviter les problèmes de dépendances
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "SushiEats",
          email: "clweb@hotmail.com"
        },
        to: [
          {
            email: email,
            name: "Destinataire"
          }
        ],
        subject: "🍣 Test Brevo API - SushiEats",
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50; text-align: center;">🍣 Test Brevo API réussi !</h2>
                <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès via l'API Brevo depuis votre système SushiEats.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
                  <p><strong>🌐 Méthode:</strong> API Brevo</p>
                  <p><strong>🔧 Endpoint:</strong> https://api.brevo.com/v3/smtp/email</p>
                  <p><strong>👤 Expéditeur:</strong> clweb@hotmail.com</p>
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
    
    console.log("📧 Statut de la réponse Brevo:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur API Brevo:", errorText);
      throw new Error(`Erreur API Brevo: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("✅ Email envoyé avec succès via l'API Brevo:", result);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès via l'API Brevo !",
      method: "API Brevo",
      messageId: result.messageId,
      deliveryTips: [
        "Vérifiez votre dossier Spam/Indésirables",
        "Vérifiez le dossier Promotions (Gmail)",
        "L'email peut prendre quelques minutes à arriver",
        "L'API Brevo offre une excellente délivrabilité",
        "Ajoutez clweb@hotmail.com à vos contacts"
      ],
      debugInfo: {
        hasApiKey: !!brevoApiKey,
        timestamp: new Date().toISOString(),
        senderEmail: "clweb@hotmail.com",
        apiEndpoint: "https://api.brevo.com/v3/smtp/email",
        messageId: result.messageId
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("💥 Erreur dans test-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    let errorMessage = error.message;
    let suggestions = [
      "Vérifiez votre clé API Brevo",
      "Vérifiez que la clé API est active",
      "Vérifiez que l'expéditeur clweb@hotmail.com est autorisé"
    ];
    
    // Messages d'erreur spécifiques selon le type d'erreur
    if (error.message.includes("401") || error.message.includes("Unauthorized")) {
      suggestions = [
        "Erreur d'authentification - Vérifiez votre clé API Brevo",
        "Assurez-vous que la clé API est correcte et active",
        "Vérifiez que vous avez les permissions d'envoi d'emails"
      ];
    } else if (error.message.includes("400") || error.message.includes("Bad Request")) {
      suggestions = [
        "Erreur dans la requête - Vérifiez l'adresse email",
        "Assurez-vous que l'expéditeur clweb@hotmail.com est vérifié",
        "Vérifiez que le domaine est autorisé dans Brevo"
      ];
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      method: "API Brevo",
      stack: error.stack,
      suggestions: suggestions,
      debugInfo: {
        timestamp: new Date().toISOString(),
        hasApiKey: !!Deno.env.get("BREVO_API_KEY"),
        apiEndpoint: "https://api.brevo.com/v3/smtp/email",
        senderEmail: "clweb@hotmail.com"
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
