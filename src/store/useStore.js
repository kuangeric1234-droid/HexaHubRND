import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'

const STORAGE_KEYS = {
  tenants: 'hexahub_tenants',
  spaces: 'hexahub_spaces',
  leases: 'hexahub_leases',
  templates: 'hexahub_templates',
  invoices: 'hexahub_invoices',
  lastBillRun: 'hexahub_last_bill_run',
  discounts: 'hexahub_discounts',
  settings: 'hexahub_settings',
}

const DEFAULT_SETTINGS = {
  company: {
    name: 'HexaHub Pty Ltd',
    email: 'info@hexahub.com.au',
    logo: '',
    website: 'hexahub.com.au',
  },
  billing: {
    businessName: 'HexaHub Pty Ltd',
    abn: '51 234 567 890',
    gstRegistered: true,
    accountablePerson: '',
    bankName: 'Commonwealth Bank',
    bsb: '063-000',
    acc: '00000000',
    address: '7 Distribution Circuit, Huntingdale VIC 3166',
  },
  adminUsers: [
    { id: 'u1', name: 'Admin User', email: 'admin@hexahub.com.au', role: 'Admin', access: 'Full Access' },
  ],
  emails: {
    notificationEmail: 'info@hexahub.com.au',
    replyTo: 'info@hexahub.com.au',
    cc: '',
    bcc: '',
    fromEmail: 'noreply@hexahub.com.au',
    fromName: 'HexaHub',
    dnsVerified: false,
  },
  contracts: {
    numberTemplate: 'CON-{{number}}',
    approvalRequired: false,
    eSignEmail: 'esign@hexahub.com.au',
    eSignName: 'HexaHub',
    terminationReasons: [
      'Office Move - Client request move',
      'Business Closure',
      'Non-Payment',
      'Lease Breach',
      'End of Term',
      'Mutual Agreement',
      'Upgrade / Downgrade',
      'Other',
    ],
  },
  billingRules: {
    billingPeriodStartDay: 1,
    taxEnabled: true,
    taxRate: 10,
    multiLocationBilling: false,
  },
  invoicing: {
    proration: true,
    autoGenerate: true,
    dueDateDays: 14,
    overdueReminderDays: 7,
    invoiceNumberTemplate: 'INV-{{number}}',
    autoSend: false,
  },
}

// Sample invoices based on the 2 seed leases (today = 2026-05-15)
const SAMPLE_INVOICES = [
  {
    id: 'inv001',
    number: 'INV-0001',
    tenantId: 't1',
    leaseId: 'l1',
    status: 'paid',
    sentStatus: 'sent',
    source: 'bill-run',
    issueDate: '2026-04-01',
    dueDate: '2026-04-14',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    reference: '',
    paymentMethod: 'Bank Transfer',
    discountPct: 0,
    vatEnabled: true,
    xeroSync: false,
    lineItems: [{
      id: 'li001',
      description: 'O5 – 11 Distribution Circuit · Apr 1 – Apr 30, 2026',
      revenueAccount: 'Membership Fees',
      unitPrice: 4708,
      qty: 1,
      discountPct: 0,
    }],
    payments: [{ id: 'pay001', date: '2026-04-08', amount: 5178.8, method: 'Bank Transfer', note: 'Direct transfer received' }],
    comments: [],
    creditNoteForId: null,
    createdAt: '2026-04-01',
    isProrated: false,
  },
  {
    id: 'inv002',
    number: 'INV-0002',
    tenantId: 't1',
    leaseId: 'l1',
    status: 'pending',
    sentStatus: 'sent',
    source: 'bill-run',
    issueDate: '2026-05-01',
    dueDate: '2026-05-15',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-31',
    reference: '',
    paymentMethod: '',
    discountPct: 0,
    vatEnabled: true,
    xeroSync: false,
    lineItems: [{
      id: 'li002',
      description: 'O5 – 11 Distribution Circuit · May 1 – May 31, 2026',
      revenueAccount: 'Membership Fees',
      unitPrice: 4708,
      qty: 1,
      discountPct: 0,
    }],
    payments: [],
    comments: [],
    creditNoteForId: null,
    createdAt: '2026-05-01',
    isProrated: false,
  },
  {
    id: 'inv003',
    number: 'INV-0003',
    tenantId: 't2',
    leaseId: 'l2',
    status: 'overdue',
    sentStatus: 'sent',
    source: 'bill-run',
    issueDate: '2026-04-01',
    dueDate: '2026-04-14',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    reference: '',
    paymentMethod: '',
    discountPct: 0,
    vatEnabled: true,
    xeroSync: false,
    lineItems: [{
      id: 'li003',
      description: 'O15 – 20 Logistic Court · Apr 1 – Apr 30, 2026',
      revenueAccount: 'Membership Fees',
      unitPrice: 3000,
      qty: 1,
      discountPct: 0,
    }],
    payments: [],
    comments: [],
    creditNoteForId: null,
    createdAt: '2026-04-01',
    isProrated: false,
  },
  {
    id: 'inv004',
    number: 'INV-0004',
    tenantId: 't2',
    leaseId: 'l2',
    status: 'pending',
    sentStatus: 'not_sent',
    source: 'bill-run',
    issueDate: '2026-05-01',
    dueDate: '2026-05-30',
    periodStart: '2026-05-01',
    periodEnd: '2026-05-30',
    reference: '',
    paymentMethod: '',
    discountPct: 0,
    vatEnabled: true,
    xeroSync: false,
    lineItems: [{
      id: 'li004',
      description: 'O15 – 20 Logistic Court · May 1 – May 30, 2026 (prorated)',
      revenueAccount: 'Membership Fees',
      unitPrice: 2903,
      qty: 1,
      discountPct: 0,
    }],
    payments: [],
    comments: [],
    creditNoteForId: null,
    createdAt: '2026-05-01',
    isProrated: true,
  },
]

