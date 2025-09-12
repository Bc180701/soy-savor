import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔄 Début de la récupération pour la commande:', orderId);

    // 1. Récupérer la commande avec stripe_session_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, items_summary, restaurant_id, total, stripe_session_id')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Erreur récupération commande:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('📋 Commande trouvée:', {
      id: order.id,
      restaurant_id: order.restaurant_id,
      items_summary_count: Array.isArray(order.items_summary) ? order.items_summary.length : 0,
      total: order.total,
      stripe_session_id: order.stripe_session_id ? 'présent' : 'absent'
    });

    // 2. Vérifier les order_items existants
    const { data: existingItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('❌ Erreur vérification order_items:', itemsError);
    }

    const existingItemsCount = existingItems?.length || 0;
    console.log('📦 Order_items existants:', existingItemsCount);

    // 3. Essayer de récupérer depuis items_summary s'il existe, sinon depuis Stripe
    let decodedItems = [];
    
    if (order.items_summary && Array.isArray(order.items_summary) && order.items_summary.length > 0) {
      console.log('📝 Items_summary trouvé en base, décodage...');
      const { data: decodedItemsResult, error: decodeError } = await supabase
        .rpc('decode_items_summary', { encoded_summary: order.items_summary });

      if (decodeError) {
        console.error('❌ Erreur décodage items_summary:', decodeError);
      } else {
        decodedItems = decodedItemsResult || [];
        console.log('✅ Articles décodés depuis la base:', decodedItems.length);
      }
    }

    // 4. Si pas d'items décodés, essayer de récupérer depuis Stripe
    if (decodedItems.length === 0 && order.stripe_session_id) {
      console.log('🔍 Récupération depuis Stripe session:', order.stripe_session_id);
      
      try {
        // Récupérer les clés Stripe pour ce restaurant
        const { data: stripeData, error: stripeError } = await supabase.functions.invoke('get-stripe-key', {
          body: { restaurantId: order.restaurant_id }
        });

        if (stripeError || !stripeData?.key) {
          console.error('❌ Impossible de récupérer la clé Stripe:', stripeError);
          throw new Error('Clé Stripe non trouvée');
        }

        // Récupérer la session Stripe
        const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.stripe_session_id}`, {
          headers: {
            'Authorization': `Bearer ${stripeData.key}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (!stripeResponse.ok) {
          throw new Error(`Stripe API error: ${stripeResponse.status}`);
        }

        const stripeSession = await stripeResponse.json();
        console.log('✅ Session Stripe récupérée');

        // Extraire les items depuis les métadonnées
        const metadata = stripeSession.metadata || {};
        let itemsFromStripe = [];

        if (metadata.items_summary) {
          console.log('📦 Items_summary trouvé dans les métadonnées Stripe');
          try {
            const parsedItems = JSON.parse(metadata.items_summary);
            if (Array.isArray(parsedItems)) {
              // Décoder les items encodés
              const { data: decodedFromStripe, error: decodeStripeError } = await supabase
                .rpc('decode_items_summary', { encoded_summary: parsedItems });
              
              if (!decodeStripeError && decodedFromStripe) {
                itemsFromStripe = decodedFromStripe;
                console.log('✅ Items décodés depuis Stripe metadata:', itemsFromStripe.length);
              }
            }
          } catch (parseError) {
            console.error('❌ Erreur parsing items_summary de Stripe:', parseError);
          }
        } else if (metadata.items) {
          console.log('📦 Items trouvé dans les métadonnées Stripe');
          try {
            const parsedItems = JSON.parse(metadata.items);
            if (Array.isArray(parsedItems)) {
              itemsFromStripe = parsedItems;
              console.log('✅ Items récupérés depuis Stripe metadata:', itemsFromStripe.length);
            }
          } catch (parseError) {
            console.error('❌ Erreur parsing items de Stripe:', parseError);
          }
        }

        decodedItems = itemsFromStripe;
        
      } catch (stripeRecoveryError) {
        console.error('❌ Erreur récupération depuis Stripe:', stripeRecoveryError);
      }
    }

    if (decodedItems.length === 0) {
      console.log('⚠️ Aucun article trouvé ni en base ni dans Stripe');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Aucun article trouvé à récupérer',
        existing_items: existingItemsCount,
        tried_database: order.items_summary && order.items_summary.length > 0,
        tried_stripe: !!order.stripe_session_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Articles à traiter:', decodedItems.length);

    // 5. Logger chaque article décodé
    decodedItems.forEach((item: any, index: number) => {
      console.log(`📋 Article décodé ${index + 1}:`, {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price
      });
    });

    // 6. Récupérer les produits correspondants pour obtenir les product_id
    const productNames = decodedItems.map((item: any) => item.name);
    console.log('🔍 Recherche des produits dans la base:', productNames);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('name', productNames)
      .eq('restaurant_id', order.restaurant_id);

    if (productsError) {
      console.error('❌ Erreur récupération produits:', productsError);
    }

    const productsMap = new Map();
    if (products) {
      products.forEach((product: any) => {
        productsMap.set(product.name, product.id);
      });
    }
    console.log('📦 Produits trouvés:', productsMap.size, 'sur', productNames.length);

    // 7. Créer les order_items manquants si nécessaire
    let recoveredItems = 0;
    let skippedItems = 0;

    if (existingItemsCount === 0 && decodedItems.length > 0) {
      console.log('🚨 RÉCUPÉRATION NÉCESSAIRE: Aucun order_item existant');
      
      const recoveryItems = decodedItems.map((item: any, index: number) => {
        const productId = productsMap.get(item.name);
        
        const orderItem = {
          order_id: orderId,
          product_id: productId || null,
          quantity: item.quantity || 1,
          price: item.price || 0,
          special_instructions: item.description || null
        };

        console.log(`💾 Order_item de récupération ${index + 1}:`, {
          name: item.name,
          product_id: productId,
          quantity: orderItem.quantity,
          price: orderItem.price,
          special_instructions: orderItem.special_instructions
        });
        
        return orderItem;
      });

      const { data: insertedItems, error: insertError } = await supabase
        .from('order_items')
        .insert(recoveryItems)
        .select();

      if (insertError) {
        console.error('❌ Erreur insertion order_items de récupération:', insertError);
        return new Response(JSON.stringify({ 
          success: false, 
          error: insertError.message,
          existing_items: existingItemsCount
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      recoveredItems = insertedItems?.length || 0;
      console.log('✅ Récupération réussie:', recoveredItems, 'order_items créés');

    } else if (existingItemsCount > 0) {
      console.log('✅ Order_items déjà présents, pas de récupération nécessaire');
      skippedItems = existingItemsCount;
    } else {
      console.log('⚠️ Pas d\'items décodés à récupérer');
    }

    // 6. Vérification finale
    const { data: finalItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    const finalCount = finalItems?.length || 0;

    console.log('📊 Résumé de la récupération:', {
      orderId,
      decoded_items_count: decodedItems.length,
      existing_items_before: existingItemsCount,
      recovered_items: recoveredItems,
      skipped_items: skippedItems,
      final_items_count: finalCount,
      had_stripe_session: !!order.stripe_session_id
    });

    return new Response(JSON.stringify({
      success: true,
      orderId,
      decoded_items_count: decodedItems.length,
      existing_items_before: existingItemsCount,
      recovered_items: recoveredItems,
      skipped_items: skippedItems,
      final_items_count: finalCount,
      message: recoveredItems > 0 ? `Récupération réussie: ${recoveredItems} order_items créés depuis ${decodedItems.length} articles trouvés` : 
               skippedItems > 0 ? 'Order_items déjà présents' : 'Aucune récupération nécessaire'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erreur dans recover-order-items:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});