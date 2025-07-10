
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔧 Début du test d'envoi d'email");
  
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json() as TestEmailRequest;
    console.log("📧 Email de test pour:", email);
    
    // Vérification de la clé API Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    console.log("🔑 Clé API Brevo:", brevoApiKey ? "PRÉSENTE" : "MANQUANTE");
    
    if (!brevoApiKey) {
      throw new Error("Clé API Brevo manquante dans les variables d'environnement");
    }
    
    // Test avec une adresse d'expéditeur plus standard
    const emailData = {
      sender: {
        name: "SushiEats Test",
        email: "noreply@mg.clwebdesign.fr" // Utilisation d'un sous-domaine dédié
      },
      to: [{
        email: email,
        name: "Test User"
      }],
      subject: "🍣 Test d'envoi d'email - SushiEats",
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2c3e50; text-align: center;">🍣 Test d'envoi d'email réussi !</h2>
              <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès depuis votre système SushiEats.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>🌐 Domaine:</strong> clwebdesign.fr</p>
                <p><strong>📧 Destinataire:</strong> ${email}</p>
              </div>
              
              <p style="color: #27ae60; font-weight: bold; text-align: center;">
                ✅ Si vous recevez cet email, la configuration Brevo fonctionne parfaitement !
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Cet email a été envoyé automatiquement par votre système de test SushiEats.<br>
                Ne pas répondre à cet email.
              </p>
            </div>
          </body>
        </html>
      `,
      // Ajout d'une version texte pour améliorer la délivrabilité
      textContent: `
Test d'envoi d'email - SushiEats

Félicitations ! Cet email de test a été envoyé avec succès.

Timestamp: ${new Date().toISOString()}
Domaine: clwebdesign.fr
Destinataire: ${email}

Si vous recevez cet email, la configuration Brevo fonctionne !

Cet email a été envoyé automatiquement par votre système de test SushiEats.
      `
    };
    
    console.log("🌐 Tentative d'envoi via Brevo API...");
    console.log("📝 Données email:", JSON.stringify(emailData, null, 2));
    
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(emailData)
    });
    
    console.log("📡 Status Brevo:", response.status);
    console.log("📡 Headers Brevo:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorData;
      const responseText = await response.text();
      console.log("❌ Réponse brute Brevo:", responseText);
      
      try {
        errorData = JSON.parse(responseText);
        console.log("❌ Erreur Brevo parsée:", JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log("❌ Impossible de parser la réponse d'erreur");
        errorData = { 
          status: response.status, 
          statusText: response.statusText,
          rawResponse: responseText
        };
      }
      
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erreur Brevo",
        details: errorData,
        suggestions: [
          "Vérifiez que le domaine clwebdesign.fr est vérifié dans Brevo",
          "Vérifiez que l'adresse d'expéditeur est autorisée",
          "Consultez les logs Brevo pour plus de détails"
        ],
        debugInfo: {
          hasApiKey: !!brevoApiKey,
          apiKeyLength: brevoApiKey?.length || 0,
          apiKeyStart: brevoApiKey?.substring(0, 10) + "...",
          timestamp: new Date().toISOString()
        }
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const result = await response.json();
    console.log("✅ Succès Brevo:", JSON.stringify(result, null, 2));
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.messageId,
      message: "Email de test envoyé avec succès !",
      deliveryTips: [
        "Vérifiez votre dossier Spam/Indésirables",
        "Vérifiez le dossier Promotions (Gmail)",
        "L'email peut prendre quelques minutes à arriver",
        "Ajoutez noreply@mg.clwebdesign.fr à vos contacts"
      ],
      debugInfo: {
        hasApiKey: !!brevoApiKey,
        timestamp: new Date().toISOString(),
        brevoResponse: result,
        senderEmail: "noreply@mg.clwebdesign.fr"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("💥 Erreur dans test-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack,
      suggestions: [
        "Vérifiez votre configuration Brevo",
        "Vérifiez que la clé API est correcte",
        "Consultez les logs Supabase pour plus de détails"
      ],
      debugInfo: {
        timestamp: new Date().toISOString(),
        hasApiKey: !!Deno.env.get("BREVO_API_KEY")
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
