import { jsPDF } from 'jspdf'

/**
 * Generate a signing-certificate PDF for the Hexa Hub Pop-Up vendor agreement.
 *
 * @param {object} booking   – vendor booking JSONB
 * @param {object|null} adminSig – { signatureData, signerName, signerTitle } from hexahub_licensor_sig
 * @returns {Blob} PDF blob
 */
export function generateAgreementPdf(booking, adminSig) {
  // Prefer per-booking countersignature if it exists (set during countersign flow)
  const effectiveAdminSig = (booking.licensorSignatureData)
    ? {
        signatureData: booking.licensorSignatureData,
        signerName: booking.licensorSignerName,
        signerTitle: booking.licensorSignerTitle,
      }
    : adminSig
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const W = 210
  const margin = 20
  const midX = W / 2
  const colL = margin
  const colR = midX + 5

  let y = 0

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function divider() {
    doc.setDrawColor(210, 210, 210)
    doc.line(margin, y, W - margin, y)
    y += 7
  }

  function label(text) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(140, 140, 140)
    doc.text(text, colL, y)
    y += 5.5
  }

  // ── Black header bar ─────────────────────────────────────────────────────────
  doc.setFillColor(0, 0, 0)
  doc.rect(0, 0, W, 16, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('HEXAHUB', margin, 10.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text('Signing Certificate', W - margin, 10.5, { align: 'right' })

  y = 26

  // ── Title ────────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  doc.text('Event Vendor Agreement', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text('Hexa Hub Pop-Up · Sunday 7 June 2026 · 3:00 PM – 9:00 PM', margin, y)
  y += 6

  // Ref + signed timestamp on one line
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(`Reference: ${booking.ref || '—'}`, margin, y)

  if (booking.signedAt) {
    const d = new Date(booking.signedAt)
    const fmt = d.toLocaleString('en-AU', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    doc.text(`Signed: ${fmt}`, W - margin, y, { align: 'right' })
  }
  y += 9
  divider()

  // ── Parties ──────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(140, 140, 140)
  doc.text('LICENSOR', colL, y)
  doc.text('LICENSEE', colR, y)
  y += 5

  const startY = y

  // Left column — licensor
  const licensorLines = [
    { bold: true,  text: 'HexaHub Pty Ltd' },
    { bold: false, text: '7 Distribution Circuit' },
    { bold: false, text: 'Huntingdale VIC 3166' },
    { bold: false, text: 'info@hexahub.com.au' },
  ]
  licensorLines.forEach(({ bold, text }) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(20, 20, 20)
    doc.text(text, colL, y)
    y += 5
  })

  // Right column — licensee (reset y)
  y = startY
  const licenseeLines = [
    { bold: true,  text: booking.vendorBusiness || booking.vendorName || '—' },
    ...(booking.vendorAbn ? [{ bold: false, text: `ABN: ${booking.vendorAbn}` }] : []),
    { bold: false, text: booking.vendorName || '—' },
    ...(booking.vendorEmail ? [{ bold: false, text: booking.vendorEmail }] : []),
  ]
  licenseeLines.forEach(({ bold, text }) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(20, 20, 20)
    doc.text(text, colR, y)
    y += 5
  })

  y = startY + Math.max(licensorLines.length, licenseeLines.length) * 5 + 4
  divider()

  // ── Documents agreed to ──────────────────────────────────────────────────────
  label('DOCUMENTS AGREED TO')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(20, 20, 20)

  const docs = [
    'Event Venue Licence Agreement (27 clauses)',
    'Liability Waiver and Acknowledgement',
    'Annexure A — Venue Rules and Operating Conditions',
    'Annexures B & C — Compliance & Marketing Requirements',
  ]
  docs.forEach(d => {
    doc.setFont('helvetica', 'bold')
    doc.text('✓', colL, y)
    doc.setFont('helvetica', 'normal')
    doc.text(d, colL + 6, y)
    y += 5.5
  })
  y += 3
  divider()

  // ── Event details ────────────────────────────────────────────────────────────
  label('EVENT DETAILS')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(20, 20, 20)

  const eventLines = [
    booking.allocatedSpace ? `Allocated Space: ${booking.allocatedSpace}` : null,
    booking.vendorType ? `Vendor Type: ${booking.vendorType}` : null,
    'Venue: The Hub, 18 Logistic Court, Huntingdale VIC 3166',
    'Bump-in: 11:00 AM  ·  Event: 3:00 PM – 9:00 PM',
  ].filter(Boolean)

  eventLines.forEach(line => {
    doc.text(line, colL, y)
    y += 5
  })
  y += 4
  divider()

  // ── Signatures ───────────────────────────────────────────────────────────────
  label('SIGNATURES')
  y += 2

  const sigW = 72
  const sigH = 22

  // Column labels
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('LICENSEE', colL, y)
  doc.text('LICENSOR', colR, y)
  y += 4

  // Signature boxes
  doc.setDrawColor(210, 210, 210)
  doc.rect(colL, y, sigW, sigH)
  doc.rect(colR, y, sigW, sigH)

  // Insert signature images (guard against bad data URLs)
  if (booking.signatureData) {
    try { doc.addImage(booking.signatureData, 'PNG', colL + 2, y + 2, sigW - 4, sigH - 4) } catch (_) {}
  }
  if (effectiveAdminSig?.signatureData) {
    try { doc.addImage(effectiveAdminSig.signatureData, 'PNG', colR + 2, y + 2, sigW - 4, sigH - 4) } catch (_) {}
  } else {
    // Placeholder text when no admin sig yet
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    doc.text('To be countersigned', colR + sigW / 2, y + sigH / 2 + 2, { align: 'center' })
  }

  y += sigH + 3

  // Underlines
  doc.setDrawColor(60, 60, 60)
  doc.line(colL, y, colL + sigW, y)
  doc.line(colR, y, colR + sigW, y)
  y += 5

  // Names
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20, 20, 20)
  doc.text(booking.signerName || '—', colL, y)
  doc.text(effectiveAdminSig?.signerName || 'HexaHub Pty Ltd', colR, y)
  y += 5

  // Titles
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(booking.signerTitle || 'Authorised Representative', colL, y)
  doc.text(effectiveAdminSig?.signerTitle || 'Licensor', colR, y)
  y += 5

  // Dates
  doc.setFontSize(8)
  doc.text(booking.signerDate || '—', colL, y)

  const countersignDate = new Date().toLocaleDateString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
  doc.text(countersignDate, colR, y)
  y += 12

  // ── Footer ───────────────────────────────────────────────────────────────────
  divider()

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)

  const footerText =
    'This certificate confirms the above-named Licensee has electronically read and agreed to the Event Vendor Agreement and associated documents. This document is legally binding under the laws of Victoria, Australia.'

  const footerLines = doc.splitTextToSize(footerText, W - margin * 2)
  doc.text(footerLines, midX, y, { align: 'center' })
  y += footerLines.length * 4 + 3

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('hexahub.com.au  ·  info@hexahub.com.au', midX, y, { align: 'center' })

  return doc.output('blob')
}
