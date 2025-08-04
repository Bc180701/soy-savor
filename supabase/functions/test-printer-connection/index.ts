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

    console.log('Testing printer connection for restaurant:', restaurantId)

    // Récupérer la configuration de l'imprimante
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

    const printerConfig = restaurant?.settings?.printer_config

    if (!printerConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Aucune configuration d\'imprimante trouvée pour ce restaurant' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Tester la connexion à l'imprimante via l'API Epos
    const { ip_address, port = "8008", device_id, timeout = "30000" } = printerConfig
    
    console.log(`Testing connection to printer at ${ip_address}:${port} with device ID: ${device_id}`)

    try {
      // Construire l'URL de l'API Epos
      const eposUrl = `http://${ip_address}:${port}/rpc/requestid`
      
      console.log('Testing simple GET request to:', eposUrl)

      // Essayer d'abord une requête GET simple pour vérifier l'accessibilité
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), parseInt(timeout))

      const response = await fetch(eposUrl, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('Response status:', response.status)

      if (response.ok || response.status === 200) {
        const result = await response.text()
        console.log('GET test successful:', result)

        // Si nous arrivons ici, la connexion fonctionne
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Connexion réussie à l'imprimante ${device_id} (${ip_address}:${port})`,
            details: `API ePOS-Print accessible. Réponse: ${result}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } else {
        // Si GET échoue, essayer POST avec JSON-RPC
        console.log('GET failed, trying POST with JSON-RPC')
        
        const testPayload = {
          method: "discover",
          params: {
            protocol: "simple"
          },
          id: "test_connection_" + Date.now()
        }

        const controller2 = new AbortController()
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000)

        const postResponse = await fetch(eposUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload),
          signal: controller2.signal
        })

        clearTimeout(timeoutId2)

        if (postResponse.ok) {
          const postResult = await postResponse.text()
          console.log('POST test successful:', postResult)

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Connexion réussie à l'imprimante ${device_id} (${ip_address}:${port})`,
              details: `API ePOS-Print accessible via POST. Réponse: ${postResult}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          throw new Error(`Both GET and POST failed. GET status: ${response.status}, POST status: ${postResponse.status}`)
        }
      }

    } catch (fetchError) {
      console.error('Printer connection test failed:', fetchError)
      
      let errorMessage = 'Connexion à l\'imprimante échouée'
      
      if (fetchError.name === 'AbortError') {
        errorMessage = `Timeout de connexion (${timeout}ms dépassé)`
      } else if (fetchError.message.includes('fetch')) {
        errorMessage = `Impossible de joindre l'imprimante à l'adresse ${ip_address}:${port}`
      } else {
        errorMessage = `Erreur de connexion: ${fetchError.message}`
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in test-printer-connection function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Erreur interne du serveur lors du test de connexion' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})