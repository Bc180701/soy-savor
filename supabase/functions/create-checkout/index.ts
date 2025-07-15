
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';
import Stripe from 'https://cdn.skypack.dev/stripe@14.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [DEBUG] Début create-checkout - Method:', req.method);
    
    // Parse request body avec gestion d'erreur détaillée
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('🚀 [DEBUG] Body reçu (longueur):', bodyText.length);
      requestBody = JSON.parse(bodyText);
      console.log('🚀 [DEBUG] Body parsé avec succès');
    } catch (error) {
      console.error('❌ [ERROR] Erreur parsing JSON:', error.message);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('🚀 [DEBUG] Validation des champs requis...');
    
    const { 
      items, 
      subtotal, 
      tax, 
      deliveryFee, 
      tip = 0, 
      discount = 0, 
      promoCode,
      total, 
      orderType, 
      clientName, 
      clientEmail, 
      clientPhone,
      deliveryStreet,
      deliveryCity,
      deliveryPostalCode,
      customerNotes,
      scheduledFor,
      restaurantId,
      successUrl,
      cancelUrl
    } = requestBody;

    console.log('🚀 [DEBUG] Données extraites:', { 
      itemsCount: items?.length || 0, 
      subtotal, 
      total, 
      restaurantId,
      clientEmail,
      orderType
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ [ERROR] Panier vide ou invalide');
      return new Response(JSON.stringify({ 
        error: 'Panier vide ou invalide',
        details: 'Le panier doit contenir au moins un article'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!clientEmail || !clientName || !orderType) {
      console.error('❌ [ERROR] Données client manquantes:', { clientEmail, clientName, orderType });
      return new Response(JSON.stringify({ 
        error: 'Informations client manquantes',
        details: 'Email, nom et type de commande sont obligatoires'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Utiliser le restaurant fourni ou le restaurant par défaut (Châteaurenard)
    const targetRestaurantId = restaurantId || "11111111-1111-1111-1111-111111111111";
    console.log('🏪 [DEBUG] Restaurant cible:', targetRestaurantId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ [ERROR] Configuration Supabase manquante');
      return new Response(JSON.stringify({ 
        error: 'Configuration serveur manquante',
        details: 'Variables d\'environnement Supabase non configurées'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('🚀 [DEBUG] Client Supabase initialisé');

    // Récupérer la clé Stripe spécifique au restaurant
    console.log('🔑 [DEBUG] Récupération clé Stripe pour restaurant:', targetRestaurantId);
    let restaurantData;
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', targetRestaurantId)
        .single();

      if (restaurantError) {
        console.error('❌ [ERROR] Erreur récupération restaurant:', restaurantError);
        return new Response(JSON.stringify({ 
          error: 'Restaurant non trouvé',
          details: restaurantError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      
      restaurantData = restaurant;
      console.log('🏪 [DEBUG] Restaurant récupéré:', restaurantData ? 'Oui' : 'Non');
    } catch (error) {
      console.error('❌ [ERROR] Exception lors récupération restaurant:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur lors de la récupération du restaurant',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Utiliser la clé spécifique au restaurant ou la clé par défaut
    let stripeSecretKey = restaurantData?.settings?.stripe_secret_key;
    
    if (!stripeSecretKey) {
      console.log('⚠️ [DEBUG] Pas de clé spécifique, utilisation clé par défaut');
      stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    } else {
      console.log('✅ [DEBUG] Clé spécifique au restaurant trouvée');
    }
    
    if (!stripeSecretKey) {
      console.error('❌ [ERROR] Aucune clé Stripe disponible');
      return new Response(JSON.stringify({ 
        error: 'Configuration Stripe manquante',
        details: 'Aucune clé Stripe configurée pour ce restaurant'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Valider le format de la clé
    if (!stripeSecretKey.startsWith('sk_live_') && !stripeSecretKey.startsWith('sk_test_')) {
      console.error('❌ [ERROR] Format de clé invalide:', stripeSecretKey.substring(0, 10) + '...');
      return new Response(JSON.stringify({ 
        error: 'Clé Stripe invalide',
        details: 'Format de clé incorrect'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('🔧 [DEBUG] Initialisation Stripe...');
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      console.log('✅ [DEBUG] Stripe initialisé avec succès');
    } catch (error) {
      console.error('❌ [ERROR] Erreur initialisation Stripe:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur configuration Stripe',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Créer les line items pour Stripe
    const lineItems = [];
    
    try {
      console.log('📦 [DEBUG] Création des line items...');
      
      for (const item of items) {
        if (!item.menuItem || !item.menuItem.name || typeof item.menuItem.price !== 'number' || !item.quantity) {
          console.error('❌ [ERROR] Item invalide:', item);
          continue;
        }

        const lineItem = {
          price_data: {
            currency: 'eur',
            product_data: {
              name: item.menuItem.name,
              description: item.menuItem.description || '',
            },
            unit_amount: Math.round(item.menuItem.price * 100),
          },
          quantity: item.quantity,
        };
        
        lineItems.push(lineItem);
        console.log('📦 [DEBUG] Line item ajouté:', item.menuItem.name, '-', item.menuItem.price, '€');
      }

      // Ajouter les frais de livraison si applicable
      if (deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Frais de livraison',
            },
            unit_amount: Math.round(deliveryFee * 100),
          },
          quantity: 1,
        });
        console.log('📦 [DEBUG] Frais de livraison ajoutés:', deliveryFee, '€');
      }

      // Ajouter le pourboire si applicable
      if (tip > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Pourboire',
            },
            unit_amount: Math.round(tip * 100),
          },
          quantity: 1,
        });
        console.log('📦 [DEBUG] Pourboire ajouté:', tip, '€');
      }

      console.log('📦 [DEBUG] Total line items créés:', lineItems.length);

      if (lineItems.length === 0) {
        console.error('❌ [ERROR] Aucun line item valide');
        return new Response(JSON.stringify({ 
          error: 'Panier invalide',
          details: 'Aucun article valide dans le panier'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

    } catch (error) {
      console.error('❌ [ERROR] Erreur création line items:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur traitement panier',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Créer la session Stripe
    console.log('💳 [DEBUG] Création session Stripe...');
    let session;
    try {
      const sessionData = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl ? `${successUrl}?session_id={CHECKOUT_SESSION_ID}` : `${req.headers.get('origin')}/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/panier`,
        customer_email: clientEmail,
        metadata: {
          restaurant_id: targetRestaurantId,
          order_type: orderType,
          client_name: clientName,
          client_phone: clientPhone || '',
          client_email: clientEmail,
          delivery_street: deliveryStreet || '',
          delivery_city: deliveryCity || '',
          delivery_postal_code: deliveryPostalCode || '',
          customer_notes: customerNotes || '',
          scheduled_for: scheduledFor || '',
          subtotal: subtotal?.toString() || '0',
          tax: tax?.toString() || '0',
          delivery_fee: deliveryFee?.toString() || '0',
          tip: tip?.toString() || '0',
          discount: discount?.toString() || '0',
          promo_code: promoCode || '',
          total: total?.toString() || '0',
          items: JSON.stringify(items)
        },
      };

      console.log('💳 [DEBUG] Configuration session:', {
        mode: sessionData.mode,
        lineItemsCount: sessionData.line_items.length,
        customerEmail: sessionData.customer_email,
        restaurantId: sessionData.metadata.restaurant_id
      });

      session = await stripe.checkout.sessions.create(sessionData);
      console.log('✅ [DEBUG] Session Stripe créée avec succès:', session.id);
      
    } catch (error) {
      console.error('❌ [ERROR] Erreur création session Stripe:', {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        stack: error.stack
      });
      
      return new Response(JSON.stringify({ 
        error: 'Erreur création session de paiement',
        details: error.message,
        stripeError: {
          type: error.type,
          code: error.code,
          param: error.param
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('✅ [DEBUG] Réponse finale:', {
      sessionId: session.id,
      url: session.url,
      restaurantId: targetRestaurantId
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      restaurantId: targetRestaurantId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ [ERROR] Erreur générale dans create-checkout:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({ 
      error: 'Erreur interne du serveur',
      details: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
