'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

interface SocialResult {
  instagram: { variations: Array<{ caption: string; hashtags: string[] }> }
  facebook: { variations: Array<{ post: string }> }
  google_business: { variations: Array<{ post: string }> }
  twitter: { variations: Array<{ tweet: string }> }
  linkedin: { variations: Array<{ post: string }> }
}

type PlatformKey = 'instagram' | 'facebook' | 'google_business' | 'twitter' | 'linkedin'

const PLATFORM_LABELS: Record<PlatformKey, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  google_business: 'Google Business',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
}

const PLATFORM_COLORS: Record<PlatformKey, string> = {
  instagram: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
  facebook: '#1a1a1a',
  google_business: '#f8f8f8',
  twitter: '#000000',
  linkedin: '#1a1a1a',
}

const PLATFORM_TEXT: Record<PlatformKey, string> = {
  instagram: '#ffffff',
  facebook: '#ffffff',
  google_business: '#202020',
  twitter: '#ffffff',
  linkedin: '#ffffff',
}

const CHAR_LIMITS: Record<PlatformKey, { limit: number; warnAt?: number }> = {
  instagram: { limit: 2200, warnAt: 150 },
  facebook: { limit: 2000, warnAt: 280 },
  google_business: { limit: 1500 },
  twitter: { limit: 280 },
  linkedin: { limit: 3000, warnAt: 700 },
}

const POST_GOALS = [
  'Drive Website Traffic',
  'Promote a Sale or Offer',
  'Announce Something New',
  'Build Brand Awareness',
  'Get People to Call or Book',
]

const ALL_PLATFORMS: PlatformKey[] = ['instagram', 'facebook', 'google_business', 'twitter', 'linkedin']

function CharCount({ len, limit, warnAt }: { len: number; limit: number; warnAt?: number }) {
  const cls = len > limit ? 'text-red-500' : (warnAt && len > warnAt) ? 'text-amber-500' : 'text-[#aaaaaa]'
  return <span className={`font-mono text-xs ${cls}`}>{len}/{limit}</span>
}

