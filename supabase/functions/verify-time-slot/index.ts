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

    console.log('🔍 Vérification créneau:', { restaurantId, orderType, scheduledFor });

    if (!restaurantId || !orderType || !scheduledFor) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si ce n'est pas une livraison, pas besoin de limiter
    if (orderType !== 'delivery') {
      console.log('✅ Commande à emporter/sur place, pas de limitation');
      return new Response(
        JSON.stringify({ available: true, message: 'No limit for pickup/dine-in orders' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compter les livraisons existantes pour ce créneau et ce restaurant
    console.log('🔍 Requête SQL pour:', {
      restaurantId,
      orderType,
      scheduledFor,
      startTime: scheduledFor,
      endTime: new Date(new Date(scheduledFor).getTime() + 60000).toISOString()
    });

    const { data: existingOrders, error } = await supabase
      .from('orders')
      .select('id, scheduled_for, restaurant_id, payment_status, order_type')
      .eq('restaurant_id', restaurantId)
      .eq('order_type', 'delivery')
      .in('payment_status', ['paid', 'pending']) // Inclure les commandes en attente de paiement
      .gte('scheduled_for', scheduledFor)
      .lt('scheduled_for', new Date(new Date(scheduledFor).getTime() + 60000).toISOString()); // +1 minute

    console.log('📊 Commandes trouvées:', existingOrders);

    if (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deliveryCount = existingOrders?.length || 0;
    console.log(`📊 Livraisons existantes pour ${scheduledFor}:`, deliveryCount);

    // 🚨 VÉRIFICATION CRITIQUE: Créneaux bloqués par l'admin
    const scheduledDate = new Date(scheduledFor);
    const timeOnly = scheduledDate.toTimeString().slice(0, 5); // Format HH:MM
    const dateOnly = scheduledDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    console.log('🔍 Vérification créneau bloqué:', {
      restaurantId,
      dateOnly,
      timeOnly
    });

    const { data: blockedSlots, error: blockedError } = await supabase
      .from('blocked_time_slots')
      .select('id, blocked_time, reason')
      .eq('restaurant_id', restaurantId)
      .eq('blocked_date', dateOnly)
      .eq('blocked_time', timeOnly + ':00'); // Ajouter les secondes

    if (blockedError) {
      console.error('❌ Erreur vérification créneaux bloqués:', blockedError);
    } else {
      console.log('📋 Créneaux bloqués trouvés:', blockedSlots);
      
      if (blockedSlots && blockedSlots.length > 0) {
        console.log('🚫 CRÉNEAU BLOQUÉ PAR L\'ADMIN - Commande refusée');
        return new Response(
          JSON.stringify({ 
            available: false, 
            message: `Ce créneau a été bloqué par l'administration. ${blockedSlots[0].reason || ''}`.trim(),
            currentCount: deliveryCount,
            maxAllowed: 1,
            blockedByAdmin: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // LIMITE STRICTE: Maximum 1 livraison par créneau de 1 minute
    const isAvailable = deliveryCount < 1;
    
    if (!isAvailable) {
      console.log('🚫 CRÉNEAU PLEIN - Blocage de la commande');
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: 'Ce créneau de livraison est complet. Veuillez choisir un autre horaire.',
          currentCount: deliveryCount,
          maxAllowed: 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Créneau disponible');
    return new Response(
      JSON.stringify({ 
        available: true, 
        message: 'Time slot available',
        currentCount: deliveryCount,
        maxAllowed: 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur dans verify-time-slot:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});