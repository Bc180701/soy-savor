import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userIds } = await req.json()

    if (!userIds || !Array.isArray(userIds)) {
      throw new Error('userIds requis et doit être un tableau')
    }

    // Créer le client Supabase avec le service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Récupération des utilisateurs admin:', userIds)

    // Récupérer la liste complète des utilisateurs
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Erreur lors de la récupération des utilisateurs:', listError)
      throw new Error(`Impossible de récupérer les utilisateurs: ${listError.message}`)
    }

    // Filtrer les utilisateurs par les IDs demandés
    const adminUsers = usersList.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at
      }))

    console.log('Utilisateurs admin trouvés:', adminUsers.length)

    return new Response(
      JSON.stringify({
        success: true,
        users: adminUsers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== ERREUR DANS GET-ADMIN-USERS ===')
    console.error('Message:', error.message || 'Erreur inconnue')
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur inconnue lors de la récupération des administrateurs'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})