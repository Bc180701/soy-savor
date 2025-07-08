
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { Resend } from "npm:resend@2.0.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Début fonction send-order-notification');
    const bodyText = await req.text();
    console.log('📋 Body reçu:', bodyText);
    
    const { email, name, orderId, status, statusMessage } = JSON.parse(bodyText) as NotificationRequest;
    
    console.log('📋 Données parsées:', { email, name, orderId, status });
    
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
    
    // Envoyer l'email via Resend
    console.log('🌐 Tentative d\'envoi via Resend...');
    const emailResponse = await resend.emails.send({
      from: "SushiEats <contact@clwebdesign.fr>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });
    
    console.log("✅ Email envoyé avec succès via Resend:", emailResponse);
    
    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
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
