
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

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
        // Si aucun article n'est encore lié à cette commande, essayons de les ajouter maintenant
        const { data: existingItems, error: existingItemsErr } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', existingOrder.id)
          .limit(1);

        if (existingItemsErr) {
          console.error('⚠️ Erreur vérification des articles existants:', existingItemsErr);
        }

        const metadata = event?.data?.object?.metadata || {};
        const restaurantIdForItems = metadata.restaurant_id || '22222222-2222-2222-2222-222222222222';

        if (!existingItemsErr && (!existingItems || existingItems.length === 0)) {
          console.log('🧩 Aucuns articles liés à la commande existante. Tentative d\'insertion depuis métadonnées...');
          const itemsData = metadata.items_summary || metadata.items;
          if (itemsData) {
            try {
              const items = JSON.parse(itemsData);

              const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

              const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
                const { data: cat } = await supabase
                  .from('categories')
                  .select('id')
                  .eq('id', 'extras')
                  .eq('restaurant_id', restaurantId)
                  .maybeSingle();
                if (cat?.id) return cat.id as string;
                const { data: newCat, error: insErr } = await supabase
                  .from('categories')
                  .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
                  .select('id')
                  .single();
                if (insErr) {
                  console.log('⚠️ Création catégorie extras impossible/inutile:', insErr.message);
                  return 'extras';
                }
                return newCat.id as string;
              };

              const resolveProductId = async (name: string, price: number, restaurantId: string): Promise<string> => {
                // 1) Tenter de trouver un produit existant par nom (peu importe is_extra)
                const { data: existingByName } = await supabase
                  .from('products')
                  .select('id')
                  .eq('restaurant_id', restaurantId)
                  .eq('name', name)
                  .maybeSingle();
                if (existingByName?.id) return existingByName.id as string;

                // 2) Créer en fallback dans la catégorie "extras" (caché)
                const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
                  const { data: cat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('id', 'extras')
                    .eq('restaurant_id', restaurantId)
                    .maybeSingle();
                  if (cat?.id) return cat.id as string;
                  const { data: newCat, error: insErr } = await supabase
                    .from('categories')
                    .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
                    .select('id')
                    .single();
                  if (insErr) {
                    console.log('⚠️ Création catégorie extras impossible/inutile:', insErr.message);
                    return 'extras';
                  }
                  return newCat.id as string;
                };

                try {
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
                    // Conflit d'unicité: récupérer l'ID existant
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
                } catch (e) {
                  throw e;
                }
              };

              const orderItems: any[] = [];
              if (Array.isArray(items)) {
                for (const item of items) {
                  let productId = item.id || item.menuItem?.id || item.product_id;
                  const quantity = item.quantity || 1;
                  const price = item.price || item.menuItem?.price || 0;
                  const special_instructions = item.specialInstructions || item.special_instructions || null;
                  if (!isUuid(productId)) {
                    const name = item.name || item.menuItem?.name || 'Extra';
                    try {
                      productId = await resolveProductId(name, price, restaurantIdForItems);
                    } catch (e) {
                      console.error('❌ Échec création/lookup produit; item ignoré:', e);
                      continue;
                    }
                  }
                  orderItems.push({ order_id: existingOrder.id, product_id: productId, quantity, price, special_instructions });
                }
              }

              if (orderItems.length > 0) {
                const { error: itemsError } = await supabase
                  .from('order_items')
                  .insert(orderItems);
                if (itemsError) {
                  console.error('❌ Erreur ajout articles (commande existante):', itemsError);
                } else {
                  console.log(`✅ ${orderItems.length} article(s) ajoutés à la commande existante`);
                }
              } else {
                console.log('⚠️ Aucun article insérable pour la commande existante');
              }
            } catch (e) {
              console.error('❌ Erreur parsing des items pour commande existante:', e);
            }
          } else {
            console.log('ℹ️ Pas de items_summary dans les métadonnées pour la commande existante');
          }
        }

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

      try {
        // Créer la commande dans Supabase avec toutes les données
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
          customer_notes: null,
        };

        console.log('📝 Création commande depuis webhook:', {
          restaurant_id: orderData.restaurant_id,
          total: orderData.total,
          client_email: orderData.client_email,
          order_type: orderData.order_type
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

        console.log('✅ Commande créée avec ID:', order.id, 'pour restaurant:', restaurantId);

        // Ajouter les articles de la commande
        const itemsData = metadata?.items_summary || metadata?.items;
        if (itemsData) {
          try {
            const items = JSON.parse(itemsData);
            console.log('📦 Articles à créer:', items.length);
            // Créer/assurer les produits pour les extras sans UUID puis insérer tous les items
            const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);

            const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
              const { data: cat } = await supabase
                .from('categories')
                .select('id')
                .eq('id', 'extras')
                .eq('restaurant_id', restaurantId)
                .maybeSingle();
              if (cat?.id) return cat.id as string;
              const { data: newCat, error: insErr } = await supabase
                .from('categories')
                .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
                .select('id')
                .single();
              if (insErr) {
                console.log('⚠️ Création catégorie extras impossible/inutile:', insErr.message);
                return 'extras';
              }
              return newCat.id as string;
            };

            const resolveProductId = async (name: string, price: number, restaurantId: string): Promise<string> => {
              // 1) Tenter de trouver un produit existant par nom (peu importe is_extra)
              const { data: existingByName } = await supabase
                .from('products')
                .select('id')
                .eq('restaurant_id', restaurantId)
                .eq('name', name)
                .maybeSingle();
              if (existingByName?.id) return existingByName.id as string;

              // 2) Créer en fallback dans la catégorie "extras" (caché)
              const ensureExtrasCategory = async (restaurantId: string): Promise<string> => {
                const { data: cat } = await supabase
                  .from('categories')
                  .select('id')
                  .eq('id', 'extras')
                  .eq('restaurant_id', restaurantId)
                  .maybeSingle();
                if (cat?.id) return cat.id as string;
                const { data: newCat, error: insErr } = await supabase
                  .from('categories')
                  .insert({ id: 'extras', name: 'Extras', description: 'Produits optionnels (non listés)', display_order: 9999, restaurant_id: restaurantId })
                  .select('id')
                  .single();
                if (insErr) {
                  console.log('⚠️ Création catégorie extras impossible/inutile:', insErr.message);
                  return 'extras';
                }
                return newCat.id as string;
              };

              try {
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
              } catch (e) {
                throw e;
              }
            };

            const orderItems: any[] = [];
            if (Array.isArray(items)) {
              for (const item of items) {
                let productId = item.id || item.menuItem?.id || item.product_id;
                const quantity = item.quantity || 1;
                const price = item.price || item.menuItem?.price || 0;
                const special_instructions = item.specialInstructions || item.special_instructions || null;
                if (!isUuid(productId)) {
                  const name = item.name || item.menuItem?.name || 'Extra';
                  try {
                    productId = await resolveProductId(name, price, order.restaurant_id);
                  } catch (e) {
                    console.error('❌ Échec création/lookup produit; item ignoré:', e);
                    continue;
                  }
                }
                orderItems.push({ order_id: order.id, product_id: productId, quantity, price, special_instructions });
              }
            }

            if (orderItems.length > 0) {
              const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

              if (itemsError) {
                console.error('❌ Erreur ajout articles:', itemsError);
              } else {
                console.log(`✅ ${orderItems.length} article(s) ajoutés depuis webhook`);
              }
            } else {
              console.log('⚠️ Aucun article insérable (tous sans UUID)');
            }
          } catch (itemsError) {
            console.error('❌ Erreur lors de l\'ajout des articles:', itemsError);
          }
        }

      } catch (error) {
        console.error('❌ Erreur lors de la création de la commande depuis webhook:', error);
        return new Response('Erreur lors de la création de la commande', { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (err) {
    console.error('❌ Erreur du webhook:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 500 });
  }
});
