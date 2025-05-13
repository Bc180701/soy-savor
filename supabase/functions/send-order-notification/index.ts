
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  email: string;
  name: string;
  orderId: string;
  status: string;
  statusMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, orderId, status, statusMessage } = await req.json() as NotificationRequest;
    
    // Initialize Supabase client with admin privileges
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Erreur de configuration: variables d'environnement manquantes");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Envoyer l'email via Supabase Postgres
    const { error } = await supabase.rpc('send_order_status_email', {
      p_email: email,
      p_name: name,
      p_order_id: orderId,
      p_status: status,
      p_status_message: statusMessage
    });
    
    if (error) {
      console.error("Erreur lors de l'envoi de l'email via Postgres:", error);
      throw error;
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erreur dans la fonction send-order-notification:", error);
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
