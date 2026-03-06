'use client'

import { useState } from 'react'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export default function ClientLoginForm() {
  const [email, setEmail] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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

  if (submitState === 'success') {
    return (
      <div className="w-full max-w-sm text-center py-16">
        <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#00ff88"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="font-heading text-3xl text-primary mb-3">Check Your Inbox</h2>
        <p className="text-sm text-muted leading-relaxed">
          If that email matches an account, we have sent your dashboard link. Check your inbox
          and follow the link to access your dashboard.
        </p>
        <p className="font-mono text-xs text-dim mt-4">
          Be sure to check your spam folder if you do not see it within a few minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm py-16">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-heading text-lg text-primary">Mantis Tech</span>
        </div>
        <h1 className="font-heading text-3xl text-primary mb-3">
          Access Your Dashboard
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Enter the email address you used when signing up and we will resend your dashboard
          link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-card border border-border text-primary rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
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
          className="w-full bg-accent text-black font-mono font-medium text-sm py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            'Send My Dashboard Link'
          )}
        </button>
      </form>

      <p className="text-center font-mono text-xs text-dim mt-6">
        New to Mantis Tech?{' '}
        <a href="/intake" className="text-muted hover:text-accent transition-colors underline underline-offset-4">
          Start a project
        </a>
        .
      </p>
    </div>
  )
}
