
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.sumup.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY") || "";
const SUMUP_API_URL = "https://api.sumup.com/v0.1/checkouts";
const SUMUP_CLIENT_ID = "cc_classic_UelwBCnPHLGxjz8w5l4YyCriGYy9P";
const SUMUP_CLIENT_SECRET = "cc_sk_classic_kNIDUAjlYVYmMRsd72FN1jgp0jsdZCi4mvAudnsLcTN8DR6thy";

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
    console.log("Utilisation des identifiants OAuth2:");
    console.log("Client ID disponible:", !!SUMUP_CLIENT_ID);
    console.log("Client Secret disponible:", !!SUMUP_CLIENT_SECRET);
    
    if (!SUMUP_CLIENT_ID || !SUMUP_CLIENT_SECRET) {
      console.error("Les identifiants OAuth2 SumUp ne sont pas définis");
      return new Response(
        JSON.stringify({ error: "Identifiants OAuth2 SumUp non configurés" }),
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

    // Create checkout session with SumUp API using OAuth2 credentials
    // SumUp API Documentation: https://developer.sumup.com/docs/api/create-checkout/
    const checkoutRequest = {
      checkout_reference: orderData.orderId,
      amount: parseFloat(orderData.total.toFixed(2)), // Ensure amount is properly formatted
      currency: "EUR",
      description: `SushiEats Commande #${orderData.orderId.slice(0, 8)}`,
      pay_to_email: "clweb@hotmail.com",
      return_url: `${orderData.returnUrl}/compte?order=${orderData.orderId}`,
      customer_email: orderData.customerEmail,
      items: items
    };

    console.log("Sending checkout request to SumUp:", JSON.stringify(checkoutRequest));
    console.log("Using SumUp API URL:", SUMUP_API_URL);

    // Call SumUp API using OAuth2 Basic auth with client id and secret
    const credentials = btoa(`${SUMUP_CLIENT_ID}:${SUMUP_CLIENT_SECRET}`);
    const response = await fetch(SUMUP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
        "Accept": "application/json"
      },
      body: JSON.stringify(checkoutRequest)
    });

    // Log the full response for debugging
    console.log("SumUp API response status:", response.status, response.statusText);
    console.log("SumUp API response headers:", JSON.stringify([...response.headers]));
    
    // Parse response body
    let data;
    const responseText = await response.text();
    console.log("SumUp API raw response body:", responseText);
    
    try {
      data = JSON.parse(responseText);
      console.log("SumUp API parsed response body:", JSON.stringify(data));
    } catch (parseError) {
      console.error("Failed to parse SumUp API response:", parseError);
      data = { error: "Invalid response format" };
    }
    
    if (!response.ok) {
      console.error("SumUp API error status:", response.status);
      console.error("SumUp API error response:", data);
      
      let errorMessage = "Failed to create SumUp checkout";
      
      if (response.status === 401) {
        errorMessage = "Erreur d'authentification avec SumUp. Veuillez vérifier vos identifiants OAuth2.";
      } else if (response.status === 400) {
        errorMessage = "Données de commande invalides. Veuillez vérifier les détails.";
      } else if (response.status === 403) {
        errorMessage = "Les identifiants OAuth2 n'ont pas les permissions nécessaires.";
      } else {
        errorMessage = "Erreur inattendue lors de la communication avec SumUp.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage, 
          details: data,
          statusCode: response.status
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || !data.id || !data.payment_link) {
      console.error("SumUp checkout response is missing required fields:", data);
      return new Response(
        JSON.stringify({ 
          error: "La réponse de SumUp est invalide ou incomplète", 
          details: data 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SumUp checkout created successfully:", data);

    // Return the checkout information
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutId: data.id,
        checkoutReference: data.checkout_reference || orderData.orderId,
        redirectUrl: data.payment_link
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating SumUp checkout:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Erreur interne du serveur", 
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
