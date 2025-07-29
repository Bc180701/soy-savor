import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    // Create Supabase admin client
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

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Check if user is super admin
    const { data: isSuperAdmin, error: superAdminError } = await supabaseAdmin
      .rpc('is_super_admin', { user_id: user.id })

    if (superAdminError || !isSuperAdmin) {
      throw new Error('Access denied: Super admin privileges required')
    }

    console.log('Super admin verified, fetching admin users...')

    // Get all admin users (non-super admins)
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'administrateur')

    if (rolesError) {
      console.error('Error fetching admin roles:', rolesError)
      throw rolesError
    }

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const userIds = adminRoles.map(role => role.user_id)
    console.log('Found admin user IDs:', userIds)

    // Get user details from auth.users using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw authError
    }

    // Filter to only admin users
    const adminAuthUsers = authUsers.users.filter(user => userIds.includes(user.id))

    // Get profiles for additional info
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      // Don't throw, profiles are optional
    }

    // Merge the data
    const adminUsers = adminAuthUsers.map(user => {
      const profile = profiles?.find(p => p.id === user.id)
      return {
        id: user.id,
        email: user.email,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || ''
      }
    })

    console.log('Returning admin users:', adminUsers.length)

    return new Response(JSON.stringify(adminUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Error in get-admin-users-detailed:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})