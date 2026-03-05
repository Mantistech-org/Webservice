'use client'

import { useState } from 'react'

interface Props { sessionId: string }

interface Keyword { term: string; monthlyVolume: number; difficulty: 'Low' | 'Medium' | 'High'; opportunity: 'Low' | 'Medium' | 'High' }
interface Ranking { term: string; position: number; change: number }
interface SEOResult {
  keywords: Keyword[]
  pageTitles: string[]
  metaDescriptions: string[]
  localTerms: string[]
  rankings: Ranking[]
}

interface Change {
  id: string
  type: 'title' | 'meta' | 'keyword'
  label: string
  value: string
}

const DIFF_COLORS: Record<string, string> = {
  Low: '#4ade80',
  Medium: '#facc15',
  High: '#f87171',
}

export default function SEOOptimization({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SEOResult | null>(null)
  const [error, setError] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'apply'>('report')
  const [changes, setChanges] = useState<Change[]>([])
  const [checkedChanges, setCheckedChanges] = useState<Set<string>>(new Set())
  const [editedChanges, setEditedChanges] = useState<Record<string, string>>({})
  const [applyStatus, setApplyStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setApplyStatus('idle')
    try {
      const res = await fetch('/api/demo/seo-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, businessType, location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const r = data.result as SEOResult
      setResult(r)
      // Build changes list for Apply tab
      const built: Change[] = [
        ...r.pageTitles.map((t, i): Change => ({ id: `title-${i}`, type: 'title', label: `Update page title ${i + 1}`, value: t })),
        ...r.metaDescriptions.map((m, i): Change => ({ id: `meta-${i}`, type: 'meta', label: `Update description for page ${i + 1}`, value: m })),
        ...r.keywords.slice(0, 4).map((k, i): Change => ({ id: `kw-${i}`, type: 'keyword', label: `Add to page content: "${k.term}"`, value: `Add the phrase "${k.term}" to your homepage or relevant service page. This phrase gets ${k.monthlyVolume.toLocaleString()} searches per month.` })),
      ]
      setChanges(built)
      setCheckedChanges(new Set(built.map((c) => c.id)))
      setEditedChanges(Object.fromEntries(built.map((c) => [c.id, c.value])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleChange = (id: string) => {
    setCheckedChanges((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const applyChanges = () => {
    setApplyStatus('saving')
    setTimeout(() => setApplyStatus('saved'), 1500)
  }

  const maxVol = result ? Math.max(...result.keywords.map((k) => k.monthlyVolume)) : 1

  const inputClass = 'w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors'

  return (
    <div className="space-y-8">
      {/* How SEO works info box */}
      <div className="bg-[#0e2030] border border-[#2d4052] rounded p-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#8ab4cc' }}>How This Works</p>
        <p className="text-sm text-teal leading-relaxed">
          When someone searches for a business like yours on Google, your website either shows up or it does not. SEO is the process of making sure you show up as high as possible for the searches that matter to your business. Mantis Tech analyzes what people are actually searching for near you, then makes targeted updates to your website so Google understands exactly what you do and who you serve. The higher you rank, the more people find you instead of your competitors.
        </p>
      </div>

      {/* Input form */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>SEO Report</p>
          <h2 className="font-heading text-2xl text-primary">Get Your SEO Analysis</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Riverside Dental" required className={inputClass} />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Type of Business</label>
                <input type="text" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Dental Practice" required className={inputClass} />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">City and State</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Portland, OR" required className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Analyzing...' : 'Run SEO Analysis'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-[#f0f0f0] border-t-transparent rounded-full animate-spin" />
              Analyzing your local search landscape...
            </div>
          )}
          {error && <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Sub-tab switcher */}
          <div className="flex gap-2 border-b border-border pb-0">
            {([['report', 'Your SEO Report'], ['apply', 'Apply Changes']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id)}
                className={`font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all ${
                  activeSubTab === id ? 'border-[#f0f0f0] text-[#f0f0f0]' : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSubTab === 'report' && (
            <div className="space-y-6">
              {/* What are people searching for */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>What Are People Searching For</p>
                  <h3 className="font-heading text-xl text-primary">Best Search Terms For Your Business</h3>
                  <p className="font-mono text-xs text-muted mt-1">Each of these is a real phrase people type into Google. Showing up for them means more customers finding you.</p>
                </div>
                <div className="divide-y divide-border">
                  {result.keywords.map((kw, i) => (
                    <div key={i} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="font-heading text-base text-primary mb-1">"{kw.term}"</div>
                          <p className="font-mono text-xs text-teal">
                            Update your website to include this phrase and you show up when people search for it.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-sm text-primary">{kw.monthlyVolume.toLocaleString()}</div>
                          <div className="font-mono text-xs text-muted">searches/mo</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#0e2030] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(kw.monthlyVolume / maxVol) * 100}%`, backgroundColor: '#8ab4cc' }} />
                        </div>
                        <span className="font-mono text-xs rounded px-2 py-0.5" style={{ color: DIFF_COLORS[kw.difficulty] }}>
                          {kw.difficulty === 'Low' ? 'Easy to rank for' : kw.difficulty === 'Medium' ? 'Moderate competition' : 'High competition'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What people see on Google */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>What People See When You Show Up On Google</p>
                  <h3 className="font-heading text-xl text-primary">Suggested Page Titles and Descriptions</h3>
                </div>
                <div className="p-6 space-y-4">
                  {result.pageTitles.map((title, i) => (
                    <div key={i} className="bg-[#0e2030] border border-[#2d4052] rounded p-4">
                      <div className="text-blue-400 text-sm font-medium mb-1">{title}</div>
                      <div className="font-mono text-xs text-muted mb-1">{businessName} — {location}</div>
                      {result.metaDescriptions[i] && (
                        <div className="font-mono text-xs text-teal leading-relaxed">{result.metaDescriptions[i]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Searches happening near you */}
              <div className="bg-card border border-border rounded p-6">
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Searches Happening Near You</p>
                <h3 className="font-heading text-xl text-primary mb-2">Local Searches You Should Own</h3>
                <p className="font-mono text-xs text-teal leading-relaxed mb-4">
                  These are searches people in your area are doing right now. Showing up for these means more local customers finding you instead of your competitors.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.localTerms.map((term, i) => (
                    <span key={i} className="font-mono text-xs bg-[#0e2030] border border-[#2d4052] text-primary px-3 py-1.5 rounded">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ranking tracker */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Where You Stand Right Now</p>
                  <h3 className="font-heading text-xl text-primary">Current Google Positions</h3>
                  <p className="font-mono text-xs text-muted mt-1">Position 1 means you are the first result. Lower numbers are better.</p>
                </div>
                <div className="divide-y divide-border">
                  {result.rankings.map((r, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-10 rounded bg-[#0e2030] flex items-center justify-center font-mono text-sm text-primary shrink-0">
                        #{r.position}
                      </div>
                      <span className="font-mono text-sm text-primary flex-1">"{r.term}"</span>
                      <div className={`flex items-center gap-1 font-mono text-sm shrink-0 ${r.change > 0 ? 'text-[#4ade80]' : r.change < 0 ? 'text-[#f87171]' : 'text-dim'}`}>
                        {r.change > 0 ? `up ${r.change}` : r.change < 0 ? `down ${Math.abs(r.change)}` : 'no change'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'apply' && (
            <div className="space-y-6">
              <div className="bg-[#0e2030] border border-[#2d4052] rounded p-5">
                <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#8ab4cc' }}>Recommended Updates</p>
                <p className="text-sm text-teal leading-relaxed">
                  Select the changes you want to apply to your website. You can edit each one before saving. Uncheck anything you want to skip.
                </p>
              </div>

              {applyStatus === 'saved' ? (
                <div className="bg-[#0e2030] border border-[#4ade80]/30 rounded p-6 text-center">
                  <div className="font-heading text-2xl text-primary mb-2">Changes Saved</div>
                  <p className="font-mono text-sm text-teal">
                    {checkedChanges.size} update{checkedChanges.size !== 1 ? 's' : ''} have been applied to your website.
                  </p>
                  <button onClick={() => setApplyStatus('idle')} className="mt-4 font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
                    Make More Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {changes.map((change) => (
                    <div key={change.id} className="bg-card border border-border rounded p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={checkedChanges.has(change.id)}
                          onChange={() => toggleChange(change.id)}
                          className="mt-1 w-4 h-4 rounded border-[#2d4052] accent-white shrink-0"
                        />
                        <div className="flex-1">
                          <div className="font-mono text-xs text-muted uppercase tracking-widest mb-1">
                            {change.type === 'title' ? 'Page Title' : change.type === 'meta' ? 'Page Description' : 'Add to Content'}
                          </div>
                          <div className="font-mono text-sm text-primary">{change.label}</div>
                        </div>
                        {change.type !== 'keyword' && (
                          <span className="font-mono text-xs text-dim shrink-0">
                            {(editedChanges[change.id] ?? change.value).length} chars
                          </span>
                        )}
                      </div>
                      <textarea
                        value={editedChanges[change.id] ?? change.value}
                        onChange={(e) => setEditedChanges((prev) => ({ ...prev, [change.id]: e.target.value }))}
                        rows={change.type === 'keyword' ? 2 : 1}
                        disabled={!checkedChanges.has(change.id)}
                        className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#5a7a9a] transition-colors resize-none disabled:opacity-40"
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono text-xs text-muted">{checkedChanges.size} of {changes.length} changes selected</span>
                    <button
                      onClick={applyChanges}
                      disabled={checkedChanges.size === 0 || applyStatus === 'saving'}
                      className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                    >
                      {applyStatus === 'saving' ? 'Saving...' : 'Apply Selected Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects to live search data and tracks your actual rankings over time.
      </p>
    </div>
  )
}
