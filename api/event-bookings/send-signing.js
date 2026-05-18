// POST /api/event-bookings/send-signing
//
// Called in three modes:
//   mode=undefined (default) — Admin sent docs for signing → email organiser with signing link
//   mode='admin_notify'      — Organiser just signed → notify admin to countersign
//   mode='insurance_deferred'— Organiser said "I'll submit later" → remind admin to chase insurance
//
// Body: { booking, signingUrl?, mode? }

const RESEND_API_KEY = process.env.RESEND_API_KEY

function fmtDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return d }
}

function fmtMoney(v) {
  if (!v && v !== 0) return '—'
  return `$${Number(v).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
}

function emailFrame(bodyHtml) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:0;background:#f5f5f5">
<div style="max-width:600px;margin:32px auto;background:#fff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
  <div style="background:#000;padding:24px 32px">
    <span style="color:#fff;font-size:20px;font-weight:900;letter-spacing:3px">HEXAHUB</span>
  </div>
  <div style="padding:32px">${bodyHtml}</div>
  <div style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #eee">
    <p style="color:#999;font-size:11px;margin:0;text-align:center">
      HexaHub Pty Ltd &nbsp;·&nbsp; 7 Distribution Circuit, Huntingdale VIC 3166<br>
      <em>build locally, scale sustainably</em> &nbsp;·&nbsp;
      <a href="https://hexahub.com.au" style="color:#999">hexahub.com.au</a>
    </p>
  </div>
</div></body></html>`
}

function buildSigningEmail({ booking, signingUrl }) {
  const eventDate = fmtDate(booking.eventDate)
  const venue = booking.venue || '17 Logistic Court, Huntingdale VIC 3166'
  const fee = fmtMoney(booking.licenceFee)

  const body = `
    <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Event Venue Licence Agreement</p>
    <h2 style="font-size:20px;color:#111;margin:0 0 20px">${booking.ref} — Please Review &amp; Sign</h2>
    <p style="font-size:14px;color:#555;margin:0 0 20px">
      Hi ${booking.organiserName},
    </p>
    <p style="font-size:14px;color:#555;margin:0 0 24px">
      HexaHub has prepared your Event Venue Licence Agreement, Liability Waiver, and Venue Rules for your upcoming event. Please review all three documents and sign online using the button below.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <tr><td style="padding:8px 0;color:#888;width:120px">Event</td><td style="padding:8px 0;font-weight:600;color:#111">${booking.eventDescription || booking.permittedUse || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Date</td><td style="padding:8px 0;font-weight:600;color:#111">${eventDate}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Venue</td><td style="padding:8px 0;color:#111">${venue}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Licence Fee</td><td style="padding:8px 0;color:#111">${fee}</td></tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      <a href="${signingUrl}"
         style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:14px 36px;font-size:14px;font-weight:700;border-radius:6px">
        Review &amp; Sign Documents
      </a>
    </div>
    <p style="font-size:12px;color:#888;margin:0">
      If the button doesn't work, copy this link: <a href="${signingUrl}" style="color:#888;word-break:break-all">${signingUrl}</a>
    </p>
    <p style="font-size:12px;color:#bbb;margin:24px 0 0">
      After signing, you will be prompted to submit your Certificate of Currency (Public Liability Insurance — min. AUD $20,000,000). Please have this ready.
    </p>`

  return emailFrame(body)
}

function buildAdminNotifyEmail({ booking }) {
  const body = `
    <h2 style="font-size:18px;color:#111;margin:0 0 16px">Event Booking Signed ✅</h2>
    <p style="font-size:14px;color:#555;margin:0 0 20px">
      <strong>${booking.organiserName}${booking.organiserCompany ? ` (${booking.organiserCompany})` : ''}</strong>
      has signed the documents for booking <strong>${booking.ref}</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <tr><td style="padding:8px 0;color:#888;width:120px">Event</td><td style="padding:8px 0;font-weight:600;color:#111">${booking.eventDescription || booking.permittedUse || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Date</td><td style="padding:8px 0;color:#111">${fmtDate(booking.eventDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Signed by</td><td style="padding:8px 0;color:#111">${booking.signerName}${booking.signerTitle ? ` — ${booking.signerTitle}` : ''}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Licence Fee</td><td style="padding:8px 0;color:#111">${fmtMoney(booking.licenceFee)}</td></tr>
    </table>
    <p style="font-size:13px;color:#555;margin:0 0 16px">
      Please log in to the admin portal to countersign and confirm the booking. The organiser has been asked to submit their Certificate of Currency.
    </p>
    <a href="https://app.hexahub.com.au/event-bookings"
       style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 28px;font-size:13px;font-weight:700;border-radius:6px">
      Open Admin Portal →
    </a>`

  return emailFrame(body)
}

function buildInsuranceDeferredEmail({ booking }) {
  const body = `
    <h2 style="font-size:18px;color:#111;margin:0 0 16px">Insurance Pending — Action Required ⚠️</h2>
    <p style="font-size:14px;color:#555;margin:0 0 20px">
      <strong>${booking.organiserName}</strong> has indicated they will submit their Certificate of Currency by email.
      Please chase this up before the event date.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
      <tr><td style="padding:8px 0;color:#888;width:120px">Booking</td><td style="padding:8px 0;font-weight:600;color:#111">${booking.ref}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Event Date</td><td style="padding:8px 0;color:#111">${fmtDate(booking.eventDate)}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Organiser Email</td><td style="padding:8px 0;color:#111">${booking.organiserEmail}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Requirement</td><td style="padding:8px 0;color:#111">${booking.insuranceRequired || 'Min. AUD $20,000,000 PLI'}</td></tr>
    </table>
    <p style="font-size:12px;color:#888;margin:0">
      Once received, mark the booking as "Insurance Received" in the admin portal.
    </p>`

  return emailFrame(body)
}

async function sendMail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HexaHub <info@hexahub.com.au>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })
  return res.ok
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!RESEND_API_KEY) return res.status(500).json({ error: 'Email not configured.' })

  const { booking, signingUrl, mode } = req.body
  if (!booking) return res.status(400).json({ error: 'Missing booking.' })

  try {
    if (!mode) {
      // Send signing link to organiser
      if (!booking.organiserEmail) return res.status(400).json({ error: 'No organiser email.' })
      if (!signingUrl) return res.status(400).json({ error: 'Missing signingUrl.' })

      const ok = await sendMail({
        to: booking.organiserEmail,
        subject: `Please sign: ${booking.ref} — Event Venue Licence Agreement`,
        html: buildSigningEmail({ booking, signingUrl }),
      })
      return res.status(ok ? 200 : 500).json({ sent: ok })
    }

    if (mode === 'admin_notify') {
      // Organiser signed — notify admin
      const ok = await sendMail({
        to: 'info@hexahub.com.au',
        subject: `Booking signed: ${booking.ref} — ${booking.organiserName}`,
        html: buildAdminNotifyEmail({ booking }),
      })
      return res.status(200).json({ sent: ok })
    }

    if (mode === 'insurance_deferred') {
      // Organiser deferred insurance — remind admin
      const ok = await sendMail({
        to: 'info@hexahub.com.au',
        subject: `Insurance pending: ${booking.ref} — ${booking.organiserName}`,
        html: buildInsuranceDeferredEmail({ booking }),
      })
      return res.status(200).json({ sent: ok })
    }

    return res.status(400).json({ error: 'Unknown mode.' })
  } catch (err) {
    console.error('send-signing error:', err)
    return res.status(500).json({ error: 'Internal error.' })
  }
}