function VarTabs({ count, active, onChange, dark }: { count: number; active: number; onChange: (i: number) => void; dark?: boolean }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`font-mono text-xs w-6 h-6 rounded transition-colors ${
            dark
              ? active === i ? 'bg-white/30 text-white' : 'bg-black/15 text-white/70 hover:bg-black/25'
              : active === i ? 'bg-[#1a1a1a] text-white' : 'bg-[#e0e0e0] text-[#666] hover:bg-[#d0d0d0]'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

function SchedulePicker() {
  const [time, setTime] = useState('10:00')
  const [day, setDay] = useState('Tomorrow')
  const [scheduled, setScheduled] = useState(false)
  if (scheduled) {
    return (
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#d0d0d0]">
        <span className="font-mono text-xs" style={{ color: '#00aa55' }}>Scheduled: {day} at {time}</span>
        <button onClick={() => setScheduled(false)} className="font-mono text-xs text-muted hover:text-primary transition-colors">Cancel</button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[#d0d0d0]">
      <select value={day} onChange={e => setDay(e.target.value)} className="font-mono text-xs bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1.5 focus:outline-none">
        <option>Today</option><option>Tomorrow</option><option>In 2 days</option><option>Next week</option>
      </select>
      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="font-mono text-xs bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1.5 focus:outline-none" />
      <button onClick={() => setScheduled(true)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-3 py-1.5 rounded hover:border-[#b0b0b0] hover:text-primary transition-all">
        Schedule Post
      </button>
    </div>
  )
}

export default function SocialMedia({ sessionId, darkMode }: Props) {
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [postGoal, setPostGoal] = useState(POST_GOALS[0])
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SocialResult | null>(null)
  const [editedPosts, setEditedPosts] = useState<Record<PlatformKey, string[]>>({
    instagram: [], facebook: [], google_business: [], twitter: [], linkedin: [],
  })
  const [selectedVar, setSelectedVar] = useState<Record<PlatformKey, number>>({
    instagram: 0, facebook: 0, google_business: 0, twitter: 0, linkedin: 0,
  })
  const [error, setError] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set(['instagram', 'facebook', 'google_business', 'twitter', 'linkedin'])
  )
  const [postedAll, setPostedAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setHasPhoto(true)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null); setPostedAll(false)
    try {
      const res = await fetch('/api/demo/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessDescription: description, topic, postGoal, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      if (!data.result) throw new Error('No result returned')
      const r = data.result as SocialResult
      setEditedPosts({
        instagram: r.instagram.variations.map(v => v.caption + (v.hashtags.length ? '\n\n' + v.hashtags.map(h => `#${h}`).join(' ') : '')),
        facebook: r.facebook.variations.map(v => v.post),
        google_business: r.google_business.variations.map(v => v.post),
        twitter: r.twitter.variations.map(v => v.tweet),
        linkedin: r.linkedin.variations.map(v => v.post),
      })
      setSelectedVar({ instagram: 0, facebook: 0, google_business: 0, twitter: 0, linkedin: 0 })
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const togglePlatform = (p: PlatformKey) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const setPost = (p: PlatformKey, vi: number, val: string) =>
    setEditedPosts(prev => ({ ...prev, [p]: prev[p].map((x, i) => i === vi ? val : x) }))

  const postAll = () => { setPostedAll(true); setTimeout(() => setPostedAll(false), 3000) }

  const activePlatforms = ALL_PLATFORMS.filter(p => selectedPlatforms.has(p))

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Post Generator</p>
          <h2 className="font-heading text-2xl text-primary">Create Social Media Posts</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="We are a family-owned Italian restaurant in downtown Austin. Known for handmade pasta, wood-fired pizza, and a warm neighborhood atmosphere..." required rows={3} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none" />
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">What Should This Post Be About?</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Our new weekend brunch menu launching next Saturday. We want to build excitement and drive reservations..." rows={2} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Post Goal</label>
                <select value={postGoal} onChange={e => setPostGoal(e.target.value)} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors">
                  {POST_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Photo (Optional)</label>
              <div onClick={() => fileRef.current?.click()} className="border border-dashed border-[#d0d0d0] rounded p-6 text-center cursor-pointer hover:border-[#b0b0b0] transition-colors">
                {photoPreview
                  ? <img src={photoPreview} alt="Upload preview" className="max-h-32 mx-auto rounded object-cover" />
                  : <p className="font-mono text-sm text-muted">Click to upload a photo</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-3">Post To</label>
              <div className="flex flex-wrap gap-3">
                {ALL_PLATFORMS.map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPlatforms.has(p)} onChange={() => togglePlatform(p)} className="w-4 h-4 rounded border-[#d0d0d0] accent-black" />
                    <span className="font-mono text-xs text-primary">{PLATFORM_LABELS[p]}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || selectedPlatforms.size === 0} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Generating posts...' : 'Generate Platform Posts'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
              Writing platform-specific posts...
            </div>
          )}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded p-4 font-mono text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Posts Ready</p>
              <h3 className="font-heading text-xl text-primary">Edit and Post</h3>
            </div>
            <div className="flex items-center gap-3">
              {postedAll && (
                <span className="font-mono text-xs text-muted">
                  Posted to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''}
                </span>
              )}
              <button onClick={postAll} className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                {postedAll ? 'Posted' : 'Post to All Selected'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {activePlatforms.map(p => {
              const cfg = CHAR_LIMITS[p]
              const vi = selectedVar[p]
              const text = editedPosts[p][vi] ?? ''
              const isGoogle = p === 'google_business'
              const isDark = !isGoogle
              const headerStyle = isGoogle
                ? { background: PLATFORM_COLORS[p], borderBottom: '1px solid #e0e0e0' }
                : { background: PLATFORM_COLORS[p] }

              return (
                <div key={p} className="bg-card border border-border rounded overflow-hidden flex flex-col">
                  <div className="px-4 py-3 flex items-center justify-between" style={headerStyle}>
                    <span className="font-mono text-xs tracking-wider font-semibold" style={{ color: PLATFORM_TEXT[p] }}>
                      {PLATFORM_LABELS[p]}
                    </span>
                    <div className="flex items-center gap-2">
                      <VarTabs count={editedPosts[p].length} active={vi} onChange={i => setSelectedVar(prev => ({ ...prev, [p]: i }))} dark={isDark} />
                      <span className="font-mono text-xs opacity-70" style={{ color: PLATFORM_TEXT[p] }}>
                        {p === 'instagram' ? '1080x1080' : p === 'twitter' ? '1600x900' : p === 'linkedin' ? '1200x627' : p === 'facebook' ? '1200x630' : '1200x900'}
                      </span>
                    </div>
                  </div>

                  {photoPreview ? (
                    <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} overflow-hidden`}>
                      <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} bg-[#efefef] border-b border-[#d0d0d0] flex items-center justify-center`}>
                      <span className="font-mono text-xs text-dim">{p === 'instagram' ? '1080 x 1080' : '1200 x 630'}</span>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between mb-1">
                      <label className="font-mono text-xs text-muted uppercase tracking-widest">Copy</label>
                      <CharCount len={text.length} limit={cfg.limit} warnAt={cfg.warnAt} />
                    </div>
                    {cfg.warnAt && text.length > cfg.warnAt && text.length <= cfg.limit && (
                      <p className="font-mono text-xs text-amber-600 mb-1">
                        {p === 'twitter' ? 'At character limit.' : `Over ${cfg.warnAt} characters. Consider shortening for best engagement.`}
                      </p>
                    )}
                    {text.length > cfg.limit && (
                      <p className="font-mono text-xs text-red-600 mb-1">Exceeds {p === 'twitter' ? '280' : cfg.limit.toString()} character limit.</p>
                    )}
                    <textarea
                      value={text}
                      onChange={e => setPost(p, vi, e.target.value)}
                      rows={5}
                      className={`flex-1 w-full bg-[#efefef] border text-[#1a1a1a] rounded px-3 py-2 font-mono text-xs focus:outline-none transition-colors resize-none ${
                        text.length > cfg.limit ? 'border-red-400' : (cfg.warnAt && text.length > cfg.warnAt) ? 'border-amber-300' : 'border-[#d0d0d0] focus:border-[#888888]'
                      }`}
                    />
                    <SchedulePicker />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your social media accounts and posts on schedule automatically.
      </p>
    </div>
  )
}
