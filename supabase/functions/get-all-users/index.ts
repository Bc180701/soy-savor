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
    console.log('🔍 Starting get-all-users function...')
    
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

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('🔍 Verifying admin permissions for user:', user.id)

    // Check if user has admin or super admin role
    const [adminResult, superAdminResult] = await Promise.all([
      supabaseAdmin.rpc('has_role', { user_id: user.id, role: 'administrateur' }),
      supabaseAdmin.rpc('has_role', { user_id: user.id, role: 'super_administrateur' })
    ]);

    if (adminResult.error && superAdminResult.error) {
      console.error('Error checking admin roles:', adminResult.error || superAdminResult.error)
      throw new Error('Error verifying permissions')
    }

    const hasAdminRole = !!adminResult.data || !!superAdminResult.data;
    if (!hasAdminRole) {
      throw new Error('Access denied: Administrator privileges required')
    }

    console.log('✅ Admin permissions verified, fetching all users...')

    // Get all users from auth using admin client
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      throw authError
    }

    console.log('✅ Found auth users:', authUsers.users.length)

    // Transform the data to match expected format
    const allUsers = authUsers.users.map(user => ({
      id: user.id,
      email: user.email || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }))

    console.log('🎯 Returning users:', allUsers.length)

    return new Response(JSON.stringify({
      success: true,
      users: allUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('❌ Error in get-all-users:', error)
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An error occurred' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})