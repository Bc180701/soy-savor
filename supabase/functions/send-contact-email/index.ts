
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("📧 Contact email handler démarré");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactEmailRequest = await req.json();
    console.log("📨 Nouveau message de contact de:", name, email);
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log("🔑 Clé API Resend:", resendApiKey ? "PRÉSENTE" : "MANQUANTE");
    
    if (!resendApiKey) {
      throw new Error("Clé API Resend manquante dans les variables d'environnement");
    }
    
    console.log("🌐 Envoi via API Resend...");
    
    const emailResponse = await resend.emails.send({
      from: "SushiEats <contact@clwebdesign.fr>",
      to: ["contact@clwebdesign.fr"],
      subject: `🍣 Nouveau message de contact: ${subject}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2c3e50; text-align: center;">🍣 Nouveau message de contact - SushiEats</h2>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;">Informations du contact</h3>
                <p><strong>👤 Nom:</strong> ${name}</p>
                <p><strong>📧 Email:</strong> ${email}</p>
                <p><strong>📋 Sujet:</strong> ${subject}</p>
                <p><strong>📅 Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
              </div>
              
              <div style="background-color: #fff; padding: 20px; border-left: 4px solid #3498db; margin: 20px 0;">
                <h3 style="color: #2c3e50; margin-top: 0;">Message</h3>
                <p style="font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              
              <p style="font-size: 14px; color: #666; text-align: center;">
                Cet email a été envoyé automatiquement depuis le formulaire de contact de SushiEats.<br>
                Vous pouvez répondre directement à ${email}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("📧 Email de contact envoyé avec succès:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Message envoyé avec succès !",
      method: "API Resend",
      messageId: emailResponse.data?.id,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 Erreur dans send-contact-email:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        method: "API Resend",
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
