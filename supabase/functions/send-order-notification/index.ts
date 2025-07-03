
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  orderId: string;
  status: string;
  statusMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, orderId, status, statusMessage } = await req.json() as NotificationRequest;
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }
    
    // Préparer le contenu de l'email
    const subject = `Mise à jour de votre commande #${orderId}`;
    const htmlContent = `
      <html><body>
        <h1>Mise à jour de votre commande</h1>
        <p>Bonjour ${name},</p>
        <p>Nous vous informons que votre commande <strong>#${orderId}</strong> ${statusMessage}.</p>
        <p>Statut actuel: <strong>${status}</strong></p>
        <p>Merci de nous faire confiance !</p>
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
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur d'envoi d'email via Brevo:", errorData);
      throw new Error(`Erreur Brevo: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    console.log("Email envoyé avec succès via Brevo:", responseData);
    
    return new Response(JSON.stringify({ success: true, messageId: responseData.messageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction send-order-notification:", error);
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
