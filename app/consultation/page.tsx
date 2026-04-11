'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const TIME_OPTIONS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

export default function ConsultationPage() {
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [message, setMessage] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, businessName, phone, email, preferredDate, preferredTime, message }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed. Please try again.')
      }
      setSubmitState('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
      setSubmitState('error')
    }
  }

  if (submitState === 'success') {
    return (
      <>
        <Nav />
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="font-heading text-4xl text-primary mb-4">
              Your consultation has been requested for {preferredDate} at {preferredTime}. We will confirm within 24 hours.
            </h2>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Nav />
      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="mb-10">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            Free Consultation
          </div>
          <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-primary mb-4">
            Schedule a Free Consultation
          </h1>
          <p className="text-muted max-w-xl leading-relaxed">
            Pick a date and time below and we will confirm your consultation within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className="form-input"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Business Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme HVAC"
              className="form-input"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="form-input"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acmehvac.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Preferred Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              required
              min={tomorrow}
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Preferred Time <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="form-input"
            >
              <option value="">Select a time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              What is your biggest challenge getting more HVAC jobs?
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your current situation..."
              className="form-input resize-none"
            />
          </div>

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
              'Request a Consultation'
            )}
          </button>
        </form>
      </main>
      <Footer />
    </>
  )
}
