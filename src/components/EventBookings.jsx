import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { format, parseISO } from 'date-fns'
import {
  Plus, ChevronRight, X, Send, Copy, Check,
  Pencil, Trash2, CheckCircle, ClipboardList, MapPin, Bell,
} from 'lucide-react'

// ── June 7 event constants ────────────────────────────────────────────────────
const EVENT = {
  name: 'Hexa Hub Pop-Up',
  date: '2026-06-07',
  venue: 'The Hub, 18 Logistic Court, Huntingdale VIC 3166',
  bumpInTime: '08:00',
  startTime: '10:00',
  finishTime: '22:00',
  bumpOutTime: '23:00',
}

const STATUS = {
  draft:              { label: 'Draft',              cls: 'bg-gray-100 text-gray-600' },
  sent:               { label: 'Docs Sent',          cls: 'bg-blue-100 text-blue-700' },
  signed:             { label: 'Signed',             cls: 'bg-yellow-100 text-yellow-700' },
  insurance_pending:  { label: 'Insurance Pending',  cls: 'bg-orange-100 text-orange-700' },
  insurance_received: { label: 'Complete',           cls: 'bg-green-100 text-green-700' },
  cancelled:          { label: 'Cancelled',          cls: 'bg-red-100 text-red-600' },
}

const VENDOR_TYPES = [
  'Food & Beverage',
  'Products / Retail',
  'Brand Activation',
  'Car Display',
  'Services',
  'Sponsor',
  'Other',
]

