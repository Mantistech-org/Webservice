'use client'

import { useState } from 'react'

interface Props { sessionId: string }

interface Keyword {
  term: string
  monthlyVolume: number
  difficulty: 'Low' | 'Medium' | 'High'
  opportunity: 'Low' | 'Medium' | 'High'
}

interface Ranking {
  term: string
  position: number
  change: number
}

interface SEOResult {
  keywords: Keyword[]
  pageTitles: string[]
  metaDescriptions: string[]
  localTerms: string[]
  rankings: Ranking[]
}

const DIFF_COLORS: Record<string, string> = {
  Low: 'text-accent border-accent/30 bg-accent/5',
  Medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  High: 'text-red-400 border-red-400/30 bg-red-400/5',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider shrink-0">
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function SEOOptimization({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SEOResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/demo/seo-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, businessType, location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as SEOResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const maxVol = result ? Math.max(...result.keywords.map((k) => k.monthlyVolume)) : 1

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">SEO Platform</p>
          <h2 className="font-heading text-2xl text-primary">Generate SEO Report</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Riverside Dental" required className="form-input" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Type</label>
                <input type="text" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Dental Practice" required className="form-input" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Portland, OR" required className="form-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Generate SEO Report'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Analyzing keywords and search landscape...
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">{error}</div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Keywords */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Keyword Research</p>
              <h3 className="font-heading text-xl text-primary">Target Keywords</h3>
            </div>
            <div className="divide-y divide-border">
              {result.keywords.map((kw, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-sm text-primary">{kw.term}</span>
                    <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${(kw.monthlyVolume / maxVol) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-mono text-sm text-primary">{kw.monthlyVolume.toLocaleString()}</div>
                    <div className="font-mono text-xs text-dim">searches/mo</div>
                  </div>
                  <span className={`shrink-0 font-mono text-xs border px-2 py-0.5 rounded-full ${DIFF_COLORS[kw.difficulty]}`}>
                    {kw.difficulty}
                  </span>
                  <span className={`shrink-0 font-mono text-xs border px-2 py-0.5 rounded-full ${DIFF_COLORS[kw.opportunity]}`}>
                    {kw.opportunity} opp.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Page titles and meta descriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">On-Page SEO</p>
                <h3 className="font-heading text-xl text-primary">Page Title Suggestions</h3>
              </div>
              <div className="divide-y divide-border">
                {result.pageTitles.map((title, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between gap-4">
                    <span className="font-mono text-sm text-primary flex-1">{title}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono text-xs ${title.length <= 60 ? 'text-accent' : 'text-yellow-400'}`}>
                        {title.length} chars
                      </span>
                      <CopyButton text={title} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded">
              <div className="px-6 py-4 border-b border-border">
                <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Meta Tags</p>
                <h3 className="font-heading text-xl text-primary">Meta Descriptions</h3>
              </div>
              <div className="divide-y divide-border">
                {result.metaDescriptions.map((desc, i) => (
                  <div key={i} className="px-6 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-sm text-primary leading-relaxed flex-1">{desc}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`font-mono text-xs ${desc.length <= 155 ? 'text-accent' : 'text-yellow-400'}`}>
                          {desc.length}
                        </span>
                        <CopyButton text={desc} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Local terms */}
          <div className="bg-card border border-border rounded p-6">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Local SEO</p>
            <h3 className="font-heading text-xl text-primary mb-4">Local Search Terms</h3>
            <div className="flex flex-wrap gap-2">
              {result.localTerms.map((term, i) => (
                <span key={i} className="font-mono text-xs bg-bg border border-border text-primary px-3 py-1.5 rounded">
                  {term}
                </span>
              ))}
            </div>
          </div>

          {/* Ranking tracker */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Rank Tracker</p>
              <h3 className="font-heading text-xl text-primary">Current Rankings</h3>
            </div>
            <div className="divide-y divide-border">
              {result.rankings.map((r, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded bg-border flex items-center justify-center font-mono text-sm text-primary shrink-0">
                    {r.position}
                  </div>
                  <span className="font-mono text-sm text-primary flex-1">{r.term}</span>
                  <div className={`flex items-center gap-1 font-mono text-sm shrink-0 ${r.change > 0 ? 'text-accent' : r.change < 0 ? 'text-red-400' : 'text-dim'}`}>
                    {r.change > 0 ? '+' : ''}{r.change}
                    <span className="text-xs">{r.change > 0 ? 'up' : r.change < 0 ? 'down' : 'flat'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version connects to live search data and tracks your actual rankings over time.
      </p>
    </div>
  )
}
