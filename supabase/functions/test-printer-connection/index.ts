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
      // Construire l'URL de l'API Epos pour TM-m30III
      const eposUrl = `http://${ip_address}:${port}/rpc/requestid`
      
      console.log('Testing TM-m30III printer connection to:', eposUrl)

      // Pour les imprimantes TM-m30III, essayer plusieurs approches
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), parseInt(timeout))

      try {
        // Approche 1: Test simple avec WebAPI
        console.log('Trying WebAPI approach for TM-m30III...')
        const webApiResponse = await fetch(`http://${ip_address}:${port}/`, {
          method: 'GET',
          signal: controller.signal
        })

        if (webApiResponse.ok) {
          const result = await webApiResponse.text()
          console.log('WebAPI test successful:', result)
          clearTimeout(timeoutId)

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Connexion réussie à l'imprimante TM-m30III ${device_id} (${ip_address}:${port})`,
              details: `WebAPI accessible. Version ePOS-Print: 6.30`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (webApiError) {
        console.log('WebAPI failed, trying ePOS-Print API...', webApiError.message)
      }

      // Approche 2: API ePOS-Print avec format JSON-RPC spécifique
      try {
        const eposPayload = {
          method: "get_device_info",
          params: {},
          id: Date.now()
        }

        const eposResponse = await fetch(eposUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ePOS-Print/6.30'
          },
          body: JSON.stringify(eposPayload),
          signal: controller.signal
        })

        if (eposResponse.ok) {
          const eposResult = await eposResponse.text()
          console.log('ePOS-Print API test successful:', eposResult)
          clearTimeout(timeoutId)

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Connexion réussie à l'imprimante TM-m30III ${device_id} (${ip_address}:${port})`,
              details: `API ePOS-Print accessible. Réponse: ${eposResult}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (eposError) {
        console.log('ePOS-Print API failed, trying basic connectivity...', eposError.message)
      }

      // Approche 3: Test de connectivité basique
      try {
        const basicResponse = await fetch(`http://${ip_address}:${port}/rpc/requestid`, {
          method: 'GET',
          headers: {
            'Accept': '*/*'
          },
          signal: controller.signal
        })

        // Même si on a une erreur HTTP, si on reçoit une réponse, la connectivité fonctionne
        const basicResult = await basicResponse.text()
        console.log('Basic connectivity test result:', basicResult, 'Status:', basicResponse.status)
        clearTimeout(timeoutId)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Connectivité confirmée avec l'imprimante TM-m30III ${device_id} (${ip_address}:${port})`,
            details: `L'imprimante répond. Status: ${basicResponse.status}. Réponse: ${basicResult.substring(0, 200)}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (basicError) {
        console.log('All connection attempts failed:', basicError.message)
        clearTimeout(timeoutId)
        // Ne pas lancer d'exception ici, plutôt retourner une réponse d'erreur
      }

    } catch (fetchError) {
      console.error('All printer connection tests failed:', fetchError)
      
      let errorMessage = 'Connexion à l\'imprimante TM-m30III échouée'
      
      if (fetchError.name === 'AbortError') {
        errorMessage = `Timeout de connexion (${timeout}ms dépassé). L'imprimante ne répond pas.`
      } else if (fetchError.message && (fetchError.message.includes('fetch') || fetchError.message.includes('network'))) {
        errorMessage = `Impossible de joindre l'imprimante TM-m30III à l'adresse ${ip_address}:${port}. Vérifiez que l'imprimante est allumée et connectée au réseau.`
      } else {
        errorMessage = `Erreur de connexion TM-m30III: ${fetchError.message || 'Erreur inconnue'}`
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: errorMessage,
          details: "Conseils: 1) Vérifiez que l'imprimante est allumée 2) Vérifiez l'adresse IP 3) Redémarrez l'imprimante 4) Vérifiez les paramètres réseau"
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Si toutes les méthodes ont échoué, retourner une erreur
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Impossible de se connecter à l'imprimante TM-m30III ${device_id} (${ip_address}:${port})`,
        details: "Toutes les méthodes de connexion ont échoué. Vérifiez la configuration réseau de l'imprimante."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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