'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QuoteCalculator from './QuoteCalculator'
import { ADDONS, PLANS, PLAN_INCLUDED_ADDONS, PLAN_PAGE_LIMITS, Plan } from '@/types'

const BUSINESS_TYPES = [
  'Restaurant / Cafe',
  'Retail Store',
  'Health and Wellness',
  'Professional Services',
  'Real Estate',
  'Beauty and Salon',
  'Fitness and Gym',
  'Automotive',
  'Construction and Trades',
  'Technology',
  'Education',
  'Non-Profit',
  'Entertainment',
  'Other',
]

const TIMELINES = ['As soon as possible', '1 to 2 weeks', '1 month', 'Flexible']

const STYLE_PREFERENCES = [
  'Modern and Minimal',
  'Bold and Vibrant',
  'Professional and Corporate',
  'Warm and Friendly',
  'Dark and Luxury',
  'Clean and Bright',
]

interface FormData {
  businessName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  location: string
  currentWebsite: string
  businessDescription: string
  primaryGoal: string
  timeline: string
  stylePreference: string
  specificFeatures: string
  additionalNotes: string
  addons: string[]
  plan: Plan
  requestedPages: string
}

const DEFAULT_FORM: FormData = {
  businessName: '',
  ownerName: '',
  email: '',
  phone: '',
  businessType: '',
  location: '',
  currentWebsite: '',
  businessDescription: '',
  primaryGoal: '',
  timeline: '',
  stylePreference: '',
  specificFeatures: '',
  additionalNotes: '',
  addons: [],
  plan: 'starter',
  requestedPages: '',
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function IntakeForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [form, setForm] = useState<FormData>(() => {
    const planParam = searchParams.get('plan') as Plan | null
    return { ...DEFAULT_FORM, plan: planParam && planParam in PLANS ? planParam : 'starter' }
  })
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const planParam = searchParams.get('plan') as Plan | null
    if (planParam && planParam in PLANS) {
      setForm((f) => ({ ...f, plan: planParam }))
    }
  }, [searchParams])

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const setPlan = (newPlan: Plan) => {
    const nowIncluded = PLAN_INCLUDED_ADDONS[newPlan]
    setForm((f) => ({
      ...f,
      plan: newPlan,
      // Remove from extra addons any that are now included in the new plan
      addons: f.addons.filter((id) => !nowIncluded.includes(id)),
    }))
  }

  const toggleAddon = (id: string) => {
    // Don't allow toggling plan-included addons
    if (PLAN_INCLUDED_ADDONS[form.plan].includes(id)) return
    setForm((f) => ({
      ...f,
      addons: f.addons.includes(id) ? f.addons.filter((a) => a !== id) : [...f.addons, id],
    }))
  }

  const addFiles = useCallback((newFiles: File[]) => {
    const images = newFiles.filter((f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024)
    setFiles((prev) => [...prev, ...images].slice(0, 8))
    images.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreviews((prev) => [...prev, e.target?.result as string].slice(0, 8))
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const removeFile = (index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index))
    setFilePreviews((p) => p.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const dropped = Array.from(e.dataTransfer.files)
      addFiles(dropped)
    },
    [addFiles]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('submitting')
    setErrorMsg('')

    const photoData: string[] = []
    for (const file of files) {
      await new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          photoData.push(ev.target?.result as string)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requestedPages: form.requestedPages ? parseInt(form.requestedPages) : undefined,
          photos: photoData,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed. Please try again.')
      }

      setSubmitState('success')
    } catch (err) {
      setSubmitState('error')
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  const pageLimit = PLAN_PAGE_LIMITS[form.plan]
  const requestedPagesNum = parseInt(form.requestedPages) || 0
  const showPageWarning = requestedPagesNum > pageLimit

  if (submitState === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-heading text-5xl text-primary mb-4">Submission Received</h2>
          <p className="text-teal leading-relaxed mb-2">
            We are generating your custom website now. Our team will review it and reach out within 48 hours.
          </p>
          <p className="font-mono text-sm text-muted">
            Check your inbox at <span className="text-accent">{form.email}</span>
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-8 font-mono text-sm border border-border text-teal px-6 py-3 rounded hover:border-accent hover:text-accent transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-16">
      <div className="mb-12">
        <div className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
          Start Your Project
        </div>
        <h1 className="font-heading text-[clamp(3rem,6vw,5rem)] leading-none text-primary">
          Tell Us About
          <br />
          <span className="text-teal">Your Business</span>
        </h1>
        <p className="mt-4 text-muted max-w-xl leading-relaxed">
          Fill out the form below and we will build a fully custom website for your business.
          Your quote updates live as you select add-ons.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">

          {/* Business Info */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Business Name" required>
                <input
                  type="text"
                  required
                  value={form.businessName}
                  onChange={(e) => setField('businessName', e.target.value)}
                  placeholder="Acme Corp"
                  className="form-input"
                />
              </FormField>
              <FormField label="Owner Name" required>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setField('ownerName', e.target.value)}
                  placeholder="Jane Smith"
                  className="form-input"
                />
              </FormField>
              <FormField label="Email Address" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="jane@acmecorp.com"
                  className="form-input"
                />
              </FormField>
              <FormField label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="form-input"
                />
              </FormField>
              <FormField label="Business Type" required>
                <select
                  required
                  value={form.businessType}
                  onChange={(e) => setField('businessType', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a type</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Business Location" required>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Austin, TX"
                  className="form-input"
                />
              </FormField>
              <FormField label="Current Website" className="sm:col-span-2">
                <input
                  type="url"
                  value={form.currentWebsite}
                  onChange={(e) => setField('currentWebsite', e.target.value)}
                  placeholder="https://yoursite.com (leave blank if none)"
                  className="form-input"
                />
              </FormField>
            </div>
          </section>

          {/* Project Details */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Project Details
            </h2>
            <div className="space-y-5">
              <FormField label="Describe Your Business" required>
                <textarea
                  required
                  rows={4}
                  value={form.businessDescription}
                  onChange={(e) => setField('businessDescription', e.target.value)}
                  placeholder="Tell us what you do, who you serve, and what makes you different..."
                  className="form-input resize-none"
                />
              </FormField>
              <FormField label="Primary Goal for Your Website" required>
                <input
                  type="text"
                  required
                  value={form.primaryGoal}
                  onChange={(e) => setField('primaryGoal', e.target.value)}
                  placeholder="e.g. Generate leads, sell products, book appointments..."
                  className="form-input"
                />
              </FormField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="Timeline" required>
                  <select
                    required
                    value={form.timeline}
                    onChange={(e) => setField('timeline', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select timeline</option>
                    {TIMELINES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Style Preference" required>
                  <select
                    required
                    value={form.stylePreference}
                    onChange={(e) => setField('stylePreference', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select a style</option>
                    {STYLE_PREFERENCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Number of Pages Requested">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.requestedPages}
                  onChange={(e) => setField('requestedPages', e.target.value)}
                  placeholder={`Up to ${pageLimit} pages on ${PLANS[form.plan].name}`}
                  className="form-input"
                />
                {showPageWarning && (
                  <div className="mt-2 p-3 bg-yellow-950/40 border border-yellow-600/40 rounded text-xs text-yellow-400 font-mono">
                    Your {PLANS[form.plan].name} plan includes up to {pageLimit} pages. You requested {requestedPagesNum}.
                    Consider upgrading to {form.plan === 'starter' ? 'Mid (up to 6 pages)' : 'Pro (up to 9 pages)'} to fit your needs.
                  </div>
                )}
              </FormField>
              <FormField label="Specific Features or Requests">
                <textarea
                  rows={3}
                  value={form.specificFeatures}
                  onChange={(e) => setField('specificFeatures', e.target.value)}
                  placeholder="Any specific pages, functionality, or design elements you have in mind..."
                  className="form-input resize-none"
                />
              </FormField>
              <FormField label="Additional Notes">
                <textarea
                  rows={3}
                  value={form.additionalNotes}
                  onChange={(e) => setField('additionalNotes', e.target.value)}
                  placeholder="Anything else we should know..."
                  className="form-input resize-none"
                />
              </FormField>
            </div>
          </section>

          {/* Plan Selection */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Select Your Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([id, plan]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`text-left p-5 rounded border transition-all duration-200 ${
                    form.plan === id
                      ? 'border-primary bg-card'
                      : 'border-border bg-card hover:border-border-light'
                  }`}
                >
                  <div className="font-mono text-xs tracking-widest uppercase mb-2">
                    {form.plan === id && (
                      <span className="text-primary">
                        <svg className="inline w-3 h-3 mr-1 mb-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    <span className={form.plan === id ? 'text-primary' : 'text-muted'}>{plan.name}</span>
                  </div>
                  <div className="font-heading text-3xl text-primary leading-none">
                    ${plan.upfront}
                    <span className="font-mono text-xs text-muted font-normal"> upfront</span>
                  </div>
                  <div className="font-heading text-xl text-teal leading-none mt-1">
                    ${plan.monthly}
                    <span className="font-mono text-xs text-muted font-normal">/mo</span>
                  </div>
                  <div className="font-mono text-xs text-dim mt-1">Up to {plan.pages} pages</div>
                </button>
              ))}
            </div>
          </section>

          {/* Add-ons */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-2 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Add-Ons
            </h2>
            <p className="text-sm text-muted mb-6">
              Add-ons included in your plan are shown below. Select extras to add to your monthly rate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDONS.map((addon) => {
                const isIncluded = PLAN_INCLUDED_ADDONS[form.plan].includes(addon.id)
                const checked = isIncluded || form.addons.includes(addon.id)
                return (
                  <label
                    key={addon.id}
                    className={`flex items-center gap-4 p-4 rounded border transition-all duration-200 ${
                      isIncluded
                        ? 'border-primary/30 bg-card cursor-default'
                        : checked
                        ? 'border-primary bg-card cursor-pointer'
                        : 'border-border bg-card hover:border-border-light cursor-pointer'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'border-primary' : 'border-dim'
                      }`}
                    >
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-primary">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={isIncluded}
                      onChange={() => toggleAddon(addon.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-primary font-medium">{addon.label}</div>
                      <div className="text-xs text-muted mt-0.5">{addon.description}</div>
                    </div>
                    <div className="font-mono text-sm shrink-0">
                      {isIncluded ? (
                        <span className="text-muted">Included</span>
                      ) : (
                        <span className="text-primary">+${addon.price}/mo</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </section>

          {/* Photo Upload */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-2 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Reference Photos
            </h2>
            <p className="text-sm text-muted mb-6">
              Upload photos of your business, products, or design inspiration. Up to 8 images.
            </p>

            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-border-light'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isDragging ? '#00ff88' : 'rgb(var(--color-dim))'}
                  strokeWidth="1.5"
                >
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p className={`font-mono text-sm ${isDragging ? 'text-accent' : 'text-muted'}`}>
                    {isDragging ? 'Drop files here' : 'Drag and drop photos here'}
                  </p>
                  <p className="font-mono text-xs text-dim mt-1">
                    or click to browse. PNG, JPG, WEBP up to 5MB each
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
              />
            </div>

            {filePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {filePreviews.map((src, i) => (
                  <div key={i} className="relative group aspect-square rounded overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute inset-0 bg-bg/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {submitState === 'error' && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded text-sm text-red-400 font-mono">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitState === 'submitting'}
            className="w-full bg-accent text-black font-mono font-medium text-base py-4 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {submitState === 'submitting' ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Generating Your Website...
              </>
            ) : (
              <>
                Submit My Project
                <span>&rarr;</span>
              </>
            )}
          </button>

          <p className="text-xs text-dim font-mono text-center">
            No payment required now. You will preview your site before checkout.
          </p>
        </div>

        <div className="lg:col-span-1">
          <QuoteCalculator selectedAddons={form.addons} selectedPlan={form.plan} />
        </div>
      </div>
    </form>
  )
}

function FormField({
  label,
  required,
  children,
  className = '',
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}
