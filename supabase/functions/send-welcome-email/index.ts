
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const PROMOTION_CODE = "BIENVENUE10";

// CORS headers for allowing requests from your frontend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName = "" } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email using Brevo API
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY || "",
      },
      body: JSON.stringify({
        sender: {
          name: "SushiEats",
          email: "no-reply@sushieats.com",
        },
        to: [
          {
            email,
            name: firstName,
          },
        ],
        subject: "Bienvenue chez SushiEats - Votre code de réduction de 10%",
        htmlContent: `
          <html>
            <body>
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #D4AF37;">SushiEats</h1>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                  <h2>Bienvenue chez SushiEats${firstName ? ", " + firstName : ""}!</h2>
                  
                  <p>Nous sommes ravis de vous compter parmi nos nouveaux clients.</p>
                  
                  <p>Comme promis, voici votre code de réduction de <b>10%</b> valable sur votre première commande :</p>
                  
                  <div style="background-color: #D4AF37; color: black; text-align: center; padding: 15px; margin: 20px 0; border-radius: 5px; font-size: 24px; font-weight: bold;">
                    ${PROMOTION_CODE}
                  </div>
                  
                  <p>Pour utiliser ce code :</p>
                  <ol>
                    <li>Connectez-vous à votre compte</li>
                    <li>Ajoutez les articles de votre choix au panier</li>
                    <li>Entrez votre code de réduction lors du paiement</li>
                  </ol>
                  
                  <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
                  
                  <p>Bon appétit!</p>
                  <p>L'équipe SushiEats</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const emailResult = await response.json();
    
    console.log("Email sending result:", emailResult);
    
    if (!response.ok) {
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: emailResult.messageId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
