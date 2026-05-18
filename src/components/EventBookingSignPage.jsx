import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import SignatureCanvas from './SignatureCanvas.jsx'

const EVENT = {
  name: 'Hexa Hub Pop-Up',
  date: 'Sunday, 7 June 2026',
  hours: '10:00 AM – 10:00 PM',
  venue: 'The Hub, 18 Logistic Court, Huntingdale VIC 3166',
  bumpIn: '8:00 AM',
  bumpOut: '11:00 PM',
  licensor: 'HexaHub Pty Ltd (ABN 51 234 567 890)',
  organiser: 'info@hexahub.com.au',
}

// ── Document 1: Vendor Participation Agreement ────────────────────────────────

function VendorAgreementDoc({ booking }) {
  const b = booking
  const today = format(new Date(), 'd MMMM yyyy')
  const vendorDisplay = [b.vendorBusiness, b.vendorName, b.vendorAbn ? `ABN ${b.vendorAbn}` : null].filter(Boolean).join(' · ')

  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-6">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Vendor Participation Agreement</h1>
        <h2 className="text-base font-semibold text-gray-600">Hexa Hub Pop-Up — 7 June 2026</h2>
        <div className="text-xs text-gray-500">This agreement is entered into on {today}</div>
      </div>

      <hr className="border-gray-300" />

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-3">Schedule — Vendor Details</h2>
        <table className="w-full text-xs border-collapse">
          <tbody>
            {[
              ['Licensor (Event Organiser)', EVENT.licensor],
              ['Vendor (Licensee)', vendorDisplay || b.vendorName],
              ['Vendor Contact', b.vendorName],
              ['Vendor Email', b.vendorEmail],
              ['Vendor Type', b.vendorType || '—'],
              ['Goods / Services', b.vendorDescription || '—'],
              ['Allocated Space', b.allocatedSpace || 'As directed by HexaHub on the day'],
              ['Event', EVENT.name],
              ['Event Date', EVENT.date],
              ['Event Hours', EVENT.hours],
              ['Venue', EVENT.venue],
              ['Bump-In Time', EVENT.bumpIn],
              ['Bump-Out Completion', EVENT.bumpOut],
              ['Participation Fee', b.participationFee ? `$${Number(b.participationFee).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD` : 'Nil — participating by invitation'],
              ['Bond', b.bond ? `$${Number(b.bond).toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD` : 'Nil'],
              ['Insurance Requirement', 'Min. AUD $10,000,000 Public Liability Insurance'],
              ['Special Conditions', b.specialConditions || 'Nil'],
            ].map(([label, value]) => (
              <tr key={label} className="border border-gray-200">
                <td className="bg-gray-50 px-3 py-2 font-semibold text-gray-700 w-48 align-top">{label}</td>
                <td className="px-3 py-2 text-gray-900 whitespace-pre-wrap">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Terms and Conditions</h2>

        <div><strong>1. Grant of Licence.</strong> HexaHub Pty Ltd ("HexaHub") grants the Vendor a non-exclusive, revocable licence to occupy and operate from the Allocated Space at the Venue on the Event Date solely for the purpose of selling, displaying, or offering the Goods/Services described in this Agreement. This licence is personal to the Vendor and cannot be transferred or sublicensed.</div>

        <div><strong>2. Participation Fee and Bond.</strong> If a Participation Fee is specified, it is payable in full prior to the Event Date. If a Bond is specified, it is payable upon signing and will be refunded within 14 days of the Event Date, less any deductions for damage, excess cleaning, or failure to comply with these terms.</div>

        <div><strong>3. Setup and Pack-Down.</strong> The Vendor may access the Venue from {EVENT.bumpIn} on {EVENT.date} for setup purposes. The Vendor must complete pack-down and vacate the Allocated Space by {EVENT.bumpOut}. All equipment, fixtures, and unsold goods must be removed by this time. HexaHub is not responsible for any items left after the Bump-Out time.</div>

        <div><strong>4. Permitted Use.</strong> The Vendor may only sell, display, or offer the Goods/Services described in this Agreement from the Allocated Space. The Vendor must not operate from any other area of the Venue without HexaHub's prior written consent. The Allocated Space must not be sublet or shared with another party.</div>

        <div><strong>5. Conduct.</strong> The Vendor and their staff must: (a) conduct themselves in a professional and courteous manner at all times; (b) comply with all directions given by HexaHub staff; (c) not engage in any activity that is unlawful, unsafe, or offensive; and (d) not interfere with or impede other vendors, exhibitors, or event attendees.</div>

        <div><strong>6. Food and Beverage.</strong> Vendors selling or providing food and beverage items must: (a) hold a current Food Business Registration or equivalent; (b) ensure all food handlers hold appropriate food safety qualifications; (c) comply with the Food Act 1984 (Vic) and all relevant food handling regulations; and (d) provide evidence of compliance to HexaHub upon request. HexaHub may require a vendor to cease food service if compliance cannot be evidenced.</div>

        <div><strong>7. Insurance.</strong> Prior to the Event Date, the Vendor must hold and maintain Public Liability Insurance of at least AUD $10,000,000 per occurrence and must provide a current Certificate of Currency to HexaHub. Failure to provide evidence of insurance may result in the Vendor being denied entry to the Venue. HexaHub's insurance does not cover the Vendor's goods, property, or liability.</div>

        <div><strong>8. Damage and Cleanliness.</strong> The Vendor is responsible for: (a) maintaining their Allocated Space in a clean and tidy condition throughout the Event; (b) removing all rubbish and waste from their space by Bump-Out; (c) the cost of repairing or replacing any damage caused by the Vendor or their staff to the Venue, equipment, or other property. HexaHub may deduct repair costs from the Bond or invoice the Vendor accordingly.</div>

        <div><strong>9. Intellectual Property and Marketing.</strong> HexaHub may photograph and film the Event, including the Vendor's stall and products, for marketing and promotional purposes. By participating in the Event, the Vendor grants HexaHub a non-exclusive, royalty-free licence to use such images and footage for marketing purposes. The Vendor may photograph and promote their own participation, provided they do not misrepresent their affiliation with HexaHub.</div>

        <div><strong>10. No Exclusivity.</strong> HexaHub does not guarantee exclusivity to the Vendor in relation to their product or service category. Other vendors at the Event may offer similar goods or services.</div>

        <div><strong>11. Termination.</strong> HexaHub may immediately terminate this Agreement and require the Vendor to vacate the Venue if the Vendor: (a) breaches any term of this Agreement or the Venue Rules; (b) engages in conduct that is unlawful, unsafe, or detrimental to the Event or other participants; (c) fails to provide evidence of insurance before the Event Date; or (d) HexaHub reasonably considers the Vendor poses a risk to persons or property. No refund of the Participation Fee will be payable upon termination for cause.</div>

        <div><strong>12. Cancellation by Vendor.</strong> If the Vendor cancels their participation: (a) more than 14 days before the Event, the Participation Fee is refunded in full; (b) 7–14 days before, 50% of the Participation Fee is forfeited; (c) fewer than 7 days before, the full Participation Fee is forfeited. The Bond will be refunded in full upon cancellation.</div>

        <div><strong>13. Force Majeure.</strong> If the Event is cancelled or postponed due to circumstances beyond HexaHub's reasonable control (including but not limited to extreme weather, government direction, or public emergency), HexaHub will offer the Vendor a full refund of the Participation Fee or the option to transfer to a rescheduled event. HexaHub will not be liable for any other losses incurred by the Vendor as a result of cancellation or postponement.</div>

        <div><strong>14. Indemnity.</strong> The Vendor indemnifies HexaHub and its directors, employees, and agents against all claims, losses, costs, and liabilities arising from: (a) the Vendor's presence at or participation in the Event; (b) the Vendor's goods or services (including any product liability claims); (c) any act or omission of the Vendor or their staff; or (d) any breach of this Agreement.</div>

        <div><strong>15. HexaHub's Liability.</strong> To the extent permitted by law, HexaHub's liability to the Vendor is limited to the Participation Fee paid. HexaHub is not liable for the Vendor's loss of profits, loss of sales, indirect or consequential loss, or any damage to or theft of the Vendor's property at the Event.</div>

        <div><strong>16. Compliance with Laws.</strong> The Vendor must comply with all applicable laws in connection with their participation in the Event, including (without limitation) the Food Act 1984 (Vic), Australian Consumer Law, Liquor Control Reform Act 1998 (Vic) (if applicable), Occupational Health and Safety Act 2004 (Vic), and any relevant licensing requirements.</div>

        <div><strong>17. Entire Agreement.</strong> This Agreement, together with the Venue Rules (Annexure A), constitutes the entire agreement between the parties in respect of the Vendor's participation at the Event.</div>

        <div><strong>18. Governing Law.</strong> This Agreement is governed by the laws of Victoria, Australia.</div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-4">Executed as an Agreement</h2>
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-4">
            <div className="font-semibold text-gray-700">SIGNED for HexaHub Pty Ltd</div>
            <div className="border-b border-gray-400 pt-8 w-full" />
            <div className="text-gray-500">Authorised Signatory · Date: ___________</div>
          </div>
          <div className="space-y-4">
            <div className="font-semibold text-gray-700">SIGNED by the Vendor</div>
            <div className="font-bold">{b.vendorName}{b.vendorBusiness ? ` — ${b.vendorBusiness}` : ''}</div>
            <div className="border-b border-gray-400 pt-8 w-full" />
            <div className="text-gray-500">Signature · Date: ___________</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Document 2: Liability Waiver ──────────────────────────────────────────────

function LiabilityWaiverDoc({ booking }) {
  const b = booking
  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-5">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Vendor Liability Waiver and Indemnity</h1>
        <div className="text-sm text-gray-600 font-sans">Hexa Hub Pop-Up · Sunday 7 June 2026</div>
      </div>

      <hr className="border-gray-300" />

      <div className="space-y-4 text-xs">
        <p>This Liability Waiver and Indemnity ("Waiver") is given by the Vendor named in the Vendor Participation Agreement — {b.vendorBusiness || b.vendorName} — ("the Vendor") in favour of HexaHub Pty Ltd ABN 51 234 567 890 ("HexaHub") in connection with the Vendor's participation in the Hexa Hub Pop-Up event held on Sunday 7 June 2026 at The Hub, 18 Logistic Court, Huntingdale VIC 3166 (the "Event").</p>

        <div>
          <strong>1. Acknowledgement of Risk.</strong>
          <p className="mt-1">The Vendor acknowledges that participation in the Event as a vendor or stallholder involves inherent risks, including but not limited to personal injury, property damage, theft, and financial loss. The Vendor has conducted its own assessment of those risks and is satisfied that it is appropriate to participate.</p>
        </div>

        <div>
          <strong>2. Release and Waiver.</strong>
          <p className="mt-1">To the fullest extent permitted by law, the Vendor releases, waives, discharges, and covenants not to sue HexaHub, its directors, officers, employees, contractors, and agents ("Released Parties") from any and all claims, demands, and causes of action of any kind arising from the Vendor's participation in the Event, including but not limited to: (a) personal injury or death sustained by the Vendor or the Vendor's staff; (b) damage to or theft of the Vendor's equipment, goods, or property; (c) financial loss arising from reduced attendance, poor weather, or any other cause; and (d) any damage caused by another vendor, attendee, or third party at the Event.</p>
        </div>

        <div>
          <strong>3. Indemnity for Vendor's Goods and Services.</strong>
          <p className="mt-1">The Vendor agrees to indemnify, defend, and hold harmless the Released Parties from any and all claims, actions, losses, and liabilities (including legal costs) brought by any third party (including event attendees) arising from: (a) the Vendor's goods or services (including any defective products or food safety incidents); (b) any act or omission of the Vendor or their staff at the Event; (c) any breach by the Vendor of the Vendor Participation Agreement; or (d) any non-compliance by the Vendor with applicable laws.</p>
        </div>

        <div>
          <strong>4. Property.</strong>
          <p className="mt-1">HexaHub is not responsible for loss, theft, or damage to the Vendor's equipment, stock, cash, or any other property brought to or left at the Venue before, during, or after the Event. The Vendor assumes sole responsibility for the security and safety of their property.</p>
        </div>

        <div>
          <strong>5. Insurance Warranty.</strong>
          <p className="mt-1">The Vendor warrants that it holds, and will maintain in force through the Event Date, Public Liability Insurance of at least AUD $10,000,000 per occurrence. The Vendor agrees to provide a current Certificate of Currency to HexaHub prior to the Event. The Vendor acknowledges that HexaHub's agreement to allow participation does not constitute a representation that this level of insurance is adequate for the Vendor's specific circumstances.</p>
        </div>

        <div>
          <strong>6. Consumer Guarantees.</strong>
          <p className="mt-1">Nothing in this Waiver excludes, restricts, or modifies any right or remedy or guarantee that the Vendor may have under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)) or any other applicable legislation that cannot by law be excluded, restricted, or modified.</p>
        </div>

        <p className="italic text-gray-600">By signing the Vendor Participation Agreement, the Vendor confirms they have read, understood, and agreed to this Waiver on behalf of themselves and their staff participating in the Event.</p>
      </div>
    </div>
  )
}

// ── Document 3: Venue Rules ───────────────────────────────────────────────────

function VenueRulesDoc() {
  return (
    <div className="font-serif text-[13px] text-gray-900 leading-relaxed space-y-5">
      <div className="text-center space-y-1">
        <div className="text-xs tracking-widest font-sans font-bold text-gray-500 uppercase">HexaHub Pty Ltd</div>
        <h1 className="text-xl font-bold tracking-tight">Vendor Rules & Housekeeping</h1>
        <div className="text-sm text-gray-600 font-sans">Hexa Hub Pop-Up · 7 June 2026 · The Hub, 18 Logistic Court, Huntingdale</div>
      </div>

      <hr className="border-gray-300" />

      <p className="text-xs text-gray-600 italic">These rules apply to all vendors, their staff, and contractors at the Hexa Hub Pop-Up. Compliance is mandatory. Failure to follow these rules may result in removal from the Event without refund.</p>

      <div className="space-y-4 text-xs">
        <div><strong>Rule 1 — Access Hours.</strong> Vendors may access the Venue from 8:00 AM for bump-in and setup. The Venue opens to the public at 10:00 AM. All vendors must be set up and ready by 9:45 AM. Pack-down may commence from 10:00 PM and must be completed by 11:00 PM. No vendor may leave the Venue during event hours without informing HexaHub staff.</div>

        <div><strong>Rule 2 — Allocated Space.</strong> Vendors must operate solely from their allocated space as designated by HexaHub. Signage, display items, and equipment must remain within the allocated space boundaries and must not encroach on walkways, emergency exits, or neighbouring spaces. Vendors must not rearrange their space layout without HexaHub's prior approval.</div>

        <div><strong>Rule 3 — Setup and Equipment.</strong> All vendor equipment, furniture, shelving, and display structures must be stable, secure, and safe for public interaction. HexaHub reserves the right to require the removal of any item considered unsafe. Vendors using electrical equipment must ensure all items are tested and tagged. Power outlets are limited — all electrical requirements must be communicated to HexaHub in advance. Generators are not permitted without prior written approval.</div>

        <div><strong>Rule 4 — Food and Beverage Vendors.</strong> All food and beverage vendors must: (a) display their Food Business Registration certificate at their stall; (b) ensure all food is stored, handled, and served in accordance with food safety regulations; (c) have appropriate waste disposal for food scraps and packaging; (d) not prepare or cook food in a manner that produces excessive smoke, odour, or open flames without prior approval; (e) not sell alcohol unless in possession of a valid liquor licence and prior written approval from HexaHub.</div>

        <div><strong>Rule 5 — Presentation.</strong> Vendors are expected to maintain a professional and visually appealing presentation throughout the Event. Displays should be clean, well-presented, and consistent with the premium aesthetic of the Hexa Hub Pop-Up. HexaHub reserves the right to request adjustments to signage or displays that are inconsistent with the event's style guidelines.</div>

        <div><strong>Rule 6 — Noise.</strong> Vendors must not use amplified music, PA systems, or any audio equipment that creates excessive noise or interferes with neighbouring vendors or the event's ambient sound. Any audio requirements must be communicated to HexaHub in advance. HexaHub's decision regarding noise levels is final.</div>

        <div><strong>Rule 7 — Engagement with Attendees.</strong> Vendors and their staff must engage with attendees respectfully and professionally. High-pressure sales tactics are not permitted. Vendors must not approach attendees who have expressed disinterest. Any complaints from attendees about vendor conduct will be taken seriously and may result in the Vendor being asked to leave.</div>

        <div><strong>Rule 8 — Waste and Cleanliness.</strong> Vendors are responsible for managing their own waste throughout the Event. All rubbish must be placed in designated bins. At pack-down, vendors must remove all waste from their space and place it in the appropriate waste disposal areas. Vendors must not leave any rubbish, packaging, or equipment at the Venue after Bump-Out.</div>

        <div><strong>Rule 9 — No Damage to the Venue.</strong> Vendors must not drill, screw, nail, tape, or affix anything to walls, floors, ceilings, roller doors, or any building structure without HexaHub's written approval. Protective matting must be used under any heavy equipment. Any damage caused by the Vendor will be charged to them.</div>

        <div><strong>Rule 10 — Fire Safety.</strong> Fire exits, extinguisher access points, and evacuation routes must be kept clear at all times. Open flames (including gas burners, candles, and heaters) require prior written approval and must be supervised at all times. In the event of a fire alarm, all vendors and staff must evacuate immediately via the nearest exit and assemble at the designated muster point. Do not re-enter until cleared by emergency services.</div>

        <div><strong>Rule 11 — Photography and Social Media.</strong> Vendors are encouraged to document and share their participation on social media. Please tag @hexahub.official and use #HexaHubPopUp. Vendors must obtain consent before photographing or filming other vendors, staff, or attendees in a way that identifies them. Vendors must not photograph or publish any content that portrays the Event or HexaHub negatively.</div>

        <div><strong>Rule 12 — HexaHub Staff Direction.</strong> All HexaHub staff and event managers are authorised to issue directions to vendors in relation to safety, noise, layout, conduct, and compliance with these rules. Vendors must follow all such directions promptly. Disputes should be raised calmly with the event manager — disruptions to the Event will not be tolerated.</div>

        <div><strong>Rule 13 — Pack-Down.</strong> Pack-down must not begin before 10:00 PM. Vendors who begin packing down early without HexaHub's permission may not be invited to future HexaHub events. All vehicle access for pack-down must be coordinated with HexaHub staff to avoid congestion.</div>
      </div>

      <div className="text-xs text-gray-500 italic mt-4">
        These Rules form part of the Vendor Participation Agreement. By signing the Agreement, the Vendor accepts these Rules. HexaHub Pty Ltd · info@hexahub.com.au · hexahub.com.au
      </div>
    </div>
  )
}

// ── Main sign page ────────────────────────────────────────────────────────────

export default function EventBookingSignPage({ token }) {
  const [state, setState] = useState('loading')
  const [booking, setBooking] = useState(null)
  const [view, setView] = useState('doc1')
  const [signerName, setSignerName] = useState('')
  const [signerTitle, setSignerTitle] = useState('')
  const [signerDate, setSignerDate] = useState(format(new Date(), 'dd/MM/yyyy'))
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [insuranceChoice, setInsuranceChoice] = useState(null)
  const sigRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('event_bookings').select('data')
        if (error) { setState('error'); return }

        const match = (data ?? []).map(r => r.data).find(b => b?.signingToken === token)
        if (!match) { setState('invalid'); return }

        setBooking(match)
        if (match.signedAt) { setState('signed'); return }
        if (match.vendorName) setSignerName(match.vendorName)
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
    { key: 'doc1', label: '1. Participation Agreement' },
    { key: 'doc2', label: '2. Liability Waiver' },
    { key: 'doc3', label: '3. Venue Rules' },
    { key: 'sign', label: '✍ Sign' },
  ]

  if (state === 'loading') return <Screen title="Loading…" />
  if (state === 'invalid') return (
    <Screen icon="🔒" title="Invalid or expired link" subtitle="This signing link is invalid or has already been used. Contact info@hexahub.com.au for assistance." />
  )
  if (state === 'error') return <Screen icon="⚠️" title="Something went wrong" subtitle="Please try again or contact info@hexahub.com.au." />

  if (state === 'signed' && insuranceChoice == null) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header booking={booking} />
        <div className="max-w-xl mx-auto my-10 px-4">
          <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
            <div className="text-4xl mb-4 text-center">✅</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">Agreement Signed</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Thank you, {booking?.signerName}. Your vendor agreement is signed. We'll be in touch to confirm your participation in the Hexa Hub Pop-Up.
            </p>
            <div className="border border-gray-200 rounded-md p-5">
              <h3 className="font-semibold text-sm text-gray-800 mb-2">Public Liability Insurance</h3>
              <p className="text-xs text-gray-500 mb-4">
                Your participation requires a Certificate of Currency showing at least{' '}
                <strong>AUD $10,000,000 Public Liability Insurance</strong>.
                Please send this to{' '}
                <a href="mailto:info@hexahub.com.au" className="text-black underline">info@hexahub.com.au</a>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => submitInsuranceChoice('later')}
                  className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-md text-sm hover:bg-gray-50 font-medium"
                >
                  I'll email it shortly
                </button>
                <button
                  onClick={() => submitInsuranceChoice('done')}
                  className="flex-1 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800"
                >
                  Already sent
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
        title="You're all set!"
        subtitle={
          insuranceChoice === 'later'
            ? `Thanks ${booking?.signerName}. Please email your Certificate of Currency to info@hexahub.com.au. See you on June 7!`
            : `Thanks ${booking?.signerName}. Agreement signed and insurance confirmed. See you on June 7!`
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header booking={booking} />

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

      {view === 'doc1' && (
        <DocFrame>
          <VendorAgreementDoc booking={booking} />
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
          <VenueRulesDoc />
          <NavBtn onClick={() => setView('sign')}>Proceed to Sign →</NavBtn>
        </DocFrame>
      )}

      {view === 'sign' && (
        <div className="max-w-xl mx-auto my-8 px-4">
          <div className="bg-white border border-gray-200 rounded-md p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Sign as Vendor</h2>
            <p className="text-sm text-gray-500 mb-6">
              By signing, you confirm you have read and agree to all three documents above and that you are authorised to sign on behalf of the business.
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
                placeholder="e.g. Director, Owner, Manager"
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
                I confirm I have read and agree to the (1) Vendor Participation Agreement, (2) Liability Waiver, and (3) Vendor Rules for the Hexa Hub Pop-Up on 7 June 2026.
              </span>
            </label>

            <div className="bg-gray-50 rounded-md p-4 text-xs text-gray-500 mb-6 space-y-1">
              {booking?.vendorBusiness && <div><span className="font-medium text-gray-700">Business:</span> {booking.vendorBusiness}</div>}
              <div><span className="font-medium text-gray-700">Vendor Type:</span> {booking?.vendorType}</div>
              {booking?.allocatedSpace && <div><span className="font-medium text-gray-700">Allocated Space:</span> {booking.allocatedSpace}</div>}
              <div><span className="font-medium text-gray-700">Event:</span> Hexa Hub Pop-Up · Sunday 7 June 2026</div>
            </div>

            <button
              onClick={handleSign}
              disabled={submitting || !agreed}
              className="w-full bg-black text-white py-3 rounded-md text-sm font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Sign & Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Header({ booking }) {
  return (
    <div className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div>
        <span className="font-black tracking-widest text-lg">HEXAHUB</span>
        <span className="text-gray-400 text-sm ml-3">Vendor Agreement</span>
      </div>
      <div className="text-right hidden sm:block">
        <div className="text-sm font-medium text-white">Hexa Hub Pop-Up</div>
        <div className="text-xs text-gray-400">Sunday 7 June 2026</div>
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
      <button onClick={onClick} className="bg-black text-white px-6 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800">
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
