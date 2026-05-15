import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { sendEmail } from '../lib/sendEmail.js'
import SignatureCanvas from './SignatureCanvas.jsx'
import ContractTemplate from './ContractTemplate.jsx'

export default function SignPage({ token }) {
  const [state, setState] = useState('loading') // loading|ready|signed|invalid|error
  const [request, setRequest] = useState(null)
  const [lease, setLease] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [space, setSpace] = useState(null)
  const [settings, setSettings] = useState(null)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [view, setView] = useState('contract') // contract|sign
  const sigRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        // Fetch the signing request
        const { data: req, error: reqErr } = await supabase
          .from('esign_requests')
          .select('*')
          .eq('token', token)
          .single()

        if (reqErr || !req) { setState('invalid'); return }
        if (req.status === 'signed') { setState('signed'); setRequest(req); return }

        setRequest(req)

        // Fetch associated data in parallel
        const [
          { data: leaseRows },
          { data: settRows },
        ] = await Promise.all([
          supabase.from('leases').select('data').eq('id', req.lease_id),
          supabase.from('settings').select('data').eq('id', 'global'),
        ])

        const leaseData = leaseRows?.[0]?.data
        if (!leaseData) { setState('invalid'); return }
        setLease(leaseData)

        const settingsData = settRows?.[0]?.data ?? null
        setSettings(settingsData)

        // Fetch tenant and space
        const [{ data: tenantRows }, { data: spaceRows }] = await Promise.all([
          supabase.from('tenants').select('data').eq('id', leaseData.tenantId),
          supabase.from('spaces').select('data').eq('id', leaseData.spaceId),
        ])

        setTenant(tenantRows?.[0]?.data ?? null)
        setSpace(spaceRows?.[0]?.data ?? null)
        if (tenantRows?.[0]?.data?.contactName) {
          setSignerName(tenantRows[0].data.contactName)
        }

        setState('ready')
      } catch (err) {
        console.error(err)
        setState('error')
      }
    }
    load()
  }, [token])

  async function handleSign() {
    if (!agreed) { alert('Please confirm you have read and agree to the agreement.'); return }
    if (!signerName.trim()) { alert('Please enter your name.'); return }
    if (sigRef.current?.isEmpty()) { alert('Please draw your signature.'); return }

    setSubmitting(true)
    try {
      const signatureData = sigRef.current.toDataURL()
      const now = new Date().toISOString()

      // Update esign request
      await supabase.from('esign_requests').update({
        status: 'signed',
        signed_at: now,
        signer_name: signerName,
        signature_data: signatureData,
      }).eq('token', token)

      // Update lease signature status
      await supabase.from('leases').update({
        data: {
          ...lease,
          signatureStatus: 'e_signed',
          signedAt: now,
          signerName: signerName,
        },
      }).eq('id', request.lease_id)

      // Send confirmation emails
      const companyName = settings?.company?.name ?? 'HexaHub'
      const contractNum = lease.contractNumber ?? `CON-${lease.id?.slice(-3).toUpperCase()}`

      if (tenant?.email) {
        await sendEmail({
          to: tenant.email,
          subject: `Signed: ${contractNum} — ${companyName}`,
          html: signedConfirmationHtml({ lease, tenant, settings, signerName, contractNum, now }),
          settings,
        }).catch(() => {})
      }

      const adminEmail = settings?.emails?.notificationEmail
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: `${tenant?.businessName ?? 'Tenant'} has signed ${contractNum}`,
          html: adminNotificationHtml({ lease, tenant, settings, signerName, contractNum, now }),
          settings,
        }).catch(() => {})
      }

      setState('signed')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-2">HEXAHUB</div>
          <div className="text-sm text-gray-400">Loading contract...</div>
        </div>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-6">HEXAHUB</div>
          <div className="bg-white border border-gray-200 rounded-md p-8">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Invalid or expired link</h1>
            <p className="text-sm text-gray-500">This signing link is invalid or has expired. Please contact HexaHub for a new link.</p>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-6">HEXAHUB</div>
          <div className="bg-white border border-gray-200 rounded-md p-8">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-lg font-bold text-gray-900 mb-2">Document signed</h1>
            <p className="text-sm text-gray-500 mb-3">
              {request?.signer_name ? `Signed by ${request.signer_name}.` : 'This document has been signed.'}
            </p>
            {request?.signed_at && (
              <p className="text-xs text-gray-400">
                {format(parseISO(request.signed_at), 'dd MMM yyyy, h:mm a')}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-4">HEXAHUB</div>
          <p className="text-sm text-gray-500">Something went wrong. Please try again or contact HexaHub.</p>
        </div>
      </div>
    )
  }

  const contractNum = lease?.contractNumber ?? `CON-${lease?.id?.slice(-3).toUpperCase()}`

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-black tracking-widest text-lg">HEXAHUB</span>
          <span className="text-gray-400 text-sm ml-3">Contract Signing</span>
        </div>
        <div className="text-sm text-gray-300">{contractNum}</div>
      </div>

      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-0">
        {[['contract', 'Review Contract'], ['sign', 'Sign']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              view === key ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contract view */}
      {view === 'contract' && (
        <div className="max-w-4xl mx-auto my-6 px-4">
          <div className="bg-white shadow-sm rounded-md overflow-hidden">
            <ContractTemplate lease={lease} tenant={tenant} space={space} settings={settings} />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setView('sign')}
              className="bg-black text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              Proceed to Sign →
            </button>
          </div>
        </div>
      )}

      {/* Sign view */}
      {view === 'sign' && (
        <div className="max-w-xl mx-auto my-8 px-4">
          <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sign the agreement</h2>
            <p className="text-sm text-gray-500 mb-6">
              By signing below you agree to the terms of {contractNum} as reviewed.
            </p>

            {/* Signer name */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Signature pad */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Signature</label>
                <button
                  onClick={() => sigRef.current?.clear()}
                  className="text-xs text-gray-400 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              </div>
              <SignatureCanvas ref={sigRef} height={140} />
              <p className="text-xs text-gray-400 mt-1">Draw your signature above using your mouse or finger</p>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">
                I have read and agree to the terms of this Licence Agreement and confirm that I am authorised to sign on behalf of the company.
              </span>
            </label>

            {/* Tenant info */}
            <div className="bg-gray-50 rounded-md p-4 text-xs text-gray-500 mb-6 space-y-1">
              <div><span className="font-medium text-gray-700">Company:</span> {tenant?.businessName}</div>
              <div><span className="font-medium text-gray-700">Contract:</span> {contractNum}</div>
              <div><span className="font-medium text-gray-700">Date:</span> {format(new Date(), 'dd MMM yyyy')}</div>
            </div>

            <button
              onClick={handleSign}
              disabled={submitting || !agreed}
              className="w-full bg-black text-white py-3 rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Sign & Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Email templates ────────────────────────────────────────────────────────────

function signedConfirmationHtml({ tenant, settings, signerName, contractNum, now }) {
  const company = settings?.company?.name ?? 'HexaHub'
  const date = format(parseISO(now), 'dd MMM yyyy, h:mm a')
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;background:#f5f5f5;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
    <div style="background:#000;padding:20px 32px"><span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:2px">${company.toUpperCase()}</span></div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:16px">Document signed ✅</h2>
      <p style="color:#555;font-size:14px;margin:0 0 20px">Hi ${tenant?.contactName ?? ''},<br><br>Your signature has been received for <strong>${contractNum}</strong>.</p>
      <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:4px;padding:16px;font-size:13px;color:#555">
        <div><strong>Signed by:</strong> ${signerName}</div>
        <div><strong>Date:</strong> ${date}</div>
        <div><strong>Contract:</strong> ${contractNum}</div>
      </div>
      <p style="font-size:12px;color:#888;margin-top:24px">Please keep this email as confirmation of your signature. A copy of the signed agreement will be provided by ${company}.</p>
    </div>
  </div></body></html>`
}

function adminNotificationHtml({ tenant, settings, signerName, contractNum, now }) {
  const company = settings?.company?.name ?? 'HexaHub'
  const date = format(parseISO(now), 'dd MMM yyyy, h:mm a')
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;background:#f5f5f5;margin:0;padding:0">
  <div style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #e5e5e5;border-radius:6px;overflow:hidden">
    <div style="background:#000;padding:20px 32px"><span style="color:#fff;font-size:18px;font-weight:bold;letter-spacing:2px">${company.toUpperCase()}</span></div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:16px">Contract signed 🖊</h2>
      <p style="color:#555;font-size:14px;margin:0 0 20px"><strong>${tenant?.businessName ?? 'A tenant'}</strong> has signed <strong>${contractNum}</strong>.</p>
      <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:4px;padding:16px;font-size:13px;color:#555">
        <div><strong>Signed by:</strong> ${signerName}</div>
        <div><strong>Tenant:</strong> ${tenant?.businessName}</div>
        <div><strong>Contract:</strong> ${contractNum}</div>
        <div><strong>Date:</strong> ${date}</div>
      </div>
      <p style="font-size:12px;color:#888;margin-top:24px">Log in to the portal to view the signed contract.</p>
    </div>
  </div></body></html>`
}
