
// Follow this setup guide to integrate the Deno runtime into your application:
// https://docs.stripe.com/docs/api/get-started

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { corsHeaders } from "../_shared/cors.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

serve(async (req) => {
  console.log("Fonction create-stripe-checkout appelée");
  
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
    if (!STRIPE_SECRET_KEY) {
      console.error("La clé d'API Stripe n'est pas définie");
      return new Response(
        JSON.stringify({ error: "Clé d'API Stripe non configurée" }),
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

    // Initialize Stripe
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    // Format order items for Stripe checkout
    const lineItems = orderData.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
        },
        unit_amount: Math.round(item.menuItem.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery fee if applicable
    if (orderData.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(orderData.deliveryFee * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    // Create checkout session with Stripe API
    console.log("Creating Stripe checkout session:", JSON.stringify({ 
      customer_email: orderData.customerEmail, 
      lineItems: lineItems.length 
    }));
    
    const session = await stripe.checkout.sessions.create({
      customer_email: orderData.customerEmail,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${orderData.returnUrl}/compte?order=${orderData.orderId}&status=success`,
      cancel_url: `${orderData.returnUrl}/panier?status=cancelled`,
      metadata: {
        order_id: orderData.orderId
      },
      shipping_options: orderData.orderType === 'delivery' ? [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // Already included in the line items
              currency: 'eur',
            },
            display_name: 'Livraison à domicile',
          }
        }
      ] : [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'eur',
            },
            display_name: 'Retrait en magasin',
          }
        }
      ],
    });

    console.log("Stripe checkout created successfully:", session.id);
    console.log("Payment URL:", session.url);

    // Return the checkout information
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkoutId: session.id,
        redirectUrl: session.url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error creating Stripe checkout:", error);
    
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
