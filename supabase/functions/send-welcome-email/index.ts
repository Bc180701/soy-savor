
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
  promoCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 Début de la fonction send-welcome-email");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Parsing de la requête...");
    const { email, name, promoCode } = await req.json() as WelcomeEmailRequest;
    
    console.log("📝 Données reçues:", { email: email, name: name, promoCode: promoCode });
    
    // Validation des données requises
    if (!email || !promoCode) {
      console.error("❌ Données manquantes:", { email: !!email, promoCode: !!promoCode });
      throw new Error("Email et code promo requis");
    }
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      console.error("❌ Clé API Brevo manquante dans les variables d'environnement");
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }
    
    console.log("🔑 Clé API Brevo trouvée");
    
    // Formater le nom si disponible, sinon utiliser l'email
    const userName = name || email.split('@')[0];
    
    // Préparer le contenu de l'email
    const subject = "Bienvenue chez SushiEats - Votre code promo de 10%";
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">SushiEats</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h1 style="color: #2c3e50;">Bienvenue chez SushiEats !</h1>
          <p>Bonjour <strong>${userName}</strong>,</p>
          <p>Nous sommes ravis de vous accueillir sur SushiEats, votre nouvelle destination pour des sushis délicieux et authentiques.</p>
          
          <div style="background-color: #f8f4e5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #d4af37; text-align: center;">
            <h2 style="color: #2c3e50; margin-top: 0;">🎁 Votre code promo de bienvenue</h2>
            <div style="font-size: 32px; font-weight: bold; color: #d4af37; margin: 15px 0; padding: 10px; background: white; border-radius: 5px; border: 2px dashed #d4af37;">${promoCode}</div>
            <p style="font-size: 18px; margin: 10px 0;"><strong>Profitez de 10% de réduction</strong> sur votre première commande !</p>
          </div>
          
          <p>Pour en profiter, il vous suffit d'utiliser ce code lors de votre prochaine commande.</p>
          <p>N'hésitez pas à explorer notre menu varié et à découvrir nos spécialités.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sushieats.fr/commander" style="display: inline-block; background-color: #d4af37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Commander maintenant</a>
          </div>
          
          <p>Bon appétit !</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p><strong>SushiEats</strong> - L'art du sushi à Châteaurenard</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          </div>
        </body>
      </html>
    `;
    
    // Préparer les données pour l'API Brevo
    const emailData = {
      sender: {
        name: "SushiEats",
        email: "bienvenue@sushieats.fr",
      },
      to: [
        {
          email: email,
          name: userName,
        },
      ],
      subject: subject,
      htmlContent: htmlContent,
    };
    
    console.log("🌐 Envoi via API Brevo...");
    console.log("📧 Destinataire:", email);
    
    // Envoyer l'email via l'API Brevo
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(emailData),
    });
    
    console.log("📡 Statut de la réponse Brevo:", response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("❌ Erreur détaillée de Brevo:", JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.error("❌ Impossible de parser la réponse d'erreur de Brevo");
        errorData = { status: response.status, statusText: response.statusText };
      }
      throw new Error(`Erreur Brevo: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    console.log("✅ Email de bienvenue envoyé avec succès:", JSON.stringify(responseData, null, 2));
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: responseData.messageId,
      message: "Email de bienvenue envoyé avec succès"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 Erreur dans la fonction send-welcome-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: "Vérifiez les logs de la fonction pour plus de détails"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
