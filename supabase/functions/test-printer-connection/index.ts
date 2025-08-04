import { corsHeaders } from '../_shared/cors.ts'

interface PrinterConfig {
  ip_address: string;
  port: string;
  device_id: string;
  timeout: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { printerConfig }: { printerConfig: PrinterConfig } = await req.json();
    
    if (!printerConfig?.ip_address || !printerConfig?.device_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Configuration incomplète",
          details: "IP et Device ID sont requis"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { ip_address, port = "8008", device_id } = printerConfig;
    
    console.log(`🧪 Test de connexion vers http://${ip_address}:${port}`);

    // Test 1: Connectivité de base
    try {
      const baseResponse = await fetch(`http://${ip_address}:${port}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (!baseResponse.ok) {
        throw new Error(`HTTP ${baseResponse.status}`);
      }

      console.log('✅ Connexion de base réussie');

      // Test 2: API ePOS-Print
      try {
        const eposResponse = await fetch(`http://${ip_address}:${port}/rpc/requestid`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });

        if (eposResponse.ok) {
          const result = await eposResponse.text();
          console.log('✅ API ePOS-Print accessible');

          // Test 3: Test d'impression simple
          try {
            const testPrintPayload = {
              method: "print",
              params: {
                devid: device_id,
                timeout: 10000
              },
              id: Date.now()
            };

            const printResponse = await fetch(`http://${ip_address}:${port}/rpc/requestid`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(testPrintPayload),
              signal: AbortSignal.timeout(10000)
            });

            const printResult = await printResponse.text();
            console.log('✅ Test d\'impression envoyé:', printResult.substring(0, 100));

            return new Response(
              JSON.stringify({
                success: true,
                message: 'Test complet réussi',
                details: `Connexion OK, API accessible, test d'impression envoyé. Device ID: ${device_id}`
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );

          } catch (printError) {
            console.log('⚠️ Test d\'impression partiel:', printError.message);
            
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Connexion réussie, test d\'impression partiel',
                details: `L'imprimante répond mais le test d'impression a échoué: ${printError.message}`
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

        } else {
          console.log(`❌ API ePOS-Print: HTTP ${eposResponse.status}`);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: 'API ePOS-Print non accessible',
              details: `L'imprimante répond mais l'API ePOS-Print retourne: HTTP ${eposResponse.status}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      } catch (eposError) {
        console.log('❌ Erreur API ePOS-Print:', eposError.message);
        
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Erreur API ePOS-Print',
            details: `L'imprimante répond mais l'API ePOS-Print est inaccessible: ${eposError.message}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

    } catch (baseError) {
      console.log('❌ Erreur de connexion de base:', baseError.message);
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Impossible de joindre l\'imprimante',
          details: `Vérifiez l'adresse IP (${ip_address}:${port}) et que l'imprimante est allumée et connectée au réseau.`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erreur de test de connexion',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});