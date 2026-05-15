import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Trash2, Check } from 'lucide-react'

const MENU = [
  {
    section: 'Account Details',
    items: [
      { key: 'company-billing', label: 'Company & Billing' },
      { key: 'admin-users', label: 'Admin Users' },
      { key: 'emails', label: 'Emails & Notifications' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { key: 'contracts', label: 'Contracts' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { key: 'billing-rules', label: 'Billing Rules' },
      { key: 'invoicing', label: 'Invoicing' },
    ],
  },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function FormRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 mr-8 min-w-0">
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <div className="w-72 shrink-0">{children}</div>
    </div>
  )
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="flex border-b border-gray-200 mb-6">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function SaveButton({ onClick, saved }) {
  return (
    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
      <button
        onClick={onClick}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700"
      >
        Save Changes
      </button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <Check size={14} /> Saved
        </span>
      )}
    </div>
  )
}

function TextInput({ value, onChange, type = 'text', placeholder = '', mono = false }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mono ? 'font-mono' : ''}`}
    />
  )
}

// ── Company & Billing ─────────────────────────────────────────────────────────
function CompanyBillingSection({ settings, updateSettings }) {
  const [tab, setTab] = useState('company')
  const [companyForm, setCompanyForm] = useState(() => ({ ...settings.company }))
  const [billingForm, setBillingForm] = useState(() => ({ ...settings.billing }))
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ company: companyForm, billing: billingForm })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function setC(f) { return (v) => setCompanyForm((p) => ({ ...p, [f]: v })) }
  function setB(f) { return (v) => setBillingForm((p) => ({ ...p, [f]: v })) }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Company & Billing</h1>
      <p className="text-sm text-gray-500 mb-6">Manage your company details and billing information used on invoices and contracts.</p>

      <TabBar
        tabs={[['company', 'Company Info'], ['billing', 'Billing Details']]}
        active={tab}
        onSelect={setTab}
      />

      {tab === 'company' && (
        <>
          <FormRow label="Company Name" description="Trading name shown across the system">
            <TextInput value={companyForm.name} onChange={setC('name')} />
          </FormRow>
          <FormRow label="Company Email" description="Primary contact email for the company">
            <TextInput type="email" value={companyForm.email} onChange={setC('email')} />
          </FormRow>
          <FormRow label="Website" description="Shown in invoice footers">
            <TextInput value={companyForm.website} onChange={setC('website')} />
          </FormRow>
          <FormRow label="Company Logo" description="Upload a logo for invoices and contracts (PNG, JPG)">
            {companyForm.logo ? (
              <div className="flex items-center gap-3">
                <img src={companyForm.logo} alt="Logo" className="h-10 max-w-[140px] object-contain border border-gray-200 rounded px-1" />
                <button
                  onClick={() => setCompanyForm((p) => ({ ...p, logo: '' }))}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="border border-dashed border-gray-300 rounded-md px-4 py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-center">
                  Click to upload logo
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = (ev) => setCompanyForm((p) => ({ ...p, logo: ev.target.result }))
                    reader.readAsDataURL(file)
                  }}
                />
              </label>
            )}
          </FormRow>
        </>
      )}

      {tab === 'billing' && (
        <>
          <FormRow label="Business Name" description="Legal entity name on invoices and contracts">
            <TextInput value={billingForm.businessName} onChange={setB('businessName')} />
          </FormRow>
          <FormRow label="ABN (Registration Number)" description="Australian Business Number">
            <TextInput value={billingForm.abn} onChange={setB('abn')} />
          </FormRow>
          <FormRow label="GST Registered" description="Include GST (10%) on all invoices by default">
            <Toggle
              checked={billingForm.gstRegistered ?? true}
              onChange={(v) => setBillingForm((p) => ({ ...p, gstRegistered: v }))}
            />
          </FormRow>
          <FormRow label="Accountable Person" description="Person responsible for billing queries">
            <TextInput value={billingForm.accountablePerson} onChange={setB('accountablePerson')} />
          </FormRow>
          <FormRow label="Bank Name" description="Name of your financial institution">
            <TextInput value={billingForm.bankName} onChange={setB('bankName')} />
          </FormRow>
          <FormRow label="BSB" description="Bank-State-Branch number (e.g. 063-000)">
            <TextInput value={billingForm.bsb} onChange={setB('bsb')} placeholder="063-000" />
          </FormRow>
          <FormRow label="ACC (Account Number)" description="Bank account number">
            <TextInput value={billingForm.acc} onChange={setB('acc')} placeholder="00000000" />
          </FormRow>
          <FormRow label="Billing Address" description="Address shown on invoices and contracts">
            <TextInput value={billingForm.address} onChange={setB('address')} />
          </FormRow>
        </>
      )}

      <SaveButton onClick={save} saved={saved} />
    </div>
  )
}

// ── Admin Users ───────────────────────────────────────────────────────────────
function AdminUsersSection() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'sending' | 'sent' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Invite failed')
      setStatus('sent')
      setInviteEmail('')
      setTimeout(() => setStatus(null), 4000)
    } catch (err) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Users</h1>
      <p className="text-sm text-gray-500 mb-6">
        Invite team members to the portal. They'll receive an email to set their password and gain access.
      </p>

      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Invite a team member</h2>
        <form onSubmit={handleInvite} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Email address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@hexahub.com.au"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            <Plus size={14} />
            {status === 'sending' ? 'Sending…' : 'Send Invite'}
          </button>
        </form>

        {status === 'sent' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            <Check size={14} /> Invite sent — they'll receive an email to set their password.
          </div>
        )}
        {status === 'error' && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Managing existing users</p>
        <p className="text-xs text-blue-600">
          To reset a password or remove a user, go to{' '}
          <a
            href="https://supabase.com/dashboard/project/yitkqjlytlyyflrsnfwc/auth/users"
            target="_blank"
            rel="noreferrer"
            className="underline font-medium"
          >
            Supabase → Authentication → Users
          </a>.
        </p>
      </div>
    </div>
  )
}

// ── Emails & Notifications ────────────────────────────────────────────────────
function EmailsSection({ settings, updateSettings }) {
  const [form, setForm] = useState(() => ({ ...settings.emails }))
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ emails: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(f) { return (v) => setForm((p) => ({ ...p, [f]: v })) }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Emails & Notifications</h1>
      <p className="text-sm text-gray-500 mb-6">Configure email addresses for invoices, contracts, and system notifications.</p>

      <FormRow label="Notification Email" description="Receive system notifications at this address">
        <TextInput type="email" value={form.notificationEmail} onChange={set('notificationEmail')} />
      </FormRow>
      <FormRow label="Reply To" description="Tenants will reply to this address">
        <TextInput type="email" value={form.replyTo} onChange={set('replyTo')} />
      </FormRow>
      <FormRow label="CC" description="Carbon copy all outbound emails">
        <TextInput type="email" value={form.cc} onChange={set('cc')} placeholder="Optional" />
      </FormRow>
      <FormRow label="BCC" description="Blind copy all outbound emails">
        <TextInput type="email" value={form.bcc} onChange={set('bcc')} placeholder="Optional" />
      </FormRow>

      <div className="pt-4 pb-2 mt-2">
        <div className="text-sm font-semibold text-gray-700">Sender Details</div>
        <p className="text-xs text-gray-500 mt-0.5">Used as the From address when emails are sent to tenants.</p>
      </div>

      <FormRow label="From Name" description="Display name on outbound emails">
        <TextInput value={form.fromName} onChange={set('fromName')} />
      </FormRow>
      <FormRow label="From Email" description="Email address invoices and contracts are sent from">
        <div className="space-y-2">
          <TextInput type="email" value={form.fromEmail} onChange={set('fromEmail')} />
          <div className={`flex items-center justify-between gap-1.5 text-xs px-2.5 py-1.5 rounded border ${
            form.dnsVerified
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-orange-50 text-orange-700 border-orange-200'
          }`}>
            <span>{form.dnsVerified ? '✓ DNS Verified' : '⚠ DNS not verified — emails may land in spam'}</span>
            {!form.dnsVerified && (
              <button
                onClick={() => setForm((p) => ({ ...p, dnsVerified: true }))}
                className="underline text-xs shrink-0"
              >
                Mark Verified
              </button>
            )}
          </div>
        </div>
      </FormRow>

      <SaveButton onClick={save} saved={saved} />
    </div>
  )
}

// ── Contracts (Operations) ────────────────────────────────────────────────────
function ContractsSection({ settings, updateSettings }) {
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState(() => ({ ...settings.contracts }))
  const [reasons, setReasons] = useState(() => [...(settings.contracts?.terminationReasons ?? [])])
  const [newReason, setNewReason] = useState('')
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ contracts: { ...form, terminationReasons: reasons } })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(f) { return (v) => setForm((p) => ({ ...p, [f]: v })) }

  const numPreview = (form.numberTemplate ?? 'CON-{{number}}').replace('{{number}}', '001')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Contracts</h1>
      <p className="text-sm text-gray-500 mb-6">Configure contract numbering, eSignature sender, and termination reasons.</p>

      <TabBar
        tabs={[['general', 'General'], ['esign', 'eSignatures'], ['termination', 'Termination Reasons']]}
        active={tab}
        onSelect={setTab}
      />

      {tab === 'general' && (
        <>
          <FormRow label="Contract Number Template" description="Use {{number}} as the auto-increment placeholder">
            <div className="space-y-1">
              <TextInput value={form.numberTemplate} onChange={set('numberTemplate')} mono />
              <div className="text-xs text-gray-400">Preview: {numPreview}</div>
            </div>
          </FormRow>
          <FormRow label="Approval Required" description="Require manager approval before contracts can be sent">
            <Toggle checked={form.approvalRequired ?? false} onChange={set('approvalRequired')} />
          </FormRow>
        </>
      )}

      {tab === 'esign' && (
        <>
          <FormRow label="Signing Email" description="Email address used as the eSign sender">
            <TextInput type="email" value={form.eSignEmail} onChange={set('eSignEmail')} />
          </FormRow>
          <FormRow label="Signing Display Name" description="Name shown on eSign request emails">
            <TextInput value={form.eSignName} onChange={set('eSignName')} />
          </FormRow>
          <FormRow label="eSign Platform" description="Signing service used for electronic signatures">
            <div className="text-sm text-gray-500 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
              Hexa eSign (Built-in)
            </div>
          </FormRow>
        </>
      )}

      {tab === 'termination' && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              These reasons appear in the <strong>Terminate Contract</strong> dropdown. Edit or add your own.
            </p>
          </div>
          <div className="space-y-2 mb-4">
            {reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={r}
                  onChange={(e) => {
                    const updated = [...reasons]
                    updated[i] = e.target.value
                    setReasons(updated)
                  }}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setReasons((prev) => prev.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newReason.trim()) {
                  setReasons((prev) => [...prev, newReason.trim()])
                  setNewReason('')
                }
              }}
              placeholder="Add new termination reason…"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                if (newReason.trim()) {
                  setReasons((prev) => [...prev, newReason.trim()])
                  setNewReason('')
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-800 text-white rounded font-medium hover:bg-black"
            >
              <Plus size={14} />
            </button>
          </div>
        </>
      )}

      <SaveButton onClick={save} saved={saved} />
    </div>
  )
}

// ── Billing Rules ─────────────────────────────────────────────────────────────
function BillingRulesSection({ settings, updateSettings }) {
  const [form, setForm] = useState(() => ({ ...settings.billingRules }))
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ billingRules: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(f) { return (v) => setForm((p) => ({ ...p, [f]: v })) }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Billing Rules</h1>
      <p className="text-sm text-gray-500 mb-6">Configure billing periods, taxes, and multi-location billing.</p>

      <FormRow label="Billing Period Start Day" description="Day of month when billing periods start (1 = 1st of month)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={28}
            value={form.billingPeriodStartDay ?? 1}
            onChange={(e) => setForm((p) => ({ ...p, billingPeriodStartDay: Math.min(28, Math.max(1, Number(e.target.value))) }))}
            className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
          <span className="text-xs text-gray-500">of the month</span>
        </div>
      </FormRow>
      <FormRow label="Tax (GST)" description="Apply GST to all invoices by default">
        <Toggle checked={form.taxEnabled ?? true} onChange={set('taxEnabled')} />
      </FormRow>
      <FormRow label="Tax Rate (%)" description="GST rate applied to taxable line items">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={form.taxRate ?? 10}
            onChange={(e) => setForm((p) => ({ ...p, taxRate: Number(e.target.value) }))}
            className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
      </FormRow>
      <FormRow label="Multi-Location Billing" description="Enable billing across multiple locations on a single invoice">
        <Toggle checked={form.multiLocationBilling ?? false} onChange={set('multiLocationBilling')} />
      </FormRow>

      <SaveButton onClick={save} saved={saved} />
    </div>
  )
}

// ── Invoicing ─────────────────────────────────────────────────────────────────
function InvoicingSection({ settings, updateSettings }) {
  const [form, setForm] = useState(() => ({ ...settings.invoicing }))
  const [saved, setSaved] = useState(false)

  function save() {
    updateSettings({ invoicing: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function set(f) { return (v) => setForm((p) => ({ ...p, [f]: v })) }

  const invPreview = (form.invoiceNumberTemplate ?? 'INV-{{number}}').replace('{{number}}', '0001')

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Invoicing</h1>
      <p className="text-sm text-gray-500 mb-6">Configure invoice generation, numbering, due dates, and sending rules.</p>

      <FormRow label="Invoice Number Template" description="Use {{number}} as the auto-increment placeholder">
        <div className="space-y-1">
          <TextInput value={form.invoiceNumberTemplate} onChange={set('invoiceNumberTemplate')} mono />
          <div className="text-xs text-gray-400">Preview: {invPreview}</div>
        </div>
      </FormRow>
      <FormRow label="Due Date" description="Number of days after invoice issue date that payment is due">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={90}
            value={form.dueDateDays ?? 14}
            onChange={(e) => setForm((p) => ({ ...p, dueDateDays: Number(e.target.value) }))}
            className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
          <span className="text-xs text-gray-500">days after issue</span>
        </div>
      </FormRow>
      <FormRow label="Proration" description="Prorate first month's invoice when a tenant starts mid-month">
        <Toggle checked={form.proration ?? true} onChange={set('proration')} />
      </FormRow>
      <FormRow label="Auto-Generate Invoices" description="Automatically generate invoices at the start of each billing period">
        <Toggle checked={form.autoGenerate ?? true} onChange={set('autoGenerate')} />
      </FormRow>
      <FormRow label="Auto-Send Invoices" description="Automatically email invoices to tenants upon generation">
        <Toggle checked={form.autoSend ?? false} onChange={set('autoSend')} />
      </FormRow>
      <FormRow label="Overdue Reminder" description="Send a reminder this many days after a payment is overdue">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={60}
            value={form.overdueReminderDays ?? 7}
            onChange={(e) => setForm((p) => ({ ...p, overdueReminderDays: Number(e.target.value) }))}
            className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
          <span className="text-xs text-gray-500">days past due</span>
        </div>
      </FormRow>

      <SaveButton onClick={save} saved={saved} />
    </div>
  )
}

// ── Main Settings ─────────────────────────────────────────────────────────────
export default function Settings() {
  const { settings, updateSettings } = useOutletContext()
  const [selectedKey, setSelectedKey] = useState('company-billing')

  const SECTIONS = {
    'company-billing': <CompanyBillingSection settings={settings} updateSettings={updateSettings} />,
    'admin-users': <AdminUsersSection />,
    'emails': <EmailsSection settings={settings} updateSettings={updateSettings} />,
    'contracts': <ContractsSection settings={settings} updateSettings={updateSettings} />,
    'billing-rules': <BillingRulesSection settings={settings} updateSettings={updateSettings} />,
    'invoicing': <InvoicingSection settings={settings} updateSettings={updateSettings} />,
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white h-full overflow-y-auto">
        <div className="px-5 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Settings</h2>
        </div>
        <nav className="py-3">
          {MENU.map(({ section, items }) => (
            <div key={section} className="mb-2">
              <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section}
              </div>
              {items.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedKey === key
                      ? 'bg-blue-50 text-blue-700 font-medium border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {SECTIONS[selectedKey]}
        </div>
      </main>
    </div>
  )
}
