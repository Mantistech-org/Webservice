'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

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

export default function SEOOptimization({ sessionId, darkMode }: Props) {
  // Business profile state
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [editingProfile, setEditingProfile] = useState(true)

  // Analysis state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SEOResult | null>(null)
  const [error, setError] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'apply' | 'keywords'>('report')
  const [changes, setChanges] = useState<Change[]>([])
  const [checkedChanges, setCheckedChanges] = useState<Set<string>>(new Set())
  const [editedChanges, setEditedChanges] = useState<Record<string, string>>({})
  const [applyStatus, setApplyStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const applyTabRef = useRef<HTMLDivElement>(null)

  const allFieldsFilled = businessName.trim() !== '' && businessType.trim() !== '' && location.trim() !== ''

  const handleRunAnalysis = async () => {
    if (!allFieldsFilled) return
    setProfileSaved(true)
    setEditingProfile(false)
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

  const goToApplyTab = () => {
    setActiveSubTab('apply')
    setTimeout(() => applyTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const maxVol = result ? Math.max(...result.keywords.map((k) => k.monthlyVolume)) : 1

  const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

  return (
    <div className="space-y-8">
      {/* How SEO works info box */}
      <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#3a6a8a' }}>How This Works</p>
        <p className="text-sm text-teal leading-relaxed">
          When someone searches for a business like yours on Google, your website either shows up or it does not. SEO is the process of making sure you show up as high as possible for the searches that matter to your business. Mantis Tech analyzes what people are actually searching for near you, then makes targeted updates to your website so Google understands exactly what you do and who you serve. The higher you rank, the more people find you instead of your competitors.
        </p>
      </div>

      {/* Business profile card */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Your Business Profile</p>
            <h2 className="font-heading text-2xl text-primary">Business Details</h2>
            <p className="font-mono text-xs text-muted mt-1">Saved for this session. Your info carries across every analysis.</p>
          </div>
          {profileSaved && !editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:border-[#b0b0b0] hover:text-primary transition-all shrink-0"
            >
              Edit
            </button>
          )}
        </div>
        <div className="p-6">
          {profileSaved && !editingProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Business Name</div>
                <div className="font-mono text-sm text-primary">{businessName}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Type of Business</div>
                <div className="font-mono text-sm text-primary">{businessType}</div>
              </div>
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">City and State</div>
                <div className="font-mono text-sm text-primary">{location}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Riverside Dental"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Type of Business</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="Dental Practice"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">City and State</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Portland, OR"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Run SEO Analysis button */}
      <button
        onClick={handleRunAnalysis}
        disabled={!allFieldsFilled || loading}
        className="w-full font-mono text-sm py-4 rounded tracking-wider transition-opacity disabled:opacity-40 font-medium"
        style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
      >
        {loading ? 'Analyzing your local search landscape...' : 'Run SEO Analysis'}
      </button>

      {loading && (
        <div className="flex items-center gap-3 text-muted font-mono text-sm">
          <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
          Analyzing your local search landscape...
        </div>
      )}
      {error && <div className="bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}

      {result && (
        <div className="space-y-6" ref={applyTabRef}>
          {/* Sub-tab switcher */}
          <div className="flex gap-2 border-b border-border pb-0">
            {([['report', 'Your SEO Report'], ['apply', 'Apply Changes'], ['keywords', 'Keyword Tracker']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id)}
                className={`font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all ${
                  activeSubTab === id ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeSubTab === 'report' && (
            <div className="space-y-6">
              {/* Top search terms */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Top Search Terms For Your Business</p>
                  <h3 className="font-heading text-xl text-primary">High Value Keywords</h3>
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
                        <div className="flex-1 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
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

              {/* How you appear in search results */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>How You Appear in Search Results</p>
                  <h3 className="font-heading text-xl text-primary">Suggested Page Titles and Descriptions</h3>
                </div>
                <div className="p-6 space-y-4">
                  {result.pageTitles.map((title, i) => (
                    <div key={i} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4">
                      <div className="text-blue-400 text-sm font-medium mb-1">{title}</div>
                      <div className="font-mono text-xs text-muted mb-1">{businessName} · {location}</div>
                      {result.metaDescriptions[i] && (
                        <div className="font-mono text-xs text-teal leading-relaxed">{result.metaDescriptions[i]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Local searches to target */}
              <div className="bg-card border border-border rounded p-6">
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Local Searches to Target</p>
                <h3 className="font-heading text-xl text-primary mb-2">Searches Happening Near You</h3>
                <p className="font-mono text-xs text-teal leading-relaxed mb-4">
                  These are searches people in your area are doing right now. Showing up for these means more local customers finding you instead of your competitors.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.localTerms.map((term, i) => (
                    <span key={i} className="font-mono text-xs bg-[#efefef] border border-[#d0d0d0] text-primary px-3 py-1.5 rounded">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current Google rankings */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Your Current Google Rankings</p>
                  <h3 className="font-heading text-xl text-primary">Where You Stand Right Now</h3>
                  <p className="font-mono text-xs text-muted mt-1">Position 1 means you are the first result. Lower numbers are better.</p>
                </div>
                <div className="divide-y divide-border">
                  {result.rankings.map((r, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-10 rounded bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-sm text-primary shrink-0">
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

              {/* Apply Changes CTA at bottom of report */}
              <button
                onClick={goToApplyTab}
                className="w-full font-mono text-sm py-4 rounded tracking-wider transition-opacity font-medium"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Apply to My Website
              </button>
            </div>
          )}

          {activeSubTab === 'apply' && (
            <div className="space-y-6">
              <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
                <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#3a6a8a' }}>Recommended Updates</p>
                <p className="text-sm text-teal leading-relaxed">
                  Select the changes you want to apply to your website. You can edit each one before saving. Uncheck anything you want to skip.
                </p>
              </div>

              {applyStatus === 'saved' ? (
                <div className="bg-[#efefef] border border-[#4ade80]/50 rounded p-6 text-center">
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
                          className="mt-1 w-4 h-4 rounded border-[#d0d0d0] accent-black shrink-0"
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
                        className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#888888] transition-colors resize-none disabled:opacity-40"
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
                      {applyStatus === 'saving' ? 'Saving...' : 'Apply to My Website'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'keywords' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Keyword Tracker</p>
                  <h3 className="font-heading text-xl text-primary">Your Ranked Keywords</h3>
                  <p className="font-mono text-xs text-muted mt-1">Current positions in Google search results. Lower position numbers mean you appear higher on the page.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Keyword</th>
                        <th className="px-5 py-3 text-center font-mono text-xs text-muted tracking-widest uppercase">Position</th>
                        <th className="px-5 py-3 text-right font-mono text-xs text-muted tracking-widest uppercase">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.rankings.map((r, i) => (
                        <tr key={i}>
                          <td className="px-5 py-4 font-mono text-sm text-primary">"{r.term}"</td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-10 h-8 rounded bg-[#efefef] border border-[#d0d0d0] font-mono text-sm text-primary">
                              #{r.position}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-mono text-sm ${r.change > 0 ? 'text-[#4ade80]' : r.change < 0 ? 'text-[#f87171]' : 'text-dim'}`}>
                              {r.change > 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="5,1 9,9 1,9" /></svg>
                                  {r.change}
                                </span>
                              ) : r.change < 0 ? (
                                <span className="flex items-center justify-end gap-1">
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="5,9 9,1 1,1" /></svg>
                                  {Math.abs(r.change)}
                                </span>
                              ) : (
                                <span>no change</span>
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
                <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#3a6a8a' }}>About These Rankings</p>
                <p className="text-sm text-teal leading-relaxed">
                  These rankings reflect estimated positions based on your current website content and the competitive landscape in your area. Applying the recommended changes improves these numbers over time.
                </p>
              </div>
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
