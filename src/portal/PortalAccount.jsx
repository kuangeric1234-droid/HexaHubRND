import { format, parseISO } from 'date-fns'
import { Building2, FileText } from 'lucide-react'

function fmt(dateStr) {
  try { return format(parseISO(dateStr), 'dd/MM/yyyy') } catch { return '—' }
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900">{value || '—'}</div>
    </div>
  )
}

export default function PortalAccount({ tenant, leases }) {
  const activeLeases = leases.filter(l => l.status === 'active')
  const pastLeases = leases.filter(l => l.status !== 'active')

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Account</h1>

      {/* Company info */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-sm font-semibold text-gray-900">
          <Building2 size={15} className="text-gray-400" />
          Company Information
        </div>
        <div className="px-5 py-5 grid grid-cols-2 gap-5">
          <Field label="Business Name" value={tenant.businessName} />
          <Field label="ABN" value={tenant.abn} />
          <Field label="Contact Name" value={tenant.contactName} />
          <Field label="Industry" value={tenant.industry} />
          <Field label="Email" value={tenant.email} />
          <Field label="Phone" value={tenant.phone} />
        </div>
        <div className="px-5 pb-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 mt-4">
            To update your company details, please contact{' '}
            <a href="mailto:info@hexahub.com.au" className="text-gray-600 hover:underline">
              info@hexahub.com.au
            </a>
          </p>
        </div>
      </div>

      {/* Active contracts */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-sm font-semibold text-gray-900">
          <FileText size={15} className="text-gray-400" />
          Active Agreements
        </div>
        {activeLeases.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-400 text-center">No active agreements.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {activeLeases.map(lease => (
              <div key={lease.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{lease.contractNumber ?? 'Contract'}</span>
                      <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-medium">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-gray-400 mb-0.5">Start Date</div>
                        <div className="text-gray-900">{fmt(lease.startDate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-0.5">End Date</div>
                        <div className="text-gray-900">{fmt(lease.endDate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-0.5">Monthly Rent</div>
                        <div className="text-gray-900 font-semibold">
                          A${Number(lease.monthlyRent ?? 0).toLocaleString('en-AU')}
                        </div>
                      </div>
                    </div>
                    {lease.items?.[0] && (
                      <div className="mt-2 text-xs text-gray-400">
                        Notice period: {lease.noticePeriodMonths ?? 2} months
                      </div>
                    )}
                  </div>
                </div>
                {(lease.signatureStatus === 'e_signed' || lease.signatureStatus === 'manually_signed') && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-500">
                      Agreement signed ·{' '}
                      <a href="mailto:info@hexahub.com.au" className="text-gray-600 hover:underline">
                        Request a copy
                      </a>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past contracts */}
      {pastLeases.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 text-sm font-semibold text-gray-900">
            <FileText size={15} className="text-gray-400" />
            Past Agreements
          </div>
          <div className="divide-y divide-gray-100">
            {pastLeases.map(lease => (
              <div key={lease.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">{lease.contractNumber ?? 'Contract'}</div>
                  <div className="text-xs text-gray-400">
                    {fmt(lease.startDate)} – {fmt(lease.endDate)}
                  </div>
                </div>
                <span className="text-xs text-gray-400 capitalize border border-gray-200 px-2 py-0.5 rounded">
                  {lease.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
