
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
    const { email, password } = await req.json() as AdminWelcomeEmailRequest;
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }

    // Préparer le contenu de l'email
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
    
    // Envoyer l'email via l'API Brevo
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
      const errorData = await response.json();
      console.error("Erreur d'envoi d'email via Brevo:", errorData);
      throw new Error(`Erreur Brevo: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    console.log("Email d'accueil admin envoyé avec succès via Brevo:", responseData);
    
    return new Response(JSON.stringify({ success: true, messageId: responseData.messageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction send-admin-welcome:", error);
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
