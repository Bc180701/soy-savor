
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, promoCode } = await req.json() as WelcomeEmailRequest;
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }
    
    // Formater le nom si disponible, sinon utiliser l'email
    const userName = name || email.split('@')[0];
    
    // Préparer le contenu de l'email
    const subject = "Bienvenue chez SushiEats - Votre code promo de 10%";
    const htmlContent = `
      <html><body>
        <h1>Bienvenue chez SushiEats !</h1>
        <p>Bonjour ${userName},</p>
        <p>Nous sommes ravis de vous accueillir sur SushiEats, votre nouvelle destination pour des sushis délicieux et authentiques.</p>
        
        <div style="background-color: #f8f4e5; padding: 15px; margin: 20px 0; border-left: 5px solid #d4af37; text-align: center;">
          <h2>🎁 Votre code promo de bienvenue</h2>
          <p style="font-size: 24px; font-weight: bold; color: #d4af37;">${promoCode}</p>
          <p>Profitez de <strong>10% de réduction</strong> sur votre première commande !</p>
        </div>
        
        <p>Pour en profiter, il vous suffit d'utiliser ce code lors de votre prochaine commande.</p>
        <p>N'hésitez pas à explorer notre menu varié et à découvrir nos spécialités.</p>
        <p>Bon appétit !</p>
        <p>L'équipe SushiEats</p>
      </body></html>
    `;
    
    // Envoyer l'email via l'API Brevo
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
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
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur d'envoi d'email via Brevo:", errorData);
      throw new Error(`Erreur Brevo: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    console.log("Email de bienvenue envoyé avec succès via Brevo:", responseData);
    
    return new Response(JSON.stringify({ success: true, messageId: responseData.messageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction send-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
