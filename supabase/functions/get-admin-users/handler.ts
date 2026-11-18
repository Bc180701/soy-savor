const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type AdminAccount = { id: string; email?: string; created_at: string }

type AdminDirectory = {
  authenticatedUserId: (token: string) => Promise<string | null>;
  isSuperAdmin: (userId: string) => Promise<boolean>;
  adminIds: () => Promise<(string | null)[]>;
  accountById: (userId: string) => Promise<AdminAccount | null>;
}

function json(body: object, status: number) {
  return Response.json(body, { status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } })
}

export function createAdminUsersHandler(directory: AdminDirectory) {
  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
    if (req.method !== 'POST') return json({ success: false }, 405)

    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1]
    if (!token) return json({ success: false, error: 'Authentification requise' }, 401)

    try {
      const callerId = await directory.authenticatedUserId(token)
      if (!callerId) return json({ success: false, error: 'Authentification requise' }, 401)
      if (!await directory.isSuperAdmin(callerId)) {
        return json({ success: false, error: 'Accès réservé aux super-administrateurs' }, 403)
      }

      const ids = [...new Set((await directory.adminIds()).filter((id): id is string => id !== null))]
      const users = []
      for (const id of ids) {
        const user = await directory.accountById(id)
        if (user) users.push({ id: user.id, email: user.email ?? '', created_at: user.created_at })
      }
      return json({ success: true, users }, 200)
    } catch (error) {
      console.error('Failed to load administrator accounts:', error)
      return json({ success: false, error: 'Impossible de récupérer la liste des administrateurs' }, 500)
    }
  }
}