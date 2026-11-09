
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSNotificationRequest {
  phoneNumber: string;
  message: string;
  orderId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, message, orderId }: SMSNotificationRequest = await req.json();
    
    console.log(`📱 Envoi SMS pour commande ${orderId} au ${phoneNumber}`);
    
    const gatewayApiToken = Deno.env.get('GATEWAYAPI_TOKEN');
    if (!gatewayApiToken) {
      throw new Error('GATEWAYAPI_TOKEN non configuré');
    }

    console.log('Service SMS configuré');

    // Nettoyer le numéro de téléphone (enlever espaces, tirets, etc.)
    const cleanPhoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // S'assurer que le numéro commence par +33 pour la France
    let formattedPhone = cleanPhoneNumber;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+33' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+33' + formattedPhone;
    }

    console.log(`📞 Numéro formaté: ${formattedPhone}`);

    // Préparer les données à envoyer
    const requestBody = {
      sender: 'SUSHIEATS',
      message: message,
      recipients: [
        {
          msisdn: formattedPhone
        }
      ]
    };

    console.log('📤 Données à envoyer:', JSON.stringify(requestBody, null, 2));

    // Appel à l'API Gateway API avec une authentification basique
    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(gatewayApiToken + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📡 Réponse Gateway API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur Gateway API (${response.status}):`, errorText);
      
      // Essayer avec l'authentification Bearer en fallback
      console.log('🔄 Tentative avec authentification Bearer...');
      const fallbackResponse = await fetch('https://gatewayapi.com/rest/mtsms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gatewayApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!fallbackResponse.ok) {
        const fallbackErrorText = await fallbackResponse.text();
        console.error(`❌ Erreur Gateway API fallback (${fallbackResponse.status}):`, fallbackErrorText);
        throw new Error(`Erreur Gateway API: ${fallbackResponse.status} - ${fallbackErrorText}`);
      }

      const fallbackResult = await fallbackResponse.json();
      console.log('✅ SMS envoyé avec succès (fallback):', fallbackResult);

      return new Response(JSON.stringify({ 
        success: true, 
        messageId: fallbackResult.ids?.[0],
        message: 'SMS envoyé avec succès (fallback)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const result = await response.json();
    console.log('✅ SMS envoyé avec succès:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.ids?.[0],
      message: 'SMS envoyé avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du SMS:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
