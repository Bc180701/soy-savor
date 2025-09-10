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

    // Définir les limites par type de commande
    const limits = {
      delivery: 1,
      pickup: 2,
      'dine-in': 10 // Pas de limitation pour sur place
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

    // Compter les commandes existantes pour ce créneau et ce restaurant du type demandé
    const scheduledDate = new Date(scheduledFor);
    const startTime = scheduledDate.toISOString();
    const endTime = new Date(scheduledDate.getTime() + 60000).toISOString(); // +1 minute
    
    console.log('🔍 Requête SQL pour:', {
      restaurantId,
      orderType,
      scheduledFor,
      startTime,
      endTime
    });

    const { data: existingOrders, error } = await supabase
      .from('orders')
      .select('id, scheduled_for, restaurant_id, payment_status, order_type, client_name')
      .eq('restaurant_id', restaurantId)
      .eq('order_type', orderType) // Filtrer par le type de commande actuel
      .in('payment_status', ['paid', 'pending']) // Inclure les commandes en attente de paiement
      .gte('scheduled_for', startTime)
      .lt('scheduled_for', endTime);

    console.log('📊 Commandes trouvées:', existingOrders);

    if (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderCount = existingOrders?.length || 0;
    console.log(`📊 Commandes ${orderType} existantes pour ${scheduledFor}:`, orderCount);

    // 🚨 VÉRIFICATION CRITIQUE: Créneaux bloqués par l'admin
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
            currentCount: orderCount,
            maxAllowed,
            blockedByAdmin: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // LIMITE STRICTE: Vérification selon le type de commande
    const isAvailable = orderCount < maxAllowed;
    
    if (!isAvailable) {
      const typeMessage = orderType === 'delivery' ? 'livraison' : 'retrait';
      console.log(`🚫 CRÉNEAU PLEIN - Blocage de la commande ${orderType}`);
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: `Ce créneau de ${typeMessage} est complet. Veuillez choisir un autre horaire.`,
          currentCount: orderCount,
          maxAllowed
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Créneau disponible');
    return new Response(
      JSON.stringify({ 
        available: true, 
        message: 'Time slot available',
        currentCount: orderCount,
        maxAllowed
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