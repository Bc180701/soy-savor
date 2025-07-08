import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Début fonction test-email');
    const { email, name = "Test User" } = await req.json() as TestEmailRequest;
    
    console.log('📋 Test email pour:', { email, name });
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      console.error('❌ Clé API Brevo manquante');
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }
    
    console.log('✅ Clé API Brevo présente');
    
    // Préparer le contenu de l'email de test
    const subject = `Email de test SushiEats - ${new Date().toLocaleString('fr-FR')}`;
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Test d'envoi d'email SushiEats</h1>
            <p style="font-size: 16px; color: #555;">Bonjour ${name},</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Ceci est un <strong style="color: #007bff;">email de test</strong> pour vérifier que le système de notifications fonctionne correctement.
            </p>
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>Date et heure:</strong> <span style="color: #007bff;">${new Date().toLocaleString('fr-FR')}</span>
              </p>
            </div>
            <p style="font-size: 16px; color: #555;">
              Si vous recevez cet email, cela signifie que le système de notifications par email fonctionne parfaitement ! 🎉
            </p>
            <p style="font-size: 16px; color: #555; margin-bottom: 0;">
              <strong>L'équipe SushiEats</strong>
            </p>
          </div>
        </body>
      </html>
    `;
    
    console.log('🌐 Tentative d\'envoi via API Brevo...');
    
    // Envoyer l'email via l'API Brevo
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        sender: {
          name: "SushiEats Test",
          email: "notifications@sushieats.fr",
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });
    
    console.log('📡 Réponse Brevo - Status:', response.status);
    console.log('📡 Réponse Brevo - Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur d'envoi d'email via Brevo:", errorData);
      throw new Error(`Erreur Brevo: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    console.log("✅ Email de test envoyé avec succès via Brevo:", responseData);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès",
      messageId: responseData.messageId,
      recipient: email
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur dans la fonction test-email:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "Vérifiez les logs pour plus de détails"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);