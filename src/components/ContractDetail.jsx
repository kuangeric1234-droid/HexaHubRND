import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, FileDown, ChevronDown, LayoutGrid, FileText, CheckCircle2 } from 'lucide-react'
import ContractTemplate from './ContractTemplate.jsx'
import { sendEmail, eSignEmailHtml } from '../lib/sendEmail.js'

const SIG_STATUS = {
  manually_signed: { label: 'Manually Signed', cls: 'bg-green-500 text-white' },
  e_signed:        { label: 'E Signed',          cls: 'bg-green-500 text-white' },
  out_for_signature: { label: 'Out For Signature', cls: 'bg-pink-400 text-white' },
  not_signed:      { label: 'Not Signed',        cls: 'bg-gray-300 text-gray-700' },
}

function getStageBadges(lease) {
  const today = new Date()
  const badges = []
  const sig = lease.signatureStatus
  if (sig === 'manually_signed' || sig === 'e_signed') {
    badges.push({ label: 'Signed', cls: 'bg-green-500 text-white' })
  } else {
    badges.push({ label: 'Not Signed', cls: 'bg-red-400 text-white' })
  }
  badges.push({ label: lease.contractType ?? 'New', cls: 'bg-blue-500 text-white' })
  if (lease.status === 'active' && lease.endDate) {
    const d = differenceInDays(parseISO(lease.endDate), today)
    if (d < 0) badges.push({ label: 'Expired', cls: 'bg-gray-400 text-white' })
    else if (d <= 60) badges.push({ label: 'Not Renewed', cls: 'bg-orange-500 text-white' })
    else badges.push({ label: 'Active', cls: 'bg-green-600 text-white' })
  }
  return badges
}

