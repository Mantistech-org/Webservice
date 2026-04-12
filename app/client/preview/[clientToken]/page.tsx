'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const PLATFORM_FEATURES = [
  'Weather Activation System',
  'Missed Call Auto-Reply',
  'Review Management',
  'SEO Optimization',
  'SMS and Text Marketing',
  'Automated Email Marketing',
  'Google Business Profile Management',
  'Booking Calendar',
  'Monthly Performance Report',
  'AI Website Editor',
]

interface ProjectInfo {
  businessName: string
  ownerName: string
  email: string
}

export default function ClientPreviewPage() {
  const { clientToken } = useParams<{ clientToken: string }>()
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeError, setSubscribeError] = useState('')

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/${clientToken}/project`)
      if (!res.ok) {
        setError('This link is invalid or has expired.')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('Failed to load your project.')
    } finally {
      setLoading(false)
    }
  }, [clientToken])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleSubscribe = async () => {
    setSubscribing(true)
    setSubscribeError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setSubscribeError(data.error ?? 'Failed to start checkout. Please try again.')
        setSubscribing(false)
      }
    } catch {
      setSubscribeError('Network error. Please try again.')
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-sm text-muted">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="border-b border-border">
        <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-heading text-xl text-primary">Mantis Tech</span>
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-20">
        {/* Headline */}
        <div className="mb-12">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            Platform Only
          </div>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary mb-4">
            Your Platform is Ready, {project?.businessName}
          </h1>
          <p className="font-mono text-sm text-muted leading-relaxed">
            Here is everything included in your Platform Only subscription.
          </p>
        </div>

        {/* Features card */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <ul className="space-y-4">
            {PLATFORM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00C27C"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-mono text-sm text-primary">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-8 border-t border-border flex items-baseline gap-2">
            <span className="font-heading text-5xl text-primary">$199</span>
            <span className="font-mono text-sm text-muted">/mo</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={subscribing}
          className="w-full bg-accent text-black font-mono font-medium text-base py-4 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {subscribing ? 'Redirecting to checkout...' : 'Subscribe Now'}
        </button>

        {subscribeError && (
          <p className="font-mono text-xs text-red-400 mt-3 text-center">{subscribeError}</p>
        )}

        <p className="font-mono text-xs text-muted text-center mt-4">
          No contracts. Cancel anytime.
        </p>
      </main>
    </div>
  )
}
