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

    // 1. Récupérer la commande avec items_summary et client_email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, items_summary, restaurant_id, total, client_email')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('❌ Erreur récupération commande:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // D'abord essayer de récupérer depuis la sauvegarde préventive
    if (order.client_email) {
      console.log("🔍 Recherche de sauvegarde préventive pour:", order.client_email);
      try {
      const { data: backupData, error: backupError } = await supabase
        .from('cart_backup')
        .select('*')
        .eq('session_id', order.client_email)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

        if (!backupError && backupData) {
          console.log("✅ Sauvegarde trouvée, récupération des items...");
          const cartItems = backupData.cart_items;

          if (Array.isArray(cartItems) && cartItems.length > 0) {
            // Créer les order_items depuis la sauvegarde
            const orderItemsToInsert = cartItems.map(item => ({
              order_id: orderId,
              product_id: item.menuItem?.id || null,
              quantity: item.quantity || 1,
              price: item.menuItem?.price || 0,
              special_instructions: item.menuItem?.description || null
            }));

            const { error: insertError } = await supabase
              .from('order_items')
              .insert(orderItemsToInsert);

            if (!insertError) {
              console.log("✅ Items récupérés depuis la sauvegarde préventive");
              
              // Marquer la sauvegarde comme utilisée
              await supabase
                .from('cart_backup')
                .update({ is_used: true })
                .eq('id', backupData.id);

              return new Response(
                JSON.stringify({ 
                  success: true, 
                  message: "Items récupérés depuis la sauvegarde préventive",
                  source: "cart_backup",
                  recovered_items: orderItemsToInsert.length
                }),
                { 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200 
                }
              );
            } else {
              console.error("Erreur lors de l'insertion des items depuis la sauvegarde:", insertError);
            }
          }
        }
      } catch (backupError) {
        console.error("Erreur lors de la récupération depuis la sauvegarde:", backupError);
      }
    }

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
      total: order.total
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

    // 3. Analyser items_summary
    if (!order.items_summary || !Array.isArray(order.items_summary)) {
      console.log('⚠️ Pas d\'items_summary valide à traiter');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No valid items_summary found',
        existing_items: existingItemsCount
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const itemsSummary = order.items_summary;
    console.log('📝 Items_summary à traiter:', itemsSummary.length, 'articles');

    // 4. Logger chaque article dans items_summary
    itemsSummary.forEach((item: any, index: number) => {
      console.log(`📋 Article ${index + 1} dans items_summary:`, {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unit_price: item.unit_price,
        description: item.description
      });
    });

    // 5. Créer les order_items manquants si nécessaire
    let recoveredItems = 0;
    let skippedItems = 0;

    if (existingItemsCount === 0 && itemsSummary.length > 0) {
      console.log('🚨 RÉCUPÉRATION NÉCESSAIRE: Aucun order_item existant');
      
      const recoveryItems = itemsSummary.map((item: any, index: number) => {
        const orderItem = {
          order_id: orderId,
          product_id: (item.id && item.id !== 'unknown') ? item.id : null,
          quantity: item.quantity || 1,
          price: item.unit_price || item.price || 0,
          special_instructions: item.name ? `RÉCUPÉRÉ: ${item.name}` : `Article récupéré ${index + 1}`
        };

        console.log(`💾 Order_item de récupération ${index + 1}:`, orderItem);
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
      console.log('⚠️ Pas d\'items_summary à récupérer');
    }

    // 6. Vérification finale
    const { data: finalItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    const finalCount = finalItems?.length || 0;

    console.log('📊 Résumé de la récupération:', {
      orderId,
      items_summary_count: itemsSummary.length,
      existing_items_before: existingItemsCount,
      recovered_items: recoveredItems,
      skipped_items: skippedItems,
      final_items_count: finalCount
    });

    return new Response(JSON.stringify({
      success: true,
      orderId,
      items_summary_count: itemsSummary.length,
      existing_items_before: existingItemsCount,
      recovered_items: recoveredItems,
      skipped_items: skippedItems,
      final_items_count: finalCount,
      message: recoveredItems > 0 ? `Récupération réussie: ${recoveredItems} order_items créés` : 
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