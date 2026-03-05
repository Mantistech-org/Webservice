'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string }

interface AdResult {
  facebook: { headline: string; primaryText: string; description: string; cta: string }
  instagram: { headline: string; caption: string; cta: string }
  google: { headline1: string; headline2: string; headline3: string; description1: string; description2: string }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return <button onClick={copy} className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
}

function DownloadButton() {
  const [dl, setDl] = useState(false)
  return (
    <button
      onClick={() => { setDl(true); setTimeout(() => setDl(false), 2000) }}
      className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded hover:border-accent hover:text-accent transition-all"
    >
      {dl ? 'Ready' : 'Download'}
    </button>
  )
}

export default function AdCreative({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [promotion, setPromotion] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdResult | null>(null)
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
      const res = await fetch('/api/demo/ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, promotion, targetAudience, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as AdResult)
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
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Ad Creative Studio</p>
          <h2 className="font-heading text-2xl text-primary">Generate Ad Creatives</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Peak Fitness Studio" required className="form-input" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Promotion Details</label>
                <input type="text" value={promotion} onChange={(e) => setPromotion(e.target.value)} placeholder="First month free, no commitment" required className="form-input" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Target Audience</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Adults 25-45, health-conscious, within 10 miles" required className="form-input" />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Creative Asset (Optional)</label>
              <div onClick={() => fileRef.current?.click()} className="border border-dashed border-border rounded p-5 text-center cursor-pointer hover:border-accent transition-colors">
                {photoPreview
                  ? <img src={photoPreview} alt="Creative asset" className="max-h-24 mx-auto rounded object-cover" />
                  : <p className="font-mono text-sm text-muted">Click to upload a photo or graphic</p>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
            <button type="submit" disabled={loading} className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Generating ads...' : 'Generate Ad Creatives'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Creating platform-optimized ad copy...
            </div>
          )}
          {error && <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facebook */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ backgroundColor: '#1877f2' }}>
              <span className="font-mono text-xs text-white tracking-wider">Facebook Ad</span>
              <div className="flex items-center gap-2">
                <CopyButton text={`${result.facebook.headline}\n\n${result.facebook.primaryText}\n\n${result.facebook.description}`} />
                <DownloadButton />
              </div>
            </div>
            {photoPreview
              ? <div className="aspect-video overflow-hidden"><img src={photoPreview} alt="Ad creative" className="w-full h-full object-cover" /></div>
              : <div className="aspect-video bg-bg flex items-center justify-center"><span className="font-mono text-xs text-dim">1200 x 628</span></div>
            }
            <div className="p-4 space-y-2">
              <div className="font-heading text-base text-primary">{result.facebook.headline}</div>
              <p className="font-mono text-xs text-teal leading-relaxed">{result.facebook.primaryText}</p>
              <p className="font-mono text-xs text-dim">{result.facebook.description}</p>
              <div className="pt-2">
                <span className="font-mono text-xs bg-[#1877f2] text-white px-4 py-1.5 rounded">{result.facebook.cta}</span>
              </div>
            </div>
          </div>

          {/* Instagram */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
              <span className="font-mono text-xs text-white tracking-wider">Instagram Ad</span>
              <div className="flex items-center gap-2">
                <CopyButton text={`${result.instagram.headline}\n\n${result.instagram.caption}`} />
                <DownloadButton />
              </div>
            </div>
            {photoPreview
              ? <div className="aspect-square overflow-hidden"><img src={photoPreview} alt="Ad creative" className="w-full h-full object-cover" /></div>
              : <div className="aspect-square bg-bg flex items-center justify-center"><span className="font-mono text-xs text-dim">1080 x 1080</span></div>
            }
            <div className="p-4 space-y-2">
              <div className="font-heading text-base text-primary">{result.instagram.headline}</div>
              <p className="font-mono text-xs text-teal leading-relaxed">{result.instagram.caption}</p>
              <div className="pt-2">
                <span className="font-mono text-xs border border-border text-muted px-3 py-1 rounded">{result.instagram.cta}</span>
              </div>
            </div>
          </div>

          {/* Google */}
          <div className="bg-card border border-border rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg">
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5">
                  {['#4285F4','#DB4437','#F4B400','#0F9D58'].map((c, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="font-mono text-xs text-primary tracking-wider">Google Search Ad</span>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={[result.google.headline1, result.google.headline2, result.google.headline3, result.google.description1, result.google.description2].join('\n')} />
                <DownloadButton />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-bg border border-border rounded p-4">
                <div className="font-mono text-xs text-dim mb-1">Ad</div>
                <div className="text-blue-500 text-sm font-medium leading-tight mb-2">
                  {result.google.headline1} | {result.google.headline2} | {result.google.headline3}
                </div>
                <p className="font-mono text-xs text-muted leading-relaxed">{result.google.description1}</p>
                <p className="font-mono text-xs text-muted leading-relaxed mt-1">{result.google.description2}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dim">H1</span>
                  <span className={`font-mono text-xs ${result.google.headline1.length <= 30 ? 'text-accent' : 'text-yellow-400'}`}>{result.google.headline1.length}/30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dim">H2</span>
                  <span className={`font-mono text-xs ${result.google.headline2.length <= 30 ? 'text-accent' : 'text-yellow-400'}`}>{result.google.headline2.length}/30</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-dim">D1</span>
                  <span className={`font-mono text-xs ${result.google.description1.length <= 90 ? 'text-accent' : 'text-yellow-400'}`}>{result.google.description1.length}/90</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version publishes directly to your Facebook Ads Manager, Instagram, and Google Ads accounts.
      </p>
    </div>
  )
}
