import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import PortalLogin from './PortalLogin.jsx'
import PortalLayout from './PortalLayout.jsx'
import PortalDashboard from './PortalDashboard.jsx'
import PortalBilling from './PortalBilling.jsx'
import PortalMessages from './PortalMessages.jsx'
import PortalAccount from './PortalAccount.jsx'
import PortalEvents from './PortalEvents.jsx'

// Detect invite/recovery link before Supabase clears the hash
const NEEDS_PASSWORD_ON_LOAD =
  window.location.hash.includes('type=invite') ||
  window.location.hash.includes('type=recovery')

function SetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    onDone()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-3xl font-black tracking-widest text-gray-900">HEXAHUB</div>
          <p className="text-sm text-gray-400 mt-1">Member Portal</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Set your password</h1>
          <p className="text-sm text-gray-400 mb-6">Choose a password to secure your account.</p>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Set Password & Enter Portal'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          hexahub.com.au · build locally, scale sustainably
        </p>
      </div>
    </div>
  )
}

export default function PortalApp() {
  const [session, setSession] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [needsPassword, setNeedsPassword] = useState(NEEDS_PASSWORD_ON_LOAD)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session && !needsPassword) await loadData(session.user.email)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session)
        setNeedsPassword(true)
        setLoading(false)
        return
      }
      setSession(session)
      if (session) {
        if (!needsPassword) {
          setLoading(true)
          await loadData(session.user.email)
          setLoading(false)
        }
      } else {
        setTenant(null)
        setInvoices([])
        setLeases([])
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadData(email) {
    const [tRes, lRes, iRes] = await Promise.all([
      supabase.from('tenants').select('data'),
      supabase.from('leases').select('data'),
      supabase.from('invoices').select('data'),
    ])
    const tenants = (tRes.data ?? []).map(r => r.data)
    const found = tenants.find(t => t.email?.toLowerCase() === email?.toLowerCase())
    setTenant(found ?? null)
    if (found) {
      setLeases((lRes.data ?? []).map(r => r.data).filter(l => l.tenantId === found.id))
      setInvoices((iRes.data ?? []).map(r => r.data).filter(i => i.tenantId === found.id))
    }
  }

  async function handlePasswordSet() {
    setNeedsPassword(false)
    if (session) {
      setLoading(true)
      await loadData(session.user.email)
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setTenant(null)
    setInvoices([])
    setLeases([])
    setNeedsPassword(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-3">HEXAHUB</div>
          <div className="text-sm text-gray-400">Loading…</div>
        </div>
      </div>
    )
  }

  if (!session) return <PortalLogin />

  if (needsPassword) return <SetPasswordScreen onDone={handlePasswordSet} />

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-sm">
          <div className="text-2xl font-black tracking-widest text-gray-900 mb-6">HEXAHUB</div>
          <p className="text-gray-600 mb-1">No member account found for</p>
          <p className="font-semibold text-gray-900 mb-6">{session.user.email}</p>
          <p className="text-sm text-gray-400 mb-8">
            Please contact HexaHub if you believe this is an error.
          </p>
          <a href="mailto:info@hexahub.com.au" className="block w-full bg-black text-white text-sm font-semibold py-2.5 rounded mb-3 text-center hover:bg-gray-800">
            Contact HexaHub
          </a>
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-600">
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const basename = window.location.hostname.startsWith('members.') ? '/' : '/portal'

  return (
    <BrowserRouter basename={basename}>
      <PortalLayout tenant={tenant} onSignOut={signOut}>
        <Routes>
          <Route path="/" element={<PortalDashboard tenant={tenant} invoices={invoices} leases={leases} />} />
          <Route path="/billing" element={<PortalBilling tenant={tenant} invoices={invoices} />} />
          <Route path="/messages" element={<PortalMessages tenant={tenant} />} />
          <Route path="/account" element={<PortalAccount tenant={tenant} leases={leases} />} />
          <Route path="/events" element={<PortalEvents />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PortalLayout>
    </BrowserRouter>
  )
}
