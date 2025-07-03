import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.43.0?dts";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      orderId, 
      customerEmail, 
      customerName, 
      delayMinutes, 
      delayReason,
      orderType
    } = await req.json() as DelayNotificationRequest;
    
    if (!customerEmail || !orderId) {
      throw new Error("Email du client et ID de commande requis");
    }
    
    // Récupérer la clé API Brevo depuis les variables d'environnement
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      throw new Error("Erreur de configuration: clé API Brevo manquante");
    }
    
    const pickupOrDeliveryText = orderType === 'delivery' ? 'La livraison' : 'Le retrait';
    
    // Préparer le contenu de l'email
    const subject = `Retard pour votre commande #${orderId.substring(0, 6)}`;
    const htmlContent = `
      <html><body>
        <h1>Retard pour votre commande</h1>
        <p>Bonjour ${customerName},</p>
        <p>Nous sommes désolés de vous informer que votre commande <strong>#${orderId.substring(0, 6)}</strong> subira un retard d'environ <strong>${delayMinutes} minutes</strong>.</p>
        <p><strong>Raison du retard:</strong> ${delayReason}</p>
        <p>${pickupOrDeliveryText} de votre commande est désormais prévu(e) avec un délai supplémentaire.</p>
        <p>Nous nous excusons pour ce contretemps et vous remercions de votre compréhension.</p>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
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
          name: "SushiEats",
          email: "notifications@sushieats.fr",
        },
        to: [
          {
            email: customerEmail,
            name: customerName,
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
    console.log("Email de notification de retard envoyé avec succès:", responseData);
    
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
      console.error("Erreur lors de la mise à jour de la commande:", updateError);
    }
    
    return new Response(JSON.stringify({ success: true, messageId: responseData.messageId }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction notify-order-delay:", error);
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
