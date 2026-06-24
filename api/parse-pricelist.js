// Vercel serverless function — POST /api/parse-pricelist
// Reads a Found Huntingdale lease price-list PDF with Claude and returns the
// units as structured JSON for reconciliation against RND spaces.
// Requires env var: ANTHROPIC_API_KEY.
//
// Body: { data: <base64 PDF (no data: prefix)> }

import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-opus-4-8'

export const config = { maxDuration: 60, api: { bodyParser: { sizeLimit: '12mb' } } }

const PROMPT = `This is a commercial lease price list for "Found Huntingdale" (warehouse, storage and office units in Huntingdale, Melbourne).

Extract EVERY unit listed. For each unit return:
- unitNumber: the unit code exactly as shown (e.g. "O5", "O15", "61W", "42S")
- type: one of "warehouse" | "storage" | "office". Infer from the code/columns — codes ending in "W" or starting with "O" are warehouse/office-warehouse → use "warehouse"; codes ending in "S" are storage → use "storage". Use "office" only if clearly office-only.
- size: the floor area as a string with unit, e.g. "240 m²"
- address: the street address shown for that unit (e.g. "11 Distribution Circuit", "20 Logistic Court")
- monthlyRate: the rent as a WHOLE-DOLLAR NUMBER PER MONTH, ex-GST. Prices in these lists are usually ANNUAL ex-GST — if so, divide by 12 and round to the nearest dollar. If a price is already monthly, use it directly. No "$" or commas.
- status: "vacant" if Available, "reserved" if Under Offer, "occupied" if Leased/Unavailable. Default to "vacant" if blank.
- cars: number of car spaces (0 if none/blank)
- attributes: a short notes/feature string for the unit (or "")

Return ONLY a JSON object of the form {"units":[ ... ]} with no markdown, no commentary.`

function parseJson(text) {
  let t = text.trim()
  if (t.startsWith('```')) t = t.replace(/^```(json)?/i, '').replace(/```$/, '').trim()
  return JSON.parse(t)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  const { data } = req.body ?? {}
  if (!data) return res.status(400).json({ error: 'Missing PDF data' })

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } },
          { type: 'text', text: PROMPT },
        ],
      }],
    })
    if (message.stop_reason === 'refusal') return res.status(422).json({ error: 'Request declined.' })
    const raw = (message.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim()
    let parsed
    try { parsed = parseJson(raw) } catch { return res.status(502).json({ error: 'Could not parse the price list. Is it the standard format?' }) }
    return res.status(200).json({ units: parsed.units ?? [] })
  } catch (err) {
    console.error('parse-pricelist error:', err)
    const status = err?.status && err.status >= 400 && err.status < 600 ? err.status : 500
    return res.status(status).json({ error: err?.message ?? 'Parse failed' })
  }
}
