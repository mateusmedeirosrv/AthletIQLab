import { createClient } from '@supabase/supabase-js'

let _admin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_admin) {
    const url = process.env['SUPABASE_URL']
    const key = process.env['SUPABASE_SERVICE_ROLE_KEY']
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }
    _admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}

export function createUserClient(accessToken: string) {
  const url = process.env['SUPABASE_URL'] ?? ''
  const anonKey = process.env['SUPABASE_ANON_KEY'] ?? ''
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
