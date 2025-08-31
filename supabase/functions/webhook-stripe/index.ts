import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Fonction pour vérifier la signature Stripe avec Web Crypto API
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parts = signature.split(',');
    const timestamp = parts.find(part => part.startsWith('t='))?.split('=')[1];
    const sig = parts.find(part => part.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !sig) return false;
    
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected_sig = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expected_sig === sig;
  } catch (error) {
    console.error('Erreur vérification signature:', error);
    return false;
  }
}

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('Signature manquante', { status: 400 });
    }

    const body = await req.text();
    
    // Essayer les deux secrets de webhook (Châteaurenard et St Martin)
    const webhookSecretChato = Deno.env.get('STRIPE_WEBHOOK_SECRET_CHATEAURENARD');
    const webhookSecretStMartin = Deno.env.get('STRIPE_WEBHOOK_SECRET_ST_MARTIN');
    
    let isValidSignature = false;
    let usedSecret = '';
    
    // Essayer d'abord avec le secret de Châteaurenard
    if (webhookSecretChato) {
      isValidSignature = await verifyStripeSignature(body, signature, webhookSecretChato);
      if (isValidSignature) {
        usedSecret = 'CHATEAURENARD';
        console.log('✅ Signature validée avec le secret de Châteaurenard');
      }
    }
    
    // Si ça n'a pas marché, essayer avec le secret de St Martin
    if (!isValidSignature && webhookSecretStMartin) {
      isValidSignature = await verifyStripeSignature(body, signature, webhookSecretStMartin);
      if (isValidSignature) {
        usedSecret = 'ST_MARTIN';
        console.log('✅ Signature validée avec le secret de St Martin de Crau');
      }
    }
    
    if (!isValidSignature) {
      console.error('❌ Signature du webhook invalide avec les deux secrets');
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('🎯 Événement Stripe reçu:', event.type);

    // Traiter l'événement
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('💳 Session complétée:', session.id);
      
      // Initialiser Stripe pour récupérer les line_items complets
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      });
      
      // Vérifier si la commande existe déjà
      const { data: existingOrder, error: existingError } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Erreur vérification commande existante:', existingError);
      }

      if (existingOrder) {
        console.log('✅ Commande déjà existante:', existingOrder.id);
        return new Response(JSON.stringify({ received: true, existing: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Récupérer toutes les données depuis les métadonnées
      const metadata = session.metadata;
      const restaurantId = metadata?.restaurant_id || '22222222-2222-2222-2222-222222222222'; // St Martin de Crau par défaut
      
      console.log('🏪 Restaurant ID depuis métadonnées:', restaurantId);
      console.log('📋 Métadonnées complètes:', metadata);
      
      if (!restaurantId) {
        console.error('❌ Restaurant ID manquant dans les métadonnées');
        return new Response('Restaurant ID manquant', { status: 400 });
      }

      // Vérifier si l'utilisateur existe
      let userId = null;
      if (session.customer_email) {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
          const user = users?.find(u => u.email === session.customer_email);
          userId = user?.id || null;
          console.log('👤 Utilisateur trouvé:', userId ? 'Oui' : 'Non', 'pour email:', session.customer_email);
        }
      }

      // Récupérer les articles depuis Stripe d'abord, puis fallback sur métadonnées
      let itemsSummary = [];
      let itemsSource = 'stripe';
      
      try {
        console.log('🔍 Récupération des line_items depuis Stripe...');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product']
        });
        
        if (lineItems.data && lineItems.data.length > 0) {
          itemsSummary = lineItems.data.map((item: any) => ({
            id: item.price?.product?.metadata?.product_id || item.price?.product?.id || 'unknown',
            name: item.description || item.price?.product?.name || 'Produit inconnu',
            price: (item.amount_total || 0) / 100,
            quantity: item.quantity || 1,
            unit_price: (item.price?.unit_amount || 0) / 100
          }));
          
          console.log('✅ Line items récupérés depuis Stripe:', itemsSummary.length, 'articles');
        } else {
          throw new Error('Aucun line_item retourné par Stripe');
        }
      } catch (stripeError) {
        console.error('❌ Erreur récupération line_items Stripe:', stripeError);
        itemsSource = 'metadata';
        
        // Fallback 1: Essayer de décoder les items depuis les métadonnées compressées
        if (metadata?.itemsSummaryStr) {
          console.log('🔄 Tentative de décodage du résumé compressé...');
          try {
            // Appeler la fonction de décodage Supabase
            const { data: decodedItems, error: decodeError } = await supabase
              .rpc('decode_items_summary', { 
                encoded_summary: JSON.parse(metadata.itemsSummaryStr) 
              });
            
            if (!decodeError && decodedItems && Array.isArray(decodedItems)) {
              itemsSummary = decodedItems;
              console.log('✅ Articles décodés depuis le résumé compressé:', itemsSummary.length, 'articles');
              itemsSource = 'decoded';
            } else {
              console.error('❌ Erreur décodage résumé:', decodeError);
              throw new Error('Échec décodage résumé compressé');
            }
          } catch (decodeError) {
            console.error('❌ Erreur lors du décodage:', decodeError);
            throw new Error('Échec décodage résumé compressé');
          }
        }
        
        // Fallback 2: Utiliser items_summary direct des métadonnées
        if (itemsSummary.length === 0 && metadata?.items_summary) {
          try {
            itemsSummary = JSON.parse(metadata.items_summary);
            console.log('⚠️ Utilisation du fallback métadonnées directes:', itemsSummary.length, 'articles');
            itemsSource = 'metadata_direct';
          } catch (parseError) {
            console.error('❌ Erreur parsing items_summary:', parseError);
          }
        }
        
        // Si toujours vide, alerte critique
        if (itemsSummary.length === 0) {
          console.error('🚨 CRITIQUE: Aucun article trouvé ni dans Stripe ni dans les métadonnées!');
          console.error('🔍 Métadonnées disponibles:', Object.keys(metadata || {}));
          
          // Envoyer une alerte aux administrateurs
          try {
            await supabase.functions.invoke('send-restaurant-alert', {
              body: { 
                orderId: session.id,
                restaurantId: restaurantId,
                alertType: 'missing_items',
                message: `Commande ${session.id} créée sans articles - Session Stripe expirée`
              }
            });
          } catch (alertError) {
            console.error('❌ Erreur envoi alerte critique:', alertError);
          }
        }
      }
      
      console.log(`📋 Articles finaux (source: ${itemsSource}):`, itemsSummary);
      
      const orderData = {
        stripe_session_id: session.id,
        restaurant_id: restaurantId,
        user_id: userId,
        subtotal: parseFloat(metadata?.subtotal || '0'),
        tax: parseFloat(metadata?.tax || '0'),
        delivery_fee: parseFloat(metadata?.delivery_fee || '0'),
        tip: parseFloat(metadata?.tip || '0'),
        total: parseFloat(metadata?.total || session.amount_total ? (session.amount_total / 100).toString() : '0'),
        discount: parseFloat(metadata?.discount || '0'),
        promo_code: metadata?.promo_code || null,
        order_type: metadata?.order_type || 'pickup',
        status: 'confirmed',
        payment_method: 'credit-card',
        payment_status: 'paid',
        scheduled_for: metadata?.scheduled_for || new Date().toISOString(),
        client_name: metadata?.client_name || session.customer_details?.name || 'Client',
        client_email: metadata?.client_email || session.customer_email || '',
        client_phone: metadata?.client_phone || session.customer_details?.phone || '',
        delivery_street: metadata?.delivery_street || null,
        delivery_city: metadata?.delivery_city || null,
        delivery_postal_code: metadata?.delivery_postal_code || null,
        customer_notes: metadata?.customer_notes || null,
        items_summary: itemsSummary,
      };

      console.log('📝 Création commande depuis webhook:', {
        restaurant_id: orderData.restaurant_id,
        total: orderData.total,
        client_email: orderData.client_email,
        order_type: orderData.order_type,
        items_count: itemsSummary.length
      });

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Erreur création commande depuis webhook:', orderError);
        throw orderError;
      }

      console.log('✅ Commande créée avec ID:', order.id, 'pour restaurant:', restaurantId, 'avec', itemsSummary.length, 'articles');

      // Créer les order_items si on a des articles - NOUVEAU: Conserver TOUS les articles
      if (itemsSummary.length > 0) {
        console.log('📦 Création des order_items pour', itemsSummary.length, 'articles...');
        
        // LOGS DÉTAILLÉS pour chaque article
        itemsSummary.forEach((item: any, index: number) => {
          console.log(`📋 Article ${index + 1}:`, {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            price: item.price,
            has_valid_product_id: item.id && item.id !== 'unknown'
          });
        });
        
        // NOUVEAU: Ne plus filtrer les articles sans product_id
        const orderItems = itemsSummary.map((item: any, index: number) => {
          const orderItem = {
            order_id: order.id,
            product_id: (item.id === 'unknown' || !item.id) ? null : item.id,
            quantity: item.quantity || 1,
            price: item.unit_price || item.price || 0,
            special_instructions: item.name || `Article ${index + 1}` // Conserver le nom si pas de product_id
          };
          
          console.log(`💾 Order_item créé pour article ${index + 1}:`, orderItem);
          return orderItem;
        });
        
        console.log(`📊 Statistiques order_items: ${orderItems.length} total, ${orderItems.filter(i => i.product_id).length} avec product_id, ${orderItems.filter(i => !i.product_id).length} sans product_id`);
        
        if (orderItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
          
          if (itemsError) {
            console.error('❌ Erreur création order_items:', itemsError);
            // Ne pas faire échouer la commande pour autant
          } else {
            console.log('✅ Order_items créés avec succès:', orderItems.length, 'articles');
            console.log(`   - ${orderItems.filter(i => i.product_id).length} avec product_id valide`);
            console.log(`   - ${orderItems.filter(i => !i.product_id).length} avec product_id null (récupérables)`);
          }
        } else {
          console.log('⚠️ Aucun order_item à créer');
        }
      } else {
        console.log('⚠️ Aucun article à traiter pour les order_items');
      }

      // NOUVEAU: Logique de récupération des order_items manquants
      try {
        console.log('🔄 Vérification des order_items manquants...');
        const { data: existingItems, error: checkError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (checkError) {
          console.error('❌ Erreur vérification order_items existants:', checkError);
        } else if (!existingItems || existingItems.length === 0) {
          console.log('🚨 AUCUN order_item trouvé, tentative de récupération depuis items_summary...');
          
          // Logique de récupération depuis items_summary
          if (itemsSummary.length > 0) {
            const recoveryItems = itemsSummary.map((item: any, index: number) => ({
              order_id: order.id,
              product_id: null, // On met null car on n'a pas de product_id valide
              quantity: item.quantity || 1,
              price: item.unit_price || item.price || 0,
              special_instructions: `RÉCUPÉRÉ: ${item.name || `Article ${index + 1}`}`
            }));

            const { error: recoveryError } = await supabase
              .from('order_items')
              .insert(recoveryItems);

            if (recoveryError) {
              console.error('❌ Erreur récupération order_items:', recoveryError);
            } else {
              console.log('✅ Récupération réussie:', recoveryItems.length, 'order_items créés');
            }
          }
        } else {
          console.log('✅ Order_items existants trouvés:', existingItems.length);
        }
      } catch (recoveryError) {
        console.error('❌ Erreur dans la logique de récupération:', recoveryError);
      }

      // Envoyer l'email de confirmation en arrière-plan
      if (order.client_email) {
        console.log('📧 Envoi email de confirmation pour:', order.client_email);
        try {
          const emailResponse = await supabase.functions.invoke('send-order-confirmation', {
            body: { orderId: order.id }
          });
          
          if (emailResponse.error) {
            console.error('❌ Erreur envoi email confirmation:', emailResponse.error);
          } else {
            console.log('✅ Email de confirmation envoyé avec succès');
          }
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
        }
      }

      // Envoyer le SMS d'alerte au restaurant
      console.log('📱 Envoi SMS alerte restaurant pour commande:', order.id);
      try {
        const smsResponse = await supabase.functions.invoke('send-restaurant-alert', {
          body: { 
            orderId: order.id,
            restaurantId: orderData.restaurant_id 
          }
        });
        
        if (smsResponse.error) {
          console.error('❌ Erreur envoi SMS restaurant:', smsResponse.error);
        } else {
          console.log('✅ SMS alerte restaurant envoyé avec succès');
        }
      } catch (smsError) {
        console.error('❌ Erreur lors de l\'envoi du SMS restaurant:', smsError);
      }

      return new Response(JSON.stringify({ 
        received: true, 
        orderId: order.id,
        itemsCount: itemsSummary.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log('ℹ️ Événement ignoré:', event.type);
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});