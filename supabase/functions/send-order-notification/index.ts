
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  orderId: string;
  status: string;
}

serve(async (req) => {
  console.log("🔄 Début de la fonction send-order-notification");
  
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Parsing de la requête...");
    const { email, name, orderId, status } = await req.json() as NotificationRequest;
    
    console.log("📝 Données reçues:", { email, name, orderId, status });
    
    // Validation des données requises
    if (!email || !name || !orderId || !status) {
      console.error("❌ Données manquantes:", { email: !!email, name: !!name, orderId: !!orderId, status: !!status });
      throw new Error("Tous les champs sont requis: email, name, orderId, status");
    }
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("❌ Clé API Resend manquante dans les variables d'environnement");
      throw new Error("Configuration manquante: clé API Resend");
    }
    
    console.log("🔑 Clé API Resend trouvée");
    
    // Messages selon le statut
    const statusMessages: Record<string, string> = {
      'confirmée': 'a été confirmée et est en cours de préparation',
      'en_preparation': 'est actuellement en préparation dans nos cuisines',
      'prête': 'est prête ! Vous pouvez venir la récupérer',
      'en_livraison': 'est en cours de livraison et arrivera bientôt chez vous',
      'livrée': 'a été livrée avec succès',
      'récupérée': 'a été récupérée avec succès'
    };
    
    const statusMessage = statusMessages[status] || 'a été mise à jour';
    const subject = `🍣 Mise à jour de votre commande #${orderId.substring(0, 8)}`;
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">🍣 SushiEats</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Mise à jour de votre commande</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Nous vous informons que votre commande <strong>#${orderId.substring(0, 8)}</strong> ${statusMessage}.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #4ecdc4;">
              <p style="margin: 0;"><strong>Statut actuel :</strong> <span style="color: #27ae60; font-weight: bold; text-transform: capitalize;">${status.replace('_', ' ')}</span></p>
            </div>
          </div>
          
          <p>Merci de nous faire confiance pour vos repas japonais !</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p><strong>SushiEats</strong> - L'art du sushi à Châteaurenard</p>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          </div>
        </body>
      </html>
    `;
    
    console.log("🌐 Envoi via API Resend...");
    console.log("📧 Destinataire:", email);
    
    const emailResponse = await resend.emails.send({
      from: "SushiEats <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });
    
    console.log("📡 Réponse Resend:", emailResponse);
    
    if (emailResponse.error) {
      console.error("❌ Erreur Resend:", emailResponse.error);
      throw new Error(`Erreur Resend: ${emailResponse.error.message}`);
    }
    
    console.log("✅ Email de notification envoyé avec succès:", emailResponse.data?.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Notification envoyée avec succès"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("💥 Erreur dans send-order-notification:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      details: "Vérifiez les logs de la fonction pour plus de détails"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
});
