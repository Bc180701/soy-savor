
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 [STEP 1] Début create-checkout - Method:', req.method);
    
    // Parse request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('🚀 [STEP 2] Body reçu (longueur):', bodyText.length);
      requestBody = JSON.parse(bodyText);
      console.log('🚀 [STEP 3] Body parsé avec succès');
    } catch (error) {
      console.error('❌ [STEP 3] Erreur parsing JSON:', error.message);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('🚀 [STEP 4] Validation des champs requis...');
    
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
      cartExtras, // Nouvelles données des extras du panier
      successUrl,
      cancelUrl
    } = requestBody;

    console.log('🚀 [STEP 5] Données extraites:', { 
      itemsCount: items?.length || 0, 
      subtotal, 
      tax,
      total, 
      restaurantId,
      clientEmail,
      orderType
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ [STEP 6] Panier vide ou invalide');
      return new Response(JSON.stringify({ 
        error: 'Panier vide ou invalide',
        details: 'Le panier doit contenir au moins un article'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!clientEmail || !clientName || !orderType) {
      console.error('❌ [STEP 7] Données client manquantes:', { clientEmail, clientName, orderType });
      return new Response(JSON.stringify({ 
        error: 'Informations client manquantes',
        details: 'Email, nom et type de commande sont obligatoires'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Utiliser le restaurant fourni ou le restaurant par défaut
    const targetRestaurantId = restaurantId || "11111111-1111-1111-1111-111111111111";
    console.log('🏪 [STEP 8] Restaurant cible:', targetRestaurantId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ [STEP 9] Configuration Supabase manquante');
      return new Response(JSON.stringify({ 
        error: 'Configuration serveur manquante',
        details: 'Variables d\'environnement Supabase non configurées'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('🚀 [STEP 10] Client Supabase initialisé');

    // Récupérer la clé Stripe
    console.log('🔑 [STEP 11] Récupération clé Stripe pour restaurant:', targetRestaurantId);
    let restaurantData;
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', targetRestaurantId)
        .single();

      if (restaurantError) {
        console.error('❌ [STEP 12] Erreur récupération restaurant:', restaurantError);
        return new Response(JSON.stringify({ 
          error: 'Restaurant non trouvé',
          details: restaurantError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }
      
      restaurantData = restaurant;
      console.log('🏪 [STEP 13] Restaurant récupéré:', restaurantData ? 'Oui' : 'Non');
    } catch (error) {
      console.error('❌ [STEP 13] Exception lors récupération restaurant:', error);
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
      console.log('⚠️ [STEP 14] Pas de clé spécifique, utilisation clé par défaut');
      stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    } else {
      console.log('✅ [STEP 14] Clé spécifique au restaurant trouvée');
    }
    
    if (!stripeSecretKey) {
      console.error('❌ [STEP 15] Aucune clé Stripe disponible');
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
      console.error('❌ [STEP 16] Format de clé invalide:', stripeSecretKey.substring(0, 10) + '...');
      return new Response(JSON.stringify({ 
        error: 'Clé Stripe invalide',
        details: 'Format de clé incorrect'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('🔧 [STEP 17] Initialisation Stripe...');
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
      console.log('✅ [STEP 18] Stripe initialisé avec succès');
    } catch (error) {
      console.error('❌ [STEP 18] Erreur initialisation Stripe:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur configuration Stripe',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Vérifier que les produits du panier sont toujours actifs (désactivés/masqués après ajout au panier)
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const productIds = [...new Set(items.map((i: any) => i?.menuItem?.id).filter((id: any) => typeof id === 'string' && uuidRe.test(id)))];
      if (productIds.length > 0) {
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, is_new, is_hidden')
          .in('id', productIds);
        const unavailable = (prods || []).filter((p: any) => p.is_new === false || p.is_hidden === true);
        if (unavailable.length > 0) {
          const names = unavailable.map((p: any) => p.name).join(', ');
          console.warn('⛔ Produits désactivés dans le panier:', names);
          return new Response(JSON.stringify({
            error: `Produit(s) plus disponible(s) : ${names}. Retirez-le(s) de votre panier pour continuer.`,
            unavailable_products: unavailable.map((p: any) => p.id),
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          });
        }
      }
    } catch (e) {
      console.error('Vérification disponibilité produits échouée:', e);
    }

    // Créer les line items pour Stripe
    const lineItems = [];
    
    try {
      console.log('📦 [STEP 19] Création des line items...');
      
      for (const item of items) {
        console.log('📦 [STEP 19.1] Traitement item:', item);
        
        if (!item.menuItem || !item.menuItem.name || typeof item.menuItem.price !== 'number' || !item.quantity) {
          console.error('❌ [STEP 19.2] Item invalide:', item);
          continue;
        }

        // Les prix sont déjà TTC, pas de majoration
        const unitAmount = Math.round(item.menuItem.price * 100);
        
        // Build product_data - only include description if it has content
        const productData: { name: string; description?: string } = {
          name: item.menuItem.name,
        };
        
        // Only add description if it's not empty (Stripe rejects empty strings)
        if (item.menuItem.description && item.menuItem.description.trim() !== '') {
          productData.description = item.menuItem.description;
        }
        
        const lineItem = {
          price_data: {
            currency: 'eur',
            product_data: productData,
            // Prix en centimes TTC (déjà inclus dans item.menuItem.price)
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        };
        
        lineItems.push(lineItem);
        console.log('📦 [STEP 19.3] Line item ajouté (TTC inclus, sans majoration):', item.menuItem.name, '-', item.menuItem.price, '€');
      }

      // Ajouter les frais de livraison
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
        console.log('📦 [STEP 19.4] Frais de livraison ajoutés:', deliveryFee, '€');
      }

      // Ajouter le pourboire
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
        console.log('📦 [STEP 19.5] Pourboire ajouté:', tip, '€');
      }

      console.log('📦 [STEP 20] Total line items créés:', lineItems.length);

      if (lineItems.length === 0) {
        console.error('❌ [STEP 21] Aucun line item valide');
        return new Response(JSON.stringify({ 
          error: 'Panier invalide',
          details: 'Aucun article valide dans le panier'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

    } catch (error) {
      console.error('❌ [STEP 20] Erreur création line items:', error);
      return new Response(JSON.stringify({ 
        error: 'Erreur traitement panier',
        details: error.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Créer un résumé des articles pour les métadonnées (les extras sont déjà inclus dans items)
    const rawItemsSummary = items.map((item: any) => ({
      id: item.menuItem.id,
      name: item.menuItem.name,
      description: item.menuItem.description || '',
      price: item.menuItem.price,
      quantity: item.quantity,
    }));

    // Système de mapping nom→code lettres pour économiser l'espace
    let itemsSummaryStr = '[]';
    try {
      const items = [];
      
      // Traiter tous les items avec mapping vers codes lettres (sans déduplication)
      for (const item of rawItemsSummary) {
        // Obtenir ou créer un code lettre pour ce produit avec description
        const description = item.description || '';
        
        // Pour les créations personnalisées, toujours créer une nouvelle entrée avec timestamp
        if (item.name === 'Poké Créa' || item.name === 'Sushi Créa') {
          const uniqueName = `${item.name}-${Date.now()}`;
          const { data: codeData, error: codeError } = await supabase
            .rpc('get_or_create_product_code', {
              p_item_name: uniqueName,
              p_item_type: 'custom',
              p_item_description: description
            });

          if (codeError) {
            console.error('Erreur génération code pour création:', codeError);
            // Fallback : utiliser les premières lettres du nom avec timestamp
            const fallbackCode = item.name.substring(0, 2).toUpperCase();
            items.push({
              n: fallbackCode,
              p: Math.round(item.price * 100),
              q: item.quantity
            });
          } else {
            items.push({
              n: codeData,
              p: Math.round(item.price * 100),
              q: item.quantity
            });
          }
        } else {
          // Pour les autres produits, utiliser la logique normale
          const { data: codeData, error: codeError } = await supabase
            .rpc('get_or_create_product_code', {
              p_item_name: item.name,
              p_item_type: item.price === 0 ? 'extra' : 'product',
              p_item_description: description
            });

          if (codeError) {
            console.error('Erreur génération code:', codeError);
            
            // Tentative de récupération si le code existe déjà
            const { data: existingCode } = await supabase
              .from('product_codes')
              .select('code')
              .eq('item_name', item.name)
              .maybeSingle();
              
            if (existingCode) {
              // Utiliser le code existant
              items.push({
                n: existingCode.code,
                p: Math.round(item.price * 100),
                q: item.quantity
              });
            } else {
              // Fallback : utiliser les premières lettres du nom
              const fallbackCode = item.name.substring(0, 2).toUpperCase();
              items.push({
                n: fallbackCode,
                p: Math.round(item.price * 100), // Prix en centimes pour économiser l'espace
                q: item.quantity
              });
            }
          } else {
            items.push({
              n: codeData, // Code lettre (A, B, C, etc.)
              p: Math.round(item.price * 100), // Prix en centimes
              q: item.quantity
            });
          }
        }
      }
      
      itemsSummaryStr = JSON.stringify(items);
      console.log(`Items summary créé: ${itemsSummaryStr.length} caractères`);
      
    } catch (error) {
      console.error('Erreur creation items_summary:', error);
      // Fallback ultra-simple en cas d'erreur
      const fallback = rawItemsSummary.slice(0, 8).map(item => ({
        n: item.name.substring(0, 3).toUpperCase(),
        p: Math.round(item.price * 100),
        q: item.quantity
      }));
      itemsSummaryStr = JSON.stringify(fallback);
    }

    console.log('📝 [STEP 21] Résumé articles total (produits + extras) créé (longueur):', itemsSummaryStr.length, ' | items comptés:', rawItemsSummary.length);

    // Créer un taux de taxe de 10% INCLUSIF (TVA déjà incluse dans les prix)
    console.log('📦 [STEP 21.5] Création du taux de taxe inclusif...');
    let taxRate;
    try {
      taxRate = await stripe.taxRates.create({
        display_name: 'TVA',
        description: 'Taxe sur la valeur ajoutée (incluse)',
        jurisdiction: 'FR',
        percentage: 10.0,
        inclusive: true, // IMPORTANT: TVA déjà incluse dans les prix
      });
      console.log('✅ [STEP 21.6] Taux de taxe inclusif créé:', taxRate.id);
    } catch (error) {
      console.error('❌ [STEP 21.6] Erreur création taux de taxe:', error);
      // Continuer sans taux de taxe si erreur
    }

    // Créer la session Stripe
    console.log('💳 [STEP 22] Création session Stripe...');
    let session;
    try {
      const sessionData = {
        payment_method_types: ['card'],
        line_items: lineItems.map(lineItem => ({
          ...lineItem,
          ...(taxRate && { tax_rates: [taxRate.id] }) // Applique le taux inclusif pour la facture
        })),
        mode: 'payment',
        success_url: successUrl ? `${successUrl}?session_id={CHECKOUT_SESSION_ID}` : `${req.headers.get('origin')}/commande-confirmee?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/panier`,
        // Configuration pour la facturation automatique
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `Commande restaurant #${orderType}`,
            metadata: {
              order_type: orderType,
              restaurant_id: restaurantId,
              order_timestamp: new Date().toISOString()
            },
            footer: 'Merci pour votre commande !'
          }
        },
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
          items_count: items.length.toString(),
          items_summary: itemsSummaryStr, // JSON valide tronqué intelligemment
          // Nouvelles données du panier
          cart_sauces: cartExtras?.sauces?.join(', ') || '',
          cart_accompagnements: cartExtras?.accompagnements?.join(', ') || '',
          cart_baguettes: cartExtras?.baguettes?.toString() || '0',
          cart_couverts: cartExtras?.couverts?.toString() || '0',
          cart_cuilleres: cartExtras?.cuilleres?.toString() || '0',
        },
      };

      // Ajouter la réduction via un coupon si code promo appliqué
      if (discount > 0 && promoCode) {
        try {
          // Créer un coupon Stripe temporaire pour cette réduction
          const coupon = await stripe.coupons.create({
            duration: 'once',
            amount_off: Math.round(discount * 100), // Montant en centimes
            currency: 'eur',
            name: `${promoCode}`,
          });
          
          sessionData.discounts = [{
            coupon: coupon.id
          }];
          
          console.log('📦 [STEP 19.6] Coupon Stripe créé pour réduction:', discount, '€ pour code', promoCode);
        } catch (couponError) {
          console.error('❌ Erreur création coupon Stripe:', couponError);
          // Continue sans coupon si erreur
        }
      }

      console.log('💳 [STEP 23] Configuration session:', {
        mode: sessionData.mode,
        lineItemsCount: sessionData.line_items.length,
        customerEmail: sessionData.customer_email,
        restaurantId: sessionData.metadata.restaurant_id,
        metadataSize: JSON.stringify(sessionData.metadata).length,
        itemsSummaryLen: itemsSummaryStr.length
      });

      // Sauvegarder le panier complet côté serveur (plus de dépendance à la limite 500 car. de Stripe)
      const draftPayload: Record<string, string> = {
        items_summary: itemsSummaryStr,
        customer_notes: customerNotes || '',
        cart_sauces: sessionData.metadata.cart_sauces,
        cart_accompagnements: sessionData.metadata.cart_accompagnements,
      };
      const { data: draft, error: draftError } = await supabase
        .from('checkout_drafts')
        .insert({ restaurant_id: targetRestaurantId, payload: draftPayload })
        .select('id')
        .single();
      if (draftError) console.error('❌ Erreur sauvegarde draft:', draftError);
      if (draft?.id) (sessionData.metadata as any).draft_id = draft.id;

      // Toutes les valeurs metadata doivent faire ≤ 500 caractères
      for (const key of Object.keys(sessionData.metadata)) {
        const val = String((sessionData.metadata as any)[key] ?? '');
        if (val.length > 500) {
          if (key === 'items_summary' || !draft?.id) {
            // items_summary est dans le draft : on ne l'envoie pas tronqué
            (sessionData.metadata as any)[key] = key === 'items_summary' ? '' : val.slice(0, 500);
          } else {
            (sessionData.metadata as any)[key] = val.slice(0, 500);
          }
        }
      }

      session = await stripe.checkout.sessions.create(sessionData);
      console.log('✅ [STEP 24] Session Stripe créée avec succès:', session.id);
      if (draft?.id) {
        await supabase.from('checkout_drafts').update({ stripe_session_id: session.id }).eq('id', draft.id);
      }
      
    } catch (error) {
      console.error('❌ [STEP 24] Erreur création session Stripe:', {
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

    console.log('✅ [STEP 25] Réponse finale:', {
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
    console.error('❌ [CRITICAL ERROR] Erreur générale dans create-checkout:', {
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
