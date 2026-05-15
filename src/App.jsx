import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
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
import { useStore } from './store/useStore.js'

export default function App() {
  const store = useStore()

  // Auto bill run: silently generates monthly invoices on first load each month
  useEffect(() => {
    store.runAutoBillRun()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout store={store} />}>
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
