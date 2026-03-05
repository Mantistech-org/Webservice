'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string }

interface SocialResult {
  instagram: { caption: string; hashtags: string[] }
  facebook: { post: string }
  google_business: { post: string }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider">
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function SchedulePicker() {
  const [time, setTime] = useState('10:00')
  const [day, setDay] = useState('Tomorrow')
  const [scheduled, setScheduled] = useState(false)
  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      {scheduled ? (
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-accent">Scheduled for {day} at {time}</span>
          <button onClick={() => setScheduled(false)} className="font-mono text-xs text-dim hover:text-muted transition-colors">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select value={day} onChange={(e) => setDay(e.target.value)} className="font-mono text-xs bg-bg border border-border text-primary rounded px-2 py-1.5 focus:outline-none focus:border-accent">
            <option>Today</option>
            <option>Tomorrow</option>
            <option>In 2 days</option>
            <option>Next week</option>
          </select>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="font-mono text-xs bg-bg border border-border text-primary rounded px-2 py-1.5 focus:outline-none focus:border-accent" />
          <button onClick={() => setScheduled(true)} className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded hover:border-accent hover:text-accent transition-all">
            Schedule Post
          </button>
        </div>
      )}
    </div>
  )
}

export default function SocialMedia({ sessionId }: Props) {
  const [description, setDescription] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SocialResult | null>(null)
  const [error, setError] = useState('')
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
    try {
      const res = await fetch('/api/demo/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessDescription: description, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as SocialResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Post Generator</p>
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
                className="form-input resize-none"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Photo (Optional)</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-border rounded p-6 text-center cursor-pointer hover:border-accent transition-colors"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Upload preview" className="max-h-32 mx-auto rounded object-cover" />
                ) : (
                  <div>
                    <p className="font-mono text-sm text-muted">Click to upload a photo</p>
                    <p className="font-mono text-xs text-dim mt-1">JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Generating posts...' : 'Generate Platform Posts'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Writing platform-specific posts...
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instagram */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full" />
                <span className="font-mono text-xs text-white tracking-wider">Instagram</span>
              </div>
              <CopyButton text={result.instagram.caption + '\n\n' + result.instagram.hashtags.map(h => `#${h}`).join(' ')} />
            </div>
            {photoPreview && (
              <div className="aspect-square bg-border overflow-hidden">
                <img src={photoPreview} alt="Post preview" className="w-full h-full object-cover" />
              </div>
            )}
            {!photoPreview && (
              <div className="aspect-square bg-bg flex items-center justify-center">
                <span className="font-mono text-xs text-dim">1080 x 1080</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex gap-3 mb-3">
                <span className="font-mono text-xs text-muted">Like</span>
                <span className="font-mono text-xs text-muted">Comment</span>
                <span className="font-mono text-xs text-muted">Share</span>
              </div>
              <p className="text-sm text-primary leading-relaxed">{result.instagram.caption}</p>
              <p className="mt-2 text-sm text-accent/80 leading-relaxed">
                {result.instagram.hashtags.map(h => `#${h}`).join(' ')}
              </p>
              <SchedulePicker />
            </div>
          </div>

          {/* Facebook */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ backgroundColor: '#1877f2' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-white/20 rounded-full" />
                <span className="font-mono text-xs text-white tracking-wider">Facebook</span>
              </div>
              <CopyButton text={result.facebook.post} />
            </div>
            {photoPreview && (
              <div className="aspect-video bg-border overflow-hidden">
                <img src={photoPreview} alt="Post preview" className="w-full h-full object-cover" />
              </div>
            )}
            {!photoPreview && (
              <div className="aspect-video bg-bg flex items-center justify-center">
                <span className="font-mono text-xs text-dim">1200 x 630</span>
              </div>
            )}
            <div className="p-4">
              <p className="text-sm text-primary leading-relaxed">{result.facebook.post}</p>
              <div className="flex gap-3 mt-3 pt-3 border-t border-border/50">
                <span className="font-mono text-xs text-muted">Like</span>
                <span className="font-mono text-xs text-muted">Comment</span>
                <span className="font-mono text-xs text-muted">Share</span>
              </div>
              <SchedulePicker />
            </div>
          </div>

          {/* Google Business */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {['#4285F4','#DB4437','#F4B400','#0F9D58'].map((c, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="font-mono text-xs text-primary tracking-wider">Google Business</span>
              </div>
              <CopyButton text={result.google_business.post} />
            </div>
            {photoPreview && (
              <div className="aspect-video bg-border overflow-hidden">
                <img src={photoPreview} alt="Post preview" className="w-full h-full object-cover" />
              </div>
            )}
            {!photoPreview && (
              <div className="aspect-video bg-bg flex items-center justify-center">
                <span className="font-mono text-xs text-dim">1200 x 900</span>
              </div>
            )}
            <div className="p-4">
              <p className="text-sm text-primary leading-relaxed">{result.google_business.post}</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <span className="font-mono text-xs text-muted">Post to Google Business Profile</span>
              </div>
              <SchedulePicker />
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version connects directly to your social media accounts and posts on schedule automatically.
      </p>
    </div>
  )
}
