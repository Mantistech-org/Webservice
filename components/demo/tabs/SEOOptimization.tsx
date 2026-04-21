'use client'

import { useState, useRef, useEffect } from 'react'

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
  applied: boolean
}

const DIFF_COLORS: Record<string, string> = {
  Low: '#4ade80',
  Medium: '#facc15',
  High: '#f87171',
}

const STORAGE_KEY = 'seo_business_profile'

// ── Browser window mockup ────────────────────────────────────────────────────

function BrowserMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d0d0d0] overflow-hidden text-left">
      {/* Browser chrome */}
      <div className="bg-[#e8e8e8] border-b border-[#d0d0d0] px-3 py-2 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
        <div className="ml-2 flex-1 bg-white border border-[#d0d0d0] rounded px-2 py-0.5 font-mono text-xs text-[#888888]">
          google.com/search
        </div>
      </div>
      {/* Page area */}
      <div className="bg-white p-4">
        {children}
      </div>
    </div>
  )
}

function TitleMockup({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <BrowserMockup>
      <div className="space-y-0.5">
        <div className="font-mono text-xs text-[#aaaaaa] mb-2">Search result preview</div>
        <div className="text-[#00ff88] text-sm font-medium leading-snug border border-dashed border-[#4ade80] rounded px-2 py-0.5 inline-block">
          {title}
        </div>
        <div className="font-mono text-xs text-[#16a34a]">{url}</div>
        <div className="font-mono text-xs text-[#555555] leading-relaxed">{description}</div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="font-mono text-xs text-[#16a34a] border border-[#4ade80]/40 rounded px-1.5 py-0.5">Updated</span>
        <span className="font-mono text-xs text-[#888888]">Page title optimized for search</span>
      </div>
    </BrowserMockup>
  )
}

function MetaMockup({ title, url, description }: { title: string; url: string; description: string }) {
  return (
    <BrowserMockup>
      <div className="space-y-0.5">
        <div className="font-mono text-xs text-[#aaaaaa] mb-2">Search result preview</div>
        <div className="text-[#00ff88] text-sm font-medium leading-snug">{title}</div>
        <div className="font-mono text-xs text-[#16a34a]">{url}</div>
        <div className="font-mono text-xs text-[#555555] leading-relaxed border border-dashed border-[#4ade80] rounded px-2 py-1">
          {description}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="font-mono text-xs text-[#16a34a] border border-[#4ade80]/40 rounded px-1.5 py-0.5">Updated</span>
        <span className="font-mono text-xs text-[#888888]">Meta description optimized</span>
      </div>
    </BrowserMockup>
  )
}

