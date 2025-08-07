
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DelayNotificationRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  delayMinutes: number;
  delayReason: string;
  orderType: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🔄 Début de la fonction notify-order-delay");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Requête OPTIONS traitée");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📧 Parsing de la requête...");
    const { 
      orderId, 
      customerEmail, 
      customerName, 
      delayMinutes, 
      delayReason,
      orderType
    } = await req.json() as DelayNotificationRequest;
    
    console.log("📝 Données reçues:", { 
      orderId, 
      customerEmail, 
      customerName, 
      delayMinutes, 
      delayReason,
      orderType
    });
    
    if (!customerEmail || !orderId) {
      console.error("❌ Données manquantes:", { customerEmail: !!customerEmail, orderId: !!orderId });
      throw new Error("Email du client et ID de commande requis");
    }
    
    // Récupérer la clé API Resend depuis les variables d'environnement
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("❌ Clé API Resend manquante dans les variables d'environnement");
      throw new Error("Erreur de configuration: clé API Resend manquante");
    }
    
    console.log("🔑 Clé API Resend trouvée");
    
    const pickupOrDeliveryText = orderType === 'delivery' ? 'La livraison' : 'Le retrait';
    
    // Préparer le contenu de l'email
    const subject = `⏰ Retard pour votre commande #${orderId.substring(0, 8)}`;
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin-bottom: 10px;">🍣 SushiEats</h1>
            <div style="height: 3px; background: linear-gradient(90deg, #ff6b6b, #4ecdc4); margin: 0 auto; width: 100px;"></div>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ffc107;">
            <h2 style="color: #856404; margin-top: 0;">⏰ Retard pour votre commande</h2>
            <p>Bonjour <strong>${customerName}</strong>,</p>
            <p>Nous sommes désolés de vous informer que votre commande <strong>#${orderId.substring(0, 8)}</strong> subira un retard d'environ <strong>${delayMinutes} minutes</strong>.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Raison du retard:</strong> ${delayReason}</p>
            </div>
            
            <p>${pickupOrDeliveryText} de votre commande est désormais prévu(e) avec un délai supplémentaire.</p>
          </div>
          
          <p>Nous nous excusons pour ce contretemps et vous remercions de votre compréhension.</p>
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p><strong>SushiEats</strong> - L'art du sushi à Châteaurenard</p>
            <p>Merci pour votre patience et votre fidélité.</p>
          </div>
        </body>
      </html>
    `;
    
    console.log("🌐 Envoi via API Resend...");
    console.log("📧 Destinataire:", customerEmail);
    
    const emailResponse = await resend.emails.send({
      from: Deno.env.get("EMAIL_FROM") || "SushiEats <noreply@votre-domaine.com>",
      to: [customerEmail],
      subject: subject,
      html: htmlContent,
    });
    
    console.log("📡 Réponse Resend:", emailResponse);
    
    if (emailResponse.error) {
      console.error("❌ Erreur Resend:", emailResponse.error);
      throw new Error(`Erreur Resend: ${emailResponse.error.error || emailResponse.error.message || 'Erreur inconnue'}`);
    }
    
    console.log("✅ Email de notification de retard envoyé avec succès:", emailResponse.data?.id);
    
    // Mettre à jour l'historique de la commande dans la base de données
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://tdykegnmomyyucbhslok.supabase.co";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeWtlZ25tb215eXVjYmhzbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NjA2NjUsImV4cCI6MjA1ODMzNjY2NX0.88jbkZIkFiFXudHvqe0l2DhqQGh2V9JIThv9FFFagas";
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ajouter une note à la commande pour indiquer le retard
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        customer_notes: `${delayReason} (Retard de ${delayMinutes} min signalé)${customerName ? ` - ${customerName}` : ''}`
      })
      .eq('id', orderId);
    
    if (updateError) {
      console.error("❌ Erreur lors de la mise à jour de la commande:", updateError);
    } else {
      console.log("✅ Commande mise à jour avec la note de retard");
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Notification de retard envoyée avec succès"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("💥 Erreur dans notify-order-delay:", error);
    console.error("💥 Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
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
