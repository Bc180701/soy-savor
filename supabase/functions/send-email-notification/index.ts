import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    console.log('📧 Début fonction send-email-notification');
    const { email, name, orderId, status, statusMessage } = await req.json() as NotificationRequest;
    
    console.log('📋 Données reçues:', { email, name, orderId, status });
    
    // Récupérer la clé API Resend depuis les variables d'environnement
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error('❌ Clé API Resend manquante');
      throw new Error("Erreur de configuration: clé API Resend manquante");
    }
    
    console.log('✅ Clé API Resend présente');
    
    const resend = new Resend(resendApiKey);
    
    // Préparer le contenu de l'email
    const subject = `Mise à jour de votre commande #${orderId}`;
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Mise à jour de votre commande</h1>
            <p style="font-size: 16px; color: #555;">Bonjour ${name},</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Nous vous informons que votre commande <strong style="color: #007bff;">#${orderId}</strong> ${statusMessage}.
            </p>
            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>Statut actuel:</strong> <span style="color: #007bff;">${status}</span>
              </p>
            </div>
            <p style="font-size: 16px; color: #555;">Merci de nous faire confiance !</p>
            <p style="font-size: 16px; color: #555; margin-bottom: 0;">
              <strong>L'équipe SushiEats</strong>
            </p>
          </div>
        </body>
      </html>
    `;
    
    console.log('📤 Envoi de l\'email via Resend...');
    
    // Envoyer l'email via Resend
    const emailResponse = await resend.emails.send({
      from: "SushiEats <notifications@sushieats.fr>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });
    
    console.log("✅ Email envoyé avec succès via Resend:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur dans la fonction send-email-notification:", error);
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