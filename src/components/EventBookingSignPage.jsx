import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import SignatureCanvas from './SignatureCanvas.jsx'

function fmtTime(t) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtDate(d) {
  if (!d) return '—'
  try { return format(parseISO(d), 'EEEE, d MMMM yyyy') } catch { return d }
}

function fmtMoney(v) {
  if (!v && v !== 0) return '—'
  return `$${Number(v).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
}

// ── Document generators ───────────────────────────────────────────────────────

function AgreementDoc({ booking }) {
  const b = booking
  const today = format(new Date(), 'd MMMM yyyy')

  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-6">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Event Venue Licence Agreement</h1>
        <div className="text-xs text-gray-500">This agreement is entered into on {today}</div>
      </div>

      <hr className="border-gray-300" />

      {/* Schedule 1 */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-3">Schedule 1 — Booking Details</h2>
        <table className="w-full text-xs border-collapse">
          <tbody>
            {[
              ['Licensor', 'HexaHub Pty Ltd (ABN 51 234 567 890)'],
              ['Licensee', [b.organiserCompany, b.organiserName, b.organiserAbn ? `ABN ${b.organiserAbn}` : null].filter(Boolean).join(' · ') || b.organiserName],
              ['Venue', b.venue || '17 Logistic Court, Huntingdale VIC 3166'],
              ['Permitted Use', b.permittedUse || '—'],
              ['Event Description', b.eventDescription || '—'],
              ['Event Date', fmtDate(b.eventDate)],
              ['Access / Bump-In Time', fmtTime(b.accessTime)],
              ['Event Commencement', fmtTime(b.eventStartTime)],
              ['Event Finish', fmtTime(b.eventFinishTime)],
              ['Bump-Out Completion', fmtTime(b.bumpOutTime)],
              ['Maximum Attendance', b.maxAttendance ? `${b.maxAttendance} persons` : '—'],
              ['Licence Fee', b.licenceFee ? `${fmtMoney(b.licenceFee)} AUD (inclusive of GST)` : '—'],
              ['Bond', b.bond ? `${fmtMoney(b.bond)} AUD` : '—'],
              ['Deposit', b.deposit ? `${fmtMoney(b.deposit)} AUD (due upon signing)` : '—'],
              ['Balance Due Date', b.balanceDueDate ? fmtDate(b.balanceDueDate) : '—'],
              ['Included Services', b.includedServices || '—'],
              ['Excluded Services', b.excludedServices || '—'],
              ['Insurance Requirement', b.insuranceRequired || 'Min. AUD $20,000,000 Public Liability Insurance'],
              ['Security Required', b.securityRequired ? 'Yes' : 'No'],
              ['Alcohol Permitted', b.alcoholPermitted ? 'Yes' : 'No'],
              ['Food Permitted', b.foodPermitted ? 'Yes' : 'No'],
              ['Special Conditions', b.specialConditions || 'Nil'],
            ].map(([label, value]) => (
              <tr key={label} className="border border-gray-200">
                <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-700 w-44 align-top">{label}</td>
                <td className="px-3 py-2 text-gray-900 whitespace-pre-wrap">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Terms and Conditions</h2>

        <div className="space-y-3 text-xs">
          <div><strong>1. Grant of Licence.</strong> HexaHub Pty Ltd ("Licensor") grants the Licensee a non-exclusive, non-transferable licence to use the Venue on the Event Date solely for the Permitted Use specified in Schedule 1, subject to these terms and the Venue Rules (Annexure A).</div>

          <div><strong>2. Fees and Payment.</strong> The Licensee must pay the Licence Fee, Bond, and Deposit as set out in Schedule 1. The Deposit is due upon signing. The balance of the Licence Fee is due by the Balance Due Date. The Bond is refundable subject to clause 4. All amounts are inclusive of GST unless stated otherwise.</div>

          <div><strong>3. Bond.</strong> The Bond is held as security against damage, additional cleaning, or other costs arising from the Event. The Licensor will refund the Bond within 14 days of the Event Date, less any deductions for damage, excess cleaning, or overtime use. The Licensee acknowledges the Bond is not a substitute for the Licence Fee.</div>

          <div><strong>4. Insurance.</strong> The Licensee must, prior to the Event Date, obtain and provide evidence of: (a) Public Liability Insurance for a minimum of AUD $20,000,000 per occurrence; and (b) any other insurance required by law or specified in Schedule 1. Failure to provide evidence of insurance may result in cancellation of this licence without refund.</div>

          <div><strong>5. Permitted Use.</strong> The Venue may only be used for the Permitted Use. The Licensee must not sublet or allow any other person to use the Venue without the Licensor's prior written consent.</div>

          <div><strong>6. Access.</strong> The Licensee and their guests may access the Venue during the hours specified in Schedule 1 only. Early access or extensions must be approved in writing and may incur additional charges.</div>

          <div><strong>7. Capacity.</strong> The Maximum Attendance specified in Schedule 1 must not be exceeded at any time during the Event. The Licensee is responsible for monitoring attendance at all times.</div>

          <div><strong>8. Alcohol.</strong> Alcohol may only be served if specified as Permitted in Schedule 1. Where permitted, the Licensee must comply with all applicable Victorian liquor licensing laws. The Licensor may revoke permission to serve alcohol if the Licensee fails to comply.</div>

          <div><strong>9. Food.</strong> Food service or catering is permitted only if specified in Schedule 1. The Licensee is responsible for ensuring all food handlers hold appropriate food safety certifications.</div>

          <div><strong>10. Security.</strong> If security is specified as Required in Schedule 1, the Licensee must engage licensed security personnel throughout the Event at their own cost. Security personnel must be licensed under the Private Security Act 2004 (Vic).</div>

          <div><strong>11. Venue Rules.</strong> The Licensee must comply with the Venue Rules set out in Annexure A at all times. Breach of the Venue Rules may result in immediate termination of the licence without refund.</div>

          <div><strong>12. Damage.</strong> The Licensee is responsible for all damage to the Venue, equipment, or common areas caused by the Licensee, their guests, contractors, or vendors. The Licensor will invoice the Licensee for all repair or replacement costs, which the Licensee must pay within 14 days.</div>

          <div><strong>13. Cleaning.</strong> The Licensee must leave the Venue in a clean and tidy condition by the Bump-Out Completion time. If the Venue requires additional cleaning beyond normal standards, the Licensor may deduct cleaning costs from the Bond or invoice the Licensee accordingly.</div>

          <div><strong>14. Cancellation.</strong> If the Licensee cancels: (a) more than 30 days before the Event Date, the Deposit is forfeited; (b) 14–30 days before, 50% of the Licence Fee is forfeited; (c) fewer than 14 days before, 100% of the Licence Fee is forfeited. The Licensor may cancel this licence without penalty in the event of Force Majeure or if the Licensor reasonably considers the Event poses a risk to persons or property.</div>

          <div><strong>15. Indemnity.</strong> The Licensee indemnifies and holds harmless the Licensor, its directors, employees, and agents from all claims, losses, damages, and costs arising from: (a) the Licensee's use of the Venue; (b) any act or omission of the Licensee, their guests, or contractors; (c) any breach of this Agreement; or (d) any personal injury or property damage arising during the Event. This indemnity survives termination of this Agreement.</div>

          <div><strong>16. Licensor's Liability.</strong> To the extent permitted by law, the Licensor's liability is limited to the Licence Fee paid. The Licensor is not liable for indirect or consequential loss, loss of revenue, or personal injury arising from the Licensee's use of the Venue.</div>

          <div><strong>17. Compliance with Laws.</strong> The Licensee must comply with all applicable laws, including but not limited to the Liquor Control Reform Act 1998 (Vic), Occupational Health and Safety Act 2004 (Vic), and Environment Protection Act 2017 (Vic).</div>

          <div><strong>18. No Assignment.</strong> The Licensee must not assign or transfer this Agreement without the Licensor's prior written consent.</div>

          <div><strong>19. Governing Law.</strong> This Agreement is governed by the laws of Victoria, Australia. Any disputes are subject to the exclusive jurisdiction of the Victorian courts.</div>

          <div><strong>20. Entire Agreement.</strong> This Agreement, together with Schedule 1 and Annexures A and B, constitutes the entire agreement between the parties and supersedes all prior agreements, representations, and understandings.</div>

          <div><strong>21. Severability.</strong> If any provision is held invalid or unenforceable, it will be severed and the remaining provisions will continue in full force.</div>

          <div><strong>22. Liability Waiver.</strong> By signing this Agreement, the Licensee acknowledges they have read and accept the Liability Waiver set out in Document 2 of this signing package.</div>
        </div>
      </div>

      {/* Signature blocks */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-4">Executed as an Agreement</h2>
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-4">
            <div className="font-semibold text-gray-700">SIGNED for and on behalf of</div>
            <div className="font-bold">HexaHub Pty Ltd (Licensor)</div>
            <div className="border-b border-gray-400 pt-8 w-full" />
            <div className="text-gray-500">Authorised Signatory &nbsp;·&nbsp; Date: ___________</div>
          </div>
          <div className="space-y-4">
            <div className="font-semibold text-gray-700">SIGNED by the Licensee</div>
            <div className="font-bold">{booking.organiserName}{booking.organiserCompany ? ` — ${booking.organiserCompany}` : ''}</div>
            <div className="border-b border-gray-400 pt-8 w-full" />
            <div className="text-gray-500">Signature &nbsp;·&nbsp; Date: ___________</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LiabilityWaiverDoc({ booking }) {
  const today = format(new Date(), 'd MMMM yyyy')
  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-5">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Liability Waiver and Indemnity</h1>
        <div className="text-xs text-gray-500">Event: {booking.eventDescription || booking.permittedUse || 'Event'} — {fmtDate(booking.eventDate)}</div>
      </div>

      <hr className="border-gray-300" />

      <div className="space-y-4 text-xs">
        <p>This Liability Waiver and Indemnity ("Waiver") is given by the Licensee named in the Event Venue Licence Agreement (the "Organiser") in favour of HexaHub Pty Ltd ABN 51 234 567 890 ("HexaHub") in connection with the use of the Venue at {booking.venue || '17 Logistic Court, Huntingdale VIC 3166'} on {fmtDate(booking.eventDate)} (the "Event").</p>

        <div>
          <strong>1. Acknowledgement of Risk.</strong>
          <p className="mt-1">The Organiser acknowledges that: (a) participation in or attendance at the Event involves inherent risks, including but not limited to physical injury, property damage, and loss; (b) HexaHub makes no representation as to the suitability of the Venue for any specific purpose; and (c) the Organiser has conducted its own assessment of the Venue and the Event risks and is satisfied that it is appropriate to proceed.</p>
        </div>

        <div>
          <strong>2. Release and Waiver.</strong>
          <p className="mt-1">To the fullest extent permitted by law, the Organiser, on behalf of itself and its employees, contractors, agents, vendors, guests, and all attendees at the Event (collectively, "Participants"), releases, waives, discharges, and covenants not to sue HexaHub, its directors, officers, employees, agents, and successors ("Released Parties") from any and all claims, demands, causes of action, damages, losses, costs, and expenses (including legal costs on a solicitor-client basis) of any kind, whether known or unknown, arising directly or indirectly from the Organiser's or any Participant's attendance at or participation in the Event, including but not limited to: (a) personal injury, death, or illness; (b) loss of or damage to personal property; and (c) financial or economic loss.</p>
        </div>

        <div>
          <strong>3. Indemnity.</strong>
          <p className="mt-1">The Organiser agrees to indemnify, defend, and hold harmless the Released Parties against any and all claims, actions, losses, damages, costs, and liabilities (including reasonable legal fees) arising from or connected to: (a) any act or omission of the Organiser or any Participant; (b) any breach by the Organiser of the Event Venue Licence Agreement or the Venue Rules; (c) any personal injury, death, or property damage occurring during the Event; or (d) any failure by the Organiser to comply with applicable laws.</p>
        </div>

        <div>
          <strong>4. Insurance.</strong>
          <p className="mt-1">The Organiser warrants that it holds, and will maintain in force through the Event Date, Public Liability Insurance with a minimum cover of AUD $20,000,000 per occurrence. The Organiser agrees to provide a current Certificate of Currency to HexaHub prior to the Event Date. The Released Parties' agreement to allow the Event to proceed does not constitute an admission that such insurance is adequate.</p>
        </div>

        <div>
          <strong>5. Assumption of Liability for Guests.</strong>
          <p className="mt-1">The Organiser accepts full responsibility for the conduct of all Participants at the Event and acknowledges that HexaHub bears no liability for the actions or omissions of any Participant. The Organiser agrees to ensure that all Participants are made aware of and comply with the Venue Rules set out in Annexure A of the Event Venue Licence Agreement.</p>
        </div>

        <div>
          <strong>6. Consumer Guarantees.</strong>
          <p className="mt-1">Nothing in this Waiver excludes, restricts, or modifies any right or remedy or guarantee that the Organiser may have under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) or any other applicable legislation that cannot by law be excluded, restricted, or modified.</p>
        </div>

        <div>
          <strong>7. Governing Law.</strong>
          <p className="mt-1">This Waiver is governed by the laws of Victoria, Australia.</p>
        </div>

        <p className="italic text-gray-600">By signing the Event Venue Licence Agreement, the Organiser acknowledges that they have read, understood, and agreed to this Waiver on behalf of themselves and all Participants.</p>
      </div>
    </div>
  )
}

function VenueRulesDoc({ booking }) {
  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-5">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Venue Rules & Housekeeping</h1>
        <div className="text-sm text-gray-600 font-sans">Annexure A — {booking.venue || '17 Logistic Court, Huntingdale VIC 3166'}</div>
      </div>

      <hr className="border-gray-300" />

      <p className="text-xs text-gray-600 italic">These Venue Rules apply to the Organiser, their staff, contractors, vendors, and all event attendees. Compliance is mandatory. Breach of these Rules may result in immediate termination of the licence without refund.</p>

      <div className="space-y-4 text-xs">
        <div>
          <strong>Rule 1 — Access Hours.</strong> Access to the Venue is strictly limited to the hours specified in Schedule 1. All guests and contractors must vacate the Venue by the Bump-Out Completion time. Overtime will be charged at a rate of $150 per hour (or part thereof), deducted from the Bond.
        </div>

        <div>
          <strong>Rule 2 — Bump-In and Bump-Out.</strong> Setup and pack-down must be completed within the access windows specified in Schedule 1. Large vehicle deliveries (trucks, vans) must use the designated loading areas and must not obstruct common driveways or fire lanes. No vehicles are permitted inside the Venue without prior written approval from HexaHub.
        </div>

        <div>
          <strong>Rule 3 — Maximum Attendance.</strong> The Maximum Attendance specified in Schedule 1 must not be exceeded at any time. The Organiser is responsible for monitoring the number of attendees throughout the Event. HexaHub reserves the right to stop entry if the limit is reached.
        </div>

        <div>
          <strong>Rule 4 — Noise and Neighbours.</strong> Music, amplified sound, and any activities generating significant noise must conclude by 10:00 PM. The Organiser must take all reasonable steps to ensure the Event does not cause unreasonable disturbance to neighbouring tenants or residents. HexaHub may require noise levels to be reduced if complaints are received.
        </div>

        <div>
          <strong>Rule 5 — Alcohol.</strong> Alcohol may only be served or consumed if Permitted in Schedule 1. Where permitted: (a) RSA-trained staff must supervise all alcohol service; (b) alcohol must not be served to intoxicated persons or minors; (c) a responsible service plan must be in place before the Event commences; and (d) the Organiser is solely responsible for compliance with the Liquor Control Reform Act 1998 (Vic).
        </div>

        <div>
          <strong>Rule 6 — Food and Catering.</strong> All food handlers must hold current food safety certifications. Food preparation must comply with the Food Act 1984 (Vic). The Organiser is responsible for adequate refrigeration and hygienic food storage. All food waste must be removed from the Venue and disposed of appropriately.
        </div>

        <div>
          <strong>Rule 7 — Decorations and Fixtures.</strong> Decorations may be placed within the Venue without causing damage. Nails, screws, bolts, and adhesive attachments to walls, ceilings, floors, or roller doors are strictly prohibited. All decorations must be removed by Bump-Out Completion. Confetti, glitter, and similar items are not permitted.
        </div>

        <div>
          <strong>Rule 8 — Fire Safety.</strong> Fire exits, fire extinguishers, sprinkler systems, and evacuation routes must remain clear and unobstructed at all times. Open flames (including candles) require prior written approval. The Organiser must brief all staff and key personnel on emergency evacuation procedures before the Event. In the event of a fire alarm activation, all persons must immediately evacuate. Emergency services must be called before re-entry.
        </div>

        <div>
          <strong>Rule 9 — Security and Conduct.</strong> The Organiser is responsible for ensuring the orderly conduct of all attendees. Any person engaging in violent, threatening, or disruptive behaviour must be removed from the Venue immediately. Where security is Required in Schedule 1, licensed security personnel must be present from event opening until all guests have departed. HexaHub reserves the right to call police if the safety of persons or property is at risk.
        </div>

        <div>
          <strong>Rule 10 — Prohibited Items.</strong> The following are strictly prohibited: (a) illegal substances of any kind; (b) weapons or any item that could cause harm; (c) pyrotechnics, smoke machines, or fog effects without prior written approval; (d) animals (except approved assistance animals); and (e) any goods or substances the Licensor deems a hazard.
        </div>

        <div>
          <strong>Rule 11 — Cleaning.</strong> The Organiser must ensure the Venue is left in a clean and tidy condition by the Bump-Out Completion time. This includes: (a) removal of all rubbish, waste, and recycling; (b) clearing of all tables, chairs, and equipment; (c) mopping of any spills; and (d) removal of all decorations and signage. Additional cleaning costs will be deducted from the Bond. The Licensor reserves the right to engage professional cleaners and charge the cost to the Licensee if the Venue is not left in an acceptable condition.
        </div>

        <div>
          <strong>Rule 12 — Damage Reporting.</strong> Any damage to the Venue, building, or equipment must be reported to HexaHub immediately. The Organiser must not attempt to repair damage themselves. HexaHub will assess all damage and invoice the Organiser for repair or replacement costs within 14 days of the Event.
        </div>

        <div>
          <strong>Rule 13 — Compliance and Right of Entry.</strong> HexaHub staff or representatives may enter the Venue at any time during the Event to conduct inspections, address safety concerns, or enforce these Rules. The Organiser must cooperate fully with any such inspection. HexaHub may terminate the Event without notice and without refund if the Organiser or any Participant is in material breach of these Rules or the Event Venue Licence Agreement.
        </div>
      </div>

      <div className="text-xs text-gray-500 italic mt-4">
        These Rules are incorporated into and form part of the Event Venue Licence Agreement between HexaHub Pty Ltd and the Organiser. HexaHub Pty Ltd · 7 Distribution Circuit, Huntingdale VIC 3166 · info@hexahub.com.au · hexahub.com.au
      </div>
    </div>
  )
}

// ── Public sign page ──────────────────────────────────────────────────────────

export default function EventBookingSignPage({ token }) {
  const [state, setState] = useState('loading') // loading|ready|signed|invalid|error
  const [booking, setBooking] = useState(null)
  const [view, setView] = useState('doc1') // doc1|doc2|doc3|sign
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [signerDate, setSignerDate] = useState(format(new Date(), 'dd/MM/yyyy'))
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [insuranceChoice, setInsuranceChoice] = useState(null) // null|'later'|'done'
  const sigRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('event_bookings')
          .select('data')

        if (error) { setState('error'); return }

        const match = (data ?? []).map(r => r.data).find(b => b?.signingToken === token)
        if (!match) { setState('invalid'); return }

        setBooking(match)
        if (match.signedAt) { setState('signed'); return }
        if (match.signerName) setSignerName(match.signerName)
        setState('ready')
      } catch {
        setState('error')
      }
    }
    load()
  }, [token])

  async function handleSign() {
    if (!agreed) { alert('Please confirm you have read and agree to all three documents.'); return }
    if (!signerName.trim()) { alert('Please enter your full name.'); return }
    if (sigRef.current?.isEmpty()) { alert('Please draw your signature.'); return }

    setSubmitting(true)
    try {
      const signatureData = sigRef.current.toDataURL()
      const now = new Date().toISOString()
      const updated = {
        ...booking,
        status: 'signed',
        signedAt: now,
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim(),
        signerDate,
        signatureData,
        updatedAt: now,
      }

      await supabase.from('event_bookings')
        .update({ data: updated, updated_at: now })
        .eq('id', booking.id)

      // Notify admin
      await fetch('/api/event-bookings/send-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: updated, mode: 'admin_notify' }),
      }).catch(() => {})

      setBooking(updated)
      setState('signed')
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitInsuranceChoice(choice) {
    const now = new Date().toISOString()
    const updated = {
      ...booking,
      status: choice === 'later' ? 'insurance_pending' : 'insurance_received',
      insuranceStatus: choice === 'later' ? 'pending' : 'received',
      insuranceDeferredAt: choice === 'later' ? now : null,
      updatedAt: now,
    }
    await supabase.from('event_bookings')
      .update({ data: updated, updated_at: now })
      .eq('id', booking.id)
    setInsuranceChoice(choice)

    if (choice === 'later') {
      await fetch('/api/event-bookings/send-signing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking: updated, mode: 'insurance_deferred' }),
      }).catch(() => {})
    }
  }

  const TABS = [
    { key: 'doc1', label: '1. Licence Agreement' },
    { key: 'doc2', label: '2. Liability Waiver' },
    { key: 'doc3', label: '3. Venue Rules' },
    { key: 'sign', label: '✍ Sign' },
  ]

  if (state === 'loading') return <Screen title="Loading…" />
  if (state === 'invalid') return (
    <Screen icon="🔒" title="Invalid or expired link" subtitle="This signing link is invalid or has already been used. Please contact HexaHub for assistance." />
  )
  if (state === 'error') return <Screen icon="⚠️" title="Something went wrong" subtitle="Please try again or contact info@hexahub.com.au." />

  if (state === 'signed' && insuranceChoice == null) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header booking={booking} label="Document Signing" />
        <div className="max-w-xl mx-auto my-10 px-4">
          <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Documents Signed</h2>
            <p className="text-sm text-gray-500 mb-6">
              Thank you, {booking?.signerName}. Your signature has been received. HexaHub will countersign and be in touch shortly.
            </p>
            <div className="border border-gray-200 rounded-md p-5 text-left mb-6">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">Public Liability Insurance</h3>
              <p className="text-xs text-gray-500 mb-4">
                Your event requires a Certificate of Currency showing at least{' '}
                <strong>AUD $20,000,000 Public Liability Insurance</strong>.
                Please send this to{' '}
                <a href="mailto:info@hexahub.com.au" className="text-black underline">info@hexahub.com.au</a>{' '}
                as soon as possible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => submitInsuranceChoice('later')}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm hover:bg-gray-50 font-medium"
                >
                  I'll submit by email
                </button>
                <button
                  onClick={() => submitInsuranceChoice('done')}
                  className="flex-1 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
                >
                  Already sent / confirmed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'signed' && insuranceChoice != null) {
    return (
      <Screen
        icon="✅"
        title="All done!"
        subtitle={
          insuranceChoice === 'later'
            ? `Thanks ${booking?.signerName}. Please email your Certificate of Currency to info@hexahub.com.au before the event date. HexaHub will be in touch to confirm your booking.`
            : `Thanks ${booking?.signerName}. Your documents are signed and insurance confirmed. HexaHub will be in touch shortly to finalise your booking.`
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header booking={booking} label={booking?.ref || 'Event Booking'} />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 flex overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              view === tab.key ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document views */}
      {view === 'doc1' && (
        <DocFrame>
          <AgreementDoc booking={booking} />
          <NavBtn onClick={() => setView('doc2')}>Next: Liability Waiver →</NavBtn>
        </DocFrame>
      )}
      {view === 'doc2' && (
        <DocFrame>
          <LiabilityWaiverDoc booking={booking} />
          <NavBtn onClick={() => setView('doc3')}>Next: Venue Rules →</NavBtn>
        </DocFrame>
      )}
      {view === 'doc3' && (
        <DocFrame>
          <VenueRulesDoc booking={booking} />
          <NavBtn onClick={() => setView('sign')}>Proceed to Sign →</NavBtn>
        </DocFrame>
      )}

      {/* Sign view */}
      {view === 'sign' && (
        <div className="max-w-xl mx-auto my-8 px-4">
          <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sign as Organiser / Licensee</h2>
            <p className="text-sm text-gray-500 mb-6">
              By signing, you confirm you have read and agree to all three documents above.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title / Position</label>
              <input
                type="text"
                value={signerTitle}
                onChange={e => setSignerTitle(e.target.value)}
                placeholder="e.g. Director, CEO, Event Manager"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="text"
                value={signerDate}
                onChange={e => setSignerDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Signature</label>
                <button onClick={() => sigRef.current?.clear()} className="text-xs text-gray-400 hover:text-gray-700 underline">Clear</button>
              </div>
              <SignatureCanvas ref={sigRef} height={140} />
              <p className="text-xs text-gray-400 mt-1">Draw your signature using mouse or finger</p>
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 shrink-0" />
              <span className="text-sm text-gray-600">
                I confirm I have read and agree to (1) the Event Venue Licence Agreement, (2) the Liability Waiver, and (3) the Venue Rules, and that I am authorised to sign on behalf of the Licensee.
              </span>
            </label>

            <div className="bg-gray-50 rounded-md p-4 text-xs text-gray-500 mb-6 space-y-1">
              {booking?.organiserCompany && <div><span className="font-medium text-gray-700">Licensee:</span> {booking.organiserCompany}</div>}
              <div><span className="font-medium text-gray-700">Event:</span> {booking?.eventDescription || booking?.permittedUse}</div>
              <div><span className="font-medium text-gray-700">Date:</span> {fmtDate(booking?.eventDate)}</div>
              <div><span className="font-medium text-gray-700">Venue:</span> {booking?.venue}</div>
            </div>

            <button
              onClick={handleSign}
              disabled={submitting || !agreed}
              className="w-full bg-black text-white py-3 rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Sign & Submit All Documents'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Header({ booking, label }) {
  return (
    <div className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <span className="font-black tracking-widest text-lg">HEXAHUB</span>
        <span className="text-gray-400 text-sm ml-3">Event Booking</span>
      </div>
      <div className="text-sm text-gray-300 hidden sm:block">
        {booking?.eventDate ? fmtDate(booking.eventDate) : label}
      </div>
    </div>
  )
}

function DocFrame({ children }) {
  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <div className="bg-white shadow-sm rounded-md overflow-hidden px-10 py-10">
        {children}
      </div>
    </div>
  )
}

function NavBtn({ onClick, children }) {
  return (
    <div className="mt-8 flex justify-end">
      <button
        onClick={onClick}
        className="bg-black text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
      >
        {children}
      </button>
    </div>
  )
}

function Screen({ icon, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-2xl font-black tracking-widest text-gray-900 mb-6">HEXAHUB</div>
        <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
          {icon && <div className="text-4xl mb-4">{icon}</div>}
          <h1 className="text-lg font-bold text-gray-900 mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
