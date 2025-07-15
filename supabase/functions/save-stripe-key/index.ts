
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2.43.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { restaurantId, stripeKey } = await req.json();
    
    if (!restaurantId || !stripeKey) {
      throw new Error('Restaurant ID et clé Stripe requis');
    }

    // Validation basique de la clé Stripe
    if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
      throw new Error('Format de clé Stripe invalide');
    }

    console.log('💾 Sauvegarde clé Stripe pour restaurant:', restaurantId);

    // Récupérer les settings actuels
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single();

    if (fetchError) {
      console.error('Erreur récupération restaurant:', fetchError);
      throw fetchError;
    }

    // Mettre à jour les settings avec la nouvelle clé
    const currentSettings = restaurant?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      stripe_secret_key: stripeKey
    };

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ settings: updatedSettings })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('Erreur mise à jour restaurant:', updateError);
      throw updateError;
    }

    console.log('✅ Clé Stripe sauvegardée avec succès');
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Clé API Stripe sauvegardée avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur save-stripe-key:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
