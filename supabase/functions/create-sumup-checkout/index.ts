
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.sumup.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// SumUp API credentials 
const SUMUP_API_URL = "https://api.sumup.com/v0.1/checkouts";
const SUMUP_API_KEY = "sup_sk_OzuCOouSMUuIIMs4hvmypnRUzWp6WWq";  // Updated with correct prefix format

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
    console.log("Utilisation de l'API key SumUp avec format correct:");
    console.log("API Key format: sup_sk_XXXX (secrets masqués)");
    
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
    
    // Using API key authentication following SumUp documentation
    console.log("Making API call to SumUp with correct Bearer token format...");
    
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
    console.log("SumUp API response headers:", JSON.stringify([...response.headers.entries()]));
    
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
          details: responseText,
          displayMessage: "Erreur lors du traitement de la réponse de SumUp. Veuillez réessayer." 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!response.ok) {
      console.error("SumUp API error status:", response.status);
      console.error("SumUp API error response:", data);
      
      let errorMessage = "Erreur lors de la création du paiement SumUp";
      let displayMessage = "Erreur de communication avec le service de paiement.";
      
      // Handle specific error cases
      if (response.status === 401) {
        errorMessage = "Erreur d'authentification avec SumUp";
        displayMessage = "Problème d'authentification avec le service de paiement. Veuillez contacter le support.";
      } else if (response.status === 400) {
        errorMessage = "Données de commande invalides";
        displayMessage = "Données de commande incorrectes. Veuillez vérifier vos informations.";
      } else if (data && data.error_message) {
        errorMessage = data.error_message;
        displayMessage = "Erreur SumUp: " + data.error_message;
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
          details: data,
          displayMessage: "La réponse du service de paiement est incomplète. Veuillez réessayer."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("SumUp checkout created successfully:", data);
    console.log("Payment link:", data.payment_link);

    // Return the checkout information with success flag
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
