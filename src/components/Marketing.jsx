import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Megaphone, FileText } from 'lucide-react'
import LeadsBoard from './LeadsBoard.jsx'
import ListingsPanel from './ListingsPanel.jsx'
import EnquiriesInbox from './EnquiriesInbox.jsx'
import EventRegistrations from './EventRegistrations.jsx'

const TABS = [
  { key: 'leads',     label: 'Leads' },
  { key: 'enquiries', label: 'Enquiries' },
  { key: 'listings',  label: 'Listings' },
  { key: 'events',    label: 'Events' },
  { key: 'forms',     label: 'Forms' },
]

export default function Marketing() {
  const store = useOutletContext()
  const [tab, setTab] = useState('leads')

  const { spaces = [], leads = [], pipelineStages = [] } = store
  const vacantCount = spaces.filter((s) => s.status === 'vacant').length
  const wonStageId = pipelineStages.find((s) => s.category === 'won')?.id
  const lostStageId = pipelineStages.find((s) => s.category === 'lost')?.id
  const openLeads = leads.filter((l) => l.stageId !== wonStageId && l.stageId !== lostStageId).length
  const monthKey = new Date().toISOString().slice(0, 7)
  const wonThisMonth = leads.filter((l) => l.stageId === wonStageId && (l.stageEnteredAt ?? '').startsWith(monthKey)).length
  const unreadEnquiries = leads.filter((l) => !l.read).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone size={22} /> Marketing
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {vacantCount} vacant {vacantCount === 1 ? 'space' : 'spaces'} · {openLeads} open {openLeads === 1 ? 'lead' : 'leads'} · {wonThisMonth} won this month
          </p>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="border-b border-gray-200 mb-6 flex">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === key ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
            {key === 'enquiries' && unreadEnquiries > 0 && (
              <span className="bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{unreadEnquiries}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'leads' && <LeadsBoard store={store} />}
      {tab === 'enquiries' && <EnquiriesInbox store={store} />}
      {tab === 'listings' && <ListingsPanel store={store} />}
      {tab === 'events' && <EventRegistrations store={store} />}
      {tab === 'forms' && (
        <ComingSoon
          icon={FileText}
          title="Form builder"
          body="Build enquiry forms and embed them on the website to replace HubSpot. Arriving in Phase 3."
        />
      )}
    </div>
  )
}

function ComingSoon({ icon: Icon, title, body }) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-md p-12 text-center max-w-xl mx-auto">
      <Icon size={28} className="mx-auto text-gray-400 mb-3" />
      <h2 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h2>
      <p className="text-sm text-gray-500">{body}</p>
      <span className="inline-block mt-4 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded">Coming soon</span>
    </div>
  )
}
