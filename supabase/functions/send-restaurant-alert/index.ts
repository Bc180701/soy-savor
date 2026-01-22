import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Début send-restaurant-alert');
    
    const { orderId, restaurantId } = await req.json();
    
    if (!orderId || !restaurantId) {
      throw new Error('orderId et restaurantId sont requis');
    }

    console.log('📋 Paramètres reçus:', { orderId, restaurantId });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Récupérer les informations de la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total, client_name, client_phone, order_type, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('❌ Erreur récupération commande:', orderError);
      throw new Error('Commande non trouvée');
    }

    console.log('📦 Commande trouvée:', order);

    // Récupérer les informations du restaurant et son numéro d'alerte
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('name, settings')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      console.error('❌ Erreur récupération restaurant:', restaurantError);
      throw new Error('Restaurant non trouvé');
    }

    console.log('🏪 Restaurant trouvé:', restaurant.name, 'Settings:', restaurant.settings);

    const alertPhone = (restaurant.settings as any)?.order_alert_phone as string | undefined;
    const gatewayApiToken = Deno.env.get('GATEWAYAPI_TOKEN');

    console.log('📱 Numéro d\'alerte configuré:', alertPhone);
    console.log('🔑 Token Gateway API présent:', !!gatewayApiToken);

    if (!alertPhone) {
      console.log('⚠️ Aucun numéro d\'alerte configuré pour ce restaurant');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Aucun numéro d\'alerte configuré' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!gatewayApiToken) {
      console.error('❌ Token Gateway API manquant');
      throw new Error('Configuration SMS manquante');
    }

    // Formatter le numéro de téléphone
    const clean = alertPhone.replace(/[\s\-\(\)]/g, '');
    let formattedPhone = clean;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+33' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+33' + formattedPhone;
    }

    console.log('📞 Numéro formaté:', formattedPhone);

    // Créer le message d'alerte
    const shortId = order.id.toString().slice(0, 8);
    const totalStr = typeof order.total === 'number' ? order.total.toFixed(2) : `${order.total}`;
    const orderTypeText = order.order_type === 'delivery' ? 'Livraison' : 
                         order.order_type === 'pickup' ? 'À emporter' : 
                         order.order_type === 'dine_in' ? 'Sur place' : order.order_type;
    
    const message = `🛎️ NOUVELLE COMMANDE PAYÉE #${shortId}
Type: ${orderTypeText}
Total: ${totalStr}€
Client: ${order.client_name || 'Anonyme'} ${order.client_phone || ''}`.trim();

    console.log('💬 Message à envoyer:', message);

    // Envoyer le SMS via Gateway API
    const smsBody = {
      sender: 'SUSHIEATS',
      message: message,
      recipients: [{ msisdn: formattedPhone }],
    };

    console.log('📤 Envoi SMS...');

    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(gatewayApiToken + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur envoi SMS:', response.status, errorText);
      throw new Error(`Erreur envoi SMS: ${response.status} ${errorText}`);
    }

    const smsResult = await response.json();
    console.log('✅ SMS envoyé avec succès:', smsResult);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Alerte SMS envoyée',
      smsResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur send-restaurant-alert:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});