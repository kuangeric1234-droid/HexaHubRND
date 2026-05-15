import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Pencil, Building2, Mail, Phone, Hash } from 'lucide-react'

const TABS = ['Overview', 'One-off Fees', 'Contracts', 'Invoices']

const SIG_BADGE = {
  manually_signed: { label: 'Signed', cls: 'bg-green-100 text-green-700' },
  e_signed:        { label: 'E Signed', cls: 'bg-green-100 text-green-700' },
  out_for_signature: { label: 'Out for Sig', cls: 'bg-yellow-100 text-yellow-700' },
  not_signed:      { label: 'Not Signed', cls: 'bg-red-100 text-red-700' },
}

const INV_STATUS = {
  pending:  { label: 'Pending', cls: 'bg-orange-100 text-orange-700' },
  paid:     { label: 'Paid', cls: 'bg-green-100 text-green-700' },
  overdue:  { label: 'Overdue', cls: 'bg-red-100 text-red-700' },
  voided:   { label: 'Voided', cls: 'bg-gray-100 text-gray-500' },
}

function Badge({ label, cls }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
}

function fmt(d) {
  try { return format(parseISO(d), 'dd MMM yyyy') } catch { return d ?? '—' }
}

function fmtAud(n) {
  return `$${Number(n ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
}

export default function TenantProfile({ tenant, leases, invoices, spaces, settings, onBack, onEdit, onSelectInvoice, onSelectContract }) {
  const [tab, setTab] = useState('Overview')

  const tenantLeases = leases.filter((l) => l.tenantId === tenant.id)
  const tenantInvoices = invoices.filter((inv) => inv.tenantId === tenant.id)
  const taxRate = (settings?.billingRules?.taxRate ?? 10) / 100

  // MRR = sum of active lease monthly rents
  const activeLeases = tenantLeases.filter((l) => l.status === 'active')
  const mrr = activeLeases.reduce((s, l) => s + (Number(l.monthlyRent) || 0), 0)

  // Deposit held = sum of unpaid deposit invoices
  const depositInvoices = tenantInvoices.filter((inv) => inv.invoiceType === 'deposit' && inv.status !== 'voided')
  const depositHeld = depositInvoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((s, inv) => {
      const sub = (inv.lineItems ?? []).reduce((a, l) => a + Math.round(l.unitPrice * l.qty * (1 - (l.discountPct ?? 0) / 100) * 100) / 100, 0)
      return s + sub
    }, 0)

  // One-off fees = deposit invoices from signed contracts + any invoice with invoiceType deposit
  // Build list: for each signed lease with a bond, find or synthesize a deposit entry
  const signedLeases = tenantLeases.filter((l) => ['manually_signed', 'e_signed'].includes(l.signatureStatus))
  const oneOffFees = signedLeases.map((lease) => {
    const bondAmount = lease.items?.[0]?.deposit ?? lease.bondAmount ?? 0
    if (!bondAmount) return null
    const space = spaces.find((s) => s.id === lease.spaceId)
    const depInv = tenantInvoices.find((inv) => inv.leaseId === lease.id && inv.invoiceType === 'deposit' && inv.status !== 'voided')
    let status, statusCls
    if (!depInv) {
      status = 'Not Invoiced'; statusCls = 'bg-gray-100 text-gray-500'
    } else if (depInv.status === 'paid') {
      status = 'Paid'; statusCls = 'bg-green-100 text-green-700'
    } else {
      status = 'Invoiced'; statusCls = 'bg-blue-100 text-blue-700'
    }
    return {
      id: lease.id,
      name: `Security Deposit — ${space?.unitNumber ?? lease.spaceId}`,
      contract: lease.contractNumber ?? `CON-${lease.id.slice(-3).toUpperCase()}`,
      amount: bondAmount,
      date: lease.startDate,
      status, statusCls,
      invoiceNumber: depInv?.number ?? null,
      invoiceId: depInv?.id ?? null,
    }
  }).filter(Boolean)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
              <ArrowLeft size={15} /> Tenants
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-800">{tenant.businessName}</span>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600"
          >
            <Pencil size={13} /> Edit Details
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Building2 size={28} className="text-gray-400" />
            </div>
          </div>
          <h2 className="text-center font-bold text-gray-900 text-sm mb-1">{tenant.businessName}</h2>
          {tenant.email && <p className="text-center text-xs text-gray-500 mb-4">{tenant.email}</p>}

          <div className="space-y-3 text-xs">
            {tenant.contactName && (
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 mt-0.5 uppercase font-semibold w-16 shrink-0">Contact</span>
                <span>{tenant.contactName}</span>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-start gap-2 text-gray-600">
                <Mail size={12} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="break-all">{tenant.email}</span>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-start gap-2 text-gray-600">
                <Phone size={12} className="text-gray-400 mt-0.5 shrink-0" />
                <span>{tenant.phone}</span>
              </div>
            )}
            {tenant.abn && (
              <div className="flex items-start gap-2 text-gray-600">
                <Hash size={12} className="text-gray-400 mt-0.5 shrink-0" />
                <span>ABN: {tenant.abn}</span>
              </div>
            )}
            {tenant.industry && (
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 uppercase font-semibold w-16 shrink-0">Industry</span>
                <span>{tenant.industry}</span>
              </div>
            )}
            {tenant.country && (
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 uppercase font-semibold w-16 shrink-0">Country</span>
                <span>{tenant.country}</span>
              </div>
            )}
            {tenant.createdAt && (
              <div className="flex items-start gap-2 text-gray-600">
                <span className="text-gray-400 uppercase font-semibold w-16 shrink-0">Since</span>
                <span>{fmt(tenant.createdAt)}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats bar */}
          <div className="bg-white border-b border-gray-200 px-8 py-4 grid grid-cols-4 gap-6">
            {[
              ['MRR', fmtAud(mrr)],
              ['Active Contracts', activeLeases.length],
              ['Total Invoices', tenantInvoices.filter((i) => i.status !== 'voided').length],
              ['Deposit Held', fmtAud(depositHeld)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-8">
            <div className="flex">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 space-y-6">

            {/* ── Overview ── */}
            {tab === 'Overview' && (
              <>
                {/* Active contracts summary */}
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Active Contracts</h3>
                  </div>
                  {activeLeases.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No active contracts.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {activeLeases.map((l) => {
                          const space = spaces.find((s) => s.id === l.spaceId)
                          return (
                            <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                              onClick={() => onSelectContract?.(l)}>
                              <td className="px-5 py-3 font-medium text-gray-900">{l.contractNumber ?? `CON-${l.id.slice(-3).toUpperCase()}`}</td>
                              <td className="px-5 py-3 text-gray-600">{space?.unitNumber ?? '—'}</td>
                              <td className="px-5 py-3 text-gray-500">{fmt(l.startDate)} – {fmt(l.endDate)}</td>
                              <td className="px-5 py-3 text-right font-medium text-gray-900">{fmtAud(l.monthlyRent)}/mo</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recent invoices */}
                <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Recent Invoices</h3>
                  </div>
                  {tenantInvoices.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-400">No invoices.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {tenantInvoices.slice(0, 5).map((inv) => {
                          const meta = INV_STATUS[inv.status] ?? { label: inv.status, cls: 'bg-gray-100 text-gray-600' }
                          return (
                            <tr key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                              onClick={() => onSelectInvoice?.(inv)}>
                              <td className="px-5 py-3 font-medium text-gray-900">{inv.number}</td>
                              <td className="px-5 py-3"><Badge label={meta.label} cls={meta.cls} /></td>
                              <td className="px-5 py-3 text-gray-500">{fmt(inv.issueDate)}</td>
                              <td className="px-5 py-3 text-right font-medium text-gray-900">
                                {fmtAud((inv.lineItems ?? []).reduce((s, l) => s + Math.round(l.unitPrice * l.qty * (1 - (l.discountPct ?? 0) / 100) * 100) / 100, 0) * (1 + taxRate))}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ── One-off Fees ── */}
            {tab === 'One-off Fees' && (
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">One-off Fees</h3>
                </div>
                {oneOffFees.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400">No one-off fees. Deposits will appear here once a contract is signed.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Name', 'Contract', 'Date', 'Amount', 'Status', 'Invoice'].map((h) => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {oneOffFees.map((fee) => (
                        <tr key={fee.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-900">{fee.name}</td>
                          <td className="px-5 py-3 text-gray-600">{fee.contract}</td>
                          <td className="px-5 py-3 text-gray-500">{fmt(fee.date)}</td>
                          <td className="px-5 py-3 font-medium text-gray-900">{fmtAud(fee.amount)}</td>
                          <td className="px-5 py-3">
                            <Badge label={fee.status} cls={fee.statusCls} />
                          </td>
                          <td className="px-5 py-3">
                            {fee.invoiceNumber ? (
                              <button
                                onClick={() => { const inv = tenantInvoices.find((i) => i.id === fee.invoiceId); if (inv) onSelectInvoice?.(inv) }}
                                className="text-blue-600 hover:underline text-xs font-medium"
                              >
                                {fee.invoiceNumber}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Contracts ── */}
            {tab === 'Contracts' && (
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Contracts</h3>
                </div>
                {tenantLeases.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400">No contracts.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Number', 'Document Type', 'Status', 'Signature', 'Period', 'Monthly'].map((h) => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tenantLeases.map((l) => {
                        const sig = SIG_BADGE[l.signatureStatus] ?? SIG_BADGE.not_signed
                        const space = spaces.find((s) => s.id === l.spaceId)
                        return (
                          <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onSelectContract?.(l)}>
                            <td className="px-5 py-3 font-medium text-gray-900">{l.contractNumber ?? `CON-${l.id.slice(-3).toUpperCase()}`}</td>
                            <td className="px-5 py-3 text-gray-600">{l.documentType ?? 'License Agreement'}</td>
                            <td className="px-5 py-3">
                              <Badge label={l.status} cls={l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} />
                            </td>
                            <td className="px-5 py-3"><Badge label={sig.label} cls={sig.cls} /></td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{fmt(l.startDate)} – {fmt(l.endDate)}<br /><span className="text-gray-400">{space?.unitNumber ?? ''}</span></td>
                            <td className="px-5 py-3 font-medium text-gray-900">{fmtAud(l.monthlyRent)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── Invoices ── */}
            {tab === 'Invoices' && (
              <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-sm">Invoices</h3>
                </div>
                {tenantInvoices.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-400">No invoices.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Number', 'Status', 'Sent', 'Issue Date', 'Due Date', 'Period', 'Amount'].map((h) => (
                          <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tenantInvoices.map((inv) => {
                        const meta = INV_STATUS[inv.status] ?? { label: inv.status, cls: 'bg-gray-100 text-gray-600' }
                        const sub = (inv.lineItems ?? []).reduce((s, l) => s + Math.round(l.unitPrice * l.qty * (1 - (l.discountPct ?? 0) / 100) * 100) / 100, 0)
                        const total = sub * (1 + taxRate)
                        return (
                          <tr key={inv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onSelectInvoice?.(inv)}>
                            <td className="px-5 py-3 font-medium text-gray-900">{inv.number}</td>
                            <td className="px-5 py-3"><Badge label={meta.label} cls={meta.cls} /></td>
                            <td className="px-5 py-3">
                              <Badge label={inv.sentStatus === 'sent' ? 'Sent' : 'Not Sent'} cls={inv.sentStatus === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} />
                            </td>
                            <td className="px-5 py-3 text-gray-500">{fmt(inv.issueDate)}</td>
                            <td className="px-5 py-3 text-gray-500">{fmt(inv.dueDate)}</td>
                            <td className="px-5 py-3 text-gray-400 text-xs">{inv.periodStart ? `${fmt(inv.periodStart)} – ${fmt(inv.periodEnd)}` : inv.invoiceType === 'deposit' ? 'Deposit' : '—'}</td>
                            <td className="px-5 py-3 font-medium text-gray-900">{fmtAud(total)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
