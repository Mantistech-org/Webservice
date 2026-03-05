'use client'

import { useState } from 'react'

interface Props { sessionId: string }
interface ReviewResult { response: string }

const MOCK_REVIEWS = {
  google: [
    { author: 'Sarah M.', stars: 5, date: 'Feb 28', text: 'Absolutely love this place. Best experience I have had in years. Will be back!', responded: true },
    { author: 'James T.', stars: 2, date: 'Feb 24', text: 'Wait time was too long and the staff seemed disinterested. Expected better.', responded: false },
    { author: 'Rachel K.', stars: 4, date: 'Feb 20', text: 'Really solid overall. A couple minor things could be improved but highly recommend.', responded: true },
    { author: 'David L.', stars: 5, date: 'Feb 15', text: 'Outstanding service from start to finish. They went above and beyond.', responded: true },
  ],
  yelp: [
    { author: 'Mike R.', stars: 4, date: 'Mar 1', text: 'Great spot, friendly staff. Parking is a bit tricky but worth the hassle.', responded: true },
    { author: 'Priya S.', stars: 1, date: 'Feb 26', text: 'Had a really disappointing visit. I hope management sees this and takes it seriously.', responded: false },
    { author: 'Tom W.', stars: 5, date: 'Feb 18', text: 'One of my favorites in the area. Consistent quality every time.', responded: true },
  ],
  facebook: [
    { author: 'Lisa H.', stars: 5, date: 'Mar 2', text: 'Telling all my friends. This is the place to go! Amazing from start to finish.', responded: true },
    { author: 'Carlos V.', stars: 3, date: 'Feb 27', text: 'Decent but not quite what I expected based on the reviews. Maybe just an off day.', responded: false },
    { author: 'Amy F.', stars: 4, date: 'Feb 22', text: 'Good experience overall. Staff were helpful and knowledgeable.', responded: true },
  ],
}

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

export default function ReviewManagement({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [platform, setPlatform] = useState<'google' | 'yelp' | 'facebook'>('google')

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

  const copy = () => { if (!result) return; navigator.clipboard.writeText(result.response); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Response Generator</p>
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
              <span className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
              Crafting a professional response...
            </div>
          )}
          {error && <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}

          {result && (
            <div className="mt-6 bg-[#efefef] border border-[#d0d0d0] rounded p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs tracking-widest uppercase" style={{ color: '#3a6a8a' }}>Generated Response</span>
                <button onClick={copy} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
              </div>
              <p className="text-sm text-primary leading-relaxed">{result.response}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard */}
      <div>
        <div className="mb-4">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Review Dashboard</p>
          <h2 className="font-heading text-2xl text-primary">Platform Overview</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Average Rating', value: '4.2', sub: 'across all platforms' },
            { label: 'Reviews This Month', value: '47', sub: '+12 from last month' },
            { label: 'Flagged and Filtered', value: '8', sub: 'potential spam removed' },
            { label: 'Responses Posted', value: '39', sub: '83% response rate' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded p-4">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{stat.label}</div>
              <div className="font-heading text-3xl text-primary mb-1">{stat.value}</div>
              <div className="font-mono text-xs text-dim">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
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

        <div className="space-y-3">
          {MOCK_REVIEWS[platform].map((r, i) => (
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
                <span className={`shrink-0 font-mono text-xs px-2 py-1 rounded border ${r.responded ? 'border-[#4ade80]/50 text-[#16a34a]' : 'border-[#d0d0d0] text-dim'}`}>
                  {r.responded ? 'Responded' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your Google, Yelp, and Facebook accounts for automated monitoring and response posting.
      </p>
    </div>
  )
}
