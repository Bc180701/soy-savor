import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { restaurantId } = await req.json()
    
    if (!restaurantId) {
      return new Response(
        JSON.stringify({ error: 'Restaurant ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Fetching printer config for restaurant:', restaurantId)

    // Récupérer la configuration de l'imprimante depuis la table restaurants
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single()

    if (error) {
      console.error('Error fetching restaurant:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch restaurant settings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const printerConfig = restaurant?.settings?.printer_config || null

    console.log('Printer config found:', printerConfig ? 'Yes' : 'No')

    return new Response(
      JSON.stringify({ printerConfig }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-printer-config function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})