const SAMPLE_DISCOUNTS = [
  { id: 'disc001', name: 'Early Sign-Up', type: 'pct', value: 10, description: '10% off first 3 months' },
  { id: 'disc002', name: 'Long-Term Commitment', type: 'pct', value: 5, description: '5% off for 12-month contracts' },
]

const SAMPLE_TEMPLATES = [
  {
    id: 'tmpl1',
    name: 'Terms and Conditions',
    version: 'v1.0',
    type: 'terms',
    content: `<h3>1. Permitted Use</h3><p>The Licensee shall use the Premises solely for the purpose of lawful commercial operations and for no other purpose without prior written consent from the Licensor. The Licensee must not use the Premises for any illegal activity or in any way that causes a nuisance to other occupants.</p><h3>2. Payment Terms</h3><p>The monthly licence fee is payable in advance on the 1st day of each calendar month by direct bank transfer to the Licensor's nominated account. Late payments attract a fee of 5% of the monthly fee per week overdue. The Licensor may suspend access to the Premises if payment is more than 14 days overdue.</p><h3>3. Bond &amp; Security Deposit</h3><p>The Licensee shall pay to the Licensor a security deposit equal to two months' licence fee prior to occupation. The deposit will be held as security for the Licensee's obligations and returned within 14 days of the agreement end date, less any deductions for unpaid fees or damage.</p><h3>4. Maintenance &amp; Condition</h3><p>The Licensor is responsible for structural repairs and maintenance of common areas and building infrastructure. The Licensee is responsible for maintaining the interior of the Premises in clean, good order and repair, and must promptly report any damage or required repairs to the Licensor in writing.</p><h3>5. Termination &amp; Notice</h3><p>Either party may terminate this Agreement by providing not less than 30 days' written notice prior to the intended termination date. Early termination by the Licensee without the required notice may result in forfeiture of the security deposit. The Licensor may terminate immediately for material breach.</p><h3>6. Governing Law</h3><p>This Agreement is governed by and construed in accordance with the laws of the State of Victoria, Australia. Any disputes arising from this Agreement shall be resolved in the jurisdiction of the Victorian courts. The parties agree to attempt mediation before commencing litigation.</p>`,
    updatedAt: '2026-04-17',
    createdAt: '2025-01-01',
  },
  {
    id: 'tmpl2',
    name: 'House Rules',
    version: 'v1.0',
    type: 'house-rules',
    content: `<h3>1. Access &amp; Security</h3><p>Access to the Premises is provided 24 hours a day, 7 days a week via the electronic access system. Tenants are responsible for the security of their access credentials and must not share them with unauthorised persons. Lost or compromised access cards must be reported to management immediately.</p><h3>2. Noise &amp; Conduct</h3><p>Tenants must conduct their operations in a manner that does not unreasonably disturb other occupants. Noise levels must be kept to a reasonable level at all times. The use of audio equipment, power tools, or machinery that generates excessive noise must be pre-approved by management.</p><h3>3. Loading &amp; Deliveries</h3><p>All loading, unloading, and delivery activities must be conducted via the designated loading zones only. Vehicles must not obstruct access roads, driveways, or other tenants' areas. Large deliveries or freight movements should be coordinated with management to avoid conflicts.</p><h3>4. Waste &amp; Cleanliness</h3><p>Tenants are responsible for the disposal of their waste using the designated bins and waste management areas. Hazardous materials must be disposed of in accordance with applicable regulations. The Premises must be kept clean and tidy at all times.</p><h3>5. Compliance</h3><p>All tenants must comply with applicable laws, regulations, and building codes including fire safety, occupational health and safety, and environmental regulations. Any activity that may affect the structural integrity or services of the building requires prior written approval from the Licensor.</p>`,
    updatedAt: '2026-04-17',
    createdAt: '2025-01-01',
  },
]