function StatusBadge({ status }) {
  const s = STATUS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
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

// ── Inline space editor ───────────────────────────────────────────────────────

function SpaceEditor({ booking, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(booking.allocatedSpace || '')
  const [saving, setSaving] = useState(false)
  const [notified, setNotified] = useState(false)

  const current = booking.allocatedSpace || null

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const updated = { ...booking, allocatedSpace: value.trim(), spaceAssignedAt: now, updatedAt: now }
      await supabase.from('event_bookings').upsert({ id: booking.id, data: updated, updated_at: now })

      // Notify vendor if they've signed or submitted details
      if (booking.vendorEmail && booking.detailsCompleted) {
        await fetch('/api/event-bookings/send-signing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking: updated, mode: 'space_assigned' }),
        }).catch(() => {})
        setNotified(true)
        setTimeout(() => setNotified(false), 3000)
      }

      onUpdate(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="e.g. Stall 3, Space B, Zone A"
        />
        <button onClick={handleSave} disabled={saving || !value.trim()} className="bg-black text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-gray-800 disabled:opacity-40 flex items-center gap-1">
          {saving ? '…' : <><Bell size={11} /> Save & Notify</>}
        </button>
        <button onClick={() => { setEditing(false); setValue(booking.allocatedSpace || '') }} className="text-gray-400 hover:text-gray-700 p-1">
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 flex items-center gap-1.5 text-sm ${current ? 'text-gray-900' : 'text-gray-400 italic'}`}>
        <MapPin size={12} className="shrink-0 text-gray-400" />
        {current || 'TBA — not yet assigned'}
      </div>
      {notified && <span className="text-xs text-green-600 font-medium">Vendor notified ✓</span>}
      <button onClick={() => setEditing(true)} className="text-xs text-gray-400 hover:text-gray-700 underline shrink-0">
        {current ? 'Change' : 'Assign'}
      </button>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function VendorDetail({
  booking, onClose, onEdit, onDelete,
  onSendForSigning, onMarkInsuranceReceived, onCopyLink,
  sending, copied, onUpdate,
}) {
  async function markCancelled() {
    if (!confirm('Cancel this vendor? This cannot be undone.')) return
    const now = new Date().toISOString()
    const updated = { ...booking, status: 'cancelled', updatedAt: now }
    await supabase.from('event_bookings').upsert({ id: booking.id, data: updated, updated_at: now })
    onUpdate(updated)
  }

  const canSend = booking.status === 'draft' && booking.vendorEmail
  const isSent = booking.status === 'sent'
  const isSigned = ['signed', 'insurance_pending'].includes(booking.status)
  const isComplete = booking.status === 'insurance_received'
  const isCancelled = booking.status === 'cancelled'

  const statusOrder = ['draft', 'sent', 'signed', 'insurance_received']
  const effectiveStatus = booking.status === 'insurance_pending' ? 'signed' : booking.status
  const currentIdx = statusOrder.indexOf(effectiveStatus)

  return (
    <div className="w-full md:w-[400px] border-l border-gray-200 bg-white flex flex-col h-full shrink-0">
      <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500">{booking.ref}</span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="text-base font-bold text-gray-900">{booking.vendorName || 'Unnamed Vendor'}</div>
          {booking.vendorBusiness && <div className="text-sm text-gray-500">{booking.vendorBusiness}</div>}
          {booking.vendorType && <div className="text-xs text-gray-400 mt-0.5">{booking.vendorType}</div>}
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
            { label: 'Added' },
            { label: 'Sent' },
            { label: 'Signed' },
            { label: 'Complete' },
          ].map((step, i) => {
            const done = currentIdx >= i
            return (
              <div key={i} className="flex items-center gap-0.5 flex-1 min-w-0">
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

      {/* Allocated space — always visible, inline editable */}
      <div className="px-5 py-3 border-b border-gray-100 shrink-0">
        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Allocated Space</div>
        <SpaceEditor booking={booking} onUpdate={onUpdate} />
      </div>

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
              {sending ? 'Sending…' : 'Send Vendor Agreement'}
            </button>
          )}
          {booking.status === 'draft' && !booking.vendorEmail && (
            <div className="text-xs text-orange-600 bg-orange-50 border border-orange-100 rounded px-3 py-2">
              Add vendor email to send documents.
            </div>
          )}
          {isSent && (
            <div className="bg-blue-50 border border-blue-100 rounded-md px-3 py-2.5 text-xs text-blue-700">
              Agreement sent {booking.sentAt ? format(parseISO(booking.sentAt), 'dd MMM, h:mm a') : ''}. Awaiting vendor signature.
            </div>
          )}
          {isSigned && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-md px-3 py-2.5 space-y-1">
              <div className="text-xs font-semibold text-yellow-800">Signed ✓</div>
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
            <>
              {booking.insuranceUrl ? (
                <a
                  href={booking.insuranceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm hover:bg-gray-50 font-medium"
                >
                  <CheckCircle size={14} className="text-green-500" />
                  View Certificate — {booking.insuranceFileName || 'Certificate of Currency'}
                </a>
              ) : (
                <div className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                  No certificate uploaded yet. Vendor will email to info@hexahub.com.au.
                </div>
              )}
              <button
                onClick={onMarkInsuranceReceived}
                className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
              >
                <CheckCircle size={14} /> Mark Insurance Confirmed
              </button>
            </>
          )}
          {isComplete && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-100 rounded-md px-3 py-2.5 text-xs text-green-700 font-medium">
                ✓ Agreement signed and insurance confirmed. Vendor confirmed for June 7.
              </div>
              {booking.insuranceUrl && (
                <a
                  href={booking.insuranceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2 rounded-md text-xs hover:bg-gray-50"
                >
                  View Insurance Certificate
                </a>
              )}
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

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vendor Details</h3>
          <dl className="space-y-3">
            <Field label="Contact Name" value={booking.vendorName} />
            <Field label="Business" value={booking.vendorBusiness} />
            <Field label="ABN" value={booking.vendorAbn} />
            <Field label="Email" value={booking.vendorEmail} />
            <Field label="Phone" value={booking.vendorPhone} />
            {booking.instagramHandle && (
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Instagram</dt>
                <dd className="text-sm text-gray-900">
                  <a href={`https://instagram.com/${booking.instagramHandle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    @{booking.instagramHandle.replace(/^@/, '')}
                  </a>
                </dd>
              </div>
            )}
            <Field label="Vendor Type" value={booking.vendorType} />
            <Field label="Description" value={booking.vendorDescription} />
          </dl>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</h3>
          <dl className="space-y-2">
            <Field label="Event" value={EVENT.name} />
            <Field label="Date" value="Sunday 7 June 2026" />
            <Field label="Venue" value={EVENT.venue} />
          </dl>
        </div>

        {(booking.participationFee || booking.bond || booking.specialConditions) && (
          <>
            <hr className="border-gray-100" />
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Terms</h3>
              <dl className="space-y-3">
                <Field label="Participation Fee" value={booking.participationFee ? `$${Number(booking.participationFee).toLocaleString()}` : 'Nil — by invitation'} />
                <Field label="Bond" value={booking.bond ? `$${Number(booking.bond).toLocaleString()}` : null} />
                <Field label="Special Conditions" value={booking.specialConditions} />
              </dl>
            </div>
          </>
        )}

        {!isCancelled && !isComplete && (
          <div className="flex gap-2 pt-1">
            {booking.status === 'draft' && (
              <button onClick={onDelete} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded border border-red-100 hover:border-red-200">
                <Trash2 size={12} /> Delete
              </button>
            )}
            {!['draft', 'cancelled', 'insurance_received'].includes(booking.status) && (
              <button onClick={markCancelled} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded border border-red-100 hover:border-red-200">
                <X size={12} /> Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vendor form ───────────────────────────────────────────────────────────────

const BLANK = {
  vendorName: '', vendorBusiness: '', vendorEmail: '', vendorPhone: '', vendorAbn: '',
  vendorType: VENDOR_TYPES[0], vendorDescription: '', allocatedSpace: '',
  participationFee: '', bond: '', specialConditions: '',
}

function VendorForm({ booking, onSave, onClose }) {
  const [form, setForm] = useState(booking ? { ...BLANK, ...booking } : { ...BLANK })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.vendorEmail) { alert('Email is required.'); return }
    if (!form.vendorName) { alert('Name is required.'); return }
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inp = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'
  const lab = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">{booking?.id ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hexa Hub Pop-Up · 7 June 2026</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Required — admin fills these */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</h3>
            <p className="text-xs text-gray-400 mb-3">Only name and email are required. The vendor will fill in their business details when they open the signing link.</p>
            <div className="space-y-3">
              <div><label className={lab}>Name *</label><input className={inp} value={form.vendorName} onChange={e => set('vendorName', e.target.value)} placeholder="First and last name" required /></div>
              <div><label className={lab}>Email *</label><input type="email" className={inp} value={form.vendorEmail} onChange={e => set('vendorEmail', e.target.value)} required /></div>
              <div><label className={lab}>Phone <span className="text-gray-300">(optional)</span></label><input className={inp} value={form.vendorPhone} onChange={e => set('vendorPhone', e.target.value)} /></div>
            </div>
          </section>

          {/* Optional — admin can pre-fill if known */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pre-fill (optional)</h3>
            <p className="text-xs text-gray-400 mb-3">If you already know these, add them. Otherwise the vendor fills them in themselves.</p>
            <div className="space-y-3">
              <div><label className={lab}>Business / Trading Name</label><input className={inp} value={form.vendorBusiness} onChange={e => set('vendorBusiness', e.target.value)} /></div>
              <div><label className={lab}>ABN</label><input className={inp} value={form.vendorAbn} onChange={e => set('vendorAbn', e.target.value)} placeholder="00 000 000 000" /></div>
              <div>
                <label className={lab}>Vendor Type</label>
                <select className={inp} value={form.vendorType} onChange={e => set('vendorType', e.target.value)}>
                  <option value="">— vendor will select —</option>
                  {VENDOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lab}>Allocated Space / Stall</label><input className={inp} value={form.allocatedSpace} onChange={e => set('allocatedSpace', e.target.value)} placeholder="e.g. Stall 3, Space B" /></div>
            </div>
          </section>

          {/* Internal notes */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Terms (optional)</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lab}>Fee $</label><input type="number" className={inp} value={form.participationFee} onChange={e => set('participationFee', e.target.value)} min={0} step={50} placeholder="Nil" /></div>
                <div><label className={lab}>Bond $</label><input type="number" className={inp} value={form.bond} onChange={e => set('bond', e.target.value)} min={0} step={50} placeholder="Nil" /></div>
              </div>
              <div><label className={lab}>Special Conditions</label><textarea className={inp} rows={2} value={form.specialConditions} onChange={e => set('specialConditions', e.target.value)} /></div>
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
            {saving ? 'Saving…' : booking?.id ? 'Save Changes' : 'Add Vendor'}
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
    const ref = editData?.ref || `VND-${String(bookings.length + 1).padStart(3, '0')}`
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
    if (!confirm('Permanently delete this vendor entry?')) return
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
      alert('Failed to send. Please try again.')
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

  const stats = {
    total: bookings.length,
    sent: bookings.filter(b => b.status === 'sent').length,
    signed: bookings.filter(b => ['signed', 'insurance_pending'].includes(b.status)).length,
    complete: bookings.filter(b => b.status === 'insurance_received').length,
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* List */}
      <div className={`flex-1 flex flex-col min-w-0 ${selected ? 'hidden md:flex' : 'flex'}`}>

        {/* Event banner */}
        <div className="bg-black text-white px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Event Vendor Agreements</div>
              <h1 className="text-lg font-bold tracking-tight">Hexa Hub Pop-Up</h1>
              <p className="text-xs text-gray-400 mt-0.5">Sunday 7 June 2026 · 10:00 AM – 10:00 PM · 18 Logistic Court, Huntingdale</p>
            </div>
            <button
              onClick={() => { setEditData(null); setShowForm(true) }}
              className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 shrink-0"
            >
              <Plus size={15} /> Add Vendor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 border-b border-gray-200 bg-white shrink-0">
          {[
            { label: 'Total Vendors', value: stats.total },
            { label: 'Agreement Sent', value: stats.sent, color: 'text-blue-600' },
            { label: 'Signed', value: stats.signed, color: 'text-yellow-600' },
            { label: 'Confirmed', value: stats.complete, color: 'text-green-600' },
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
              <p className="text-sm font-medium text-gray-500">No vendors added yet</p>
              <p className="text-xs mt-1">Click Add Vendor to get started</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Space</th>
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
                    <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{b.ref}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-gray-900">{b.vendorName || '—'}</div>
                      <div className="text-xs text-gray-400">
                        {b.vendorBusiness || ''}
                        {b.instagramHandle && <span className="ml-1 text-gray-300">· @{b.instagramHandle.replace(/^@/, '')}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{b.vendorType || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{b.allocatedSpace || '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5"><ChevronRight size={14} className="text-gray-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail */}
      {selected && (
        <VendorDetail
          booking={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditData(selected); setShowForm(true) }}
          onDelete={() => deleteBooking(selected.id)}
          onSendForSigning={() => sendForSigning(selected)}
          onMarkInsuranceReceived={() => markInsuranceReceived(selected)}
          onCopyLink={() => copySigningLink(selected)}
          sending={sending}
          copied={copied}
          onUpdate={updated => {
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
            setSelected(updated)
          }}
        />
      )}

      {/* Form */}
      {showForm && (
        <VendorForm
          booking={editData}
          onSave={saveBooking}
          onClose={() => { setShowForm(false); setEditData(null) }}
        />
      )}
    </div>
  )
}
