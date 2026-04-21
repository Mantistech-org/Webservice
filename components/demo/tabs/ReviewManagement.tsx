'use client'

import { useState } from 'react'

interface Props { sessionId: string; darkMode?: boolean }
interface ReviewResult { response: string }

const MOCK_REVIEWS = {
  google:   [] as Array<{ author: string; stars: number; date: string; text: string; responded: boolean }>,
  yelp:     [] as Array<{ author: string; stars: number; date: string; text: string; responded: boolean }>,
  facebook: [] as Array<{ author: string; stars: number; date: string; text: string; responded: boolean }>,
}

const FLAGGED_REVIEWS: Array<{ author: string; text: string; flag: string }> = []

function Stars({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < n ? '#facc15' : 'none'} stroke={i < n ? '#facc15' : '#d0d0d0'} strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  )
}

export default function ReviewManagement({ sessionId, darkMode }: Props) {
  const [mainTab, setMainTab] = useState<'reviews' | 'response' | 'requests'>('reviews')
  const [platform, setPlatform] = useState<'google' | 'yelp' | 'facebook'>('google')

  // Response generator state
  const [businessName, setBusinessName] = useState('')
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/demo/review-management', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, review }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as ReviewResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

  const currentReviews = MOCK_REVIEWS[platform]
  const unanswered = currentReviews.filter((r) => !r.responded)
  const answered = currentReviews.filter((r) => r.responded)

  return (
    <div className="space-y-8">
      {/* Main tab switcher */}
      <div className="flex gap-2 border-b border-border pb-0">
        {([['reviews', 'Reviews'], ['response', 'Negative Review Response'], ['requests', 'Review Requests']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMainTab(id)}
            className={`font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all ${
              mainTab === id ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'reviews' && (
        <div className="space-y-8">
          {/* Analytics bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Reviews', value: '0', sub: 'across all platforms' },
              { label: 'Average Rating', value: '0', sub: 'out of 5.0' },
              { label: 'Reviews This Month', value: '0', sub: 'new reviews' },
              { label: 'Response Rate', value: '0%', sub: 'of reviews answered' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded p-4">
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{stat.label}</div>
                <div className="font-heading text-3xl text-primary mb-1">{stat.value}</div>
                <div className="font-mono text-xs text-dim">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Fake Review Protection */}
          <div className="bg-[#00ff88]/5 border border-[#00ff88]/40 rounded">
            <div className="px-6 py-4 border-b border-[#00ff88]/30">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Protection System</p>
              <h2 className="font-heading text-2xl text-primary">Fake Review Protection</h2>
              <p className="font-mono text-xs text-teal mt-1">
                The system automatically detects suspicious reviews and reports them to Google before they can hurt your business. Below are reviews flagged in the last 30 days.
              </p>
            </div>
            <div className="divide-y divide-[#00ff88]/20">
              {FLAGGED_REVIEWS.map((fr, i) => (
                <div key={i} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-xs text-muted shrink-0">
                      {fr.author[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-sm text-primary mb-0.5">{fr.author}</div>
                      <p className="font-mono text-xs text-dim mb-1 truncate">"{fr.text}"</p>
                      <span className="font-mono text-xs" style={{ color: '#00aa55' }}>{fr.flag}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs px-2.5 py-1 rounded border border-[#4ade80]/50 text-[#16a34a] whitespace-nowrap">
                    Reported to Google
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform switcher */}
          <div>
            <div className="flex gap-2 mb-6">
              {(['google', 'yelp', 'facebook'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`font-mono text-xs px-4 py-2 rounded border tracking-wider transition-all capitalize ${
                    platform === p ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-[#d0d0d0] text-muted hover:border-[#b0b0b0] hover:text-primary'
                  }`}
                >
                  {p === 'google' ? 'Google' : p === 'yelp' ? 'Yelp' : 'Facebook'}
                </button>
              ))}
            </div>

            {/* Empty state */}
            {unanswered.length === 0 && answered.length === 0 && (
              <div className="bg-card border border-border rounded p-6 text-center">
                <p className="font-mono text-sm text-muted">No reviews yet. Reviews will appear here once your platform is connected.</p>
              </div>
            )}

            {/* Unanswered reviews */}
            {unanswered.length > 0 && (
              <div className="mb-6">
                <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Unanswered Reviews</p>
                <div className="space-y-3">
                  {unanswered.map((r, i) => (
                    <div key={i} className="bg-card border border-border rounded p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-xs text-muted">
                              {r.author[0]}
                            </div>
                            <div>
                              <div className="font-mono text-sm text-primary">{r.author}</div>
                              <Stars n={r.stars} />
                            </div>
                            <span className="font-mono text-xs text-dim ml-auto">{r.date}</span>
                          </div>
                          <p className="text-sm text-teal leading-relaxed">{r.text}</p>
                        </div>
                        <button className="shrink-0 font-mono text-xs px-3 py-1.5 rounded border border-[#d0d0d0] text-muted hover:border-[#b0b0b0] hover:text-primary transition-all">
                          Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Answered reviews */}
            {answered.length > 0 && (
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Answered Reviews</p>
                <div className="space-y-3">
                  {answered.map((r, i) => (
                    <div key={i} className="bg-card border border-border rounded p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-xs text-muted">
                              {r.author[0]}
                            </div>
                            <div>
                              <div className="font-mono text-sm text-primary">{r.author}</div>
                              <Stars n={r.stars} />
                            </div>
                            <span className="font-mono text-xs text-dim ml-auto">{r.date}</span>
                          </div>
                          <p className="text-sm text-teal leading-relaxed">{r.text}</p>
                        </div>
                        <span className="shrink-0 font-mono text-xs px-2.5 py-1 rounded border border-[#4ade80]/50 text-[#16a34a]">
                          Responded
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === 'response' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Response Generator</p>
              <h2 className="font-heading text-2xl text-primary">Generate a Review Response</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your Business Name" required className={inputClass} />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Paste the Negative Review</label>
                  <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="The service was slow and the staff were not helpful. I waited 30 minutes and never got assistance..." required rows={4} className={`${inputClass} resize-none`} />
                </div>
                <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                  {loading ? 'Generating response...' : 'Generate Professional Response'}
                </button>
              </form>

              {loading && (
                <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
                  <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
                  Crafting a professional response...
                </div>
              )}
              {error && <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}

              {result && (
                <div className="mt-6 bg-[#efefef] border border-[#d0d0d0] rounded p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#00aa55' }}>Generated Response</span>
                    <button onClick={copy} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
                  </div>
                  <p className="text-sm text-primary leading-relaxed">{result.response}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mainTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Auto-Request Settings */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00aa55', fontWeight: 600, marginBottom: 6 }}>Auto-Request System</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Automatic Review Requests</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Trigger row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>Sends automatically when a job is marked complete in Bookings</span>
              </div>
              {/* Toggle */}
              <div style={{ display: 'flex', gap: 8 }}>
                {['Active', 'Paused'].map((label, i) => (
                  <div
                    key={label}
                    style={{
                      padding: '6px 18px', borderRadius: 999, fontSize: 13, fontWeight: i === 0 ? 600 : 400,
                      backgroundColor: i === 0 ? '#00C27C' : 'transparent',
                      color: i === 0 ? '#ffffff' : '#6b7280',
                      border: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.12)',
                      cursor: 'default',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { value: '0 Requests Sent', label: 'This Month' },
                  { value: '0%',             label: 'Conversion Rate' },
                ].map((pill) => (
                  <div
                    key={pill.label}
                    style={{
                      backgroundColor: 'rgba(0,194,124,0.08)',
                      border: '1px solid rgba(0,194,124,0.3)',
                      borderRadius: 8, padding: '10px 16px',
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#00C27C', lineHeight: 1.2 }}>{pill.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{pill.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00aa55', fontWeight: 600, marginBottom: 6 }}>Request Message</p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>SMS Review Request</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{
                backgroundColor: '#00C27C', color: '#ffffff',
                fontSize: 14, lineHeight: 1.6,
                padding: '10px 14px', borderRadius: 12,
                maxWidth: '85%',
              }}>
                Hi [Customer Name], thank you for choosing [Business Name] today. We hope your service went smoothly. If you have a moment, we would really appreciate a Google review. It helps families in the area find reliable HVAC service: g.page/r/[business-link]/review
              </div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Sends within 2 hours of job completion</span>
            </div>
          </div>

          {/* Recent Requests */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00aa55', fontWeight: 600, margin: 0 }}>Recent Requests</p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {['Customer', 'Job Type', 'Sent', 'Status'].map((h) => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} style={{ padding: '20px', fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
                    No requests sent yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your Google, Yelp, and Facebook accounts for automated monitoring and response posting.
      </p>
    </div>
  )
}
