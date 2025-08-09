
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
    console.log('🚀 Début verify-payment');
    
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID manquant');
    }

    console.log('🔍 Vérification session:', sessionId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Vérifier si la commande existe déjà
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id, status, total, client_email, order_type, restaurant_id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (existingOrderError) {
      console.error('❌ Erreur lors de la vérification commande existante:', existingOrderError);
    }

    if (existingOrder) {
      console.log('✅ Commande déjà existante:', existingOrder.id);
      
      // Récupérer les détails complets de la commande existante
      const { data: orderDetails, error: detailsError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, description, price)
          )
        `)
        .eq('id', existingOrder.id)
        .single();

      if (detailsError) {
        console.error('❌ Erreur récupération détails commande:', detailsError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        orderId: existingOrder.id,
        message: 'Commande déjà créée',
        orderDetails: orderDetails || existingOrder
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Liste des restaurants avec leurs clés Stripe
    const restaurants = [
      {
        id: '11111111-1111-1111-1111-111111111111', // Châteaurenard
        name: 'Châteaurenard'
      },
      {
        id: '22222222-2222-2222-2222-222222222222', // Saint-Martin-de-Crau
        name: 'Saint-Martin-de-Crau'
      }
    ];

    let session;
    let stripeKey;
    let detectedRestaurantId;

    // Essayer de récupérer la session avec chaque clé Stripe pour déterminer le bon restaurant
    for (const restaurant of restaurants) {
      try {
        console.log(`🔑 Tentative récupération clé Stripe pour ${restaurant.name}...`);
        const { data: keyData, error: keyError } = await supabase.functions.invoke('get-stripe-key', {
          body: { restaurantId: restaurant.id }
        });

        if (keyError || !keyData?.stripeKey) {
          console.log(`❌ Pas de clé Stripe pour ${restaurant.name}:`, keyError);
          continue;
        }

        console.log(`✅ Clé Stripe récupérée pour ${restaurant.name}`);

        const testStripe = new Stripe(keyData.stripeKey, {
          apiVersion: '2023-10-16',
        });

        try {
          console.log(`💳 Test récupération session avec clé ${restaurant.name}...`);
          const testSession = await testStripe.checkout.sessions.retrieve(sessionId);
          
          // Si on arrive ici sans erreur, c'est la bonne clé
          session = testSession;
          stripeKey = keyData.stripeKey;
          detectedRestaurantId = restaurant.id;
          console.log(`✅ Session trouvée avec la clé ${restaurant.name}`);
          break;
          
        } catch (stripeError) {
          console.log(`❌ Session non trouvée avec clé ${restaurant.name}:`, stripeError.message);
          continue;
        }

      } catch (error) {
        console.log(`❌ Erreur récupération clé ${restaurant.name}:`, error);
        continue;
      }
    }

    if (!session || !stripeKey || !detectedRestaurantId) {
      throw new Error('Impossible de récupérer la session Stripe avec aucune des clés disponibles');
    }
    
    console.log('📊 Session récupérée:', {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      customer_email: session.customer_email,
      detected_restaurant: detectedRestaurantId,
      metadata_keys: Object.keys(session.metadata || {})
    });

    if (session.payment_status !== 'paid') {
      throw new Error(`Paiement non confirmé. Statut: ${session.payment_status}`);
    }

    // Récupérer les métadonnées
    const metadata = session.metadata || {};
    console.log('📋 Métadonnées disponibles:', metadata);

    // Vérifier si l'utilisateur est connecté
    let userId = null;
    if (session.customer_email) {
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError) {
        const user = users?.find(u => u.email === session.customer_email);
        userId = user?.id || null;
        console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
      }
    }

    // Utiliser le restaurant détecté via la clé Stripe, ou celui des métadonnées en fallback
    const restaurantId = detectedRestaurantId || metadata.restaurant_id || '22222222-2222-2222-2222-222222222222';
    console.log('🏪 Restaurant ID utilisé:', restaurantId, '(détecté via clé Stripe:', detectedRestaurantId, ')');

    // Créer la commande avec les données des métadonnées
    const orderData = {
      stripe_session_id: sessionId,
      restaurant_id: restaurantId,
      user_id: userId,
      subtotal: parseFloat(metadata.subtotal || '0'),
      tax: parseFloat(metadata.tax || '0'),
      delivery_fee: parseFloat(metadata.delivery_fee || '0'),
      tip: parseFloat(metadata.tip || '0'),
      total: parseFloat(metadata.total || session.amount_total ? (session.amount_total / 100).toString() : '0'),
      discount: parseFloat(metadata.discount || '0'),
      promo_code: metadata.promo_code || null,
      order_type: metadata.order_type || 'pickup',
      status: 'confirmed',
      payment_method: 'credit-card',
      payment_status: 'paid',
      scheduled_for: metadata.scheduled_for || new Date().toISOString(),
      client_name: metadata.client_name || session.customer_details?.name || 'Client',
      client_email: metadata.client_email || session.customer_email || '',
      client_phone: metadata.client_phone || session.customer_details?.phone || '',
      delivery_street: metadata.delivery_street || null,
      delivery_city: metadata.delivery_city || null,
      delivery_postal_code: metadata.delivery_postal_code || null,
      customer_notes: null,
    };

    console.log('📝 Création commande avec:', {
      restaurant_id: orderData.restaurant_id,
      total: orderData.total,
      client_email: orderData.client_email,
      order_type: orderData.order_type,
      payment_status: orderData.payment_status
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Erreur création commande:', orderError);
      throw orderError;
    }

    console.log('✅ Commande créée:', order.id);

    // Ajouter les articles depuis items_summary ou items dans les métadonnées
    const itemsData = metadata.items_summary || metadata.items;
    if (itemsData) {
      try {
        const items = JSON.parse(itemsData);
        console.log('📦 Ajout articles:', items.length);

        // Créer/assurer les produits pour les extras sans UUID puis insérer tous les items
        const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

        // Ensure "extras" category exists for this restaurant
        const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
          const { data: cat, error: catErr } = await supabase
            .from('categories')
            .select('id')
            .eq('id', 'extras')
            .eq('restaurant_id', restaurantId)
            .maybeSingle();
          if (cat && cat.id) return cat.id as string;
          const { data: newCat, error: insErr } = await supabase
            .from('categories')
            .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
            .select('id')
            .single();
          if (insErr) {
            console.log('⚠️ Impossible de créer la catégorie extras (peut-être déjà créée):', insErr.message);
            return 'extras';
          }
          return newCat.id as string;
        };

        const resolveProductId = async (name: string, price: number, restaurantId: string): Promise<string> => {
          // 1) Rechercher par nom (quel que soit is_extra)
          const { data: existingByName } = await supabase
            .from('products')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('name', name)
            .maybeSingle();
          if (existingByName?.id) return existingByName.id as string;

          // 2) Fallback: créer un produit caché dans la catégorie "extras"
          const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
            const { data: cat, error: catErr } = await supabase
              .from('categories')
              .select('id')
              .eq('id', 'extras')
              .eq('restaurant_id', restaurantId)
              .maybeSingle();
            if (cat && cat.id) return cat.id as string;
            const { data: newCat, error: insErr } = await supabase
              .from('categories')
              .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
              .select('id')
              .single();
            if (insErr) {
              console.log('⚠️ Impossible de créer la catégorie extras (peut-être déjà créée):', insErr.message);
              return 'extras';
            }
            return newCat.id as string;
          };

          const categoryId = await ensureExtrasCategory(restaurantId);
          const { data: inserted, error: insErr } = await supabase
            .from('products')
            .insert({
              name,
              description: 'Extra généré automatiquement',
              price: price || 0,
              category_id: categoryId,
              restaurant_id: restaurantId,
              is_hidden: true,
              is_extra: true,
            })
            .select('id')
            .single();
          if (insErr) {
            if ((insErr as any).code === '23505') {
              const { data: retry } = await supabase
                .from('products')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('name', name)
                .maybeSingle();
              if (retry?.id) return retry.id as string;
            }
            throw insErr;
          }
          return inserted.id as string;
        };

        const orderItems: any[] = [];
        if (Array.isArray(items)) {
          for (const item of items) {
            let productId = item.id || item.menuItem?.id || item.product_id;
            const quantity = item.quantity || 1;
            const price = item.price || item.menuItem?.price || 0;
            const specialInstructions = item.specialInstructions || item.special_instructions || null;
            if (!isUuid(productId)) {
              const name = item.name || item.menuItem?.name || 'Extra';
              try {
                productId = await getOrCreateExtraProduct(name, price, order.restaurant_id);
              } catch (e) {
                console.error('❌ Échec d\'obtention du produit extra, item ignoré:', e);
                continue;
              }
            }
            orderItems.push({ order_id: order.id, product_id: productId, quantity, price, special_instructions: specialInstructions });
          }
        }

        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('❌ Erreur ajout articles:', itemsError);
          } else {
            console.log(`✅ ${orderItems.length} article(s) ajoutés avec succès`);
          }
        } else {
          console.log('⚠️ Aucun article à insérer');
        }
      } catch (error) {
        console.error('❌ Erreur parsing items:', error);
      }
    } else {
      console.log('⚠️ Aucun article trouvé dans les métadonnées');
    }

    // Récupérer les détails complets de la commande créée
    const { data: fullOrderDetails, error: fullDetailsError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (name, description, price)
        )
      `)
      .eq('id', order.id)
      .single();

    if (fullDetailsError) {
      console.error('❌ Erreur récupération détails complets:', fullDetailsError);
    }

    // Envoi d'un SMS d'alerte au responsable du restaurant via fonction dédiée
    try {
      console.log('🔔 Début envoi SMS alerte restaurant pour commande:', order.id);
      
      const { data: alertResult, error: alertError } = await supabase.functions.invoke('send-restaurant-alert', {
        body: { 
          orderId: order.id, 
          restaurantId: order.restaurant_id 
        }
      });

      if (alertError) {
        console.error('❌ Erreur lors de l\'appel à send-restaurant-alert:', alertError);
      } else {
        console.log('✅ Résultat SMS alerte:', alertResult);
      }
    } catch (notifyErr) {
      console.error('❌ Erreur lors de l\'envoi du SMS d\'alerte:', notifyErr);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      message: 'Commande créée avec succès',
      orderDetails: fullOrderDetails || {
        id: order.id,
        status: order.status,
        total: order.total,
        client_email: order.client_email,
        order_type: order.order_type,
        restaurant_id: order.restaurant_id
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur verify-payment:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
