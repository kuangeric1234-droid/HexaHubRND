import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, RefreshCw, AlertCircle, Megaphone, Target, Search } from 'lucide-react'
import { generateMarketing } from '../lib/aiMarketing.js'

const MODES = [
  { key: 'post', label: 'Social Post', icon: Megaphone, platforms: ['Instagram', 'LinkedIn', 'Facebook'] },
  { key: 'ad',   label: 'Ad Copy',     icon: Target,    platforms: ['Google', 'Meta', 'LinkedIn'] },
  { key: 'seo',  label: 'SEO',         icon: Search,    platforms: [] },
]
const TONES = ['professional', 'friendly', 'bold', 'minimal']

export default function AiStudio({ store }) {
  const { spaces = [], settings = {} } = store
  const [kind, setKind] = useState('post')
  const mode = MODES.find((m) => m.key === kind)

  const [spaceId, setSpaceId] = useState('')
  const [platform, setPlatform] = useState('Instagram')
  const [tone, setTone] = useState('professional')
  const [count, setCount] = useState(3)
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  // Default the unit picker to vacant units, but keep all selectable.
  const vacant = spaces.filter((s) => s.status === 'vacant')
  const others = spaces.filter((s) => s.status !== 'vacant')

  function switchMode(k) {
    setKind(k)
    const m = MODES.find((x) => x.key === k)
    setPlatform(m.platforms[0] ?? '')
    setOutput(''); setError('')
  }

  async function handleGenerate() {
    setLoading(true); setError(''); setCopied(false)
    try {
      const space = spaces.find((s) => s.id === spaceId) ?? null
      const text = await generateMarketing({
        kind, platform: mode.platforms.length ? platform : undefined,
        tone, count, space, company: settings.company, notes,
      })
      setOutput(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyOut() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500)
    })
  }

  const input = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div>
        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-md p-0.5 mb-5">
          {MODES.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => switchMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded transition-colors ${
                kind === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Space (optional)</label>
            <select value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className={input}>
              <option value="">— General / brand —</option>
              {vacant.length > 0 && (
                <optgroup label="Vacant">
                  {vacant.map((s) => <option key={s.id} value={s.id}>{s.unitNumber} — {s.address ?? s.type}</option>)}
                </optgroup>
              )}
              {others.length > 0 && (
                <optgroup label="Other">
                  {others.map((s) => <option key={s.id} value={s.id}>{s.unitNumber} — {s.address ?? s.type} ({s.status})</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mode.platforms.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={input}>
                  {mode.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className={`${input} capitalize`}>
                {TONES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            {kind !== 'seo' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Variations</label>
                <input type="number" min={1} max={6} value={count} onChange={(e) => setCount(e.target.value)} className={input} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Extra direction (optional)</label>
            <textarea value={notes} rows={3} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. emphasise 24/7 access and proximity to the freeway" className={`${input} resize-none`} />
          </div>

          <button onClick={handleGenerate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-md text-sm font-semibold hover:bg-gray-800 disabled:opacity-40">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Generating…' : output ? 'Regenerate' : 'Generate'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-xs text-red-700 flex gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Output</span>
          {output && (
            <button onClick={copyOut} className="flex items-center gap-1 text-xs text-gray-500 hover:text-black">
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4 min-h-[320px] text-sm text-gray-800 whitespace-pre-wrap">
          {output ? output : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-300 py-16">
              <Sparkles size={26} className="mb-2" />
              <p className="text-sm text-gray-400">Pick a space and hit Generate.<br />Posts, ads and SEO copy appear here.</p>
            </div>
          )}
        </div>
        {output && (
          <button onClick={handleGenerate} disabled={loading}
            className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-black">
            <RefreshCw size={12} /> Generate another set
          </button>
        )}
      </div>
    </div>
  )
}
