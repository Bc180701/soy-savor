
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationPayload {
  orderId: string;
  customerEmail: string;
  customerName: string;
  newStatus: string;
  orderItems: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the request payload
    const { orderId, customerEmail, customerName, newStatus, orderItems }: OrderNotificationPayload = await req.json();

    if (!orderId || !customerEmail || !newStatus) {
      throw new Error("Missing required fields");
    }

    console.log(`Sending notification for order ${orderId} with new status: ${newStatus}`);
    
    // Translate status to French for customer-friendly messages
    const statusInFrench = getStatusInFrench(newStatus);
    
    // Generate email subject and content
    const subject = `Mise à jour de votre commande: ${statusInFrench}`;
    
    let content = `<h1>Bonjour ${customerName || 'cher client'},</h1>`;
    content += `<p>Votre commande (Ref: ${orderId.substring(0, 8)}) est maintenant <strong>${statusInFrench}</strong>.</p>`;
    
    if (orderItems && orderItems.length > 0) {
      content += `<h2>Détail de votre commande:</h2><ul>`;
      orderItems.forEach(item => {
        content += `<li>${item}</li>`;
      });
      content += `</ul>`;
    }
    
    // Add specific instructions based on status
    if (newStatus === 'confirmed') {
      content += `<p>Nous avons bien reçu votre commande et nous commençons à la préparer.</p>`;
    } else if (newStatus === 'preparing') {
      content += `<p>Votre commande est actuellement en préparation par notre équipe.</p>`;
    } else if (newStatus === 'ready') {
      content += `<p>Votre commande est prête à être retirée dans notre restaurant.</p>`;
    } else if (newStatus === 'out-for-delivery') {
      content += `<p>Votre commande est en route vers l'adresse indiquée.</p>`;
    } else if (newStatus === 'delivered') {
      content += `<p>Votre commande a été livrée. Bon appétit!</p>`;
    } else if (newStatus === 'completed') {
      content += `<p>Nous espérons que vous avez apprécié votre repas. À bientôt!</p>`;
    }
    
    content += `<p>Merci d'avoir choisi notre restaurant.</p>`;
    content += `<p>L'équipe du restaurant</p>`;

    // For development/testing we'll log the notification details
    console.log(`Email would be sent to: ${customerEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content preview: ${content.substring(0, 100)}...`);

    // Store the notification in Supabase
    const { data, error } = await supabase
      .from('order_notifications')
      .insert({
        order_id: orderId,
        recipient_email: customerEmail,
        subject,
        content,
        status_update: newStatus
      });

    if (error) {
      throw new Error(`Failed to store notification: ${error.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully",
        notificationId: data?.[0]?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in order-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to translate status to French
function getStatusInFrench(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'confirmed': 'Confirmée',
    'preparing': 'En préparation',
    'ready': 'Prête à être récupérée',
    'out-for-delivery': 'En cours de livraison',
    'delivered': 'Livrée',
    'completed': 'Terminée',
    'cancelled': 'Annulée'
  };
  
  return statusMap[status] || status;
}

serve(handler);