// ── Real Found Huntingdale data (PDF: 17 April 2026) ──────────────────────────
// Prices in PDF are annual ex-GST ex-outgoings. monthlyRate = annualRate / 12 (rounded).
// "reserved" = Under Offer per PDF.

const SAMPLE_TENANTS = [
  {
    id: 't1',
    businessName: 'Meridian Fulfilment Pty Ltd',
    contactName: 'Sarah Chen',
    email: 'sarah@meridianful.com.au',
    phone: '0412 345 678',
    abn: '51 234 567 890',
    industry: 'E-commerce & Logistics',
    country: 'Australia',
    createdAt: '2024-06-01',
  },
  {
    id: 't2',
    businessName: 'BluePeak Distribution Co',
    contactName: 'James Okafor',
    email: 'james@bluepeak.com.au',
    phone: '0398 765 432',
    abn: '78 901 234 567',
    industry: 'Wholesale Distribution',
    country: 'Australia',
    createdAt: '2025-01-10',
  },
]

const SAMPLE_SPACES = [
  // ── Distribution Circuit — Block B ────────────────────────────────────────
  {
    id: 'so5',
    unitNumber: 'O5',
    type: 'warehouse',
    size: '240 m²',
    monthlyRate: 4708,   // $56,500/yr ÷ 12
    status: 'occupied',
    location: 'huntingdale',
    address: '11 Distribution Circuit',
    cars: 5,
    attributes: 'Street frontage, rear access tilt door & full floor office.',
  },
  {
    id: 'so7',
    unitNumber: 'O7',
    type: 'warehouse',
    size: '240 m²',
    monthlyRate: 4708,
    status: 'vacant',
    location: 'huntingdale',
    address: '15 Distribution Circuit',
    cars: 5,
    attributes: 'Street frontage, rear access tilt door & full floor office.',
  },
  {
    id: 'so11',
    unitNumber: 'O11',
    type: 'warehouse',
    size: '128 m²',
    monthlyRate: 3333,   // $40,000/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '103 Distribution Circuit',
    cars: 2,
    attributes: 'Corner 1st floor office with natural light and district views.',
  },
  {
    id: 'so10',
    unitNumber: 'O10',
    type: 'warehouse',
    size: '140 m²',
    monthlyRate: 3583,   // $43,000/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '103 Distribution Circuit',
    cars: 3,
    attributes: 'Corner 1st floor office with natural light and district views.',
  },
  // ── Logistic Court ────────────────────────────────────────────────────────
  {
    id: 'so14',
    unitNumber: 'O14',
    type: 'warehouse',
    size: '136 m²',
    monthlyRate: 3000,   // $36,000/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '19 Logistic Court',
    cars: 3,
    attributes: 'Ground floor office with private access direct from Franklyn Street.',
  },
  {
    id: 'so15',
    unitNumber: 'O15',
    type: 'warehouse',
    size: '136 m²',
    monthlyRate: 3000,
    status: 'occupied',
    location: 'huntingdale',
    address: '20 Logistic Court',
    cars: 3,
    attributes: 'Ground floor office with private access direct from Franklyn Street.',
  },
  {
    id: 's55w',
    unitNumber: '55W',
    type: 'warehouse',
    size: '223 m²',
    monthlyRate: 4083,   // $49,000/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '6 Logistic Court',
    cars: 3,
    attributes: 'Positioned directly opposite the storage driveway for improved access and vehicle manoeuvrability.',
  },
  {
    id: 's51w',
    unitNumber: '51W',
    type: 'warehouse',
    size: '223 m²',
    monthlyRate: 4083,
    status: 'vacant',
    location: 'huntingdale',
    address: '2 Logistic Court',
    cars: 3,
    attributes: 'Easy access — first warehouse from Franklyn Street driveway. Traditional office/warehouse with standard inclusions.',
  },
  {
    id: 's61w',
    unitNumber: '61W',
    type: 'warehouse',
    size: '243 m²',
    monthlyRate: 4833,   // $58,000/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '15 Logistic Court',
    cars: 3,
    attributes: 'Additional dual level office with balcony to the top floor.',
  },
  // ── Storage — 18 Logistic Court ───────────────────────────────────────────
  {
    id: 's61s',
    unitNumber: '61S',
    type: 'storage',
    size: '37 m²',
    monthlyRate: 942,    // $11,300/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '25/18 Logistic Court',
    cars: 0,
    attributes: 'Wireless keypad and 2x bollards.',
  },
  {
    id: 's56s',
    unitNumber: '56S',
    type: 'storage',
    size: '39 m²',
    monthlyRate: 975,    // $11,700/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '34/18 Logistic Court',
    cars: 0,
    attributes: 'Opposite The Hub.',
  },
  {
    id: 's42s',
    unitNumber: '42S',
    type: 'storage',
    size: '71 m²',
    monthlyRate: 1567,   // $18,800/yr ÷ 12
    status: 'reserved',  // Under Offer per PDF
    location: 'huntingdale',
    address: '38/18 Logistic Court',
    cars: 0,
    attributes: 'Opposite the Hub and drive through.',
  },
  {
    id: 's43s',
    unitNumber: '43S',
    type: 'storage',
    size: '31 m²',
    monthlyRate: 827,    // $9,920/yr ÷ 12
    status: 'reserved',  // Under Offer per PDF
    location: 'huntingdale',
    address: '39/18 Logistic Court',
    cars: 0,
    attributes: 'Base storage unit.',
  },
  {
    id: 's48s',
    unitNumber: '48S',
    type: 'storage',
    size: '75 m²',
    monthlyRate: 1625,   // $19,500/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '44/18 Logistic Court',
    cars: 0,
    attributes: 'Drive through.',
  },
  {
    id: 's57s',
    unitNumber: '57S',
    type: 'storage',
    size: '43 m²',
    monthlyRate: 1075,   // $12,900/yr ÷ 12
    status: 'vacant',
    location: 'huntingdale',
    address: '47/18 Logistic Court',
    cars: 0,
    attributes: 'Opposite The Hub.',
  },
  {
    id: 's26s',
    unitNumber: '26S',
    type: 'storage',
    size: '39 m²',
    monthlyRate: 975,
    status: 'vacant',
    location: 'huntingdale',
    address: '58/18 Logistic Court',
    cars: 0,
    attributes: 'Base storage unit.',
  },
]

