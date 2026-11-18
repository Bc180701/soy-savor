import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createAdminUsersHandler } from './handler.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } },
)

serve(createAdminUsersHandler({
  async authenticatedUserId(token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error && error.status !== 400 && error.status !== 401 && error.status !== 403 && error.status !== 422) {
      throw error
    }
    return error ? null : data.user?.id ?? null
  },
  async isSuperAdmin(userId) {
    const { data, error } = await supabaseAdmin.rpc('is_super_admin', { user_id: userId })
    if (error) throw error
    return data === true
  },
  async adminIds() {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .in('role', ['administrateur', 'super_administrateur'])
    if (error) throw error
    return data.map(({ user_id }) => user_id)
  },
  async accountById(userId) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error && error.status !== 404) throw error
    return error ? null : data.user
  },
}))