import { useOutletContext } from 'react-router-dom'
import { differenceInDays, parseISO, format } from 'date-fns'
import { Building2, Users, TrendingUp, AlertTriangle } from 'lucide-react'

function KPICard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-md border ${accent ? 'border-amber-300' : 'border-gray-200'} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`p-2 rounded-md ${accent ? 'bg-amber-50' : 'bg-gray-50'}`}>
          <Icon size={16} className={accent ? 'text-amber-600' : 'text-gray-500'} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { spaces, leases, tenants } = useOutletContext()

  const today = new Date()
  const activeLeases = leases.filter((l) => l.status === 'active')
  const occupiedSpaces = spaces.filter((s) => s.status === 'occupied')
  const occupancyRate = spaces.length ? Math.round((occupiedSpaces.length / spaces.length) * 100) : 0
  const monthlyRevenue = activeLeases.reduce((sum, l) => sum + Number(l.monthlyRent), 0)

  const expiringSoon = activeLeases.filter((l) => {
    const days = differenceInDays(parseISO(l.endDate), today)
    return days >= 0 && days <= 60
  })

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(today, 'EEEE, d MMMM yyyy')} · HexaHub Huntingdale
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <KPICard
          icon={Building2}
          label="Total Spaces"
          value={spaces.length}
          sub={`${occupiedSpaces.length} occupied · ${spaces.filter(s => s.status === 'vacant').length} vacant`}
        />
        <KPICard
          icon={TrendingUp}
          label="Occupancy Rate"
          value={`${occupancyRate}%`}
          sub={`${occupiedSpaces.length} of ${spaces.length} spaces filled`}
        />
        <KPICard
          icon={Users}
          label="Active Leases"
          value={activeLeases.length}
          sub={`${tenants.length} tenants total`}
        />
        <KPICard
          icon={AlertTriangle}
          label="Expiring in 60 Days"
          value={expiringSoon.length}
          sub="Requires renewal action"
          accent={expiringSoon.length > 0}
        />
      </div>

      {/* Revenue Summary */}
      <div className="bg-black text-white rounded-md p-6 mb-6">
        <p className="text-sm text-gray-400 mb-1">Monthly Recurring Revenue</p>
        <p className="text-4xl font-bold">
          ${monthlyRevenue.toLocaleString('en-AU')}
          <span className="text-lg font-normal text-gray-400 ml-2">AUD / month</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">Based on {activeLeases.length} active leases</p>
      </div>

      {/* Expiring Leases Table */}
      {expiringSoon.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Leases Expiring Soon
          </h2>
          <div className="bg-white border border-amber-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  {['Tenant', 'Space', 'End Date', 'Days Left', 'Rent / mo'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map((lease) => {
                  const tenant = tenants.find((t) => t.id === lease.tenantId)
                  const space = spaces.find((s) => s.id === lease.spaceId)
                  const days = differenceInDays(parseISO(lease.endDate), today)
                  return (
                    <tr key={lease.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium">{tenant?.businessName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{space?.unitNumber ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(parseISO(lease.endDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">
                          {days} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        ${Number(lease.monthlyRent).toLocaleString('en-AU')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Space Status Grid */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Space Inventory Overview
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={`rounded-md border p-3 text-sm ${
                space.status === 'occupied'
                  ? 'border-gray-300 bg-gray-900 text-white'
                  : space.status === 'reserved'
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              <div className="font-semibold">{space.unitNumber}</div>
              <div className={`text-xs mt-0.5 capitalize ${space.status === 'occupied' ? 'text-gray-400' : 'text-gray-500'}`}>
                {space.status}
              </div>
              <div className={`text-xs mt-1 ${space.status === 'occupied' ? 'text-gray-300' : 'text-gray-400'}`}>
                ${space.monthlyRate.toLocaleString('en-AU')}/mo
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
