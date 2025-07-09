
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
    
    // Test simple d'envoi d'email
    const emailData = {
      sender: {
        name: "SushiEats Test",
        email: "test@clwebdesign.fr"
      },
      to: [{
        email: email,
        name: "Test User"
      }],
      subject: "Test d'envoi d'email - SushiEats",
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2c3e50;">Test d'envoi d'email</h2>
            <p>Ceci est un email de test pour vérifier la configuration Brevo.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Domaine:</strong> clwebdesign.fr</p>
            <p>Si vous recevez cet email, la configuration fonctionne !</p>
          </body>
        </html>
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
      debugInfo: {
        hasApiKey: !!brevoApiKey,
        timestamp: new Date().toISOString(),
        brevoResponse: result
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
