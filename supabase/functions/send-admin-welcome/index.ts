
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send admin welcome function called");
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data received:", JSON.stringify({
        email: requestData?.email,
        password: requestData?.password ? "********" : undefined // Masked for security
      }));
    } catch (error) {
      console.error("Error parsing request body:", error);
      throw new Error("Format de requête invalide");
    }
    
    // Validate required fields
    if (!requestData || !requestData.email || !requestData.password) {
      const errorMsg = "Email et mot de passe requis dans la requête";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    const { email, password } = requestData as AdminWelcomeEmailRequest;
    
    // Get Brevo API key from environment variables
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not found in environment variables");
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }

    // Prepare email content
    const subject = "Bienvenue dans l'équipe d'administration SushiEats";
    const htmlContent = `
      <html><body>
        <h1>Bienvenue dans l'équipe d'administration de SushiEats!</h1>
        <p>Bonjour,</p>
        <p>Vous avez été ajouté(e) en tant qu'administrateur sur la plateforme SushiEats.</p>
        
        <div style="background-color: #f8f4e5; padding: 15px; margin: 20px 0; border-left: 5px solid #d4af37;">
          <h2>Vos identifiants de connexion</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mot de passe temporaire:</strong> ${password}</p>
          <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
        </div>
        
        <p>Pour vous connecter à l'interface d'administration, rendez-vous sur <a href="https://sushieats.fr/login">sushieats.fr/login</a>.</p>
        
        <p>En cas de question, n'hésitez pas à contacter l'administrateur principal.</p>
        <p>Cordialement,</p>
        <p>L'équipe SushiEats</p>
      </body></html>
    `;
    
    // Send email via Brevo API
    console.log("Sending email via Brevo API");
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: {
            name: "SushiEats Admin",
            email: "admin@sushieats.fr",
          },
          to: [
            {
              email: email,
            },
          ],
          subject: subject,
          htmlContent: htmlContent,
        }),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { status: response.status, statusText: response.statusText };
        }
        console.error("Brevo API error:", errorData);
        throw new Error(`Erreur d'envoi d'email: ${response.status} ${response.statusText}`);
      }
      
      const responseBody = await response.json();
      console.log("Brevo API response:", JSON.stringify(responseBody));
      console.log("Admin welcome email sent successfully to:", email);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email d'accueil admin envoyé avec succès" 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (emailError: any) {
      console.error("Error sending email:", emailError);
      throw new Error(`Erreur d'envoi d'email: ${emailError.message}`);
    }
  } catch (error: any) {
    console.error("Error in send-admin-welcome function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erreur interne du serveur",
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
