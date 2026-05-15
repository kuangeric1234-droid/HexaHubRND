import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Warehouse,
  FileText,
  FilePlus,
  RefreshCw,
  BookOpen,
  Receipt,
  Settings,
  LogOut,
} from 'lucide-react'
import { clearSession } from '../lib/auth.js'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tenants', icon: Users, label: 'Tenants' },
  { to: '/spaces', icon: Warehouse, label: 'Spaces' },
  { to: '/leases', icon: FileText, label: 'Contracts' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/agreements', icon: FilePlus, label: 'Agreements' },
  { to: '/renewals', icon: RefreshCw, label: 'Renewals' },
  { to: '/templates', icon: BookOpen, label: 'Templates' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout({ store, onLogout }) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-52 bg-black text-white flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-gray-800">
          <span className="text-lg font-bold tracking-tight">HexaHub</span>
          <p className="text-xs text-gray-400 mt-0.5">Management System</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500">
          <div className="mb-3">
            7 Distribution Circuit
            <br />
            Huntingdale VIC 3166
          </div>
          <button
            onClick={() => { clearSession(); onLogout?.() }}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet context={store} />
      </main>
    </div>
  )
}
