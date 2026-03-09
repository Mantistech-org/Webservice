'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ProjectStatus, Plan, PLANS, ADDONS } from '@/types'

interface ProjectInfo {
  businessName: string
  ownerName: string
  email: string
  plan: Plan
  status: ProjectStatus
  addons: string[]
  clientToken: string
  stripeSessionId: string | null
}

export default function ClientReviewContent() {
  const { clientToken } = useParams<{ clientToken: string }>()
  const searchParams = useSearchParams()
  const paymentStatus = searchParams.get('payment')

  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState(false)
  const [actionMsg, setActionMsg] = useState('')
  const [changeMessage, setChangeMessage] = useState('')
  const [submittingChange, setSubmittingChange] = useState(false)
  const [changeSubmitted, setChangeSubmitted] = useState(false)
  const [changeError, setChangeError] = useState('')

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/${clientToken}/project`)
      if (!res.ok) {
        setError('This review link is invalid or has expired.')
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

  useEffect(() => {
    if (paymentStatus === 'cancelled') {
      setActionMsg('Payment was cancelled. You can still approve and proceed to checkout below.')
    }
  }, [paymentStatus])

  const handleApprove = async () => {
    setApproving(true)
    setActionMsg('')
    try {
      const res = await fetch(`/api/client/${clientToken}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        setActionMsg(data.error ?? 'Failed to start checkout. Please try again.')
        setApproving(false)
      }
    } catch {
      setActionMsg('Network error. Please try again.')
      setApproving(false)
    }
  }

  const handleChangeRequest = async () => {
    if (!changeMessage.trim()) return
    setSubmittingChange(true)
    setChangeError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: changeMessage.trim() }),
      })
      if (res.ok) {
        setChangeSubmitted(true)
        setChangeMessage('')
      } else {
        const data = await res.json()
        setChangeError(data.error ?? 'Failed to submit. Please try again.')
        setSubmittingChange(false)
      }
    } catch {
      setChangeError('Network error. Please try again.')
      setSubmittingChange(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Loading your preview...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-primary mb-4">Link Not Found</h1>
          <p className="font-mono text-sm text-muted leading-relaxed">
            {error || 'This review link is invalid or has expired. Please contact us for assistance.'}
          </p>
        </div>
      </div>
    )
  }

  const plan = PLANS[project.plan]
  const activeAddons = ADDONS.filter((a) => project.addons.includes(a.id))
  const monthlyTotal = plan.monthly + activeAddons.reduce((sum, a) => sum + a.price, 0)

  if (paymentStatus === 'success' || project.status === 'active') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-lg">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="font-mono text-xs text-primary tracking-widest uppercase mb-2">
            Payment Confirmed
          </div>
          <h1 className="font-heading text-5xl text-primary mb-4">You Are Live</h1>
          <p className="text-teal leading-relaxed mb-2">
            Welcome to Mantis Tech, {project.ownerName}. Your{' '}
            <span className="text-primary capitalize">{plan.name}</span> plan is now active.
          </p>
          <p className="font-mono text-sm text-muted">
            Our team will be in touch within 24 hours with your next steps.
          </p>
          <div className="mt-8 p-4 bg-card border border-border rounded font-mono text-xs text-muted">
            Confirmation sent to <span className="text-teal">{project.email}</span>
          </div>
        </div>
      </div>
    )
  }

  if (project.status !== 'client_review' && project.status !== 'changes_requested') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl text-primary mb-4">Not Ready Yet</h1>
          <p className="font-mono text-sm text-muted leading-relaxed">
            Your website is still being reviewed by our team. You will receive an email when it is
            ready for your approval.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-heading text-xl tracking-widest text-primary">MANTIS TECH</span>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <a
            href="tel:+15016690488"
            className="font-mono text-xs text-muted hover:text-teal transition-colors"
          >
            (501) 669-0488
          </a>
          <div className="font-mono text-xs text-muted hidden sm:block">
            Website Preview for <span className="text-teal">{project.businessName}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col xl:flex-row" style={{ minHeight: 0 }}>
        {/* Preview iframe */}
        <div className="flex-1 relative" style={{ minHeight: '60vh' }}>
          <iframe
            src={`/api/preview/${clientToken}`}
            className="absolute inset-0 w-full h-full border-0"
            title={`Preview: ${project.businessName}`}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>

        {/* Approval sidebar */}
        <div className="xl:w-80 shrink-0 bg-card border-t xl:border-t-0 xl:border-l border-border overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <div className="font-mono text-xs text-primary tracking-widest uppercase mb-1">
                Your Preview
              </div>
              <h2 className="font-heading text-3xl text-primary">{project.businessName}</h2>
              <p className="font-mono text-xs text-muted mt-1">
                Hi {project.ownerName}, this is your custom website.
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Order summary */}
            <div>
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
                Order Summary
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-teal capitalize">{plan.name} Plan</span>
                  <span className="font-mono text-primary">${plan.upfront} upfront</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal">Base website</span>
                  <span className="font-mono text-primary">${plan.monthly}/mo</span>
                </div>
                {activeAddons.map((a) => (
                  <div key={a.id} className="flex justify-between">
                    <span className="text-teal text-xs">{a.label}</span>
                    <span className="font-mono text-xs text-primary">+${a.price}/mo</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-mono text-xs text-muted uppercase">Monthly</div>
                    <div className="font-heading text-3xl text-primary">
                      ${monthlyTotal}
                      <span className="font-mono text-sm text-muted font-normal">/mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xs text-muted uppercase">Due Now</div>
                    <div className="font-heading text-2xl text-primary">${plan.upfront}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Approve section */}
            <div>
              {project.status === 'changes_requested' && !changeSubmitted ? (
                <div className="text-center py-4">
                  <p className="font-mono text-sm text-orange-600 font-semibold">
                    Changes requested
                  </p>
                  <p className="font-mono text-xs text-muted mt-1">
                    Our team is reviewing your feedback and will send you an updated preview shortly.
                  </p>
                </div>
              ) : changeSubmitted ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-mono text-sm text-primary font-semibold">
                    Your request has been submitted.
                  </p>
                  <p className="font-mono text-xs text-muted mt-1">
                    We will be in touch shortly.
                  </p>
                </div>
              ) : project.stripeSessionId ? (
                <div className="text-center py-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="font-mono text-sm text-primary font-semibold">
                    You have already approved this site.
                  </p>
                  <p className="font-mono text-xs text-muted mt-1">
                    Complete your payment in the checkout tab, or contact us if you need help.
                  </p>
                </div>
              ) : (
                <>
                  <p className="font-mono text-xs text-muted leading-relaxed mb-4">
                    Review your website above. If everything looks good, click below to approve and
                    proceed to checkout.
                  </p>

                  {actionMsg && (
                    <div className="mb-3 font-mono text-xs text-orange-400 bg-orange-400/5 border border-orange-400/20 rounded px-3 py-2">
                      {actionMsg}
                    </div>
                  )}

                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full bg-accent text-black font-mono text-sm py-3 px-6 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60 glow-accent flex items-center justify-center gap-2"
                  >
                    {approving ? (
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
                          <path
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            strokeOpacity="0.3"
                          />
                          <path d="M21 12a9 9 0 00-9-9" />
                        </svg>
                        Redirecting to Checkout...
                      </>
                    ) : (
                      <>
                        Approve and Proceed to Checkout
                        <span>&rarr;</span>
                      </>
                    )}
                  </button>

                  <p className="font-mono text-xs text-muted text-center mt-3">
                    Secure payment powered by Stripe
                  </p>
                </>
              )}
            </div>

            {/* Request Changes section */}
            {!changeSubmitted && project.status === 'client_review' && (
              <>
                <div className="h-px bg-border" />

                <div>
                  <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">
                    Request Changes
                  </div>
                  <textarea
                    value={changeMessage}
                    onChange={(e) => setChangeMessage(e.target.value)}
                    placeholder="Describe what you would like changed..."
                    rows={4}
                    className="w-full bg-bg border border-border rounded px-3 py-2 font-mono text-xs text-primary placeholder-muted resize-none focus:outline-none focus:border-accent/50 transition-colors"
                  />
                  {changeError && (
                    <p className="font-mono text-xs text-orange-400 mt-2">{changeError}</p>
                  )}
                  <button
                    onClick={handleChangeRequest}
                    disabled={submittingChange || !changeMessage.trim()}
                    className="mt-3 w-full border border-border text-muted font-mono text-sm py-2 px-4 rounded tracking-wider hover:border-orange-400/50 hover:text-orange-400 transition-all disabled:opacity-40"
                  >
                    {submittingChange ? 'Submitting...' : 'Submit Change Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
