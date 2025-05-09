
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.sumup.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUMUP_API_KEY = Deno.env.get("SUMUP_API_KEY") || "";
const SUMUP_API_URL = "https://api.sumup.com/v0.1/checkouts";

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

    // Call SumUp API with proper error handling
    const response = await fetch(SUMUP_API_URL, {
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
        errorMessage = "Erreur d'authentification avec SumUp. Veuillez vérifier votre clé API.";
      } else if (response.status === 400) {
        errorMessage = "Données de commande invalides. Veuillez vérifier les détails.";
      } else if (response.status === 403) {
        errorMessage = "La clé API n'a pas les permissions nécessaires.";
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
