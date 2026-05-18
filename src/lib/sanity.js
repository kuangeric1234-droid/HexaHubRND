const PROJECT_ID = 'w4zxsbqi'
const DATASET    = 'production'
const API_VER    = '2021-06-07'

const BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VER}/data/query/${DATASET}`

export function sanityImageUrl(asset, width = 900) {
  if (!asset?._ref) return null
  const clean = asset._ref
    .replace(/^image-/, '')
    .replace(/-(\w+)$/, '.$1')
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${clean}?w=${width}&auto=format&fit=crop`
}

// Convert Sanity Portable Text blocks to plain text
export function ptToText(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter(b => b._type === 'block')
    .map(b => (b.children ?? []).map(c => c.text ?? '').join(''))
    .filter(t => t.trim())
    .join(' ')
    .trim()
}

export async function fetchSanityEvents() {
  const query = encodeURIComponent(
    '*[_type == "event"] | order(date asc) {_id, title, date, endDate, summary, tagline, location, locationAddress, slug, coverImage, rsvpEnabled, rsvpClosingDate}'
  )
  try {
    const res = await fetch(`${BASE}?query=${query}`)
    if (!res.ok) return []
    const { result } = await res.json()
    return (result ?? []).map(e => ({
      id: e._id,
      title: e.title,
      date: e.date ? e.date.split('T')[0] : null,
      endDate: e.endDate,
      time: e.date ? new Date(e.date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : null,
      location: [e.location, e.locationAddress].filter(Boolean).join(' — '),
      description: e.summary ?? e.tagline ?? '',
      imageUrl: sanityImageUrl(e.coverImage?.asset ? e.coverImage : null),
      link: e.slug?.current ? `https://www.hexahub.com.au/events/${e.slug.current}` : 'https://www.hexahub.com.au/events',
      rsvpEnabled: e.rsvpEnabled,
      source: 'sanity',
    }))
  } catch {
    return []
  }
}
