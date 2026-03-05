'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string }

interface SocialResult {
  instagram: { caption: string; hashtags: string[] }
  facebook: { post: string }
  google_business: { post: string }
  twitter: { tweet: string }
  linkedin: { post: string }
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
  facebook: '#1877f2',
  google_business: '#f8f8f8',
  twitter: '#000000',
  linkedin: '#0077b5',
}

const PLATFORM_TEXT: Record<PlatformKey, string> = {
  instagram: '#ffffff',
  facebook: '#ffffff',
  google_business: '#202020',
  twitter: '#ffffff',
  linkedin: '#ffffff',
}

function SchedulePicker() {
  const [time, setTime] = useState('10:00')
  const [day, setDay] = useState('Tomorrow')
  const [scheduled, setScheduled] = useState(false)
  if (scheduled) {
    return (
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2d4052]">
        <span className="font-mono text-xs" style={{ color: '#8ab4cc' }}>Scheduled: {day} at {time}</span>
        <button onClick={() => setScheduled(false)} className="font-mono text-xs text-muted hover:text-primary transition-colors">Cancel</button>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[#2d4052]">
      <select value={day} onChange={(e) => setDay(e.target.value)} className="font-mono text-xs bg-[#162334] border border-[#2d4052] text-[#f0f0f0] rounded px-2 py-1.5 focus:outline-none">
        <option>Today</option><option>Tomorrow</option><option>In 2 days</option><option>Next week</option>
      </select>
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="font-mono text-xs bg-[#162334] border border-[#2d4052] text-[#f0f0f0] rounded px-2 py-1.5 focus:outline-none" />
      <button onClick={() => setScheduled(true)} className="font-mono text-xs border border-[#2d4052] text-muted px-3 py-1.5 rounded hover:border-[#4a6070] hover:text-[#f0f0f0] transition-all">
        Schedule Post
      </button>
    </div>
  )
}

export default function SocialMedia({ sessionId }: Props) {
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SocialResult | null>(null)
  const [editedPosts, setEditedPosts] = useState<Partial<Record<PlatformKey, string>>>({})
  const [error, setError] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set(['instagram', 'facebook', 'google_business', 'twitter', 'linkedin'])
  )
  const [postedAll, setPostedAll] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setHasPhoto(true)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setEditedPosts({})
    setPostedAll(false)
    try {
      const res = await fetch('/api/demo/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessDescription: description, topic, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      if (!data.result) throw new Error('No result returned')
      const r = data.result as SocialResult
      // Pre-populate editable state
      setEditedPosts({
        instagram: r.instagram.caption + '\n\n' + r.instagram.hashtags.map((h) => `#${h}`).join(' '),
        facebook: r.facebook.post,
        google_business: r.google_business.post,
        twitter: r.twitter.tweet,
        linkedin: r.linkedin.post,
      })
      setResult(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const togglePlatform = (p: PlatformKey) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev)
      if (next.has(p)) { next.delete(p) } else { next.add(p) }
      return next
    })
  }

  const postAll = () => {
    setPostedAll(true)
    setTimeout(() => setPostedAll(false), 3000)
  }

  const platforms: PlatformKey[] = ['instagram', 'facebook', 'google_business', 'twitter', 'linkedin']

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Post Generator</p>
          <h2 className="font-heading text-2xl text-primary">Create Social Media Posts</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="We are a family-owned Italian restaurant in downtown Austin. Known for handmade pasta, wood-fired pizza, and a warm neighborhood atmosphere..."
                required
                rows={3}
                className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors resize-none"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">What Should This Post Be About?</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Our new weekend brunch menu launching next Saturday. We want to build excitement and drive reservations..."
                rows={2}
                className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors resize-none"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Photo (Optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-[#2d4052] rounded p-6 text-center cursor-pointer hover:border-[#4a6070] transition-colors"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Upload preview" className="max-h-32 mx-auto rounded object-cover" />
                  : <p className="font-mono text-sm text-muted">Click to upload a photo</p>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            {/* Platform selection */}
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-3">Post To</label>
              <div className="flex flex-wrap gap-3">
                {platforms.map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.has(p)}
                      onChange={() => togglePlatform(p)}
                      className="w-4 h-4 rounded border-[#2d4052] accent-black"
                    />
                    <span className="font-mono text-xs text-primary">{PLATFORM_LABELS[p]}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || selectedPlatforms.size === 0}
              className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              {loading ? 'Generating posts...' : 'Generate Platform Posts'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-[#f0f0f0] border-t-transparent rounded-full animate-spin" />
              Writing platform-specific posts...
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Post to All + confirmation */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Posts Ready</p>
              <h3 className="font-heading text-xl text-primary">Edit and Post</h3>
            </div>
            <div className="flex items-center gap-3">
              {postedAll && (
                <span className="font-mono text-xs text-muted">
                  Posted to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''}
                </span>
              )}
              <button
                onClick={postAll}
                className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                {postedAll ? 'Posted' : 'Post to All Selected'}
              </button>
            </div>
          </div>

          {/* Platform cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {platforms.filter((p) => selectedPlatforms.has(p)).map((p) => (
              <div key={p} className="bg-card border border-border rounded overflow-hidden flex flex-col">
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{
                    background: PLATFORM_COLORS[p],
                    color: PLATFORM_TEXT[p],
                  }}
                >
                  <span className="font-mono text-xs tracking-wider font-semibold">{PLATFORM_LABELS[p]}</span>
                  <span className="font-mono text-xs opacity-70">{p === 'instagram' ? '1080x1080' : p === 'facebook' ? '1200x630' : p === 'twitter' ? '1600x900' : p === 'linkedin' ? '1200x627' : '1200x900'}</span>
                </div>

                {photoPreview && (
                  <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} overflow-hidden`}>
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {!photoPreview && (
                  <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} bg-[#0e2030] flex items-center justify-center`}>
                    <span className="font-mono text-xs text-dim">{p === 'instagram' ? '1080 x 1080' : '1200 x 630'}</span>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <textarea
                    value={editedPosts[p] ?? ''}
                    onChange={(e) => setEditedPosts((prev) => ({ ...prev, [p]: e.target.value }))}
                    rows={5}
                    className="flex-1 w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#5a7a9a] transition-colors resize-none"
                  />
                  <SchedulePicker />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your social media accounts and posts on schedule automatically.
      </p>
    </div>
  )
}
