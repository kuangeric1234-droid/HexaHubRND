import { useState, useEffect } from 'react'
import { format, parseISO, isFuture, isToday } from 'date-fns'
import { supabase } from '../lib/supabase.js'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

function fmt(dateStr) {
  try { return format(parseISO(dateStr), 'EEEE, d MMMM yyyy') } catch { return dateStr }
}

export default function PortalEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('portal_events').select('data')
      const all = (data ?? []).map(r => r.data)
      all.sort((a, b) => new Date(a.date) - new Date(b.date))
      setEvents(all)
      setLoading(false)
    }
    load()
  }, [])

  const upcoming = events.filter(e => {
    try { return isFuture(parseISO(e.date)) || isToday(parseISO(e.date)) } catch { return true }
  })
  const past = events.filter(e => {
    try { return !isFuture(parseISO(e.date)) && !isToday(parseISO(e.date)) } catch { return false }
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Events</h1>
        <a
          href="https://www.hexahub.com.au/events"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
        >
          <ExternalLink size={13} />
          hexahub.com.au/events
        </a>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 text-center py-12">Loading events…</div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-16 text-center">
          <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-1">No upcoming events at the moment.</p>
          <a
            href="https://www.hexahub.com.au/events"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:underline"
          >
            View hexahub.com.au for the latest updates →
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Upcoming</h2>
              <div className="space-y-4">
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Past Events</h2>
              <div className="space-y-4 opacity-60">
                {past.slice(0, 5).map(event => (
                  <EventCard key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, past }) {
  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${past ? 'border-gray-100' : 'border-gray-200'}`}>
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-40 object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base mb-2">{event.title}</h3>
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar size={12} />
                {fmt(event.date)}{event.time ? ` · ${event.time}` : ''}
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} />
                  {event.location}
                </div>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
            )}
          </div>
        </div>
        {event.link && !past && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:underline"
            >
              Learn more <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