export default function ContractDetail({
  lease, tenant, space, templates = [], allLeases = [], settings,
  onEdit, onBack, onRenew, onDelete, onUpdateLease,
}) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showSignMenu, setShowSignMenu] = useState(false)
  const [view, setView] = useState('grid') // 'grid' | 'template'
  const [generating, setGenerating] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  const isSigned = lease.signatureStatus === 'manually_signed' || lease.signatureStatus === 'e_signed'
  const isOutForSign = lease.signatureStatus === 'out_for_signature'

  const eSignAdminLink = lease.eSignAdminLink ?? `https://esign.hexahub.com.au/admin/${lease.id}`
  const eSignMemberLink = lease.eSignMemberLink ?? `https://esign.hexahub.com.au/member/${lease.id}`

  function copyLink(link, label) {
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopyMsg(`${label} copied`)
    setTimeout(() => setCopyMsg(''), 2000)
  }

  async function handleSendForESign() {
    setShowSignMenu(false)
    const updatedLease = {
      signatureStatus: 'out_for_signature',
      eSignAdminLink: `https://esign.hexahub.com.au/admin/${lease.id}`,
      eSignMemberLink: `https://esign.hexahub.com.au/member/${lease.id}`,
      eSignSentAt: new Date().toISOString(),
    }
    if (onUpdateLease) onUpdateLease(lease.id, updatedLease)

    // Send eSign email to tenant if email is on file
    if (tenant?.email) {
      try {
        const mergedLease = { ...lease, ...updatedLease }
        await sendEmail({
          to: tenant.email,
          subject: `Please sign: ${lease.contractNumber ?? 'Licence Agreement'} — ${settings?.contracts?.eSignName ?? settings?.company?.name ?? 'HexaHub'}`,
          html: eSignEmailHtml({ lease: mergedLease, tenant, settings }),
          settings,
        })
      } catch {
        // silently fail — lease status already updated
      }
    }
  }

  function handleMarkAsSigned() {
    setShowSignMenu(false)
    if (onUpdateLease) {
      onUpdateLease(lease.id, {
        signatureStatus: 'manually_signed',
        signedAt: new Date().toISOString(),
      })
    }
  }

  const contractNum = lease.contractNumber ?? `CON-${lease.id.slice(-3).toUpperCase()}`
  const stageBadges = getStageBadges(lease)
  const sigMeta = SIG_STATUS[lease.signatureStatus]
  const annualValue = lease.monthlyRent ? lease.monthlyRent * 12 : null
  const isMonthToMonth = lease.contractType === 'Month-to-month' || lease.documentType === 'Membership Agreement Month-to-month'

  // Find previous contract if this is a renewal
  const prevContract = lease.previousContractId
    ? allLeases.find((l) => l.id === lease.previousContractId)
    : null
  const prevNum = prevContract?.contractNumber ?? (lease.previousContractId ? `CON-${lease.previousContractId.slice(-3).toUpperCase()}` : null)

  // Resources = items from the contract
  const items = lease.items ?? [{
    spaceId: lease.spaceId,
    deposit: lease.bondAmount ?? 0,
    steps: [{ startDate: lease.startDate, endDate: lease.endDate, listPrice: lease.monthlyRent, discount: '' }],
  }]

  // Attached templates
  const attachedTemplates = (lease.contractTerms ?? [])
    .map((ref) => templates.find((t) => t.id === ref) ?? templates.find((t) => `${t.name} - ${t.version}` === ref || t.name === ref))
    .filter(Boolean)

  async function handleGeneratePDF() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const H = doc.internal.pageSize.getHeight()
      const ml = 18, mr = W - 18
      let y = 20

      function checkPage(needed = 14) {
        if (y + needed > H - 15) { doc.addPage(); y = 20 }
      }

      // Header
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0)
      doc.text('LICENCE AGREEMENT', ml, y)
      doc.setFontSize(13)
      doc.text('HEXA SPACE', mr, y, { align: 'right' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120)
      doc.text('六合空间', mr, y + 5, { align: 'right' })
      y += 14

      // Agreement info
      doc.setFontSize(8.5)
      doc.setTextColor(0)
      doc.setFont('helvetica', 'normal')
      doc.text(`Agreement ID: ${contractNum}`, ml, y)
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, ml, y + 5)
      doc.setFont('helvetica', 'bold')
      doc.text('Business Centre Address', mr, y, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.text('7 Distribution Circuit', mr, y + 5, { align: 'right' })
      doc.text('Huntingdale VIC 3166', mr, y + 10, { align: 'right' })
      doc.text('Australia, Victoria', mr, y + 15, { align: 'right' })
      y += 22
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.line(ml, y, mr, y)
      y += 8

      // Company + Contact (two columns)
      const colMid = ml + (mr - ml) / 2 + 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('COMPANY', ml, y)
      doc.text('PRIMARY CONTACT', colMid, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      const leftLines = [
        `Company: ${tenant?.businessName ?? '—'}`,
        `Address:`,
        `City/State:`,
        `Post code:`,
        `ABN: ${tenant?.abn ?? ''}`,
      ]
      const rightLines = [
        `Name: ${tenant?.contactName ?? '—'}`,
        `Number: ${tenant?.phone ?? ''}`,
        `Email: ${tenant?.email ?? ''}`,
      ]
      const maxRows = Math.max(leftLines.length, rightLines.length)
      for (let i = 0; i < maxRows; i++) {
        checkPage()
        if (leftLines[i]) doc.text(leftLines[i], ml, y)
        if (rightLines[i]) doc.text(rightLines[i], colMid, y)
        y += 5
      }
      y += 6

      // Licence Fee Details table
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('LICENCE FEE DETAILS', ml, y)
      y += 5

      const cols = { office: ml, start: ml + 26, end: ml + 54, price: ml + 82, ws: ml + 124, total: ml + 142 }
      doc.setFillColor(245, 245, 245)
      doc.rect(ml, y - 3, mr - ml, 7, 'F')
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text('OFFICE', cols.office, y + 1)
      doc.text('START DATE', cols.start, y + 1)
      doc.text('END DATE', cols.end, y + 1)
      doc.text('PRICE PER W/S', cols.price, y + 1)
      doc.text('W/S', cols.ws, y + 1)
      doc.text('MONTHLY TOTAL', cols.total, y + 1)
      y += 7

      const items = lease.items ?? [{
        spaceId: lease.spaceId,
        deposit: lease.bondAmount ?? 0,
        steps: [{ startDate: lease.startDate, endDate: lease.endDate, listPrice: lease.monthlyRent ?? 0, qty: 1 }],
      }]

      doc.setFont('helvetica', 'normal')
      for (const item of items) {
        for (const step of (item.steps ?? [])) {
          checkPage()
          const price = Number(step.listPrice ?? 0)
          const qty = Number(step.qty ?? 1)
          doc.setDrawColor(220)
          doc.line(ml, y - 1, mr, y - 1)
          doc.text(space?.unitNumber ?? '—', cols.office, y + 3)
          doc.text(step.startDate ? format(parseISO(step.startDate), 'dd/MM/yyyy') : '—', cols.start, y + 3)
          doc.text(step.endDate ? format(parseISO(step.endDate), 'dd/MM/yyyy') : '—', cols.end, y + 3)
          doc.text(`${price.toFixed(2)} AUD`, cols.price + 38, y + 3, { align: 'right' })
          doc.text(String(qty), cols.ws + 4, y + 3, { align: 'center' })
          doc.text(`${(price * qty).toFixed(2)} AUD`, mr, y + 3, { align: 'right' })
          y += 8
        }
      }
      y += 4

      // Summary
      const deposit = Number(items[0]?.deposit ?? 0)
      const taxRatePct = settings?.billingRules?.taxRate ?? 10
      const gst = Math.round(deposit * (taxRatePct / 100) * 100) / 100
      const totalInit = Math.round((deposit + gst) * 100) / 100

      const sumRows = [
        [`Minimum Notice Period:`, `${lease.noticePeriodMonths ?? 1} (M), 0 (W), 0 (D)`],
        [`Start Date:`, lease.startDate ? format(parseISO(lease.startDate), 'dd/MM/yyyy') : '—'],
        [`End Date:`, lease.endDate ? format(parseISO(lease.endDate), 'dd/MM/yyyy') : '—'],
      ]
      const payRows = [
        [`Initial payment:`, `${deposit.toFixed(2)} AUD`],
        [`GST ${taxRatePct} %:`, `${gst.toFixed(2)} AUD`],
        [`Total initial payment:`, `${totalInit.toFixed(2)} AUD`],
        [`Deposit`, `${deposit.toFixed(2)} AUD`],
      ]
      const maxSumRows = Math.max(sumRows.length, payRows.length)
      doc.setFontSize(8)
      for (let i = 0; i < maxSumRows; i++) {
        checkPage()
        doc.setDrawColor(220)
        doc.line(ml, y - 1, colMid - 4, y - 1)
        doc.line(colMid, y - 1, mr, y - 1)
        if (sumRows[i]) {
          doc.setFont('helvetica', 'bold')
          doc.text(sumRows[i][0], ml, y + 3)
          doc.setFont('helvetica', 'normal')
          doc.text(sumRows[i][1], colMid - 6, y + 3, { align: 'right' })
        }
        if (payRows[i]) {
          doc.setFont('helvetica', 'bold')
          doc.text(payRows[i][0], colMid, y + 3)
          doc.setFont('helvetica', 'normal')
          doc.text(payRows[i][1], mr, y + 3, { align: 'right' })
        }
        y += 7
      }
      y += 4
      doc.setFontSize(7)
      doc.setTextColor(130)
      doc.text('*Minimum Term is subject to written notice from either party. Minimum notice period as specified above.', ml, y)
      y += 10
      doc.setTextColor(0)

      // Signature blocks
      checkPage(50)
      doc.setDrawColor(180)
      doc.line(ml, y, mr, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.text('For and on behalf of You The Licensee:', ml, y)
      doc.text('For and on behalf of Us The Licensor:', colMid, y)
      y += 8
      for (const field of ['Name:', 'Title:', 'Date:', 'Signature:']) {
        doc.setFont('helvetica', 'bold')
        doc.text(field, ml, y)
        doc.text(field, colMid, y)
        doc.setDrawColor(100)
        doc.line(ml + 18, y + 1, colMid - 6, y + 1)
        doc.line(colMid + 18, y + 1, mr, y + 1)
        y += 9
      }

      // Page numbers
      const pages = doc.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150)
        doc.text(`${contractNum} · HexaHub Pty Ltd · Page ${i} of ${pages}`, W / 2, H - 8, { align: 'center' })
      }

      const slug = (tenant?.businessName ?? 'contract').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      doc.save(`${contractNum}_${slug}.pdf`)

      // Save the generation record
      const now = new Date().toISOString()
      if (onUpdateLease) {
        onUpdateLease(lease.id, {
          lastGeneratedAt: now,
          lastGeneratedFile: `${contractNum}_${slug}.pdf`,
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-sm">
          <button onClick={onBack} className="text-blue-600 hover:underline flex items-center gap-1">
            Contracts
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-semibold">{contractNum}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Copy feedback toast */}
          {copyMsg && (
            <span className="text-xs text-green-600 font-medium">{copyMsg}</span>
          )}

          {/* [...] menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-gray-600 font-bold text-sm"
            >
              ...
            </button>
            {showMenu && (
              <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-36 py-1">
                <button
                  onClick={() => { setShowMenu(false); onBack() }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(lease.id) }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Sign dropdown (unsigned) / Renew (signed) */}
          {isSigned ? (
            <button
              onClick={onRenew}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Renew
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowSignMenu((v) => !v)}
                className="flex items-center gap-1.5 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
              >
                Sign <ChevronDown size={13} />
              </button>
              {showSignMenu && (
                <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-44 py-1">
                  <button
                    onClick={handleSendForESign}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Send for eSign
                  </button>
                  <button
                    onClick={handleMarkAsSigned}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Mark as Signed
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Edit */}
          <button
            onClick={onEdit}
            className="bg-blue-600 text-white rounded px-4 py-1.5 text-sm font-semibold hover:bg-blue-700"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── Left panel ── */}
        <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto p-5">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{contractNum}</h2>
            <p className="text-sm text-gray-600 mt-0.5">{lease.documentType ?? 'License Agreement'}</p>
            {lease.createdAt && (
              <p className="text-xs text-gray-400 mt-2">
                Created: {format(parseISO(lease.createdAt), 'dd/MM/yyyy')}
              </p>
            )}
            {tenant?.contactName && (
              <p className="text-xs text-gray-400">Creator: {tenant.contactName}</p>
            )}
          </div>

          {/* Previous contract link */}
          {prevNum && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <p className="text-xs text-gray-500">
                Renewed Contract (Previous):{' '}
                <span className="text-blue-600 font-medium cursor-pointer hover:underline">{prevNum}</span>
              </p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Stage */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span>▪</span> Stage
              </p>
              <div className="flex flex-wrap gap-1">
                {stageBadges.map((b) => (
                  <span key={b.label} className={`text-xs font-semibold px-2 py-0.5 rounded ${b.cls}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Status */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <span>✍</span> Signature Status
              </p>
              {sigMeta ? (
                <>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sigMeta.cls}`}>
                    {sigMeta.label}
                  </span>
                  {isSigned && tenant?.contactName && (
                    <p className="text-xs text-gray-500 mt-1">Signed By: {tenant.contactName}</p>
                  )}
                  {isSigned && lease.signedAt && (
                    <p className="text-xs text-gray-400">
                      {format(new Date(lease.signedAt), 'dd/MM/yyyy')}
                    </p>
                  )}
                  {isOutForSign && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">🔗 eSign Links:</p>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => copyLink(eSignAdminLink, 'Admin link')}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                        >
                          <span>📋</span> Copy Admin Link
                        </button>
                        <button
                          onClick={() => copyLink(eSignMemberLink, 'Member link')}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                        >
                          <span>📋</span> Copy Member Link
                        </button>
                      </div>
                      {lease.eSignSentAt && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          Sent {format(new Date(lease.eSignSentAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              {/* Member */}
              <div className="flex items-start gap-2">
                <span className="text-gray-300 text-xs mt-0.5">👤</span>
                <div>
                  <p className="text-xs font-medium text-gray-500">Member</p>
                  <p className="text-sm text-gray-800">
                    {lease.memberName || tenant?.contactName || '—'}
                    {tenant?.businessName ? ` at ${tenant.businessName}` : ''}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2">
                <span className="text-gray-300 text-xs mt-0.5">📍</span>
                <div>
                  <p className="text-xs font-medium text-gray-500">Location</p>
                  <p className="text-sm text-gray-800">Found Huntingdale</p>
                </div>
              </div>

              {/* Duration */}
              <div className="flex items-start gap-2">
                <span className="text-gray-300 text-xs mt-0.5">📅</span>
                <div>
                  <p className="text-xs font-medium text-gray-500">Duration</p>
                  <p className="text-sm text-gray-800">
                    {lease.startDate ? format(parseISO(lease.startDate), 'dd/MM/yyyy') : '—'} –{' '}
                    {isMonthToMonth ? '∞' : lease.endDate ? format(parseISO(lease.endDate), 'dd/MM/yyyy') : '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Notice: {lease.noticePeriodMonths ?? 1} Month{(lease.noticePeriodMonths ?? 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Value */}
              <div className="flex items-start gap-2">
                <span className="text-gray-300 text-xs mt-0.5">💰</span>
                <div>
                  <p className="text-xs font-medium text-gray-500">Value</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {isMonthToMonth ? 'N/A' : annualValue
                      ? `A$${annualValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Last generated badge */}
            {lease.lastGeneratedAt && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-green-700">Document Generated</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(lease.lastGeneratedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{lease.lastGeneratedFile}</p>
                    <button
                      className="mt-2 text-xs text-blue-500 hover:underline font-medium"
                      onClick={() => alert('E-sign integration coming soon.')}
                    >
                      Send for E-Sign →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Template toolbar */}
          <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Template</span>
              <select className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none w-52">
                <option>{lease.documentType ?? 'License Agreement'}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border border-gray-300 rounded overflow-hidden text-sm">
                <button
                  onClick={() => setView('template')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${view === 'template' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <FileText size={13} /> Template View
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-gray-300 transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <LayoutGrid size={13} /> Grid View
                </button>
              </div>
              <button
                onClick={handleGeneratePDF}
                disabled={generating}
                className="flex items-center gap-1.5 bg-blue-600 text-white rounded px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                <FileDown size={13} /> {generating ? 'Generating…' : 'Generate PDF'} <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {/* ── Template View ── */}
          {view === 'template' && (
            <div className="overflow-auto bg-gray-100 flex-1">
              <ContractTemplate lease={lease} tenant={tenant} space={space} templates={templates} settings={settings} />
            </div>
          )}

          {/* ── Grid View ── */}
          {view === 'grid' && (
          <div className="p-5 space-y-5">
            {/* ── Resources ── */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Resources</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['Resource', 'List Price', 'Deposit', 'Steps', 'Final Price'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const itemSpace = item.spaceId ? [space, ...[]].find((s) => s?.id === item.spaceId) : null
                    const resourceName = itemSpace?.unitNumber ?? space?.unitNumber ?? `Resource ${idx + 1}`
                    const resourceSub = itemSpace?.size ?? space?.size ?? ''
                    return (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">{resourceName}</div>
                          {resourceSub && <div className="text-xs text-blue-500 mt-0.5">{resourceSub}</div>}
                        </td>
                        <td className="px-5 py-3">
                          {(item.steps ?? []).map((step, si) => (
                            <div key={si} className="text-gray-800">
                              A${Number(step.listPrice ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                            </div>
                          ))}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          A${Number(item.deposit ?? 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3">
                          {(item.steps ?? []).map((step, si) => (
                            <div key={si} className="text-gray-600 text-xs">
                              {step.startDate && step.endDate
                                ? `${format(parseISO(step.startDate), 'dd/MM/yyyy')} – ${format(parseISO(step.endDate), 'dd/MM/yyyy')}`
                                : '—'}
                            </div>
                          ))}
                        </td>
                        <td className="px-5 py-3">
                          {(item.steps ?? []).map((step, si) => {
                            const disc = Number(step.discount?.replace('%', '') || 0)
                            const finalPrice = disc > 0
                              ? Number(step.listPrice ?? 0) * (1 - disc / 100)
                              : Number(step.listPrice ?? 0)
                            return (
                              <div key={si} className="text-gray-800 text-right">
                                A${finalPrice.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                              </div>
                            )
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Setup Fees ── (shown if notes contain fees or as placeholder) */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Setup Fees</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['Setup Fee', 'List Price', 'Quantity', 'Source Plan', 'Final Price'].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="px-5 py-5 text-sm text-gray-400 text-center">
                      No setup fees on this contract.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Terms & Conditions ── */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Terms &amp; Conditions</h3>
              </div>
              <div className="px-5 py-4">
                {attachedTemplates.length === 0 ? (
                  <p className="text-sm text-gray-400">No documents attached to this contract.</p>
                ) : (
                  <ul className="space-y-1">
                    {attachedTemplates.map((tmpl) => (
                      <li key={tmpl.id} className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
                        <span className="text-gray-400">📄</span>
                        {tmpl.name}
                        <span className="text-xs text-gray-400">{tmpl.version}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Notes (if any) */}
            {lease.notes && (
              <div className="bg-white border border-gray-200 rounded-md p-5">
                <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{lease.notes}</p>
              </div>
            )}
          </div>
          )} {/* end grid view */}
        </div>
      </div>

      {/* Click outside overlays */}
      {showMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
      )}
      {showSignMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSignMenu(false)} />
      )}
    </div>
  )
}
