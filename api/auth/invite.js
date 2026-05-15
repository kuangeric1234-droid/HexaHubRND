// POST /api/auth/invite
// Requires env var: SUPABASE_SERVICE_ROLE_KEY
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yitkqjlytlyyflrsnfwc.supabase.co'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return res.status(500).json({ error: 'Invite service not configured.' })

  const { email } = req.body ?? {}
  if (!email) return res.status(400).json({ error: 'Email is required.' })

  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email)
  if (error) return res.status(400).json({ error: error.message })

  return res.status(200).json({ success: true, email: data.user?.email })
}
