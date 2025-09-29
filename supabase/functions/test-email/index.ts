import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔧 Test Resend API démarré");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: TestEmailRequest = await req.json();
    console.log("📧 Email de test pour:", email);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("🔑 Clé API Resend:", resendApiKey ? "PRÉSENTE" : "MANQUANTE");
    
    if (!resendApiKey) {
      throw new Error("Clé API Resend manquante dans les variables d'environnement");
    }
    
    console.log("🌐 Envoi via API Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "SushiEats <onboarding@resend.dev>",
      to: [email],
      subject: "🍣 Test Resend API - SushiEats",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2c3e50; text-align: center;">🍣 Test Resend API réussi !</h2>
              <p style="font-size: 16px; line-height: 1.6;">Félicitations ! Cet email de test a été envoyé avec succès via l'API Resend depuis votre système SushiEats.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>📅 Timestamp:</strong> ${new Date().toISOString()}</p>
                <p><strong>🌐 Méthode:</strong> API Resend</p>
                <p><strong>🔧 Service:</strong> Resend Email Service</p>
                <p><strong>👤 Expéditeur:</strong> onboarding@resend.dev</p>
                <p><strong>📧 Destinataire:</strong> ${email}</p>
              </div>
              
              <p style="color: #27ae60; font-weight: bold; text-align: center;">
                ✅ Si vous recevez cet email, la configuration Resend fonctionne parfaitement !
              </p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Cet email a été envoyé automatiquement par votre système de test SushiEats via l'API Resend.<br>
                Ne pas répondre à cet email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("📧 Email envoyé avec succès via Resend:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email de test envoyé avec succès via Resend !",
      method: "API Resend",
      messageId: emailResponse.data?.id,
      debugInfo: {
        hasApiKey: !!resendApiKey,
        timestamp: new Date().toISOString(),
        senderEmail: "onboarding@resend.dev",
        service: "Resend",
        messageId: emailResponse.data?.id
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 Erreur dans test-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        method: "API Resend",
        stack: error.stack,
        debugInfo: {
          timestamp: new Date().toISOString(),
          hasApiKey: !!Deno.env.get("RESEND_API_KEY"),
          service: "Resend",
          senderEmail: "onboarding@resend.dev"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);