import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { format, parseISO } from 'date-fns'
import {
  Plus, Calendar, ChevronRight, X, Send, Copy, Check,
  Pencil, Trash2, CheckCircle, ClipboardList,
} from 'lucide-react'

const STATUS = {
  draft:              { label: 'Draft',              cls: 'bg-gray-100 text-gray-600' },
  sent:               { label: 'Docs Sent',          cls: 'bg-blue-100 text-blue-700' },
  signed:             { label: 'Signed',             cls: 'bg-yellow-100 text-yellow-700' },
  insurance_pending:  { label: 'Insurance Pending',  cls: 'bg-orange-100 text-orange-700' },
  insurance_received: { label: 'Complete',           cls: 'bg-green-100 text-green-700' },
  cancelled:          { label: 'Cancelled',          cls: 'bg-red-100 text-red-600' },
}

const VENUES = [
  '17 Logistic Court, Huntingdale VIC 3166',
  '11 Distribution Circuit, Huntingdale VIC 3166',
  '7 Distribution Circuit, Huntingdale VIC 3166',
  'The Hub — 18 Logistic Court, Huntingdale VIC 3166',
]

const PERMITTED_USES = [
  'Corporate Event',
  'Workshop / Training',
  'Exhibition / Trade Show',
  'Private Function',
  'Product Launch',
  'Networking Event',
  'Pop-Up Market',
  'Other',
]

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
  )
}

