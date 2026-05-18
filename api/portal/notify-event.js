// POST /api/portal/notify-event
// Emails all active portal members when a new event is added.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yitkqjlytlyyflrsnfwc.supabase.co'

function fmtDate(dateStr) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey  = process.env.RESEND_API_KEY
  if (!serviceKey || !resendKey) return res.status(500).json({ error: 'Not configured.' })

  const { event } = req.body ?? {}
  if (!event?.title) return res.status(400).json({ error: 'Event required.' })

  const admin = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Get all tenants with emails
  const { data: tenantsData } = await admin.from('tenants').select('data')
  const tenants = (tenantsData ?? []).map(r => r.data).filter(t => t.email)

  // Find which tenants are active portal members (have signed in at least once)
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const activeEmails = new Set(
    users.filter(u => u.last_sign_in_at).map(u => u.email?.toLowerCase())
  )

  const recipients = tenants.filter(t => activeEmails.has(t.email?.toLowerCase()))
  if (!recipients.length) return res.status(200).json({ sent: 0 })

  const portalUrl = 'https://members.hexahub.com.au/events'

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#000000;padding:28px 40px;">
    <div style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:4px;">HEXAHUB</div>
    <div style="color:#888888;font-size:11px;margin-top:3px;">Community Events</div>
  </div>

  <div style="padding:36px 40px;">
    <p style="color:#888888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">New Event</p>
    <h2 style="font-size:22px;color:#111111;margin:0 0 20px;">${event.title}</h2>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${event.date ? `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#888888;width:100px;">Date</td>
        <td style="padding:8px 0;font-size:13px;color:#111111;font-weight:600;">
          ${fmtDate(event.date)}${event.time ? ` · ${event.time}` : ''}
        </td>
      </tr>` : ''}
      ${event.location ? `
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#888888;">Location</td>
        <td style="padding:8px 0;font-size:13px;color:#111111;">${event.location}</td>
      </tr>` : ''}
    </table>

    ${event.description ? `
    <p style="color:#444444;font-size:14px;line-height:1.7;margin:0 0 28px;">${event.description}</p>` : ''}

    <a href="${event.link || portalUrl}"
       style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;
              padding:12px 28px;font-size:13px;font-weight:600;border-radius:6px;">
      ${event.link ? 'Learn More' : 'View in Portal'}
    </a>
  </div>

  <div style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #eeeeee;">
    <p style="color:#999999;font-size:11px;margin:0;text-align:center;line-height:1.6;">
      HexaHub Pty Ltd &nbsp;·&nbsp; 7 Distribution Circuit, Huntingdale VIC 3166<br>
      <em>build locally, scale sustainably</em> &nbsp;·&nbsp;
      <a href="https://hexahub.com.au" style="color:#999999;">hexahub.com.au</a>
    </p>
  </div>
</div>`

  let sent = 0
  for (const tenant of recipients) {
    const ok = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'HexaHub <info@hexahub.com.au>',
        to: [tenant.email],
        subject: `New Event: ${event.title}`,
        html,
      }),
    }).then(r => r.ok).catch(() => false)
    if (ok) sent++
  }

  return res.status(200).json({ sent, total: recipients.length })
}
