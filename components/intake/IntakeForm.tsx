'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QuoteCalculator from './QuoteCalculator'
import { PLANS, Plan } from '@/types'

const HVAC_TYPES = ['Residential HVAC', 'Commercial HVAC', 'Both Residential and Commercial']

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
  specificFeatures: string
  additionalNotes: string
  addons: string[]
  plan: Plan
  // Domain step
  domainStatus: 'existing' | 'new' | ''
  existingDomain: string
  preferredDomain: string
  wantsProfessionalEmail: boolean
  // Platform Plus
  primaryGoal: string
  stylePreference: string
  requestedPages: string
  employeeCount: string
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
  specificFeatures: '',
  additionalNotes: '',
  addons: [],
  plan: 'platform',
  domainStatus: '',
  existingDomain: '',
  preferredDomain: '',
  wantsProfessionalEmail: false,
  primaryGoal: '',
  stylePreference: '',
  requestedPages: '',
  employeeCount: '',
}

const STORAGE_KEY = 'intake_form_draft'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function IntakeForm() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [form, setForm] = useState<FormData>(() => {
    const planParam = searchParams.get('plan') as Plan | null
    return { ...DEFAULT_FORM, plan: planParam && planParam in PLANS ? planParam : 'platform' }
  })
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [referralToken, setReferralToken] = useState('')

  // File upload state
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Restore draft from localStorage on mount
  useEffect(() => {
    const planParam = searchParams.get('plan') as Plan | null
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draft = JSON.parse(saved) as FormData
        localStorage.removeItem(STORAGE_KEY)
        if (planParam && planParam in PLANS) {
          setForm({ ...draft, plan: planParam })
        } else {
          setForm(draft)
        }
        return
      }
    } catch {
      // ignore parse errors
    }
    if (planParam && planParam in PLANS) {
      setForm((f) => ({ ...f, plan: planParam }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep plan in sync when URL param changes after initial mount
  useEffect(() => {
    const planParam = searchParams.get('plan') as Plan | null
    if (planParam && planParam in PLANS) {
      setForm((f) => ({ ...f, plan: planParam }))
    }
  }, [searchParams])

  // Read referral token from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)referral_token=([^;]*)/)
    if (match) setReferralToken(decodeURIComponent(match[1]))
  }, [])

  // Save form draft to localStorage on every change
  useEffect(() => {
    if (submitState === 'success') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {
      // ignore storage errors
    }
  }, [form, submitState])

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const setPlan = (newPlan: Plan) => {
    setField('plan', newPlan)
  }

  const toggleProfessionalEmail = (checked: boolean) => {
    setField('wantsProfessionalEmail', checked)
  }

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter((f) => f.type.startsWith('image/'))
    const remaining = 8 - files.length
    const toAdd = arr.slice(0, remaining)
    if (toAdd.length === 0) return
    const previews = toAdd.map((f) => URL.createObjectURL(f))
    setFiles((prev) => [...prev, ...toAdd])
    setFilePreviews((prev) => [...prev, ...previews])
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFilePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90_000)

      const photoData: string[] =
        form.plan === 'platform-plus'
          ? await Promise.all(
              files.map(
                (f) =>
                  new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(f)
                  })
              )
            )
          : []

      let res: Response
      try {
        res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            ...form,
            domainStatus: form.domainStatus || undefined,
            existingDomain: form.existingDomain || undefined,
            preferredDomain: form.preferredDomain || undefined,
            wantsProfessionalEmail: form.wantsProfessionalEmail || undefined,
            referredBy: referralToken || undefined,
            photos: photoData,
          }),
        })
      } finally {
        clearTimeout(timeoutId)
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed. Please try again.')
      }

      await res.json().catch(() => ({}))

      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }

      setSubmitState('success')
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setErrorMsg('The request timed out. Your submission may have gone through — check your email or try again.')
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
      }
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="font-heading text-5xl text-primary mb-4">Request Received</h2>
          <p className="text-teal leading-relaxed mb-4">
            Our team is reviewing your submission and will be in touch shortly with next steps. If you have any questions in the meantime call us at{' '}
            <a href="tel:+15016690488" className="text-accent hover:underline">(501) 669-0488</a>.
          </p>
          <p className="font-mono text-sm text-muted">
            A confirmation will be sent to <span className="text-accent">{form.email}</span>
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
          Fill out the form below and we will get your platform set up and your business growing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">

          {/* Business Information */}
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
              <FormField label="HVAC Business Type" required>
                <select
                  required
                  value={form.businessType}
                  onChange={(e) => setField('businessType', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a type</option>
                  {HVAC_TYPES.map((t) => (
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
              <FormField label="Tell us about your HVAC business" required>
                <textarea
                  required
                  rows={4}
                  value={form.businessDescription}
                  onChange={(e) => setField('businessDescription', e.target.value)}
                  placeholder="Tell us what you do, who you serve, and what makes you different..."
                  className="form-input resize-none"
                />
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

          {/* Website Details — platform-plus only */}
          {form.plan === 'platform-plus' && (
            <section>
              <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-6 flex items-center gap-3">
                <span className="w-4 h-px bg-accent" />
                Website Details
              </h2>
              <div className="space-y-5">
                <FormField label="Primary Goal for Your Website" required>
                  <input
                    type="text"
                    required={form.plan === 'platform-plus'}
                    value={form.primaryGoal}
                    onChange={(e) => setField('primaryGoal', e.target.value)}
                    placeholder="e.g. Generate leads, book appointments, showcase services..."
                    className="form-input"
                  />
                </FormField>
                <FormField label="Style Preference" required>
                  <select
                    required={form.plan === 'platform-plus'}
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
                <FormField label="Number of Pages Requested">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.requestedPages}
                    onChange={(e) => setField('requestedPages', e.target.value)}
                    placeholder="How many pages do you need?"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Photo Upload">
                  <div
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-border-light'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => e.target.files && addFiles(e.target.files)}
                    />
                    <p className="text-sm text-muted">
                      Drag and drop images here, or click to select
                    </p>
                    <p className="font-mono text-xs text-dim mt-1">
                      Up to 8 images
                    </p>
                  </div>
                  {filePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {filePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square">
                          <img src={src} alt="" className="w-full h-full object-cover rounded" />
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition-colors"
                          >
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </FormField>
              </div>
            </section>
          )}

          {/* Domain — platform-plus only */}
          {form.plan === 'platform-plus' && (
            <section>
              <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-2 flex items-center gap-3">
                <span className="w-4 h-px bg-accent" />
                Your Domain
              </h2>
              <p className="text-sm text-muted mb-6">
                Every website needs a domain name. Let us know whether you already have one or need us to register one for you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {([
                  { value: 'existing', label: 'Yes, I have a domain', sub: 'I already own a domain name' },
                  { value: 'new', label: 'No, I need a domain', sub: 'I need one registered for me' },
                ] as const).map(({ value, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField('domainStatus', value)}
                    className={`text-left p-5 rounded border transition-all duration-200 ${
                      form.domainStatus === value
                        ? 'border-primary bg-card'
                        : 'border-border bg-card hover:border-border-light'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        form.domainStatus === value ? 'border-primary' : 'border-dim'
                      }`}>
                        {form.domainStatus === value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <span className={`font-mono text-sm font-medium ${form.domainStatus === value ? 'text-primary' : 'text-muted'}`}>
                        {label}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-dim ml-6">{sub}</div>
                  </button>
                ))}
              </div>

              {form.domainStatus === 'existing' && (
                <div className="space-y-3">
                  <FormField label="Your Current Domain Name">
                    <input
                      type="text"
                      value={form.existingDomain}
                      onChange={(e) => setField('existingDomain', e.target.value)}
                      placeholder="mybusiness.com"
                      className="form-input"
                    />
                  </FormField>
                  <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/20 rounded">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-mono text-xs text-teal leading-relaxed">
                      We will handle pointing it to your new website. No technical knowledge needed.
                    </p>
                  </div>
                </div>
              )}

              {form.domainStatus === 'new' && (
                <div className="space-y-3">
                  <FormField label="Preferred Domain Name">
                    <input
                      type="text"
                      value={form.preferredDomain}
                      onChange={(e) => setField('preferredDomain', e.target.value)}
                      placeholder="mybusiness.com or mybusiness.net"
                      className="form-input"
                    />
                  </FormField>
                  <div className="flex items-start gap-2 p-3 bg-accent/5 border border-accent/20 rounded">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-mono text-xs text-teal leading-relaxed">
                      We will check availability and register it for you. If your first choice is taken we will reach out with alternatives.
                    </p>
                  </div>
                </div>
              )}

              {form.domainStatus !== '' && (
                <label className={`flex items-start gap-4 p-4 rounded border mt-5 cursor-pointer transition-all duration-200 ${
                  form.wantsProfessionalEmail ? 'border-primary bg-card' : 'border-border bg-card hover:border-border-light'
                }`}>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      form.wantsProfessionalEmail ? 'border-primary' : 'border-dim'
                    }`}
                  >
                    {form.wantsProfessionalEmail && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-primary">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.wantsProfessionalEmail}
                    onChange={(e) => toggleProfessionalEmail(e.target.checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-primary font-medium">
                      Add a professional email address at my domain
                    </div>
                    <div className="font-mono text-xs text-muted mt-0.5">
                      For example: hello@{form.existingDomain || form.preferredDomain?.split(' ')[0] || 'yourbusiness.com'}
                    </div>
                    <div className="font-mono text-xs text-muted mt-1">
                      Included with Platform Plus
                    </div>
                  </div>
                </label>
              )}
            </section>
          )}

          {/* Plan Selection */}
          <section>
            <h2 className="font-mono text-xs text-primary tracking-widest uppercase mb-6 flex items-center gap-3">
              <span className="w-4 h-px bg-accent" />
              Select Your Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.entries(PLANS) as [Plan, typeof PLANS[Plan]][]).map(([id, plan]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`text-left p-5 rounded border transition-all duration-200 ${
                    form.plan === id
                      ? 'border-accent bg-card'
                      : 'border-border bg-card hover:border-border-light'
                  }`}
                >
                  <div className="text-sm font-medium text-primary mb-2">{plan.name}</div>
                  <div className="font-heading text-3xl text-primary leading-none mb-4">
                    ${plan.monthly}
                    <span className="text-base text-muted font-normal">/mo</span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5" className="shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
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
                Submitting...
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
          <QuoteCalculator selectedPlan={form.plan} />
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