const SAMPLE_LEASES = [
  {
    id: 'l1',
    tenantId: 't1',
    spaceId: 'so5',  // Meridian in O5 (11 Distribution Circuit)
    startDate: '2025-07-01',
    endDate: '2026-06-15',  // 31 days from 2026-05-15 → shows in Renewals
    monthlyRent: 4708,
    bondAmount: 9416,
    status: 'active',
    notes: 'Renewal discussion pending. Tenant is happy with the space and access.',
    createdAt: '2025-06-20',
  },
  {
    id: 'l2',
    tenantId: 't2',
    spaceId: 'so15',  // BluePeak in O15 (20 Logistic Court)
    startDate: '2026-01-01',
    endDate: '2026-05-30',  // 15 days from 2026-05-15 → urgent in Renewals
    monthlyRent: 3000,
    bondAmount: 6000,
    status: 'active',
    notes: '',
    createdAt: '2025-12-10',
  },
]

// ── Supabase helpers ──────────────────────────────────────────────────────────

function syncRow(table, id, data) {
  supabase.from(table)
    .upsert({ id, data, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error(`Supabase sync (${table}):`, error) })
}

function deleteRow(table, id) {
  supabase.from(table)
    .delete().eq('id', id)
    .then(({ error }) => { if (error) console.error(`Supabase delete (${table}):`, error) })
}

