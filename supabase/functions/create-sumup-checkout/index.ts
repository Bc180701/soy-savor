
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.sumup.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY") || "";

serve(async (req) => {
  console.log("Fonction create-sumup-checkout appelée");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Verify req method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    console.log("Clé API SumUp disponible:", !!SUMUP_API_KEY);
    
    if (!SUMUP_API_KEY) {
      console.error("La clé API SumUp n'est pas définie");
      return new Response(
        JSON.stringify({ error: "Clé API SumUp non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { orderData } = await req.json();
    
    if (!orderData || !orderData.total || !orderData.orderId || !orderData.customerEmail) {
      console.error("Données de commande manquantes:", orderData);
      return new Response(
        JSON.stringify({ error: "Missing required order data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format order items for SumUp checkout
    const items = orderData.items.map(item => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.menuItem.price,
    }));

    // Create checkout session with SumUp API
    const checkoutRequest = {
      checkout_reference: orderData.orderId,
      amount: orderData.total,
      currency: "EUR",
      description: `SushiEats Commande #${orderData.orderId.slice(0, 8)}`,
      pay_to_email: "contact@sushieats.fr", // Remplacez par votre email SumUp
      return_url: `${orderData.returnUrl}/compte?order=${orderData.orderId}`,
      customer_email: orderData.customerEmail,
      items: items
    };

    console.log("Sending checkout request to SumUp:", JSON.stringify(checkoutRequest));

    // Utiliser l'authentification avec Bearer token pour l'API SumUp
    const response = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUMUP_API_KEY}` // Assurez-vous que c'est le bon format d'authentification
      },
      body: JSON.stringify(checkoutRequest)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("SumUp API error:", data);
      console.error("SumUp API status:", response.status, response.statusText);
      
      return new Response(
        JSON.stringify({ error: "Failed to create SumUp checkout", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SumUp checkout created successfully:", data);

    // Return the checkout URL to redirect the user
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutId: data.id,
        checkoutUrl: data.checkout_reference,
        redirectUrl: data.payment_link
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating SumUp checkout:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
