import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { restaurantId, orderType, scheduledFor } = await req.json();

    console.log('🔒 Réservation atomique créneau:', { restaurantId, orderType, scheduledFor });

    if (!restaurantId || !orderType || !scheduledFor) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Définir les limites par type de commande
    const limits = {
      delivery: 1,
      pickup: 2,
      'dine-in': 10
    };

    const maxAllowed = limits[orderType as keyof typeof limits] || 1;
    
    // Si sur place, pas de limitation stricte
    if (orderType === 'dine-in') {
      console.log('✅ Commande sur place, pas de limitation');
      return new Response(
        JSON.stringify({ available: true, message: 'No limit for dine-in orders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VÉRIFICATION ET RÉSERVATION ATOMIQUE avec une transaction
    const scheduledDate = new Date(scheduledFor);
    const startTime = scheduledDate.toISOString();
    const endTime = new Date(scheduledDate.getTime() + 60000).toISOString(); // +1 minute
    
    console.log('🔒 Début transaction atomique pour:', {
      restaurantId,
      orderType,
      scheduledFor,
      startTime,
      endTime,
      maxAllowed
    });

    // Utiliser une transaction pour garantir l'atomicité
    const { data: result, error: transactionError } = await supabase.rpc('reserve_time_slot_atomic', {
      p_restaurant_id: restaurantId,
      p_order_type: orderType,
      p_scheduled_for: scheduledDate.toISOString(),
      p_start_time: startTime,
      p_end_time: endTime,
      p_max_allowed: maxAllowed
    });

    if (transactionError) {
      console.error('❌ Erreur transaction atomique:', transactionError);
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: 'Erreur lors de la réservation du créneau',
          error: transactionError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔒 Résultat transaction:', result);

    if (result && result.success) {
      console.log('✅ Créneau réservé avec succès');
      return new Response(
        JSON.stringify({ 
          available: true, 
          message: 'Créneau réservé avec succès',
          reserved: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('🚫 Créneau non disponible:', result?.message || 'Limite atteinte');
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: result?.message || `Limite de ${maxAllowed} ${orderType} atteinte pour ce créneau`,
          currentCount: result?.current_count || 0,
          maxAllowed: maxAllowed
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return new Response(
      JSON.stringify({ 
        available: false, 
        message: 'Erreur serveur lors de la réservation',
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

