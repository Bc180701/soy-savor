
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.sumup.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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
    console.log("Client ID:", SUMUP_CLIENT_ID.substring(0, 5) + "...");
    console.log("Client Secret: [HIDDEN]");
    
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
    
    // Prepare Basic Auth credentials for OAuth2
    const credentials = btoa(`${SUMUP_CLIENT_ID}:${SUMUP_CLIENT_SECRET}`);
    
    // Call SumUp API using OAuth2 Basic auth with client id and secret
    console.log("Making API call to SumUp with Basic Auth...");
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
    
    // Parse response body
    let responseText = await response.text();
    console.log("SumUp API raw response body:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("SumUp API parsed response:", JSON.stringify(data));
    } catch (parseError) {
      console.error("Failed to parse SumUp API response:", parseError);
      
      return new Response(
        JSON.stringify({ 
          error: "Format de réponse invalide de SumUp", 
          details: responseText 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!response.ok) {
      console.error("SumUp API error status:", response.status);
      console.error("SumUp API error response:", data);
      
      let errorMessage = "Erreur lors de la création du paiement SumUp";
      let displayMessage = "Erreur de communication avec le service de paiement.";
      
      if (response.status === 401) {
        errorMessage = "Erreur d'authentification avec SumUp";
        displayMessage = "Problème d'authentification avec le service de paiement. Veuillez contacter le support.";
      } else if (response.status === 400) {
        errorMessage = "Données de commande invalides";
        displayMessage = "Données de commande incorrectes. Veuillez vérifier vos informations.";
      } else if (data && data.message) {
        errorMessage = data.message;
        displayMessage = "Erreur SumUp: " + data.message;
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          displayMessage: displayMessage,
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
        error: "Erreur lors du traitement de la demande", 
        displayMessage: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