async function seedTable(table, items) {
  const rows = items.map((item) => ({ id: item.id, data: item, updated_at: new Date().toISOString() }))
  const { error } = await supabase.from(table).upsert(rows)
  if (error) console.error(`Supabase seed (${table}):`, error)
}

function extractRows(data) {
  return (data ?? []).map((r) => r.data)
}

export function useStore() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState([])
  const [spaces, setSpaces] = useState([])
  const [leases, setLeases] = useState([])
  const [templates, setTemplates] = useState([])
  const [invoices, setInvoices] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  // Always-current settings ref for callbacks
  const settingsRef = useRef(settings)
  useEffect(() => { settingsRef.current = settings }, [settings])

  // ── Load all data from Supabase on mount ──────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const [
          { data: tData }, { data: sData }, { data: lData },
          { data: tmData }, { data: invData }, { data: discData },
          { data: settData }, { data: metaData },
        ] = await Promise.all([
          supabase.from('tenants').select('data'),
          supabase.from('spaces').select('data'),
          supabase.from('leases').select('data'),
          supabase.from('templates').select('data'),
          supabase.from('invoices').select('data'),
          supabase.from('discounts').select('data'),
          supabase.from('settings').select('data').eq('id', 'global'),
          supabase.from('meta').select('*'),
        ])

        // 'seeded' flag — once set, we NEVER fall back to sample data again
        const isSeeded = metaData?.find((m) => m.key === 'seeded')?.value === 'true'

        const loadedTenants   = tData?.length    ? extractRows(tData)    : (isSeeded ? [] : SAMPLE_TENANTS)
        const loadedSpaces    = sData?.length    ? extractRows(sData)    : (isSeeded ? [] : SAMPLE_SPACES)
        const loadedLeases    = lData?.length    ? extractRows(lData)    : (isSeeded ? [] : SAMPLE_LEASES)
        const loadedTemplates = tmData?.length   ? extractRows(tmData)   : (isSeeded ? [] : SAMPLE_TEMPLATES)
        const loadedInvoices  = invData?.length  ? extractRows(invData)  : (isSeeded ? [] : SAMPLE_INVOICES)
        const loadedDiscounts = discData?.length ? extractRows(discData) : (isSeeded ? [] : SAMPLE_DISCOUNTS)
        const loadedSettings  = settData?.[0]?.data ?? DEFAULT_SETTINGS
        const lastBillRun     = metaData?.find((m) => m.key === 'last_bill_run')?.value ?? null

        // Seed sample data only on the very first ever load
        if (!isSeeded) {
          if (!tData?.length)    await seedTable('tenants',   SAMPLE_TENANTS)
          if (!sData?.length)    await seedTable('spaces',    SAMPLE_SPACES)
          if (!lData?.length)    await seedTable('leases',    SAMPLE_LEASES)
          if (!tmData?.length)   await seedTable('templates', SAMPLE_TEMPLATES)
          if (!invData?.length)  await seedTable('invoices',  SAMPLE_INVOICES)
          if (!discData?.length) await seedTable('discounts', SAMPLE_DISCOUNTS)
          if (!settData?.length) await supabase.from('settings').upsert({ id: 'global', data: loadedSettings })
          await supabase.from('meta').upsert({ key: 'seeded', value: 'true' })
        }

        setTenants(loadedTenants)
        setSpaces(loadedSpaces)
        setLeases(loadedLeases)
        setTemplates(loadedTemplates)
        setDiscounts(loadedDiscounts)
        setSettings(loadedSettings)
        settingsRef.current = loadedSettings

        // ── Auto bill run ──────────────────────────────────────────────
        const today = new Date()
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

        if (lastBillRun !== currentMonthKey && loadedSettings.invoicing?.autoGenerate !== false) {
          const s = loadedSettings
          const invTemplate = s.invoicing?.invoiceNumberTemplate ?? 'INV-{{number}}'
          const dueDateDays = s.invoicing?.dueDateDays ?? 14
          const prorateEnabled = s.invoicing?.proration !== false
          const startDay = Math.min(28, Math.max(1, s.billingRules?.billingPeriodStartDay ?? 1))
          const monthStart = new Date(today.getFullYear(), today.getMonth(), startDay)
          const periodMonthEnd = startDay === 1
            ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
            : new Date(today.getFullYear(), today.getMonth() + 1, startDay - 1 || 1)
          const daysInPeriod = Math.floor((periodMonthEnd - monthStart) / 86400000) + 1

          const activeLeases = loadedLeases.filter((l) => {
            if (l.status !== 'active') return false
            const start = new Date(l.startDate)
            const end = new Date(l.endDate)
            return start <= periodMonthEnd && end >= monthStart
          })

          const newInvoices = []
          for (const lease of activeLeases) {
            const alreadyBilled = loadedInvoices.some(
              (inv) => inv.leaseId === lease.id && inv.status !== 'voided' && inv.periodStart?.startsWith(currentMonthKey)
            )
            if (alreadyBilled) continue

            const leaseStart = new Date(lease.startDate)
            const leaseEnd = new Date(lease.endDate)
            const space = loadedSpaces.find((sp) => sp.id === lease.spaceId)
            const periodStart = leaseStart > monthStart ? leaseStart : monthStart
            const periodEnd = leaseEnd < periodMonthEnd ? leaseEnd : periodMonthEnd
            const daysOccupied = Math.floor((periodEnd - periodStart) / 86400000) + 1
            const isProrated = prorateEnabled && daysOccupied < daysInPeriod
            const amount = isProrated
              ? Math.round((lease.monthlyRent * daysOccupied / daysInPeriod) * 100) / 100
              : lease.monthlyRent

            const fmt = (d) => d.toISOString().split('T')[0]
            const periodLabel = `${periodStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${periodEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}${isProrated ? ' (prorated)' : ''}`
            const desc = `${space?.unitNumber ?? ''}${space?.address ? ` – ${space.address}` : ''} · ${periodLabel}`

            const allNums = [...loadedInvoices, ...newInvoices]
              .map((i) => parseInt(i.number?.replace(/\D/g, '') || '0', 10))
              .filter((n) => !isNaN(n))
            const nextNum = allNums.length > 0 ? Math.max(...allNums) + 1 : 1
            const dueDate = new Date(monthStart.getTime())
            dueDate.setDate(dueDate.getDate() + dueDateDays)

            newInvoices.push({
              id: `inv${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              number: invTemplate.replace('{{number}}', String(nextNum).padStart(4, '0')),
              tenantId: lease.tenantId, leaseId: lease.id,
              status: 'pending', sentStatus: 'not_sent', source: 'bill-run',
              issueDate: fmt(monthStart), dueDate: fmt(dueDate),
              periodStart: fmt(periodStart), periodEnd: fmt(periodEnd),
              reference: '', paymentMethod: '', discountPct: 0,
              vatEnabled: true, xeroSync: false, isProrated,
              lineItems: [{ id: `li${Date.now()}`, description: desc, revenueAccount: 'Membership Fees', unitPrice: amount, qty: 1, discountPct: 0 }],
              payments: [], comments: [], creditNoteForId: null,
              createdAt: fmt(today),
            })
          }

          if (newInvoices.length > 0) {
            setInvoices([...loadedInvoices, ...newInvoices])
            await seedTable('invoices', [...loadedInvoices, ...newInvoices])
          } else {
            setInvoices(loadedInvoices)
          }

          await supabase.from('meta').upsert({ key: 'last_bill_run', value: currentMonthKey })
        } else {
          setInvoices(loadedInvoices)
        }
      } catch (err) {
        console.error('Supabase load failed:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tenants ───────────────────────────────────────────────────────────────
  const addTenant = useCallback((tenant) => {
    const item = { ...tenant, id: `t${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }
    setTenants((prev) => [...prev, item])
    syncRow('tenants', item.id, item)
    return item
  }, [])

  const updateTenant = useCallback((id, updates) => {
    setTenants((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      const updated = next.find((t) => t.id === id)
      if (updated) syncRow('tenants', id, updated)
      return next
    })
  }, [])

  const deleteTenant = useCallback((id) => {
    setTenants((prev) => prev.filter((t) => t.id !== id))
    deleteRow('tenants', id)
  }, [])

  // ── Spaces ────────────────────────────────────────────────────────────────
  const addSpace = useCallback((space) => {
    const item = { ...space, id: `s${Date.now()}` }
    setSpaces((prev) => [...prev, item])
    syncRow('spaces', item.id, item)
    return item
  }, [])

  const updateSpace = useCallback((id, updates) => {
    setSpaces((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      const updated = next.find((s) => s.id === id)
      if (updated) syncRow('spaces', id, updated)
      return next
    })
  }, [])

  const deleteSpace = useCallback((id) => {
    setSpaces((prev) => prev.filter((s) => s.id !== id))
    deleteRow('spaces', id)
  }, [])

  // ── Leases ────────────────────────────────────────────────────────────────
  const addLease = useCallback((lease) => {
    const item = { ...lease, id: `l${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }
    setLeases((prev) => [...prev, item])
    syncRow('leases', item.id, item)
    setSpaces((prev) => {
      const next = prev.map((s) => (s.id === lease.spaceId ? { ...s, status: 'occupied' } : s))
      const updated = next.find((s) => s.id === lease.spaceId)
      if (updated) syncRow('spaces', updated.id, updated)
      return next
    })
    return item
  }, [])

  const updateLease = useCallback((id, updates) => {
    setLeases((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      const updated = next.find((l) => l.id === id)
      if (updated) syncRow('leases', id, updated)
      return next
    })
  }, [])

  const deleteLease = useCallback((id) => {
    setLeases((prev) => {
      const lease = prev.find((l) => l.id === id)
      if (lease) {
        setSpaces((spaces) => {
          const next = spaces.map((s) => (s.id === lease.spaceId ? { ...s, status: 'vacant' } : s))
          const updated = next.find((s) => s.id === lease.spaceId)
          if (updated) syncRow('spaces', updated.id, updated)
          return next
        })
      }
      return prev.filter((l) => l.id !== id)
    })
    deleteRow('leases', id)
  }, [])

  // ── Templates ─────────────────────────────────────────────────────────────
  const addTemplate = useCallback((template) => {
    const today = new Date().toISOString().split('T')[0]
    const item = { ...template, id: `tmpl${Date.now()}`, createdAt: today, updatedAt: today }
    setTemplates((prev) => [...prev, item])
    syncRow('templates', item.id, item)
    return item
  }, [])

  const updateTemplate = useCallback((id, updates) => {
    setTemplates((prev) => {
      const next = prev.map((t) => t.id === id
        ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t)
      const updated = next.find((t) => t.id === id)
      if (updated) syncRow('templates', id, updated)
      return next
    })
  }, [])

  const deleteTemplate = useCallback((id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    deleteRow('templates', id)
  }, [])

  // ── Invoices ──────────────────────────────────────────────────────────────
  const addInvoice = useCallback((invoice) => {
    setInvoices((prev) => {
      const invTemplate = settingsRef.current?.invoicing?.invoiceNumberTemplate ?? 'INV-{{number}}'
      const nums = prev.map((i) => parseInt(i.number?.replace(/\D/g, '') || '0', 10)).filter((n) => !isNaN(n))
      const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1
      const newInv = {
        ...invoice,
        id: `inv${Date.now()}`,
        number: invoice.number || invTemplate.replace('{{number}}', String(nextNum).padStart(4, '0')),
        createdAt: new Date().toISOString().split('T')[0],
        payments: invoice.payments ?? [],
        comments: invoice.comments ?? [],
      }
      syncRow('invoices', newInv.id, newInv)
      return [...prev, newInv]
    })
  }, [])

  const updateInvoice = useCallback((id, updates) => {
    setInvoices((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      const updated = next.find((i) => i.id === id)
      if (updated) syncRow('invoices', id, updated)
      return next
    })
  }, [])

  const voidInvoice = useCallback((id) => {
    setInvoices((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, status: 'voided' } : i))
      const updated = next.find((i) => i.id === id)
      if (updated) syncRow('invoices', id, updated)
      return next
    })
  }, [])

  const addPaymentToInvoice = useCallback((invoiceId, payment) => {
    setInvoices((prev) => {
      const next = prev.map((i) => i.id === invoiceId
        ? { ...i, payments: [...(i.payments ?? []), { ...payment, id: `pay${Date.now()}` }], status: 'paid' }
        : i)
      const updated = next.find((i) => i.id === invoiceId)
      if (updated) syncRow('invoices', invoiceId, updated)
      return next
    })
  }, [])

  const addCommentToInvoice = useCallback((invoiceId, text) => {
    setInvoices((prev) => {
      const next = prev.map((i) => i.id === invoiceId
        ? { ...i, comments: [...(i.comments ?? []), { id: `cmt${Date.now()}`, text, createdAt: new Date().toISOString().split('T')[0] }] }
        : i)
      const updated = next.find((i) => i.id === invoiceId)
      if (updated) syncRow('invoices', invoiceId, updated)
      return next
    })
  }, [])

  // ── Discounts ─────────────────────────────────────────────────────────────
  const addDiscount = useCallback((discount) => {
    const item = { ...discount, id: `disc${Date.now()}` }
    setDiscounts((prev) => [...prev, item])
    syncRow('discounts', item.id, item)
  }, [])

  const updateDiscount = useCallback((id, updates) => {
    setDiscounts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      const updated = next.find((d) => d.id === id)
      if (updated) syncRow('discounts', id, updated)
      return next
    })
  }, [])

  const deleteDiscount = useCallback((id) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== id))
    deleteRow('discounts', id)
  }, [])

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      settingsRef.current = next
      supabase.from('settings').upsert({ id: 'global', data: next })
        .then(({ error }) => { if (error) console.error('Supabase settings sync:', error) })
      return next
    })
  }, [])

  // ── Reset sample data ─────────────────────────────────────────────────────
  const resetSampleData = useCallback(async () => {
    if (!window.confirm('Load Found Huntingdale sample data?\n\nThis will replace all current data.')) return
    setTenants(SAMPLE_TENANTS)
    setSpaces(SAMPLE_SPACES)
    setLeases(SAMPLE_LEASES)
    setTemplates(SAMPLE_TEMPLATES)
    setInvoices(SAMPLE_INVOICES)
    setDiscounts(SAMPLE_DISCOUNTS)
    await Promise.all([
      seedTable('tenants', SAMPLE_TENANTS),
      seedTable('spaces', SAMPLE_SPACES),
      seedTable('leases', SAMPLE_LEASES),
      seedTable('templates', SAMPLE_TEMPLATES),
      seedTable('invoices', SAMPLE_INVOICES),
      seedTable('discounts', SAMPLE_DISCOUNTS),
      supabase.from('meta').upsert({ key: 'seeded', value: 'true' }),
    ])
  }, [])

  // runAutoBillRun is now handled inside the load useEffect — kept as no-op for compatibility
  const runAutoBillRun = useCallback(() => {}, [])

  return {
    loading,
    tenants, addTenant, updateTenant, deleteTenant,
    spaces, addSpace, updateSpace, deleteSpace,
    leases, addLease, updateLease, deleteLease,
    templates, addTemplate, updateTemplate, deleteTemplate,
    invoices, addInvoice, updateInvoice, voidInvoice, addPaymentToInvoice, addCommentToInvoice, runAutoBillRun,
    discounts, addDiscount, updateDiscount, deleteDiscount,
    settings, updateSettings,
    resetSampleData,
  }
}
