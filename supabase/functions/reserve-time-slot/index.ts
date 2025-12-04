import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventTimeSlot {
  time: string;
  maxOrders?: number;
}

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

    // Définir les limites par défaut par type de commande
    const defaultLimits = {
      delivery: 1,
      pickup: 2,
      'dine-in': 10
    };

    let maxAllowed = defaultLimits[orderType as keyof typeof defaultLimits] || 1;
    
    // Si sur place, pas de limitation stricte
    if (orderType === 'dine-in') {
      console.log('✅ Commande sur place, pas de limitation');
      return new Response(
        JSON.stringify({ available: true, message: 'No limit for dine-in orders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire la date et l'heure du créneau
    const scheduledDate = new Date(scheduledFor);
    const dateOnly = scheduledDate.toISOString().split('T')[0]; // Format "2025-12-24"
    const timeOnly = scheduledDate.toTimeString().slice(0, 5); // Format "13:40"

    console.log('📅 Vérification événement spécial pour:', { dateOnly, timeOnly, restaurantId });

    // Chercher un événement spécial actif pour cette date
    const { data: eventData, error: eventError } = await supabase
      .from('special_events')
      .select('id, name, time_slots')
      .eq('is_active', true)
      .eq('event_date', dateOnly)
      .maybeSingle();

    if (eventError) {
      console.error('⚠️ Erreur recherche événement:', eventError);
    }

    // Si un événement est trouvé, utiliser ses limites
    if (eventData && eventData.time_slots) {
      const eventSlots = eventData.time_slots as EventTimeSlot[];
      const matchingSlot = eventSlots.find(s => s.time === timeOnly);
      
      if (matchingSlot && matchingSlot.maxOrders) {
        maxAllowed = matchingSlot.maxOrders;
        console.log(`🎄 Créneau événement "${eventData.name}" détecté - Limite: ${maxAllowed} (au lieu de ${defaultLimits[orderType as keyof typeof defaultLimits]})`);
      } else {
        console.log(`🎄 Événement "${eventData.name}" trouvé mais pas de limite spécifique pour ${timeOnly}, utilisation limite par défaut: ${maxAllowed}`);
      }
    } else {
      console.log(`📋 Pas d'événement spécial pour ${dateOnly}, utilisation limite par défaut: ${maxAllowed}`);
    }

    // VÉRIFICATION ET RÉSERVATION ATOMIQUE avec une transaction
    const startTime = scheduledDate.toISOString();
    const endTime = new Date(scheduledDate.getTime() + 60000).toISOString(); // +1 minute
    
    console.log('🔒 Début transaction atomique pour:', {
      restaurantId,
      orderType,
      scheduledFor,
      startTime,
      endTime,
      maxAllowed,
      isEventSlot: !!eventData
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
          reserved: true,
          isEventSlot: !!eventData
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
          maxAllowed: maxAllowed,
          isEventSlot: !!eventData
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