function KeywordMockup({ keyword, businessName }: { keyword: string; businessName: string }) {
  return (
    <BrowserMockup>
      <div className="font-mono text-xs text-[#aaaaaa] mb-2">Website page preview</div>
      <div className="bg-[#f5f5f5] rounded p-3 space-y-1.5">
        <div className="font-mono text-xs text-[#1a1a1a] font-bold">{businessName}</div>
        <div className="font-mono text-xs text-[#555555] leading-relaxed">
          Welcome to our website. We offer quality services tailored to your needs.{' '}
          <span className="bg-[#4ade80]/30 border border-[#4ade80]/50 rounded px-0.5">
            {keyword}
          </span>
          {' '}is one of our most requested services. Contact us today to learn more.
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="font-mono text-xs text-[#16a34a] border border-[#4ade80]/40 rounded px-1.5 py-0.5">Added</span>
        <span className="font-mono text-xs text-[#888888]">Keyword added to page content</span>
      </div>
    </BrowserMockup>
  )
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded p-4">
      <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{label}</div>
      <div className={`font-heading text-3xl leading-none mb-1 ${accent ? 'text-[#4ade80]' : 'text-primary'}`}>{value}</div>
      {sub && <div className="font-mono text-xs text-dim">{sub}</div>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SEOOptimization({ sessionId, darkMode }: Props) {
  // Business profile — persisted in localStorage
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [editingProfile, setEditingProfile] = useState(true)

  // Analysis state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SEOResult | null>(null)
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false)
  const [error, setError] = useState('')
  const [activeSubTab, setActiveSubTab] = useState<'report' | 'keywords' | 'apply'>('report')
  const [changes, setChanges] = useState<Change[]>([])
  const [metrics, setMetrics] = useState<{ seoScore: number; pageSpeed: number; backlinks: number; keywordsRanked: number } | null>(null)
  const [animating, setAnimating] = useState(false)

  const applyRef = useRef<HTMLDivElement>(null)

  // Load saved profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { businessName: string; businessType: string; location: string; websiteUrl?: string }
        setBusinessName(parsed.businessName || '')
        setBusinessType(parsed.businessType || '')
        setLocation(parsed.location || '')
        setWebsiteUrl(parsed.websiteUrl || '')
        if (parsed.businessName && parsed.businessType && parsed.location) {
          setEditingProfile(false)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save profile to localStorage whenever fields change
  const saveProfile = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ businessName, businessType, location, websiteUrl }))
    } catch {
      // ignore
    }
    setEditingProfile(false)
  }

  const allFieldsFilled = businessName.trim() !== '' && businessType.trim() !== '' && location.trim() !== ''

  const handleRunAnalysis = async () => {
    if (!allFieldsFilled) return
    saveProfile()
    setLoading(true)
    setError('')
    setResult(null)
    setMetrics(null)
    setAnimating(false)

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
      setHasRunAnalysis(true)
      setActiveSubTab('report')

      // Derive metrics from result
      const lowCount = r.keywords.filter((k) => k.difficulty === 'Low').length
      const seoScore = Math.min(95, 52 + lowCount * 6 + r.rankings.length * 2)
      const pageSpeed = Math.round(1600 + Math.random() * 1400)
      const backlinks = 12 + r.rankings.length * 4 + Math.floor(Math.random() * 20)
      setMetrics({ seoScore, pageSpeed, backlinks, keywordsRanked: r.rankings.length })

      const built: Change[] = [
        ...r.pageTitles.map((t, i): Change => ({ id: `title-${i}`, type: 'title', label: `Update page title ${i + 1}`, value: t, applied: false })),
        ...r.metaDescriptions.map((m, i): Change => ({ id: `meta-${i}`, type: 'meta', label: `Update meta description for page ${i + 1}`, value: m, applied: false })),
        ...r.keywords.slice(0, 3).map((k, i): Change => ({ id: `kw-${i}`, type: 'keyword', label: `Add keyword to page content`, value: k.term, applied: false })),
      ]
      setChanges(built)

      // Trigger count-up animation
      setAnimating(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const applyChange = (id: string) => {
    setChanges((prev) => prev.map((c) => c.id === id ? { ...c, applied: true } : c))
  }

  const goToApplyTab = () => {
    setActiveSubTab('apply')
    setTimeout(() => applyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const maxVol = result ? Math.max(...result.keywords.map((k) => k.monthlyVolume)) : 1

  const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

  const subTabs = [
    { id: 'report' as const, label: 'Your SEO Report' },
    { id: 'keywords' as const, label: 'Keyword Tracker' },
    ...(hasRunAnalysis ? [{ id: 'apply' as const, label: 'Apply Changes' }] : []),
  ]

  return (
    <div className="space-y-8">
      {/* How SEO works info box */}
      <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#00aa55' }}>How This Works</p>
        <p className="text-sm text-teal leading-relaxed">
          Search engine optimization determines how visible your business is when potential customers are actively looking for what you offer. A strong SEO presence means your business appears at the top of Google results for the searches that matter most to you, putting you in front of customers at the exact moment they are ready to buy. Enter your business details and run an analysis to see your current visibility score, what is holding you back and exactly what we will fix.
        </p>
      </div>

      {/* Business profile card */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Your Business Profile</p>
            <h2 className="font-heading text-2xl text-primary">Business Details</h2>
            <p className="font-mono text-xs text-muted mt-1">Saved to this browser. Your info carries across every analysis.</p>
          </div>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:border-[#b0b0b0] hover:text-primary transition-all shrink-0"
            >
              Edit
            </button>
          )}
        </div>
        <div className="p-6">
          {!editingProfile ? (
            <div className="space-y-4">
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
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">Website URL</div>
                <div className="font-mono text-sm text-primary">{websiteUrl || <span className="text-muted">Not set</span>}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Riverside Dental" className={inputClass} />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Type of Business</label>
                  <input type="text" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Dental Practice" className={inputClass} />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">City and State</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Portland, OR" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Website URL</label>
                <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourbusiness.com" className={inputClass} />
              </div>
              {allFieldsFilled && (
                <button
                  onClick={saveProfile}
                  className="font-mono text-xs px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                >
                  Save Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Analytics overview cards — always visible, empty state until analysis runs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="SEO Score"
          value={animating && metrics ? `${metrics.seoScore}/100` : '--'}
          sub={animating && metrics ? (metrics.seoScore >= 70 ? 'Good' : 'Needs improvement') : 'Run analysis'}
          accent={!!(animating && metrics && metrics.seoScore >= 70)}
        />
        <MetricCard
          label="Page Speed"
          value={animating && metrics ? `${metrics.pageSpeed}ms` : '--'}
          sub={animating && metrics ? (metrics.pageSpeed < 2500 ? 'Fast' : 'Could be faster') : 'Run analysis'}
        />
        <MetricCard
          label="Backlinks"
          value={animating && metrics ? `${metrics.backlinks}` : '--'}
          sub={animating && metrics ? 'Referring domains' : 'Run analysis'}
        />
        <MetricCard
          label="Keywords Ranked"
          value={animating && metrics ? `${metrics.keywordsRanked}` : '--'}
          sub={animating && metrics ? 'In top 50 results' : 'Run analysis'}
        />
      </div>

      {/* Run SEO Analysis button */}
      <button
        onClick={handleRunAnalysis}
        disabled={!allFieldsFilled || loading}
        className="w-full font-mono text-sm py-5 rounded tracking-wider transition-opacity disabled:opacity-40 font-medium text-base"
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

      {/* Results — only shown after analysis */}
      {result && (
        <div className="space-y-6" ref={applyRef}>
          {/* Sub-tab switcher — Apply Changes always last, only appears after first run */}
          <div className="flex gap-2 border-b border-border pb-0">
            {subTabs.map(({ id, label }) => (
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

          {/* ── Report tab ── */}
          {activeSubTab === 'report' && (
            <div className="space-y-6">
              {/* Top search terms */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Top Search Terms For Your Business</p>
                  <h3 className="font-heading text-xl text-primary">High Value Keywords</h3>
                  <p className="font-mono text-xs text-muted mt-1">Each of these is a real phrase people type into Google. Showing up for them means more customers finding you.</p>
                </div>
                <div className="divide-y divide-border">
                  {result.keywords.map((kw, i) => (
                    <div key={i} className="px-6 py-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="font-heading text-base text-primary mb-1">&ldquo;{kw.term}&rdquo;</div>
                          <p className="font-mono text-xs text-teal">Update your website to include this phrase and you show up when people search for it.</p>
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
                          {kw.difficulty === 'Low' ? 'Easy to rank' : kw.difficulty === 'Medium' ? 'Moderate competition' : 'High competition'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested page titles and descriptions */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>How You Appear in Search Results</p>
                  <h3 className="font-heading text-xl text-primary">Suggested Page Titles and Descriptions</h3>
                </div>
                <div className="p-6 space-y-4">
                  {result.pageTitles.map((title, i) => (
                    <div key={i} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4">
                      <div className="text-[#00ff88] text-sm font-medium mb-1">{title}</div>
                      <div className="font-mono text-xs text-muted mb-1">{businessName} &middot; {location}</div>
                      {result.metaDescriptions[i] && (
                        <div className="font-mono text-xs text-teal leading-relaxed">{result.metaDescriptions[i]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Local search terms */}
              <div className="bg-card border border-border rounded p-6">
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Local Searches to Target</p>
                <h3 className="font-heading text-xl text-primary mb-2">Searches Happening Near You</h3>
                <p className="font-mono text-xs text-teal leading-relaxed mb-4">These are searches people in your area are doing right now. Showing up for these means more local customers finding you instead of your competitors.</p>
                <div className="flex flex-wrap gap-2">
                  {result.localTerms.map((term, i) => (
                    <span key={i} className="font-mono text-xs bg-[#efefef] border border-[#d0d0d0] text-primary px-3 py-1.5 rounded">
                      {term}
                    </span>
                  ))}
                </div>
              </div>

              {/* Current rankings */}
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Your Current Google Rankings</p>
                  <h3 className="font-heading text-xl text-primary">Where You Stand Right Now</h3>
                  <p className="font-mono text-xs text-muted mt-1">Position 1 means you are the first result. Lower numbers are better.</p>
                </div>
                <div className="divide-y divide-border">
                  {result.rankings.map((r, i) => (
                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-10 rounded bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-sm text-primary shrink-0">
                        #{r.position}
                      </div>
                      <span className="font-mono text-sm text-primary flex-1">&ldquo;{r.term}&rdquo;</span>
                      <div className={`font-mono text-sm shrink-0 ${r.change > 0 ? 'text-[#4ade80]' : r.change < 0 ? 'text-[#f87171]' : 'text-dim'}`}>
                        {r.change > 0 ? `up ${r.change}` : r.change < 0 ? `down ${Math.abs(r.change)}` : 'no change'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Changes CTA */}
              <button
                onClick={goToApplyTab}
                className="w-full font-mono text-sm py-4 rounded tracking-wider transition-opacity font-medium hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Apply Changes to My Website
              </button>
            </div>
          )}

          {/* ── Keyword tracker tab ── */}
          {activeSubTab === 'keywords' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Keyword Tracker</p>
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
                          <td className="px-5 py-4 font-mono text-sm text-primary">&ldquo;{r.term}&rdquo;</td>
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
                <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#00aa55' }}>About These Rankings</p>
                <p className="text-sm text-teal leading-relaxed">These rankings reflect estimated positions based on your current website content and the competitive landscape in your area. Applying the recommended changes improves these numbers over time.</p>
              </div>

              <button
                onClick={goToApplyTab}
                className="w-full font-mono text-sm py-4 rounded tracking-wider transition-opacity font-medium hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Apply Changes to My Website
              </button>
            </div>
          )}

          {/* ── Apply Changes tab — always last ── */}
          {activeSubTab === 'apply' && (
            <div className="space-y-6">
              <div className="bg-[#efefef] border border-[#d0d0d0] rounded p-5">
                <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: '#00aa55' }}>Recommended Updates</p>
                <p className="text-sm text-teal leading-relaxed">
                  Each change below includes a preview of how it will look once applied. Review the preview, then click Apply to update your website.
                </p>
              </div>

              <div className="space-y-6">
                {changes.map((change) => {
                  const pageIndex = parseInt(change.id.split('-')[1] ?? '0')
                  const title = result.pageTitles[pageIndex] ?? result.pageTitles[0]
                  const meta = result.metaDescriptions[pageIndex] ?? result.metaDescriptions[0]
                  const siteUrl = websiteUrl
                    ? websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
                    : `${businessName.toLowerCase().replace(/\s+/g, '')}.com`

                  return (
                    <div key={change.id} className="bg-card border border-border rounded overflow-hidden">
                      <div className="px-6 py-4 border-b border-border">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="font-mono text-xs text-muted uppercase tracking-widest mb-1">
                              {change.type === 'title' ? 'Page Title Update' : change.type === 'meta' ? 'Meta Description Update' : 'Keyword Addition'}
                            </div>
                            <div className="font-mono text-sm text-primary">{change.label}</div>
                          </div>
                          {change.applied ? (
                            <span className="font-mono text-xs text-[#16a34a] border border-[#4ade80]/50 px-3 py-1.5 rounded shrink-0">
                              Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => applyChange(change.id)}
                              className="font-mono text-xs px-4 py-1.5 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0"
                              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* What will change */}
                        <div>
                          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">The Change</div>
                          <div className="bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-3 font-mono text-sm text-primary">
                            {change.value}
                          </div>
                        </div>

                        {/* Preview mockup */}
                        {/* TODO: Replace mock preview with live iframe or screenshot of client website
                            showing the specific change applied to their actual site. This ensures
                            each change card reflects the real before/after state when the live
                            website build pipeline is implemented. */}
                        <div>
                          <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Preview</div>
                          {change.type === 'title' && (
                            <TitleMockup
                              title={change.value}
                              url={`${siteUrl} › home`}
                              description={meta}
                            />
                          )}
                          {change.type === 'meta' && (
                            <MetaMockup
                              title={title}
                              url={`${siteUrl} › home`}
                              description={change.value}
                            />
                          )}
                          {change.type === 'keyword' && (
                            <KeywordMockup
                              keyword={change.value}
                              businessName={businessName}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {changes.every((c) => c.applied) && (
                <div className="bg-[#efefef] border border-[#4ade80]/50 rounded p-6 text-center">
                  <div className="font-heading text-2xl text-primary mb-2">All Changes Applied</div>
                  <p className="font-mono text-sm text-teal">
                    {changes.length} update{changes.length !== 1 ? 's' : ''} have been applied to your website.
                  </p>
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
