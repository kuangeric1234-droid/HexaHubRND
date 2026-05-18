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

export default function PortalApp() {
  const [session, setSession] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) await loadData(session.user.email)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session)
      if (session) {
        setLoading(true)
        await loadData(session.user.email)
        setLoading(false)
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

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setTenant(null)
    setInvoices([])
    setLeases([])
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

  // On members.hexahub.com.au the base is "/"; on the main domain it's "/portal"
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
