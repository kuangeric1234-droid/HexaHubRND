import { useState, useEffect } from 'react'
import { format, addDays, parseISO, startOfMonth, endOfMonth, getDaysInMonth, differenceInDays } from 'date-fns'
import { X, Plus, Trash2 } from 'lucide-react'

const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Direct Debit', 'Cash', 'Other']
const REVENUE_ACCOUNTS = ['Membership Fees', 'Additional Services', 'Late Fee', 'Bond', 'Other']

function calcLineTotal(item) {
  return Math.round(item.unitPrice * item.qty * (1 - item.discountPct / 100) * 100) / 100
}

function calcTotals(lineItems, discountPct, taxRate = 0.1) {
  const lineSubtotal = lineItems.reduce((s, l) => s + calcLineTotal(l), 0)
  const invoiceDiscount = Math.round(lineSubtotal * (discountPct / 100) * 100) / 100
  const taxable = lineSubtotal - invoiceDiscount
  const gst = Math.round(taxable * taxRate * 100) / 100
  return { lineSubtotal, invoiceDiscount, taxable, gst, total: Math.round((taxable + gst) * 100) / 100 }
}

function newLine(id) {
  return { id, description: '', revenueAccount: 'Membership Fees', unitPrice: 0, qty: 1, discountPct: 0 }
}

function nextInvNumber(invoices) {
  const nums = invoices
    .map((i) => parseInt(i.number?.replace(/\D/g, '') || '0', 10))
    .filter((n) => !isNaN(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `INV-${String(max + 1).padStart(4, '0')}`
}

export default function InvoiceForm({ invoices, tenants, leases, spaces, taxRatePct = 10, onSave, onClose }) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    tenantId: '',
    issueDate: today,
    dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    reference: '',
    number: nextInvNumber(invoices),
    paymentMethod: '',
    discountPct: 0,
    periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    lineItems: [newLine(`li${Date.now()}`)],
    vatEnabled: true,
  })

  // Auto-fill line items when tenant selected
  useEffect(() => {
    if (!form.tenantId) return
    const activeLease = leases.find(
      (l) => l.tenantId === form.tenantId && l.status === 'active'
    )
    if (!activeLease) return
    const space = spaces.find((s) => s.id === activeLease.spaceId)

    // Calculate amount for the period (with proration)
    const periodStart = parseISO(form.periodStart)
    const leaseStart = parseISO(activeLease.startDate)
    const daysInMonth = getDaysInMonth(periodStart)
    const startOfPeriod = startOfMonth(periodStart)
    const isFirstMonth =
      format(leaseStart, 'yyyy-MM') === format(periodStart, 'yyyy-MM') &&
      leaseStart.getDate() > 1
    let amount = activeLease.monthlyRent
    let isProrated = false
    if (isFirstMonth) {
      const daysOccupied = daysInMonth - leaseStart.getDate() + 1
      amount = Math.round((activeLease.monthlyRent * daysOccupied / daysInMonth) * 100) / 100
      isProrated = true
    }

    const periodLabel = `${format(periodStart, 'd MMM')} – ${format(parseISO(form.periodEnd), 'd MMM yyyy')}`
    const desc = `${space?.unitNumber ?? ''}${space?.address ? ` – ${space.address}` : ''} · ${periodLabel}${isProrated ? ' (prorated)' : ''}`

    setForm((f) => ({
      ...f,
      lineItems: [{
        id: `li${Date.now()}`,
        description: desc,
        revenueAccount: 'Membership Fees',
        unitPrice: amount,
        qty: 1,
        discountPct: 0,
      }],
    }))
  }, [form.tenantId, form.periodStart]) // eslint-disable-line react-hooks/exhaustive-deps

  function addLine() {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, newLine(`li${Date.now()}`)] }))
  }

  function removeLine(id) {
    setForm((f) => ({ ...f, lineItems: f.lineItems.filter((l) => l.id !== id) }))
  }

  function updateLine(id, field, value) {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((l) =>
        l.id === id ? { ...l, [field]: field === 'description' || field === 'revenueAccount' ? value : Number(value) } : l
      ),
    }))
  }

  function handleSave(sendNow) {
    onSave({
      ...form,
      status: 'pending',
      sentStatus: sendNow ? 'sent' : 'not_sent',
      source: 'manual',
      xeroSync: false,
      isProrated: false,
    })
  }

  const { lineSubtotal, invoiceDiscount, taxable, gst, total } = calcTotals(form.lineItems, form.discountPct, taxRatePct / 100)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Add Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {/* To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select company</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.businessName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date *</label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1 text-red-600">Due Date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-red-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reference</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Number</label>
              <input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=""></option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPct}
                  onChange={(e) => setForm({ ...form, discountPct: Number(e.target.value) })}
                  className="w-20 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period Start</label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) =>
                  setForm({
                    ...form,
                    periodStart: e.target.value,
                    periodEnd: format(endOfMonth(parseISO(e.target.value)), 'yyyy-MM-dd'),
                  })
                }
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Period End</label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-gray-100 pt-4">
            <div className="grid gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
              style={{ gridTemplateColumns: '3fr 1.5fr 60px 60px 70px 24px' }}>
              <span>Description</span>
              <span>Revenue Account</span>
              <span>Unit Price</span>
              <span>Qty</span>
              <span>Price</span>
              <span />
            </div>

            {form.lineItems.map((line) => (
              <div key={line.id} className="grid gap-2 items-center mb-2"
                style={{ gridTemplateColumns: '3fr 1.5fr 60px 60px 70px 24px' }}>
                <input
                  value={line.description}
                  onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                  placeholder="Description"
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <select
                  value={line.revenueAccount}
                  onChange={(e) => updateLine(line.id, 'revenueAccount', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {REVENUE_ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <input
                  type="number"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.id, 'unitPrice', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  value={line.qty}
                  onChange={(e) => updateLine(line.id, 'qty', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-right text-gray-700 font-medium">
                  ${calcLineTotal(line).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </span>
                <button type="button" onClick={() => removeLine(line.id)}
                  className="text-gray-300 hover:text-red-400">
                  <X size={13} />
                </button>
              </div>
            ))}

            <button type="button" onClick={addLine}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center gap-1">
              <Plus size={12} /> Add new line item
            </button>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-3 flex justify-end">
            <div className="w-52 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${lineSubtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
              </div>
              {form.discountPct > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Discount ({form.discountPct}%):</span>
                  <span>-${invoiceDiscount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {form.vatEnabled && (
                <div className="flex justify-between text-gray-500">
                  <span>GST ({taxRatePct}%):</span>
                  <span>${gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1">
                <span>Total:</span>
                <span>${total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 shrink-0">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
            Close
          </button>
          <button onClick={() => handleSave(false)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
            Add
          </button>
          <button onClick={() => handleSave(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded hover:bg-blue-800">
            Add & Send
          </button>
        </div>
      </div>
    </div>
  )
}
