
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
    const { email, password } = await req.json()

    // Validation
    if (!email || !password) {
      throw new Error('Email et mot de passe requis')
    }

    if (password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères')
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

    console.log('Création de l\'utilisateur avec l\'Admin API...')

    // Créer l'utilisateur avec l'Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Confirmer l'email automatiquement
    })

    if (userError) {
      console.error('Erreur création utilisateur:', userError)
      throw new Error(`Erreur lors de la création du compte: ${userError.message}`)
    }

    if (!userData.user) {
      throw new Error('Aucun utilisateur créé')
    }

    console.log('Utilisateur créé avec succès:', userData.user.id)

    // Ajouter le rôle administrateur avec le service role (bypass RLS)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'administrateur'
      })
      .select()

    if (roleError) {
      console.error('Erreur ajout rôle:', roleError)
      throw new Error(`Erreur lors de l'ajout du rôle: ${roleError.message}`)
    }

    console.log('Rôle administrateur ajouté avec succès')

    // Créer le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.user.id,
        first_name: '',
        last_name: ''
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      // Ne pas faire échouer la création pour une erreur de profil
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erreur dans create-admin-user:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
