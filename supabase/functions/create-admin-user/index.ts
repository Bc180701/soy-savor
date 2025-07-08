
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

    console.log('=== CRÉATION ADMIN DEBUG ===')
    console.log('Email:', email)
    console.log('Password reçu:', !!password)

    // Validation
    if (!email || !password) {
      console.error('Email ou mot de passe manquant')
      throw new Error('Email et mot de passe requis')
    }

    if (password.length < 6) {
      console.error('Mot de passe trop court:', password.length)
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

    console.log('Client Supabase Admin créé')

    // Vérifier si l'utilisateur existe déjà en utilisant l'Admin API
    console.log('Vérification existence utilisateur avec Admin API...')
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Erreur lors de la récupération des utilisateurs:', listError)
      throw new Error(`Impossible de vérifier les utilisateurs existants: ${listError.message}`)
    }

    const existingUser = usersList.users.find(user => user.email === email)
    console.log('Utilisateur existant trouvé:', !!existingUser)

    // Si l'utilisateur existe déjà, vérifier s'il a déjà le rôle admin
    if (existingUser) {
      console.log('Utilisateur existant trouvé:', existingUser.id)
      
      // Vérifier si l'utilisateur a déjà le rôle administrateur
      const { data: existingRole, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id)
        .eq('role', 'administrateur')
        .single()

      if (roleCheckError && roleCheckError.code !== 'PGRST116') {
        console.error('Erreur vérification rôle:', roleCheckError)
        throw new Error(`Erreur lors de la vérification du rôle: ${roleCheckError.message}`)
      }

      if (existingRole) {
        console.log('Utilisateur a déjà le rôle administrateur')
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Cet utilisateur a déjà le rôle administrateur',
            user: {
              id: existingUser.id,
              email: existingUser.email
            }
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      // L'utilisateur existe mais n'a pas le rôle admin, on l'ajoute
      console.log('Ajout du rôle administrateur à l\'utilisateur existant')
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: existingUser.id,
          role: 'administrateur'
        })

      if (roleError) {
        console.error('Erreur ajout rôle:', roleError)
        throw new Error(`Erreur lors de l'ajout du rôle: ${roleError.message}`)
      }

      console.log('Rôle administrateur ajouté avec succès à l\'utilisateur existant')

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Rôle administrateur ajouté à l\'utilisateur existant',
          user: {
            id: existingUser.id,
            email: existingUser.email
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // L'utilisateur n'existe pas, on le crée
    console.log('Création d\'un nouvel utilisateur...')

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
      console.error('Aucun utilisateur créé dans la réponse')
      throw new Error('Aucun utilisateur créé')
    }

    console.log('Utilisateur créé avec succès:', userData.user.id)

    // Ajouter le rôle administrateur
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'administrateur'
      })

    if (roleError) {
      console.error('Erreur ajout rôle:', roleError)
      throw new Error(`Erreur lors de l'ajout du rôle: ${roleError.message}`)
    }

    console.log('Rôle administrateur ajouté avec succès')

    // Créer le profil utilisateur (optionnel)
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
    } else {
      console.log('Profil créé avec succès')
    }

    console.log('=== CRÉATION ADMIN TERMINÉE AVEC SUCCÈS ===')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Administrateur créé avec succès',
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
    console.error('=== ERREUR DANS CREATE-ADMIN-USER ===')
    console.error('Type:', typeof error)
    console.error('Message:', error.message || 'Erreur inconnue')
    console.error('Stack:', error.stack || 'Pas de stack trace')
    console.error('Objet complet:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur inconnue lors de la création de l\'administrateur'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
