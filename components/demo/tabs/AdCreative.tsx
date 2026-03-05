'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string }

interface AdResult {
  facebook: { headline: string; primaryText: string; description: string; cta: string }
  instagram: { headline: string; caption: string; cta: string }
  google: { headline1: string; headline2: string; headline3: string; description1: string; description2: string }
  linkedin: { headline: string; post: string; cta: string }
}

type Platform = 'facebook' | 'instagram' | 'google' | 'linkedin'

const PLATFORM_CONFIG: Record<Platform, { label: string; style: React.CSSProperties; textColor: string; size: string }> = {
  facebook:  { label: 'Facebook',  style: { backgroundColor: '#1877f2' }, textColor: '#ffffff', size: '1200 x 628' },
  instagram: { label: 'Instagram', style: { background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)' }, textColor: '#ffffff', size: '1080 x 1080' },
  google:    { label: 'Google',    style: { backgroundColor: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }, textColor: '#202020', size: 'Search' },
  linkedin:  { label: 'LinkedIn',  style: { backgroundColor: '#0077b5' }, textColor: '#ffffff', size: '1200 x 627' },
}

interface EditState {
  facebook: { headline: string; primaryText: string; description: string; cta: string }
  instagram: { headline: string; caption: string; cta: string }
  google: { headline1: string; headline2: string; headline3: string; description1: string; description2: string }
  linkedin: { headline: string; post: string; cta: string }
}

export default function AdCreative({ sessionId }: Props) {
  const [description, setDescription] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [promotion, setPromotion] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [hasPhoto, setHasPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AdResult | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [error, setError] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set(['facebook', 'instagram', 'google', 'linkedin']))
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
    e.preventDefault(); setLoading(true); setError(''); setResult(null); setEditingPlatform(null); setPostedAll(false)
    try {
      const res = await fetch('/api/demo/ad-creative', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, description, businessName, promotion, targetAudience, hasPhoto }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const r = data.result as AdResult
      setResult(r)
      setEditState({ facebook: { ...r.facebook }, instagram: { ...r.instagram }, google: { ...r.google }, linkedin: { ...r.linkedin } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const togglePlatform = (p: Platform) => setSelectedPlatforms((prev) => { const n = new Set(prev); if (n.has(p)) n.delete(p); else n.add(p); return n })

  const updateEdit = (platform: Platform, field: string, value: string) => {
    setEditState((prev) => prev ? { ...prev, [platform]: { ...(prev[platform] as Record<string, string>), [field]: value } } : prev)
  }

  const platforms = (['facebook', 'instagram', 'google', 'linkedin'] as Platform[]).filter((p) => selectedPlatforms.has(p))

  const inputClass = 'w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#5a7a9a] transition-colors'

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Ad Creative Studio</p>
          <h2 className="font-heading text-2xl text-primary">Generate Ad Creatives</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Direction and Goal</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="We want to promote our summer sale with 20% off all services. Targeting people who have already visited our site and have not converted yet." rows={2} className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Peak Fitness Studio" required className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Promotion Details</label>
                <input type="text" value={promotion} onChange={(e) => setPromotion(e.target.value)} placeholder="First month free, no commitment" required className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Target Audience</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Adults 25 to 45, health-conscious, within 10 miles" required className="w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors" />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Creative Asset (Optional)</label>
              <div onClick={() => fileRef.current?.click()} className="border border-dashed border-[#2d4052] rounded p-5 text-center cursor-pointer hover:border-[#4a6070] transition-colors">
                {photoPreview ? <img src={photoPreview} alt="Creative" className="max-h-24 mx-auto rounded object-cover" /> : <p className="font-mono text-sm text-muted">Click to upload a photo or graphic</p>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>

            {/* Platform checkboxes */}
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-3">Platforms to Generate</label>
              <div className="flex flex-wrap gap-4">
                {(['facebook', 'instagram', 'google', 'linkedin'] as Platform[]).map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedPlatforms.has(p)} onChange={() => togglePlatform(p)} className="w-4 h-4 rounded border-[#2d4052] accent-white" />
                    <span className="font-mono text-xs text-primary">{PLATFORM_CONFIG[p].label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || selectedPlatforms.size === 0} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Generating ads...' : 'Generate Ad Creatives'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-[#f0f0f0] border-t-transparent rounded-full animate-spin" />
              Creating platform-optimized ad copy...
            </div>
          )}
          {error && <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}
        </div>
      </div>

      {result && editState && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Ads Ready</p>
              <p className="font-mono text-xs text-muted">Click any ad to edit before posting.</p>
            </div>
            <div className="flex items-center gap-3">
              {postedAll && <span className="font-mono text-xs text-muted">Posted to {platforms.length} platform{platforms.length !== 1 ? 's' : ''}</span>}
              <button onClick={() => setPostedAll(true)} className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                {postedAll ? 'Posted' : 'Post to All Selected'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {platforms.map((p) => {
              const cfg = PLATFORM_CONFIG[p]
              const isEditing = editingPlatform === p
              return (
                <div key={p} className="bg-card border border-border rounded overflow-hidden">
                  {/* Platform header */}
                  <div className="px-4 py-3 flex items-center justify-between" style={cfg.style}>
                    <span className="font-mono text-xs tracking-wider font-semibold" style={{ color: cfg.textColor }}>{cfg.label} Ad</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs opacity-60" style={{ color: cfg.textColor }}>{cfg.size}</span>
                      <button
                        onClick={() => setEditingPlatform(isEditing ? null : p)}
                        className="font-mono text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: cfg.textColor }}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                    </div>
                  </div>

                  {/* Creative asset */}
                  {photoPreview && p !== 'google' && (
                    <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} overflow-hidden`}>
                      <img src={photoPreview} alt="Ad creative" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!photoPreview && p !== 'google' && (
                    <div className={`${p === 'instagram' ? 'aspect-square' : 'aspect-video'} bg-[#0e2030] flex items-center justify-center`}>
                      <span className="font-mono text-xs text-dim">{cfg.size}</span>
                    </div>
                  )}

                  {/* Ad content */}
                  <div className="p-4 space-y-3">
                    {p === 'facebook' && (
                      isEditing ? (
                        <div className="space-y-2">
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Headline</label><input value={editState.facebook.headline} onChange={(e) => updateEdit('facebook', 'headline', e.target.value)} className={inputClass} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Primary Text</label><textarea value={editState.facebook.primaryText} onChange={(e) => updateEdit('facebook', 'primaryText', e.target.value)} rows={3} className={`${inputClass} resize-none`} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Description</label><input value={editState.facebook.description} onChange={(e) => updateEdit('facebook', 'description', e.target.value)} className={inputClass} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Button Text</label><input value={editState.facebook.cta} onChange={(e) => updateEdit('facebook', 'cta', e.target.value)} className={inputClass} /></div>
                        </div>
                      ) : (
                        <>
                          <div className="font-heading text-base text-primary">{editState.facebook.headline}</div>
                          <p className="font-mono text-xs text-teal leading-relaxed">{editState.facebook.primaryText}</p>
                          <p className="font-mono text-xs text-dim">{editState.facebook.description}</p>
                          <span className="inline-block font-mono text-xs px-4 py-1.5 rounded" style={{ backgroundColor: '#1877f2', color: '#ffffff' }}>{editState.facebook.cta}</span>
                        </>
                      )
                    )}

                    {p === 'instagram' && (
                      isEditing ? (
                        <div className="space-y-2">
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Headline</label><input value={editState.instagram.headline} onChange={(e) => updateEdit('instagram', 'headline', e.target.value)} className={inputClass} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Caption</label><textarea value={editState.instagram.caption} onChange={(e) => updateEdit('instagram', 'caption', e.target.value)} rows={3} className={`${inputClass} resize-none`} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Button Text</label><input value={editState.instagram.cta} onChange={(e) => updateEdit('instagram', 'cta', e.target.value)} className={inputClass} /></div>
                        </div>
                      ) : (
                        <>
                          <div className="font-heading text-base text-primary">{editState.instagram.headline}</div>
                          <p className="font-mono text-xs text-teal leading-relaxed">{editState.instagram.caption}</p>
                          <span className="inline-block font-mono text-xs border border-[#2d4052] text-muted px-3 py-1 rounded">{editState.instagram.cta}</span>
                        </>
                      )
                    )}

                    {p === 'google' && (
                      isEditing ? (
                        <div className="space-y-2">
                          {(['headline1','headline2','headline3'] as const).map((f, i) => (
                            <div key={f}><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Headline {i+1}</label><input value={editState.google[f]} onChange={(e) => updateEdit('google', f, e.target.value)} className={inputClass} /></div>
                          ))}
                          {(['description1','description2'] as const).map((f, i) => (
                            <div key={f}><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Description {i+1}</label><textarea value={editState.google[f]} onChange={(e) => updateEdit('google', f, e.target.value)} rows={2} className={`${inputClass} resize-none`} /></div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#0e2030] border border-[#2d4052] rounded p-4">
                          <div className="font-mono text-xs text-dim mb-1">Sponsored</div>
                          <div className="text-blue-400 text-sm font-medium mb-1">{editState.google.headline1} | {editState.google.headline2} | {editState.google.headline3}</div>
                          <p className="font-mono text-xs text-muted">{editState.google.description1} {editState.google.description2}</p>
                        </div>
                      )
                    )}

                    {p === 'linkedin' && (
                      isEditing ? (
                        <div className="space-y-2">
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Headline</label><input value={editState.linkedin.headline} onChange={(e) => updateEdit('linkedin', 'headline', e.target.value)} className={inputClass} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Post Body</label><textarea value={editState.linkedin.post} onChange={(e) => updateEdit('linkedin', 'post', e.target.value)} rows={4} className={`${inputClass} resize-none`} /></div>
                          <div><label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Button Text</label><input value={editState.linkedin.cta} onChange={(e) => updateEdit('linkedin', 'cta', e.target.value)} className={inputClass} /></div>
                        </div>
                      ) : (
                        <>
                          <div className="font-heading text-base text-primary">{editState.linkedin.headline}</div>
                          <p className="font-mono text-xs text-teal leading-relaxed">{editState.linkedin.post}</p>
                          <span className="inline-block font-mono text-xs px-4 py-1.5 rounded" style={{ backgroundColor: '#0077b5', color: '#ffffff' }}>{editState.linkedin.cta}</span>
                        </>
                      )
                    )}
                  </div>
                </div>
              )
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
