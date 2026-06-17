// Vercel serverless function — POST /api/sanity-sync
// Pushes a HexaHub space → the website's Sanity `unit` document.
// Requires env var: SANITY_WRITE_TOKEN (Editor permission, project w4zxsbqi).
//
// Body: { action: 'sync' | 'delete', space }
//   sync   — createIfNotExists the unit (deterministic _id = `unit.<spaceId>`),
//            then patch ONLY operational fields. Editorial fields curated in
//            Sanity (photos, description, features, featured, slug) are never
//            touched, so a price/status change can't wipe them.
//   delete — remove the unit document entirely.

const PROJECT_ID = 'w4zxsbqi'
const DATASET = 'production'
const API_VER = 'v2021-06-07'
const MUTATE_URL = `https://${PROJECT_ID}.api.sanity.io/${API_VER}/data/mutate/${DATASET}?returnIds=true`

// space.status → Sanity unit.status
const STATUS_MAP = { vacant: 'available', occupied: 'leased', reserved: 'under-offer' }
// space.type → Sanity unit.type (unmapped types fall back to 'warehouse')
const TYPE_MAP = { warehouse: 'warehouse', storage: 'storage', office: 'office' }

function slugify(str) {
  return String(str).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function parseSize(size) {
  const n = parseFloat(String(size ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : undefined
}

function docId(space) {
  return `unit.${space.id}`
}

// Operational fields HexaHub owns — these are patched on every sync.
function operationalFields(space) {
  const fields = {
    unitId: space.unitNumber,
    type: TYPE_MAP[space.type] ?? 'warehouse',
    status: STATUS_MAP[space.status] ?? 'available',
    monthlyPrice: typeof space.monthlyRate === 'number' ? space.monthlyRate : undefined,
    sizeSquareMetres: parseSize(space.size),
    parkingSpaces: typeof space.cars === 'number' ? space.cars : undefined,
    streetAddress: space.address ? `${space.address}, Huntingdale VIC 3166` : undefined,
    attributes: space.attributes || undefined,
  }
  // Strip undefined so we never blank out a field by patching it to null.
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined))
}

async function mutate(mutations) {
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) {
    return { ok: false, status: 500, error: 'SANITY_WRITE_TOKEN not configured' }
  }
  const res = await fetch(MUTATE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, status: res.status, error: data?.error?.description ?? data?.message ?? 'Sanity mutate failed' }
  return { ok: true, data }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { action = 'sync', space } = req.body ?? {}
  if (!space?.id) return res.status(400).json({ error: 'Missing space.id' })

  const _id = docId(space)

  try {
    if (action === 'delete') {
      const result = await mutate([{ delete: { id: _id } }])
      if (!result.ok) return res.status(result.status).json({ error: result.error })
      return res.status(200).json({ success: true, action: 'delete', id: _id })
    }

    // action === 'sync'
    const op = operationalFields(space)
    const title = `${(op.type ?? 'warehouse').replace('-', ' ')} ${space.unitNumber}`.replace(/\b\w/g, (c) => c.toUpperCase())
    const slug = slugify(`${space.unitNumber}-${space.address ?? op.type}`)

    const result = await mutate([
      {
        // First publish only: seed a complete, valid doc. Never overwrites an
        // existing one, so Sanity-curated photos/description survive.
        createIfNotExists: {
          _id,
          _type: 'unit',
          title,
          slug: { _type: 'slug', current: slug },
          listingType: 'for-lease',
          ...op,
        },
      },
      {
        // Every sync: refresh operational fields only.
        patch: { id: _id, set: op },
      },
    ])
    if (!result.ok) return res.status(result.status).json({ error: result.error })
    return res.status(200).json({ success: true, action: 'sync', id: _id })
  } catch (err) {
    console.error('sanity-sync error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
