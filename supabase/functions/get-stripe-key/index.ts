
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
    console.log('🔍 Début get-stripe-key');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Configuration Supabase manquante');
      throw new Error('Configuration Supabase manquante');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const body = await req.json();
    const { restaurantId } = body;
    
    console.log('🔍 Recherche clé pour restaurant:', restaurantId);
    
    if (!restaurantId) {
      throw new Error('Restaurant ID manquant');
    }

    // Récupérer la clé depuis les settings du restaurant
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('❌ Erreur récupération restaurant:', error);
      throw error;
    }

    const stripeKey = restaurant?.settings?.stripe_secret_key || null;
    
    console.log('🔍 Clé trouvée:', stripeKey ? `${stripeKey.substring(0, 10)}...` : 'Aucune clé');
    
    return new Response(JSON.stringify({ 
      stripeKey: stripeKey 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur get-stripe-key:', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