function Field({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}

function fmtTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function BookingDetail({
  booking, onClose, onEdit, onDelete,
  onSendForSigning, onMarkInsuranceReceived, onCopyLink,
  sending, copied, onUpdate,
}) {
  async function markCancelled() {
    if (!confirm('Cancel this booking? This cannot be undone.')) return
    const now = new Date().toISOString()
    const updated = { ...booking, status: 'cancelled', updatedAt: now }
    await supabase.from('event_bookings').upsert({ id: booking.id, data: updated, updated_at: now })
    onUpdate(updated)
  }

  const canSend = booking.status === 'draft' && booking.organiserEmail
  const isSent = booking.status === 'sent'
  const isSigned = ['signed', 'insurance_pending'].includes(booking.status)
  const isComplete = booking.status === 'insurance_received'
  const isCancelled = booking.status === 'cancelled'

  const statusOrder = ['draft', 'sent', 'signed', 'insurance_received']
  const effectiveStatus = booking.status === 'insurance_pending' ? 'signed' : booking.status
  const currentIdx = statusOrder.indexOf(effectiveStatus)

  return (
    <div className="w-full md:w-[420px] border-l border-gray-200 bg-white flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500">{booking.ref}</span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-base font-bold text-gray-900">{booking.organiserName || 'Unnamed Booking'}</div>
          {booking.organiserCompany && <div className="text-sm text-gray-500">{booking.organiserCompany}</div>}
        </div>
        <div className="flex items-center gap-1">
          {!isCancelled && !isComplete && (
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Pencil size={13} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center gap-0.5 text-xs">
          {[
            { key: 'draft', label: 'Created' },
            { key: 'sent', label: 'Sent' },
            { key: 'signed', label: 'Signed' },
            { key: 'insurance_received', label: 'Complete' },
          ].map((step, i) => {
            const done = currentIdx >= i
            return (
              <div key={step.key} className="flex items-center gap-0.5 flex-1 min-w-0">
                <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${done ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {done ? <Check size={9} /> : <span className="text-[10px]">{i + 1}</span>}
                </div>
                <span className={`truncate ${done ? 'text-gray-700' : 'text-gray-400'}`}>{step.label}</span>
                {i < 3 && <div className={`flex-1 h-px mx-0.5 ${done ? 'bg-gray-400' : 'bg-gray-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Actions */}
        <div className="space-y-2">
          {canSend && (
            <button
              onClick={onSendForSigning}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-40"
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send Documents for Signing'}
            </button>
          )}
          {!canSend && booking.status === 'draft' && !booking.organiserEmail && (
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded px-3 py-2">
              Add organiser email before sending.
            </div>
          )}
          {isSent && (
            <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2.5 text-xs text-blue-700">
              Documents sent {booking.sentAt ? format(parseISO(booking.sentAt), 'dd MMM yyyy, h:mm a') : ''}. Awaiting signature.
            </div>
          )}
          {isSigned && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-md px-3 py-2.5 space-y-1">
              <div className="text-xs font-semibold text-yellow-800">Signed</div>
              {booking.signedAt && (
                <div className="text-xs text-yellow-700">
                  By {booking.signerName}{booking.signerTitle ? ` (${booking.signerTitle})` : ''} · {format(parseISO(booking.signedAt), 'dd MMM yyyy')}
                </div>
              )}
              {booking.status === 'insurance_pending' && (
                <div className="text-xs text-orange-600 font-medium">Insurance certificate not yet received</div>
              )}
            </div>
          )}
          {isSigned && (
            <button
              onClick={onMarkInsuranceReceived}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
            >
              <CheckCircle size={14} /> Mark Insurance Received
            </button>
          )}
          {isComplete && (
            <div className="bg-green-50 border border-green-100 rounded-md px-3 py-2.5 text-xs text-green-700 font-medium">
              Booking complete — all documents signed and insurance received.
            </div>
          )}
          {booking.signingToken && !isCancelled && (
            <button
              onClick={onCopyLink}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2 rounded-md text-xs hover:bg-gray-50"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy Signing Link'}
            </button>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Event details */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</h3>
          <dl className="space-y-3">
            <Field label="Venue" value={booking.venue} />
            <Field label="Permitted Use" value={booking.permittedUse} />
            <Field label="Event Description" value={booking.eventDescription} />
            <Field label="Event Date" value={booking.eventDate ? format(parseISO(booking.eventDate), 'EEEE, d MMMM yyyy') : null} />
            <Field label="Access / Bump-In" value={fmtTime(booking.accessTime)} />
            <Field label="Event Start" value={fmtTime(booking.eventStartTime)} />
            <Field label="Event Finish" value={fmtTime(booking.eventFinishTime)} />
            <Field label="Bump-Out Completion" value={fmtTime(booking.bumpOutTime)} />
            <Field label="Max Attendance" value={booking.maxAttendance} />
          </dl>
        </div>

        <hr className="border-gray-100" />

        {/* Financials */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Financials</h3>
          <dl className="space-y-3">
            <Field label="Licence Fee (inc. GST)" value={booking.licenceFee ? `$${Number(booking.licenceFee).toLocaleString()}` : null} />
            <Field label="Bond" value={booking.bond ? `$${Number(booking.bond).toLocaleString()}` : null} />
            <Field label="Deposit" value={booking.deposit ? `$${Number(booking.deposit).toLocaleString()}` : null} />
            <Field label="Balance Due Date" value={booking.balanceDueDate ? format(parseISO(booking.balanceDueDate), 'dd/MM/yyyy') : null} />
          </dl>
        </div>

        <hr className="border-gray-100" />

        {/* Requirements */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requirements</h3>
          <div className="space-y-1.5 mb-3">
            {[
              { key: 'alcoholPermitted', label: 'Alcohol Permitted' },
              { key: 'foodPermitted', label: 'Food Permitted' },
              { key: 'securityRequired', label: 'Security Required' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${booking[key] ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-gray-700">{label}: {booking[key] ? 'Yes' : 'No'}</span>
              </div>
            ))}
          </div>
          <dl className="space-y-3">
            <Field label="Insurance Requirement" value={booking.insuranceRequired} />
            <Field label="Included Services" value={booking.includedServices} />
            <Field label="Excluded Services" value={booking.excludedServices} />
            <Field label="Special Conditions" value={booking.specialConditions} />
          </dl>
        </div>

        <hr className="border-gray-100" />

        {/* Organiser */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organiser</h3>
          <dl className="space-y-3">
            <Field label="Name" value={booking.organiserName} />
            <Field label="Company" value={booking.organiserCompany} />
            <Field label="ABN" value={booking.organiserAbn} />
            <Field label="Email" value={booking.organiserEmail} />
            <Field label="Phone" value={booking.organiserPhone} />
          </dl>
        </div>

        {/* Danger zone */}
        {!isCancelled && !isComplete && (
          <div className="flex gap-2 pt-1">
            {booking.status === 'draft' && (
              <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded border border-red-100 hover:border-red-200">
                <Trash2 size={12} /> Delete
              </button>
            )}
            {!['draft', 'cancelled', 'insurance_received'].includes(booking.status) && (
              <button onClick={markCancelled} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded border border-red-100 hover:border-red-200">
                <X size={12} /> Cancel Booking
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── New / edit form ───────────────────────────────────────────────────────────

const BLANK = {
  organiserName: '', organiserCompany: '', organiserEmail: '', organiserPhone: '', organiserAbn: '',
  venue: VENUES[0], permittedUse: PERMITTED_USES[0], eventDescription: '',
  eventDate: '', accessTime: '07:00', eventStartTime: '09:00', eventFinishTime: '17:00', bumpOutTime: '18:00',
  maxAttendance: '', licenceFee: '', bond: '', deposit: '', balanceDueDate: '',
  alcoholPermitted: false, foodPermitted: true, securityRequired: false,
  insuranceRequired: 'Min. AUD $20,000,000 Public Liability Insurance',
  includedServices: '', excludedServices: '', specialConditions: '',
}

function BookingForm({ booking, onSave, onClose }) {
  const [form, setForm] = useState(booking ? { ...BLANK, ...booking } : { ...BLANK })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.organiserEmail) { alert('Organiser email is required.'); return }
    if (!form.eventDate) { alert('Event date is required.'); return }
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inp = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const lab = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-bold text-gray-900">{booking?.id ? 'Edit Booking' : 'New Event Booking'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Organiser / Licensee</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Full Name *</label><input className={inp} value={form.organiserName} onChange={e => set('organiserName', e.target.value)} required /></div>
                <div><label className={lab}>Company Name</label><input className={inp} value={form.organiserCompany} onChange={e => set('organiserCompany', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Email *</label><input type="email" className={inp} value={form.organiserEmail} onChange={e => set('organiserEmail', e.target.value)} required /></div>
                <div><label className={lab}>Phone</label><input className={inp} value={form.organiserPhone} onChange={e => set('organiserPhone', e.target.value)} /></div>
              </div>
              <div><label className={lab}>ABN</label><input className={inp} value={form.organiserAbn} onChange={e => set('organiserAbn', e.target.value)} placeholder="00 000 000 000" /></div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</h3>
            <div className="space-y-3">
              <div>
                <label className={lab}>Venue</label>
                <select className={inp} value={form.venue} onChange={e => set('venue', e.target.value)}>
                  {VENUES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={lab}>Permitted Use</label>
                <select className={inp} value={form.permittedUse} onChange={e => set('permittedUse', e.target.value)}>
                  {PERMITTED_USES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={lab}>Event Description</label>
                <textarea className={inp} rows={2} value={form.eventDescription} onChange={e => set('eventDescription', e.target.value)} />
              </div>
              <div>
                <label className={lab}>Event Date *</label>
                <input type="date" className={inp} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Access / Bump-In</label><input type="time" className={inp} value={form.accessTime} onChange={e => set('accessTime', e.target.value)} /></div>
                <div><label className={lab}>Event Start</label><input type="time" className={inp} value={form.eventStartTime} onChange={e => set('eventStartTime', e.target.value)} /></div>
                <div><label className={lab}>Event Finish</label><input type="time" className={inp} value={form.eventFinishTime} onChange={e => set('eventFinishTime', e.target.value)} /></div>
                <div><label className={lab}>Bump-Out Completion</label><input type="time" className={inp} value={form.bumpOutTime} onChange={e => set('bumpOutTime', e.target.value)} /></div>
              </div>
              <div>
                <label className={lab}>Maximum Attendance</label>
                <input type="number" className={inp} value={form.maxAttendance} onChange={e => set('maxAttendance', e.target.value)} min={1} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Financials</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Licence Fee (inc. GST) $</label><input type="number" className={inp} value={form.licenceFee} onChange={e => set('licenceFee', e.target.value)} min={0} step={50} /></div>
                <div><label className={lab}>Bond $</label><input type="number" className={inp} value={form.bond} onChange={e => set('bond', e.target.value)} min={0} step={50} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Deposit (due now) $</label><input type="number" className={inp} value={form.deposit} onChange={e => set('deposit', e.target.value)} min={0} step={50} /></div>
                <div><label className={lab}>Balance Due Date</label><input type="date" className={inp} value={form.balanceDueDate} onChange={e => set('balanceDueDate', e.target.value)} /></div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requirements & Conditions</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-6">
                {[
                  { k: 'alcoholPermitted', label: 'Alcohol Permitted' },
                  { k: 'foodPermitted', label: 'Food Permitted' },
                  { k: 'securityRequired', label: 'Security Required' },
                ].map(({ k, label }) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
                    {label}
                  </label>
                ))}
              </div>
              <div><label className={lab}>Insurance Requirement</label><input className={inp} value={form.insuranceRequired} onChange={e => set('insuranceRequired', e.target.value)} /></div>
              <div><label className={lab}>Included Services</label><textarea className={inp} rows={2} value={form.includedServices} onChange={e => set('includedServices', e.target.value)} placeholder="e.g. Tables, chairs, PA system, WiFi" /></div>
              <div><label className={lab}>Excluded Services</label><textarea className={inp} rows={2} value={form.excludedServices} onChange={e => set('excludedServices', e.target.value)} placeholder="e.g. Catering, decorations, AV technician" /></div>
              <div><label className={lab}>Special Conditions</label><textarea className={inp} rows={3} value={form.specialConditions} onChange={e => set('specialConditions', e.target.value)} /></div>
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
            {saving ? 'Saving…' : booking?.id ? 'Save Changes' : 'Create Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EventBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadBookings() }, [])

  async function loadBookings() {
    const { data } = await supabase
      .from('event_bookings')
      .select('data')
      .order('updated_at', { ascending: false })
    setBookings((data ?? []).map(r => r.data).filter(Boolean))
    setLoading(false)
  }

  async function saveBooking(formData) {
    const isNew = !editData?.id
    const id = editData?.id || `eb${Date.now()}`
    const ref = editData?.ref || `EVT-${String(bookings.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString()
    const item = {
      ...editData,
      ...formData,
      id,
      ref,
      status: editData?.status || 'draft',
      updatedAt: now,
      createdAt: editData?.createdAt || now,
    }
    await supabase.from('event_bookings').upsert({ id, data: item, updated_at: now })
    if (isNew) {
      setBookings(prev => [item, ...prev])
      setSelected(item)
    } else {
      setBookings(prev => prev.map(b => b.id === id ? item : b))
      if (selected?.id === id) setSelected(item)
    }
    setShowForm(false)
    setEditData(null)
  }

  async function deleteBooking(id) {
    if (!confirm('Permanently delete this booking?')) return
    await supabase.from('event_bookings').delete().eq('id', id)
    setBookings(prev => prev.filter(b => b.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function sendForSigning(booking) {
    setSending(true)
    try {
      const token = crypto.randomUUID()
      const now = new Date().toISOString()
      const signingUrl = `${window.location.origin}/sign/event/${token}`
      const updated = { ...booking, status: 'sent', signingToken: token, sentAt: now, updatedAt: now }

      await supabase.from('event_bookings').upsert({ id: booking.id, data: updated, updated_at: now })

      const res = await fetch('/api/event-bookings/send-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: updated, signingUrl }),
      })
      if (!res.ok) throw new Error('Send failed')

      setBookings(prev => prev.map(b => b.id === booking.id ? updated : b))
      setSelected(updated)
    } catch {
      alert('Failed to send signing email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function markInsuranceReceived(booking) {
    const now = new Date().toISOString()
    const updated = { ...booking, status: 'insurance_received', insuranceReceivedAt: now, updatedAt: now }
    await supabase.from('event_bookings').upsert({ id: booking.id, data: updated, updated_at: now })
    setBookings(prev => prev.map(b => b.id === booking.id ? updated : b))
    setSelected(updated)
  }

  function copySigningLink(booking) {
    navigator.clipboard.writeText(`${window.location.origin}/sign/event/${booking.signingToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleUpdate(updated) {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
    setSelected(updated)
  }

  const stats = {
    total: bookings.length,
    sent: bookings.filter(b => b.status === 'sent').length,
    signed: bookings.filter(b => ['signed', 'insurance_pending'].includes(b.status)).length,
    complete: bookings.filter(b => b.status === 'insurance_received').length,
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left: list */}
      <div className={`flex-1 flex flex-col min-w-0 ${selected ? 'hidden md:flex' : 'flex'}`}>

        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Event Bookings</h1>
            <p className="text-xs text-gray-400 mt-0.5">Venue licence agreements and event document signing</p>
          </div>
          <button
            onClick={() => { setEditData(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-800"
          >
            <Plus size={15} /> New Booking
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 border-b border-gray-200 bg-white shrink-0">
          {[
            { label: 'Total', value: stats.total, color: '' },
            { label: 'Awaiting Signature', value: stats.sent, color: 'text-blue-600' },
            { label: 'Signed', value: stats.signed, color: 'text-yellow-600' },
            { label: 'Complete', value: stats.complete, color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className={`px-6 py-4 ${i < 3 ? 'border-r border-gray-200' : ''}`}>
              <div className={`text-2xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading…</div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <ClipboardList size={40} className="mb-3 opacity-25" />
              <p className="text-sm font-medium text-gray-500">No event bookings yet</p>
              <p className="text-xs mt-1">Click New Booking to get started</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Organiser</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Venue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={`cursor-pointer transition-colors ${selected?.id === b.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-600">{b.ref}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{b.organiserName || '—'}</div>
                      {b.organiserCompany && <div className="text-xs text-gray-400">{b.organiserCompany}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {b.eventDate ? format(parseISO(b.eventDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[200px] truncate hidden lg:table-cell">{b.venue || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {b.licenceFee ? `$${Number(b.licenceFee).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5"><ChevronRight size={14} className="text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selected && (
        <BookingDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditData(selected); setShowForm(true) }}
          onDelete={() => deleteBooking(selected.id)}
          onSendForSigning={() => sendForSigning(selected)}
          onMarkInsuranceReceived={() => markInsuranceReceived(selected)}
          onCopyLink={() => copySigningLink(selected)}
          sending={sending}
          copied={copied}
          onUpdate={handleUpdate}
        />
      )}

      {/* Form modal */}
      {showForm && (
        <BookingForm
          booking={editData}
          onSave={saveBooking}
          onClose={() => { setShowForm(false); setEditData(null) }}
        />
      )}
    </div>
  )
}
