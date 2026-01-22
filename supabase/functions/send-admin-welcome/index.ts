
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminWelcomeEmailRequest {
  email: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 Début de la fonction send-admin-welcome");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Parsing de la requête...");
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("📝 Données reçues:", {
        email: requestData?.email,
        password: requestData?.password ? "********" : undefined // Masked for security
      });
    } catch (error) {
      console.error("❌ Erreur parsing requête:", error);
      throw new Error("Format de requête invalide");
    }
    
    // Validate required fields
    if (!requestData || !requestData.email || !requestData.password) {
      const errorMsg = "Email et mot de passe requis dans la requête";
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }
    
    const { email, password } = requestData as AdminWelcomeEmailRequest;
    
    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("❌ Clé API Resend manquante dans les variables d'environnement");
      throw new Error("Erreur de configuration: clé API Resend manquante");
    }

    console.log("🔑 Clé API Resend trouvée");

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Prepare email content
    const subject = "Bienvenue dans l'équipe d'administration SUSHIEATS";
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">SUSHIEATS</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <h1 style="color: #2c3e50;">Bienvenue dans l'équipe d'administration !</h1>
          <p>Bonjour,</p>
          <p>Vous avez été ajouté(e) en tant qu'administrateur sur la plateforme SUSHIEATS.</p>
          
          <div style="background-color: #f8f4e5; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 5px solid #d4af37;">
            <h2 style="color: #2c3e50; margin-top: 0;">Vos identifiants de connexion</h2>
            <p><strong>Email:</strong> ${email}</p>
            <div style="background-color: white; padding: 10px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Mot de passe temporaire:</strong> <code style="font-size: 16px; color: #e74c3c;">${password}</code></p>
            </div>
            <p style="color: #e67e22;"><strong>⚠️ Important:</strong> Nous vous recommandons fortement de changer votre mot de passe après votre première connexion.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sushieats.fr/login" style="display: inline-block; background-color: #d4af37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Se connecter à l'administration</a>
          </div>
          
          <p>En cas de question, n'hésitez pas à contacter l'administrateur principal.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p><strong>SUSHIEATS</strong> - L'art du sushi à Châteaurenard</p>
            <p>Cet email contient des informations confidentielles.</p>
          </div>
        </body>
      </html>
    `;
    
    console.log("🌐 Envoi via API Resend...");
    console.log("📧 Destinataire:", email);
    
    // Send email via Resend API
    try {
      const emailResponse = await resend.emails.send({
        from: "SUSHIEATS Admin <admin@emailsend.clwebdesign.fr>",
        to: [email],
        subject: subject,
        html: htmlContent,
      });
      
      console.log("✅ Email admin envoyé avec succès:", emailResponse);
      
      return new Response(JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        message: "Email d'accueil admin envoyé avec succès" 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError: any) {
      console.error("💥 Erreur envoi email:", emailError);
      throw new Error(`Erreur d'envoi d'email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error("💥 Erreur dans send-admin-welcome:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur interne du serveur",
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
