import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout.jsx'
import Dashboard from './components/Dashboard.jsx'
import Tenants from './components/Tenants.jsx'
import Spaces from './components/Spaces.jsx'
import Leases from './components/Leases.jsx'
import AgreementGenerator from './components/AgreementGenerator.jsx'
import Renewals from './components/Renewals.jsx'
import Templates from './components/Templates.jsx'
import Billing from './components/Billing.jsx'
import Settings from './components/Settings.jsx'
import Login from './components/Login.jsx'
import { useStore } from './store/useStore.js'
import { isLoggedIn } from './lib/auth.js'

export default function App() {
  const store = useStore()
  const [authed, setAuthed] = useState(() => isLoggedIn())

  useEffect(() => {
    if (authed) store.runAutoBillRun()
  }, [authed]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout store={store} onLogout={() => setAuthed(false)} />}>
          <Route index element={<Dashboard />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="spaces" element={<Spaces />} />
          <Route path="leases" element={<Leases />} />
          <Route path="agreements" element={<AgreementGenerator />} />
          <Route path="billing" element={<Billing />} />
          <Route path="renewals" element={<Renewals />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
