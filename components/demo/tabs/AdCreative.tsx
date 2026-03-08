'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

interface FbVar { headline: string; primaryText: string; description: string }
interface IgVar { caption: string }
interface GgVar { headline1: string; headline2: string; headline3: string; description1: string; description2: string }
interface LiVar { headline: string; post: string }

interface AdResult {
  facebook: { variations: FbVar[] }
  instagram: { variations: IgVar[] }
  google: { variations: GgVar[] }
  linkedin: { variations: LiVar[] }
}

type Platform = 'facebook' | 'instagram' | 'google' | 'linkedin'

const CTA_OPTIONS = [
  'Book Now', 'Learn More', 'Shop Now', 'Get a Quote', 'Contact Us',
  'Sign Up', 'Order Now', 'Get Directions', 'Call Now', 'Download',
]

const inputCls = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors'

function CharCount({ len, limit, warnAt }: { len: number; limit: number; warnAt?: number }) {
  const cls = len > limit ? 'text-red-500' : (warnAt && len > warnAt) ? 'text-amber-500' : 'text-[#aaaaaa]'
  return <span className={`font-mono text-xs ${cls}`}>{len}/{limit}</span>
}

function VarTabs({ count, active, onChange }: { count: number; active: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`font-mono text-xs w-6 h-6 rounded transition-colors ${
            active === i ? 'bg-white/30 text-white' : 'bg-black/15 text-white/70 hover:bg-black/25'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

export default function AdCreative({ sessionId, darkMode }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [promotion, setPromotion] = useState('')
  const [description, setDescription] = useState('')
  const [cta, setCta] = useState('Learn More')
  const [ageRange, setAgeRange] = useState('')
  const [locationRadius, setLocationRadius] = useState('')
  const [idealCustomer, setIdealCustomer] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [hasPhoto, setHasPhoto] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    new Set(['facebook', 'instagram', 'google', 'linkedin'])
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AdResult | null>(null)
  const [editState, setEditState] = useState<{
    facebook: FbVar[]; instagram: IgVar[]; google: GgVar[]; linkedin: LiVar[]
  } | null>(null)
  const [selectedVar, setSelectedVar] = useState<Record<Platform, number>>(
    { facebook: 0, instagram: 0, google: 0, linkedin: 0 }
  )
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
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
    setLoading(true); setError(''); setResult(null); setEditingPlatform(null); setPostedAll(false)
    try {
      const res = await fetch('/api/demo/ad-creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, description, businessName, promotion, cta, ageRange, locationRadius, idealCustomer, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const r = data.result as AdResult
      setResult(r)
      setEditState({
        facebook: r.facebook.variations.map(v => ({ ...v })),
        instagram: r.instagram.variations.map(v => ({ ...v })),
        google: r.google.variations.map(v => ({ ...v })),
        linkedin: r.linkedin.variations.map(v => ({ ...v })),
      })
      setSelectedVar({ facebook: 0, instagram: 0, google: 0, linkedin: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const togglePlatform = (p: Platform) => setSelectedPlatforms(prev => {
    const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n
  })

  const setVarFb = (vi: number, k: keyof FbVar, v: string) =>
    setEditState(p => p ? { ...p, facebook: p.facebook.map((x, i) => i === vi ? { ...x, [k]: v } : x) } : p)
  const setVarIg = (vi: number, k: keyof IgVar, v: string) =>
    setEditState(p => p ? { ...p, instagram: p.instagram.map((x, i) => i === vi ? { ...x, [k]: v } : x) } : p)
  const setVarGg = (vi: number, k: keyof GgVar, v: string) =>
    setEditState(p => p ? { ...p, google: p.google.map((x, i) => i === vi ? { ...x, [k]: v } : x) } : p)
  const setVarLi = (vi: number, k: keyof LiVar, v: string) =>
    setEditState(p => p ? { ...p, linkedin: p.linkedin.map((x, i) => i === vi ? { ...x, [k]: v } : x) } : p)

  const platforms = (['facebook', 'instagram', 'google', 'linkedin'] as Platform[]).filter(p => selectedPlatforms.has(p))

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Ad Creative Studio</p>
          <h2 className="font-heading text-2xl text-primary">Generate Ad Creatives</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Peak Fitness Studio" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Promotion Details</label>
                <input type="text" value={promotion} onChange={e => setPromotion(e.target.value)} placeholder="First month free, no commitment" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Direction and Goal</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Summer retargeting campaign for site visitors who did not convert. Focus on urgency and the limited-time offer." rows={2} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none" />
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Call to Action</label>
              <select value={cta} onChange={e => setCta(e.target.value)} className="w-full sm:w-1/2 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors">
                {CTA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-3">Audience Targeting</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-xs text-dim block mb-1.5">Age Range</label>
                  <input type="text" value={ageRange} onChange={e => setAgeRange(e.target.value)} placeholder="25 to 45" className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2.5 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-xs text-dim block mb-1.5">Location Radius</label>
                  <input type="text" value={locationRadius} onChange={e => setLocationRadius(e.target.value)} placeholder="10 miles from downtown" className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2.5 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-xs text-dim block mb-1.5">Ideal Customer</label>
                  <input type="text" value={idealCustomer} onChange={e => setIdealCustomer(e.target.value)} placeholder="Health-conscious professionals" className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2.5 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
                </div>
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Creative Asset (Optional)</label>
              <div onClick={() => fileRef.current?.click()} className="border border-dashed border-[#d0d0d0] rounded p-5 text-center cursor-pointer hover:border-[#b0b0b0] transition-colors">
                {photoPreview
                  ? <img src={photoPreview} alt="Creative" className="max-h-24 mx-auto rounded object-cover" />
                  : <p className="font-mono text-sm text-muted">Click to upload a photo or graphic</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-3">Platforms</label>
              <div className="flex flex-wrap gap-4">
                {(['facebook', 'instagram', 'google', 'linkedin'] as Platform[]).map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPlatforms.has(p)} onChange={() => togglePlatform(p)} className="w-4 h-4 rounded border-[#d0d0d0] accent-black" />
                    <span className="font-mono text-xs text-primary">{p === 'google' ? 'Google' : p === 'facebook' ? 'Facebook' : p === 'instagram' ? 'Instagram' : 'LinkedIn'}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || selectedPlatforms.size === 0} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Generating...' : 'Generate Ad Creatives'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
              Creating platform-optimized ad copy...
            </div>
          )}
          {error && <div className="mt-6 bg-red-50 border border-red-200 rounded p-4 font-mono text-sm text-red-700">{error}</div>}
        </div>
      </div>

      {/* Results */}
      {result && editState && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Ads Ready</p>
              <p className="font-mono text-xs text-muted">Select a variation and edit before posting.</p>
            </div>
            <button onClick={() => setPostedAll(true)} className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {postedAll ? 'Posted' : 'Post to All Selected'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {platforms.map(platform => {
              if (!editState) return null

              if (platform === 'facebook') {
                const vi = selectedVar.facebook
                const fb = editState.facebook[vi]
                const isE = editingPlatform === 'facebook'
                return (
                  <div key="facebook" className="bg-card border border-border rounded overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#1a1a1a' }}>
                      <span className="font-mono text-xs tracking-wider font-semibold text-white">Facebook</span>
                      <div className="flex items-center gap-2">
                        <VarTabs count={editState.facebook.length} active={vi} onChange={i => setSelectedVar(p => ({ ...p, facebook: i }))} />
                        <button type="button" onClick={() => setEditingPlatform(isE ? null : 'facebook')} className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' }}>
                          {isE ? 'Done' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#e4e6eb] flex items-center justify-center font-mono text-xs font-bold text-[#666]">{businessName.charAt(0) || 'B'}</div>
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#1c1e21]">{businessName || 'Your Business'}</div>
                          <div className="font-mono text-[10px] text-[#8a8d91]">Sponsored</div>
                        </div>
                      </div>
                      {!isE && <p className="font-mono text-xs text-[#1c1e21] px-3 pb-2 leading-relaxed">{fb.primaryText}</p>}
                      {photoPreview
                        ? <img src={photoPreview} alt="" className="w-full aspect-video object-cover" />
                        : <div className="w-full aspect-video bg-[#e4e6eb] flex items-center justify-center"><span className="font-mono text-xs text-[#8a8d91]">1200 x 628</span></div>}
                      <div className="px-3 py-2 bg-[#f0f2f5] flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="font-mono text-[10px] text-[#8a8d91] uppercase truncate">{locationRadius || 'your-business.com'}</div>
                          <div className="font-mono text-sm font-semibold text-[#1c1e21] truncate">{fb.headline}</div>
                          <div className="font-mono text-[10px] text-[#8a8d91] truncate">{fb.description}</div>
                        </div>
                        <span className="shrink-0 font-mono text-xs px-3 py-1.5 rounded bg-[#e4e6eb] text-[#1c1e21] border border-[#ccd0d5]">{cta}</span>
                      </div>
                    </div>
                    {isE && (
                      <div className="p-4 space-y-3 border-t border-border">
                        <div>
                          <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Headline</label><CharCount len={fb.headline.length} limit={40} /></div>
                          <input value={fb.headline} onChange={e => setVarFb(vi, 'headline', e.target.value)} className={`${inputCls} ${fb.headline.length > 40 ? 'border-red-400' : ''}`} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Primary Text</label><CharCount len={fb.primaryText.length} limit={125} /></div>
                          <textarea value={fb.primaryText} onChange={e => setVarFb(vi, 'primaryText', e.target.value)} rows={3} className={`${inputCls} resize-none ${fb.primaryText.length > 125 ? 'border-red-400' : ''}`} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Description</label><CharCount len={fb.description.length} limit={125} /></div>
                          <input value={fb.description} onChange={e => setVarFb(vi, 'description', e.target.value)} className={`${inputCls} ${fb.description.length > 125 ? 'border-red-400' : ''}`} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              }

              if (platform === 'instagram') {
                const vi = selectedVar.instagram
                const ig = editState.instagram[vi]
                const isE = editingPlatform === 'instagram'
                const overWarn = ig.caption.length > 150
                const overLimit = ig.caption.length > 2200
                return (
                  <div key="instagram" className="bg-card border border-border rounded overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }}>
                      <span className="font-mono text-xs tracking-wider font-semibold text-white">Instagram</span>
                      <div className="flex items-center gap-2">
                        <VarTabs count={editState.instagram.length} active={vi} onChange={i => setSelectedVar(p => ({ ...p, instagram: i }))} />
                        <button type="button" onClick={() => setEditingPlatform(isE ? null : 'instagram')} className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' }}>
                          {isE ? 'Done' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#833ab4] to-[#fcb045]" />
                        <div className="font-mono text-xs font-semibold text-[#1a1a1a] flex-1">{businessName.toLowerCase().replace(/\s+/g, '.') || 'your.business'}</div>
                        <span className="font-mono text-xs font-semibold text-[#00aa55]">Follow</span>
                      </div>
                      <div className="relative aspect-square overflow-hidden bg-[#e4e6eb]">
                        {photoPreview
                          ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><span className="font-mono text-xs text-[#8a8d91]">1080 x 1080</span></div>}
                        {!isE && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
                            <p className="font-mono text-xs text-white leading-relaxed line-clamp-3">{ig.caption}</p>
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-2 border-t border-[#dbdbdb] flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#8a8d91]">Sponsored</span>
                        <span className="font-mono text-xs font-semibold text-[#00aa55]">{cta}</span>
                      </div>
                    </div>
                    {isE && (
                      <div className="p-4 border-t border-border">
                        <div className="flex justify-between mb-1">
                          <label className="font-mono text-xs text-muted uppercase tracking-widest">Caption</label>
                          <CharCount len={ig.caption.length} limit={2200} warnAt={150} />
                        </div>
                        {overWarn && !overLimit && <p className="font-mono text-xs text-amber-600 mb-2">Captions over 150 characters are truncated in feed.</p>}
                        {overLimit && <p className="font-mono text-xs text-red-600 mb-2">Caption exceeds the 2200 character limit.</p>}
                        <textarea value={ig.caption} onChange={e => setVarIg(vi, 'caption', e.target.value)} rows={4} className={`${inputCls} resize-none ${overLimit ? 'border-red-400' : overWarn ? 'border-amber-300' : ''}`} />
                      </div>
                    )}
                    {!isE && overWarn && (
                      <div className="px-4 py-2 bg-card border-t border-border">
                        <p className="font-mono text-xs text-amber-600">Caption exceeds 150 characters and will be truncated in feed.</p>
                      </div>
                    )}
                  </div>
                )
              }

              if (platform === 'google') {
                const vi = selectedVar.google
                const gg = editState.google[vi]
                const isE = editingPlatform === 'google'
                return (
                  <div key="google" className="bg-card border border-border rounded overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between bg-[#f8f8f8] border-b border-[#e0e0e0]">
                      <span className="font-mono text-xs tracking-wider font-semibold text-[#202020]">Google Display</span>
                      <div className="flex items-center gap-2">
                        <VarTabs count={editState.google.length} active={vi} onChange={i => setSelectedVar(p => ({ ...p, google: i }))} />
                        <button type="button" onClick={() => setEditingPlatform(isE ? null : 'google')} className="font-mono text-xs px-2 py-1 rounded bg-[#e0e0e0] text-[#202020]">
                          {isE ? 'Done' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <span className="inline-block font-mono text-xs border border-[#dadce0] rounded px-1.5 py-0.5 text-[#202020] mb-2">Sponsored</span>
                      <div className="text-[#1a0dab] text-sm font-medium leading-snug mb-1">
                        {[gg.headline1, gg.headline2, gg.headline3].filter(Boolean).join(' | ')}
                      </div>
                      <div className="font-mono text-xs text-[#188038] mb-1">
                        {businessName ? businessName.toLowerCase().replace(/\s+/g, '') + '.com' : 'your-business.com'}
                      </div>
                      <p className="font-mono text-xs text-[#4d5156] leading-relaxed">
                        {gg.description1}{gg.description2 ? ' ' + gg.description2 : ''}
                      </p>
                    </div>
                    {isE && (
                      <div className="p-4 space-y-3 border-t border-border">
                        {(['headline1', 'headline2', 'headline3'] as (keyof GgVar)[]).map((f, i) => (
                          <div key={f}>
                            <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Headline {i + 1}</label><CharCount len={(gg[f] as string).length} limit={30} /></div>
                            <input value={gg[f] as string} onChange={e => setVarGg(vi, f, e.target.value)} className={`${inputCls} ${(gg[f] as string).length > 30 ? 'border-red-400' : ''}`} />
                          </div>
                        ))}
                        {(['description1', 'description2'] as (keyof GgVar)[]).map((f, i) => (
                          <div key={f}>
                            <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Description {i + 1}</label><CharCount len={(gg[f] as string).length} limit={90} /></div>
                            <textarea value={gg[f] as string} onChange={e => setVarGg(vi, f, e.target.value)} rows={2} className={`${inputCls} resize-none ${(gg[f] as string).length > 90 ? 'border-red-400' : ''}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              if (platform === 'linkedin') {
                const vi = selectedVar.linkedin
                const li = editState.linkedin[vi]
                const isE = editingPlatform === 'linkedin'
                const overWarn = li.post.length > 150
                return (
                  <div key="linkedin" className="bg-card border border-border rounded overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#1a1a1a' }}>
                      <span className="font-mono text-xs tracking-wider font-semibold text-white">LinkedIn</span>
                      <div className="flex items-center gap-2">
                        <VarTabs count={editState.linkedin.length} active={vi} onChange={i => setSelectedVar(p => ({ ...p, linkedin: i }))} />
                        <button type="button" onClick={() => setEditingPlatform(isE ? null : 'linkedin')} className="font-mono text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' }}>
                          {isE ? 'Done' : 'Edit'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-white">
                      <div className="px-3 py-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center font-mono text-xs text-white font-bold">{businessName.charAt(0) || 'B'}</div>
                        <div>
                          <div className="font-mono text-xs font-semibold text-[#1a1a1a]">{businessName || 'Your Business'}</div>
                          <div className="font-mono text-[10px] text-[#8a8d91]">Sponsored</div>
                        </div>
                      </div>
                      {photoPreview
                        ? <img src={photoPreview} alt="" className="w-full aspect-video object-cover" />
                        : <div className="w-full aspect-video bg-[#e4e6eb] flex items-center justify-center"><span className="font-mono text-xs text-[#8a8d91]">1200 x 627</span></div>}
                      {!isE && (
                        <div className="px-3 py-2 border-t border-[#e0e0e0]">
                          <div className="font-mono text-sm font-semibold text-[#1a1a1a] truncate">{li.headline}</div>
                          <p className="font-mono text-xs text-[#666] mt-1 leading-relaxed line-clamp-3">{li.post}</p>
                        </div>
                      )}
                      {!isE && (
                        <div className="px-3 pb-3 pt-2">
                          <span className="font-mono text-xs px-4 py-1.5 rounded border border-[#1a1a1a] text-[#1a1a1a]">{cta}</span>
                        </div>
                      )}
                    </div>
                    {isE && (
                      <div className="p-4 space-y-3 border-t border-border">
                        <div>
                          <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Headline</label><CharCount len={li.headline.length} limit={70} /></div>
                          <input value={li.headline} onChange={e => setVarLi(vi, 'headline', e.target.value)} className={`${inputCls} ${li.headline.length > 70 ? 'border-red-400' : ''}`} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1"><label className="font-mono text-xs text-muted uppercase tracking-widest">Post Body</label><CharCount len={li.post.length} limit={150} /></div>
                          {overWarn && <p className="font-mono text-xs text-amber-600 mb-1">Posts over 150 characters show a truncation in feed.</p>}
                          <textarea value={li.post} onChange={e => setVarLi(vi, 'post', e.target.value)} rows={4} className={`${inputCls} resize-none ${overWarn ? 'border-amber-300' : ''}`} />
                        </div>
                      </div>
                    )}
                    {!isE && overWarn && (
                      <div className="px-4 pb-3 bg-card border-t border-border">
                        <p className="font-mono text-xs text-amber-600">Post exceeds 150 characters and will show a truncation in feed.</p>
                      </div>
                    )}
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version publishes directly to your Facebook Ads Manager, Instagram, Google Ads, and LinkedIn Campaign Manager.
      </p>
    </div>
  )
}
