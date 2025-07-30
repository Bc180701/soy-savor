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
    
    const { restaurantId, printerConfig } = await req.json()
    
    if (!restaurantId || !printerConfig) {
      return new Response(
        JSON.stringify({ error: 'Restaurant ID and printer config are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Valider la configuration de l'imprimante
    if (!printerConfig.ip_address || !printerConfig.device_id) {
      return new Response(
        JSON.stringify({ error: 'IP address and device ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Saving printer config for restaurant:', restaurantId)

    // Récupérer les paramètres actuels du restaurant
    const { data: currentRestaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single()

    if (fetchError) {
      console.error('Error fetching current restaurant settings:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current restaurant settings' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fusionner les nouveaux paramètres avec les existants
    const currentSettings = currentRestaurant?.settings || {}
    const updatedSettings = {
      ...currentSettings,
      printer_config: {
        ip_address: printerConfig.ip_address,
        port: printerConfig.port || "8008",
        device_id: printerConfig.device_id,
        timeout: printerConfig.timeout || "30000"
      }
    }

    // Mettre à jour les paramètres du restaurant
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ settings: updatedSettings })
      .eq('id', restaurantId)

    if (updateError) {
      console.error('Error updating restaurant settings:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save printer configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Printer config saved successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Printer configuration saved successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in save-printer-config function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})