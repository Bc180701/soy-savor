import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Fonction debug-brevo démarrée");
    
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    console.log("🔑 Clé BREVO_API_KEY:", brevoApiKey ? `présente (${brevoApiKey.substring(0, 10)}...)` : "ABSENTE ❌");
    
    // Test de connexion à l'API Brevo
    if (brevoApiKey) {
      console.log("🌐 Test de connexion à Brevo...");
      const testResponse = await fetch("https://api.brevo.com/v3/account", {
        headers: {
          "api-key": brevoApiKey,
        },
      });
      
      console.log("📡 Status test Brevo:", testResponse.status);
      
      if (testResponse.ok) {
        const accountInfo = await testResponse.json();
        console.log("✅ Connexion Brevo OK:", accountInfo.firstName || "Account connecté");
      } else {
        const errorData = await testResponse.json();
        console.error("❌ Erreur connexion Brevo:", errorData);
      }
    }

    return new Response(JSON.stringify({ 
      brevo_key_present: !!brevoApiKey,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("💥 Erreur debug:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});