
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
  };
  quantity: number;
  specialInstructions?: string;
}

interface OrderData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  discount?: number; // Montant de la réduction du code promo
  promoCode?: string; // Code promo appliqué
  total: number;
  orderType: "delivery" | "pickup";
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryPostalCode?: string;
  customerNotes?: string;
  scheduledFor: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Vérifier la clé Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: 'La clé API Stripe n\'est pas configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Récupérer les données de la commande depuis le corps de la requête
    const orderData: OrderData = await req.json();
    
    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    // Client pour authentification utilisateur (si disponible)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Client avec rôle de service pour les opérations de base de données (bypass RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Authentification de l'utilisateur (optionnelle)
    let userId: string | undefined;
    
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(token);
        userId = userData.user?.id;
      } catch (authError) {
        console.log("Utilisateur non authentifié, commande en tant qu'invité");
      }
    }
    
    // Créer ou récupérer le client Stripe
    let customerId: string | undefined;
    
    if (orderData.clientEmail) {
      const { data: customers } = await stripe.customers.list({
        email: orderData.clientEmail,
        limit: 1,
      });
      
      if (customers && customers.length > 0) {
        customerId = customers[0].id;
      } else {
        // Créer un nouveau client
        const newCustomer = await stripe.customers.create({
          email: orderData.clientEmail,
          name: orderData.clientName,
          phone: orderData.clientPhone,
        });
        customerId = newCustomer.id;
      }
    }

    // Créer les éléments de ligne pour Stripe Checkout
    const lineItems = orderData.items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.menuItem.name,
          description: item.specialInstructions,
        },
        unit_amount: Math.round(item.menuItem.price * 100), // Montant en centimes
      },
      quantity: item.quantity,
    }));

    // Ajouter les frais de livraison si nécessaires
    if (orderData.deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
          },
          unit_amount: Math.round(orderData.deliveryFee * 100), // Montant en centimes
        },
        quantity: 1,
      });
    }
    
    // Ajouter la TVA
    if (orderData.tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'TVA (10%)',
          },
          unit_amount: Math.round(orderData.tax * 100), // Montant en centimes
        },
        quantity: 1,
      });
    }
    
    // Ajouter le pourboire si présent
    if (orderData.tip && orderData.tip > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Pourboire',
          },
          unit_amount: Math.round(orderData.tip * 100), // Montant en centimes
        },
        quantity: 1,
      });
    }
    
    // Ajouter la réduction du code promo si présente (comme élément négatif)
    if (orderData.discount && orderData.discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Réduction${orderData.promoCode ? ' (' + orderData.promoCode + ')' : ''}`,
          },
          unit_amount: Math.round(-orderData.discount * 100), // Montant négatif en centimes
        },
        quantity: 1,
      });
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: !customerId ? orderData.clientEmail : undefined,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: orderData.successUrl,
      cancel_url: orderData.cancelUrl,
      metadata: {
        user_id: userId || 'guest',
        order_type: orderData.orderType,
        scheduled_for: orderData.scheduledFor,
        customer_notes: orderData.customerNotes || '',
        delivery_address: orderData.orderType === 'delivery' ? 
          `${orderData.deliveryStreet}, ${orderData.deliveryPostalCode} ${orderData.deliveryCity}` : '',
        tip_amount: orderData.tip ? (orderData.tip).toString() : '0', // Ajouter le pourboire aux métadonnées
        discount_amount: orderData.discount ? (orderData.discount).toString() : '0', // Ajouter la réduction aux métadonnées
        promo_code: orderData.promoCode || '', // Ajouter le code promo aux métadonnées
      },
    });

    // Créer la commande avec un statut de paiement "pending" et inclure le pourboire
    const { data: orderRecord, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId, // null si invité
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        delivery_fee: orderData.deliveryFee,
        tip: orderData.tip || 0, // Ajouter le pourboire
        discount: orderData.discount || 0, // Ajouter la réduction du code promo
        promo_code: orderData.promoCode || null, // Ajouter le code promo utilisé
        total: orderData.total,
        order_type: orderData.orderType,
        status: 'pending',
        payment_method: 'credit-card',
        payment_status: 'pending',
        scheduled_for: orderData.scheduledFor,
        client_name: orderData.clientName,
        client_email: orderData.clientEmail,
        client_phone: orderData.clientPhone,
        delivery_street: orderData.deliveryStreet,
        delivery_city: orderData.deliveryCity,
        delivery_postal_code: orderData.deliveryPostalCode,
        customer_notes: orderData.customerNotes,
        stripe_session_id: session.id
      })
      .select('id')
      .single();

    if (orderError) {
      console.error("Erreur lors de la création de la commande:", orderError);
    } else {
      // Ajouter les articles de la commande
      for (const item of orderData.items) {
        await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: orderRecord.id,
            product_id: item.menuItem.id,
            quantity: item.quantity,
            price: item.menuItem.price,
            special_instructions: item.specialInstructions
          });
      }
    }
    
    // Renvoyer l'URL de la session
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // Gérer les erreurs
    console.error('Erreur lors de la création de la session Stripe:', err);
    
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Une erreur inconnue est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
