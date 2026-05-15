import { useOutletContext, useNavigate } from 'react-router-dom'
import { differenceInDays, parseISO, format } from 'date-fns'
import { FileText, RefreshCw } from 'lucide-react'

export default function Renewals() {
  const { leases, tenants, spaces } = useOutletContext()
  const navigate = useNavigate()
  const today = new Date()

  const expiring = leases
    .filter((l) => {
      if (l.status !== 'active') return false
      const days = differenceInDays(parseISO(l.endDate), today)
      return days >= 0 && days <= 60
    })
    .sort((a, b) => differenceInDays(parseISO(a.endDate), today) - differenceInDays(parseISO(b.endDate), today))

  const expired = leases
    .filter((l) => {
      const days = differenceInDays(parseISO(l.endDate), today)
      return days < 0 && l.status === 'active'
    })
    .sort((a, b) => differenceInDays(parseISO(b.endDate), today) - differenceInDays(parseISO(a.endDate), today))

  function urgencyBadge(days) {
    if (days <= 14) return 'bg-red-100 text-red-800 border border-red-200'
    if (days <= 30) return 'bg-orange-100 text-orange-800 border border-orange-200'
    return 'bg-amber-100 text-amber-800 border border-amber-200'
  }

  function LeaseRow({ lease, daysLabel, badgeStyle }) {
    const tenant = tenants.find((t) => t.id === lease.tenantId)
    const space = spaces.find((s) => s.id === lease.spaceId)
    return (
      <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
        <td className="px-4 py-3 font-medium text-gray-900">{tenant?.businessName ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600">{tenant?.email ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600">{tenant?.phone ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600">{space?.unitNumber ?? '—'}</td>
        <td className="px-4 py-3 text-gray-600">
          {format(parseISO(lease.endDate), 'dd/MM/yyyy')}
        </td>
        <td className="px-4 py-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeStyle}`}>
            {daysLabel}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/agreements?leaseId=${lease.id}`)}
              className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <FileText size={12} /> Agreement
            </button>
            <button
              onClick={() => navigate('/leases')}
              className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <RefreshCw size={12} /> Renew
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Renewals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Leases expiring within 60 days — action required.
        </p>
      </div>

      {expiring.length === 0 && expired.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center text-green-800 text-sm font-medium">
          No leases expiring in the next 60 days.
        </div>
      )}

      {expiring.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Expiring Within 60 Days ({expiring.length})
          </h2>
          <div className="bg-white border border-amber-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50 border-b border-amber-200">
                <tr>
                  {['Tenant', 'Email', 'Phone', 'Space', 'Expiry', 'Urgency', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-amber-800 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expiring.map((lease) => {
                  const days = differenceInDays(parseISO(lease.endDate), today)
                  return (
                    <LeaseRow
                      key={lease.id}
                      lease={lease}
                      daysLabel={`${days} days left`}
                      badgeStyle={urgencyBadge(days)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expired.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Overdue / Not Renewed ({expired.length})
          </h2>
          <div className="bg-white border border-red-200 rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  {['Tenant', 'Email', 'Phone', 'Space', 'Expiry', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-red-800 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expired.map((lease) => {
                  const days = Math.abs(differenceInDays(parseISO(lease.endDate), today))
                  return (
                    <LeaseRow
                      key={lease.id}
                      lease={lease}
                      daysLabel={`${days}d overdue`}
                      badgeStyle="bg-red-100 text-red-800 border border-red-200"
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
