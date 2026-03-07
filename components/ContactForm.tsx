'use client'

import { useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong. Please try again.')
      }

      setSubmitState('success')
    } catch (err) {
      setSubmitState('error')
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    }
  }

  const inputClass =
    'w-full bg-card border border-border text-primary rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent transition-colors'

  if (submitState === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00ff88"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-heading text-4xl text-primary mb-4">Message Sent</h2>
        <p className="text-muted leading-relaxed">
          Thank you for reaching out. We will be in touch within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-24 px-6">
      <div className="mb-10">
        <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
          Get In Touch
        </p>
        <h1 className="font-heading text-[clamp(2.5rem,6vw,4rem)] leading-tight text-primary">
          Contact Us
        </h1>
        <p className="mt-4 text-muted leading-relaxed">
          Have a question or want to learn more about what we offer? Send us a message and we will get
          back to you promptly.
        </p>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4 p-5 bg-card border border-border rounded-lg">
        <div>
          <p className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
            Email
          </p>
          <a
            href="mailto:hello@mantistech.io"
            className="font-mono text-sm text-accent hover:underline underline-offset-4"
          >
            hello@mantistech.io
          </a>
        </div>
        <div className="hidden sm:block w-px bg-border" aria-hidden="true" />
        <div>
          <p className="font-mono text-xs text-muted tracking-widest uppercase mb-1">
            Response Time
          </p>
          <p className="font-mono text-sm text-primary">
            Within 24 hours
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us how we can help..."
            className={`${inputClass} resize-none`}
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
          className="w-full bg-accent text-black font-mono font-medium text-sm py-4 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {submitState === 'submitting' ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
                <path d="M21 12a9 9 0 00-9-9" />
              </svg>
              Sending...
            </>
          ) : (
            <>
              Send Message
              <span aria-hidden="true">&rarr;</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}
