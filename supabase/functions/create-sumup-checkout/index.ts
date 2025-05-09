
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
    console.log("Longueur de la clé API SumUp:", SUMUP_API_KEY.length);
    
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
    // Documentation reference: https://developer.sumup.com/docs/api/create-checkout/
    const checkoutRequest = {
      checkout_reference: orderData.orderId,
      amount: orderData.total,
      currency: "EUR",
      description: `SushiEats Commande #${orderData.orderId.slice(0, 8)}`,
      merchant_code: "XXXX", // This should be configured in the environment variables or otherwise obtained
      pay_to_email: "clweb@hotmail.com", // Using the provided SumUp account email
      return_url: `${orderData.returnUrl}/compte?order=${orderData.orderId}`,
      customer_email: orderData.customerEmail,
      items: items
    };

    console.log("Sending checkout request to SumUp:", JSON.stringify(checkoutRequest));

    // Use the correct API endpoint and authentication method based on SumUp documentation
    const response = await fetch("https://api.sumup.com/v0.1/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUMUP_API_KEY}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(checkoutRequest)
    });

    // Log the full response for debugging
    console.log("SumUp API response status:", response.status, response.statusText);
    console.log("SumUp API response headers:", JSON.stringify([...response.headers]));
    
    const data = await response.json();
    console.log("SumUp API response body:", JSON.stringify(data));
    
    if (!response.ok) {
      console.error("SumUp API error:", data);
      
      let errorMessage = "Failed to create SumUp checkout";
      if (response.status === 401) {
        errorMessage = "SumUp API authentication failed. Please verify your API key is valid and has the correct permissions.";
      } else if (response.status === 400) {
        errorMessage = "Invalid request data. Please verify your checkout details.";
      } else if (response.status === 403) {
        errorMessage = "API key doesn't have permission to create checkouts.";
      }
      
      // Return detailed error information to help with debugging
      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: data,
          request: {
            ...checkoutRequest,
            // Remove sensitive information
            pay_to_email: "[REDACTED]",
            customer_email: "[REDACTED]"
          }
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SumUp checkout created successfully:", data);

    // According to SumUp documentation, return the checkout ID and payment link
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutId: data.id,
        checkoutReference: data.checkout_reference,
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
