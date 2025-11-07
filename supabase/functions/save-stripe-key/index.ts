
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
    console.log('🔧 Début save-stripe-key');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Variables d\'environnement:', {
      supabaseUrl: supabaseUrl ? 'Présente' : 'MANQUANTE',
      serviceRoleKey: supabaseServiceRoleKey ? 'Présente' : 'MANQUANTE'
    });
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Variables d\'environnement manquantes');
      throw new Error('Configuration Supabase manquante');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    console.log('📦 Corps de la requête reçu:', { 
      restaurantId: body.restaurantId || 'MANQUANT',
      stripeKey: body.stripeKey ? `${body.stripeKey.substring(0, 10)}...` : 'MANQUANT'
    });
    
    const { restaurantId, stripeKey } = body;
    
    if (!restaurantId || !stripeKey) {
      console.error('❌ Paramètres manquants:', { restaurantId, stripeKey: !!stripeKey });
      throw new Error('Restaurant ID et clé Stripe requis');
    }

    // Validation du format de la clé Stripe
    console.log('🔍 Validation du format de la clé:', stripeKey.substring(0, 10));
    if (!stripeKey.startsWith('sk_live_') && !stripeKey.startsWith('sk_test_')) {
      console.error('❌ Format de clé invalide:', stripeKey.substring(0, 10));
      throw new Error('Format de clé Stripe invalide. La clé doit commencer par sk_live_ ou sk_test_');
    }

    console.log('💾 Sauvegarde clé Stripe pour restaurant:', restaurantId);

    // Récupérer les settings actuels
    console.log('🔍 Récupération des settings actuels...');
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur récupération restaurant:', fetchError);
      throw new Error(`Restaurant non trouvé: ${fetchError.message}`);
    }

    console.log('✅ Restaurant trouvé, settings actuels:', restaurant?.settings ? 'Présents' : 'Vides');

    // Mettre à jour les settings avec la nouvelle clé
    const currentSettings = restaurant?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      stripe_secret_key: stripeKey
    };

    console.log('💾 Mise à jour des settings...');
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ settings: updatedSettings })
      .eq('id', restaurantId);

    if (updateError) {
      console.error('❌ Erreur mise à jour restaurant:', updateError);
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
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
    console.error('❌ Erreur détaillée save-stripe-key:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Voir les logs pour plus de détails'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
