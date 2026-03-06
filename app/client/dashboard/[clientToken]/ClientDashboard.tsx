'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { PLANS, ADDONS, PLAN_INCLUDED_ADDONS, Plan, ChangeRequest, ClientNotification } from '@/types'

interface ProjectData {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  plan: Plan
  status: string
  addons: string[]
  clientToken: string
  hasGeneratedHtml: boolean
  changeRequests: ChangeRequest[]
  notifications: ClientNotification[]
  upsellClicks: string[]
  stripeAddonSubscriptions: string[]
  stripeCustomerId?: string
}

export default function ClientDashboard() {
  const { clientToken } = useParams<{ clientToken: string }>()
  const searchParams = useSearchParams()

  const [project, setProject] = useState<ProjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [changeMessage, setChangeMessage] = useState('')
  const [submittingChange, setSubmittingChange] = useState(false)
  const [changeSuccess, setChangeSuccess] = useState(false)
  const [creatingCheckout, setCreatingCheckout] = useState('')
  const [editContactOpen, setEditContactOpen] = useState(false)
  const [editOwnerName, setEditOwnerName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)
  const [openingPortal, setOpeningPortal] = useState(false)

  const successMsg =
    searchParams.get('payment') === 'success'
      ? 'Payment confirmed. Your plan is now active.'
      : searchParams.get('addon') === 'success'
      ? 'Add-on activated successfully.'
      : searchParams.get('upgrade') === 'success'
      ? 'Plan upgraded successfully.'
      : null

  const fetchProject = () =>
    fetch(`/api/client/${clientToken}/project`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setProject(data.project)
      })
      .catch(() => setError('Failed to load your dashboard.'))
      .finally(() => setLoading(false))

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientToken])

  const handleUpgradePlan = async (newPlan: Plan) => {
    setCreatingCheckout(`upgrade:${newPlan}`)
    try {
      const res = await fetch(`/api/client/${clientToken}/upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'upgrade', newPlan }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch {
      // noop
    } finally {
      setCreatingCheckout('')
    }
  }

  const handleAddonSubscribe = async (addonId: string, addonLabel: string) => {
    setCreatingCheckout(`addon:${addonId}`)
    try {
      const res = await fetch(`/api/client/${clientToken}/upsell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'addon', addonId, addonLabel }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    } catch {
      // noop
    } finally {
      setCreatingCheckout('')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch(`/api/client/${clientToken}/mark-read`, { method: 'POST' })
      setProject((prev) => prev ? { ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })) } : prev)
    } catch {
      // noop
    }
  }

  const handleOpenEditContact = () => {
    setEditOwnerName(project?.ownerName ?? '')
    setEditEmail(project?.email ?? '')
    setEditPhone(project?.phone ?? '')
    setEditContactOpen(true)
    setContactSaved(false)
  }

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingContact(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/update-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName: editOwnerName, email: editEmail, phone: editPhone }),
      })
      if (res.ok) {
        setContactSaved(true)
        setEditContactOpen(false)
        await fetchProject()
      }
    } finally {
      setSavingContact(false)
    }
  }

  const handleManageBilling = async () => {
    setOpeningPortal(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/billing-portal`, { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setOpeningPortal(false)
    }
  }

  const handleSubmitChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!changeMessage.trim()) return
    setSubmittingChange(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: changeMessage }),
      })
      if (res.ok) {
        setChangeSuccess(true)
        setChangeMessage('')
        await fetchProject()
      }
    } finally {
      setSubmittingChange(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Loading your dashboard...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <p className="font-mono text-sm text-red-400">{error || 'Dashboard unavailable.'}</p>
      </div>
    )
  }

  const plan = PLANS[project.plan]
  const includedAddonIds = PLAN_INCLUDED_ADDONS[project.plan]
  const upsellAddons = ADDONS.filter(
    (a) => !includedAddonIds.includes(a.id) && !project.stripeAddonSubscriptions.includes(a.id)
  )
  const nextPlan: Plan | null =
    project.plan === 'starter' ? 'mid' : project.plan === 'mid' ? 'pro' : null
  const unreadCount = project.notifications.filter((n) => !n.read).length
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'support@mantistech.io'

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-heading text-xl tracking-widest text-white">MANTIS TECH</span>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <span className="font-mono text-xs bg-accent text-bg px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
            <a
              href={`mailto:${adminEmail}`}
              className="font-mono text-xs text-muted hover:text-accent transition-colors border border-border px-3 py-1.5 rounded"
            >
              Contact Support
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {successMsg && (
          <div className="bg-accent/5 border border-accent/20 rounded p-4 font-mono text-sm text-accent">
            {successMsg}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl text-white">{project.businessName}</h1>
            <p className="font-mono text-sm text-muted mt-1">Welcome back, {project.ownerName}</p>
          </div>
          <span
            className={`font-mono text-xs border px-3 py-1 rounded-full shrink-0 ${
              project.status === 'active'
                ? 'text-accent border-accent/30 bg-accent/5'
                : project.status === 'client_review'
                ? 'text-blue-400 border-blue-400/30 bg-blue-400/5'
                : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5'
            }`}
          >
            {project.status === 'active'
              ? 'Active'
              : project.status === 'client_review'
              ? 'Ready for Review'
              : 'In Progress'}
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left: preview + change request + performance */}
          <div className="xl:col-span-2 space-y-6">
            {/* Website Preview */}
            <div className="bg-card border border-border rounded overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-heading text-xl text-white">Website Preview</h2>
                <a
                  href={`/api/preview/${project.clientToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-muted hover:text-accent transition-colors"
                >
                  Open full screen &rarr;
                </a>
              </div>
              <div style={{ height: '60vh' }}>
                <iframe
                  src={`/api/preview/${project.clientToken}`}
                  className="w-full h-full"
                  title={`${project.businessName} preview`}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>

            {/* Change Request Form */}
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-heading text-xl text-white mb-1">Request a Change</h2>
              <p className="font-mono text-xs text-muted mb-5">
                Describe what you would like updated on your website.
              </p>
              <form onSubmit={handleSubmitChange} className="space-y-3">
                <textarea
                  rows={4}
                  value={changeMessage}
                  onChange={(e) => setChangeMessage(e.target.value)}
                  placeholder="E.g. Update the hero headline, change the contact form fields, add a new section about our team..."
                  className="form-input resize-none w-full text-sm"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingChange || !changeMessage.trim()}
                  className="font-mono text-sm bg-accent text-bg px-6 py-2.5 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60"
                >
                  {submittingChange ? 'Submitting...' : 'Submit Request'}
                </button>
                {changeSuccess && (
                  <p className="font-mono text-xs text-accent">
                    Request submitted. We will be in touch within 24 hours.
                  </p>
                )}
              </form>

              {project.changeRequests.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-mono text-xs text-muted uppercase tracking-widest">
                    Previous Requests
                  </h3>
                  {project.changeRequests.map((req) => (
                    <div key={req.id} className="border border-border rounded p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-xs border px-2 py-0.5 rounded-full ${
                            req.status === 'resolved'
                              ? 'text-accent border-accent/30'
                              : 'text-yellow-400 border-yellow-400/30'
                          }`}
                        >
                          {req.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                        <span className="font-mono text-xs text-dim">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-teal">{req.message}</p>
                      {req.adminResponse && (
                        <div className="bg-bg border border-border rounded p-3">
                          <div className="font-mono text-xs text-accent mb-1">Team Response</div>
                          <p className="text-sm text-white">{req.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Report */}
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-heading text-xl text-white mb-1">Monthly Performance Report</h2>
              <div className="mt-4 bg-bg border border-border rounded p-8 text-center">
                <p className="font-mono text-sm text-muted">
                  Your first report will arrive within 30 days of your site going live.
                </p>
                <p className="font-mono text-xs text-dim mt-2">
                  Reports include traffic, leads captured, and SEO rankings.
                </p>
              </div>
            </div>
          </div>

          {/* Right: plan info, upsells, notifications */}
          <div className="space-y-6">
            {/* Plan Info */}
            <div className="bg-card border border-border rounded p-6">
              <h2 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                Current Plan
              </h2>
              <div className="font-heading text-3xl text-white mb-3">{plan.name}</div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-mono">Upfront paid</span>
                  <span className="text-white font-mono">${plan.upfront}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-mono">Monthly rate</span>
                  <span className="text-accent font-mono">${plan.monthly}/mo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-mono">Page limit</span>
                  <span className="text-white font-mono">Up to {plan.pages} pages</span>
                </div>
              </div>

              {nextPlan ? (
                <>
                  <div className="h-px bg-border mb-4" />
                  <p className="font-mono text-xs text-muted mb-3">
                    Upgrade to {PLANS[nextPlan].name} for more pages and features.
                  </p>
                  <button
                    onClick={() => handleUpgradePlan(nextPlan)}
                    disabled={!!creatingCheckout}
                    className="w-full font-mono text-sm border border-accent text-accent py-2.5 rounded hover:bg-accent hover:text-bg transition-all disabled:opacity-60"
                  >
                    {creatingCheckout === `upgrade:${nextPlan}`
                      ? 'Loading...'
                      : `Upgrade to ${PLANS[nextPlan].name} for $${PLANS[nextPlan].monthly}/mo`}
                  </button>
                </>
              ) : project.stripeCustomerId ? (
                <>
                  <div className="h-px bg-border mb-4" />
                  <button
                    onClick={handleManageBilling}
                    disabled={openingPortal}
                    className="w-full font-mono text-sm border border-border text-muted py-2.5 rounded hover:border-accent hover:text-accent transition-all disabled:opacity-60"
                  >
                    {openingPortal ? 'Loading...' : 'Manage Billing'}
                  </button>
                </>
              ) : null}
            </div>

            {/* Edit Contact Info */}
            <div className="bg-card border border-border rounded p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs text-accent tracking-widest uppercase">Contact Info</h2>
                <button
                  onClick={handleOpenEditContact}
                  className="font-mono text-xs text-muted hover:text-accent transition-colors"
                >
                  Edit
                </button>
              </div>
              {editContactOpen ? (
                <form onSubmit={handleSaveContact} className="space-y-3">
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1">Name</label>
                    <input type="text" required value={editOwnerName} onChange={(e) => setEditOwnerName(e.target.value)} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1">Email</label>
                    <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-1">Phone</label>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="form-input text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingContact} className="font-mono text-xs bg-accent text-bg px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                      {savingContact ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditContactOpen(false)} className="font-mono text-xs border border-border text-muted px-4 py-2 rounded hover:border-border-light transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-white">{project.ownerName}</div>
                  <div className="text-muted">{project.email}</div>
                  {project.phone && <div className="text-muted">{project.phone}</div>}
                  {contactSaved && <p className="text-xs text-accent">Contact info updated.</p>}
                </div>
              )}
            </div>

            {/* Upsell Add-ons */}
            {upsellAddons.length > 0 && (
              <div className="bg-card border border-border rounded p-6">
                <h2 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                  Available Add-ons
                </h2>
                <div className="space-y-3">
                  {upsellAddons.map((addon) => (
                    <div key={addon.id} className="border border-border rounded p-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm text-white font-medium">{addon.label}</div>
                        <div className="font-mono text-sm text-accent shrink-0">
                          ${addon.price}/mo
                        </div>
                      </div>
                      <p className="text-xs text-muted mb-3">{addon.description}</p>
                      <button
                        onClick={() => handleAddonSubscribe(addon.id, addon.label)}
                        disabled={!!creatingCheckout}
                        className="w-full font-mono text-xs border border-border text-teal py-2 rounded hover:border-accent hover:text-accent transition-all disabled:opacity-60"
                      >
                        {creatingCheckout === `addon:${addon.id}` ? 'Loading...' : 'Subscribe'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notification Center */}
            <div className="bg-card border border-border rounded p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xs text-accent tracking-widest uppercase">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="font-mono text-xs bg-accent text-bg px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  >
                    {unreadCount} new — Mark read
                  </button>
                )}
              </div>
              {project.notifications.length > 0 ? (
                <div className="space-y-3">
                  {[...project.notifications].reverse().map((notif) => (
                    <div
                      key={notif.id}
                      className={`border rounded p-3 ${
                        notif.read ? 'border-border' : 'border-accent/40 bg-accent/5'
                      }`}
                    >
                      <p className="text-sm text-white">{notif.message}</p>
                      <p className="font-mono text-xs text-dim mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-dim">No notifications yet.</p>
              )}
            </div>

            {/* Support */}
            <a
              href={`mailto:${adminEmail}`}
              className="block w-full text-center font-mono text-sm border border-border text-muted py-3 rounded hover:border-accent hover:text-accent transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
