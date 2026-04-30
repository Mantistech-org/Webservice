'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailStep {
  step_number: number
  days_after_enrollment: number
  subject: string
  body: string
}

interface Campaign {
  id: string
  name: string
  audience: 'all' | 'engaged'
  status: 'active' | 'paused'
  created_at: string
  emails: (EmailStep & { id: string })[]
  enrollmentCount: number
  sentCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function AudienceBadge({ audience }: { audience: string }) {
  const engaged = audience === 'engaged'
  return (
    <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${
      engaged
        ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5'
        : 'text-blue-700 dark:text-blue-400 border-blue-700/30 dark:border-blue-400/30 bg-blue-700/5 dark:bg-blue-400/5'
    }`}>
      {engaged ? 'Engaged Only' : 'All Leads'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${
      active
        ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5'
        : 'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30 bg-yellow-700/5 dark:bg-yellow-400/5'
    }`}>
      {active ? 'Active' : 'Paused'}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AutomatedEmailsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'builder' | 'campaigns' | 'results'>('builder')

  // ── Shared campaign data ───────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/automated-emails')
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  return (
    <div className="flex-1 min-w-0 px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-5xl text-primary mb-2">Automated Emails</h1>
        <p className="font-mono text-sm text-muted">Drip campaigns that enroll demo leads automatically.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {([
          { key: 'builder',   label: 'Campaign Builder' },
          { key: 'campaigns', label: 'Active Campaigns' },
          { key: 'results',   label: 'Results' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-mono text-xs tracking-wider px-5 py-2.5 -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? 'border-accent text-emerald-700 dark:text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'builder'   && <BuilderTab onCreated={loadCampaigns} router={router} />}
      {tab === 'campaigns' && <CampaignsTab campaigns={campaigns} loading={loading} onRefresh={loadCampaigns} router={router} />}
      {tab === 'results'   && <ResultsTab  campaigns={campaigns} loading={loading} onRefresh={loadCampaigns} />}
    </div>
  )
}

// ── Tab 1: Campaign Builder ───────────────────────────────────────────────────

function emptyStep(stepNumber: number): EmailStep {
  return { step_number: stepNumber, days_after_enrollment: 0, subject: '', body: '' }
}

const PREVIEW_BUSINESS = 'Riverside Heating and Cooling'

function renderPreviewHtml(body: string): string {
  const personalized = body
    .replace(/\[Business Name\]/g, PREVIEW_BUSINESS)
    .replace(/\[business name\]/g, PREVIEW_BUSINESS)
  return personalized
    .split('\n')
    .map(line => line.trim() === ''
      ? '<br>'
      : `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#222;font-family:Georgia,serif;">${line}</p>`)
    .join('')
}

function BuilderTab({ onCreated, router }: { onCreated: () => void; router: ReturnType<typeof useRouter> }) {
  const [name, setName] = useState('')
  const [audience, setAudience] = useState<'all' | 'engaged'>('all')
  const [steps, setSteps] = useState<EmailStep[]>([emptyStep(1)])
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState<Set<number>>(new Set())

  const updateStep = (index: number, field: keyof EmailStep, value: string | number) => {
    setSteps((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const addStep = () => {
    setSteps((prev) => [...prev, emptyStep(prev.length + 1)])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.map((s, i) => ({ ...s, step_number: i + 1 }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/admin/automated-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, audience, emails: steps }),
      })
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign.')
      setSuccess(true)
      setName('')
      setAudience('all')
      setSteps([emptyStep(1)])
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Campaign meta */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div>
          <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Campaign Name</label>
          <input
            type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input w-full" placeholder="e.g. New Lead Welcome Sequence" />
        </div>
        <div>
          <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'all' | 'engaged')}
            className="form-input w-full">
            <option value="all">All Demo Leads</option>
            <option value="engaged">Engaged Leads Only</option>
          </select>
        </div>
      </div>

      {/* Email steps */}
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted tracking-widest uppercase">
                Email {step.step_number}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewOpen((prev) => {
                    const next = new Set(prev)
                    if (next.has(i)) next.delete(i); else next.add(i)
                    return next
                  })}
                  className="font-mono text-xs text-muted hover:text-primary border border-border rounded px-3 py-1 transition-colors">
                  {previewOpen.has(i) ? 'Hide Preview' : 'Preview'}
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="font-mono text-xs text-red-600 dark:text-red-400 hover:opacity-70 transition-opacity">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
                Days After Enrollment
              </label>
              <input
                type="number" min={0} required
                value={step.days_after_enrollment}
                onChange={(e) => updateStep(i, 'days_after_enrollment', Number(e.target.value))}
                className="form-input w-32"
                placeholder="0" />
              <p className="font-mono text-xs text-muted mt-1">
                {step.days_after_enrollment === 0 ? 'Sends immediately on enrollment' : `Sends ${step.days_after_enrollment} day${step.days_after_enrollment !== 1 ? 's' : ''} after enrollment`}
              </p>
            </div>
            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Subject</label>
              <input
                type="text" required value={step.subject}
                onChange={(e) => updateStep(i, 'subject', e.target.value)}
                className="form-input w-full" placeholder="Email subject line" />
            </div>
            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Body</label>
              <textarea
                required rows={6} value={step.body}
                onChange={(e) => updateStep(i, 'body', e.target.value)}
                className="form-input w-full resize-y"
                placeholder="Write your email body here..." />
            </div>
            {previewOpen.has(i) && (
              <div style={{
                backgroundColor: '#f9f9f9',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 6,
                padding: '24px',
                marginTop: 12,
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 16, fontFamily: 'monospace' }}>
                  {step.subject || '(no subject)'}
                </p>
                <div
                  dangerouslySetInnerHTML={{ __html: renderPreviewHtml(step.body) || '<p style="margin:0;font-size:15px;color:#999;font-family:Georgia,serif;">(no body)</p>' }}
                />
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addStep}
          className="font-mono text-xs text-muted hover:text-primary border border-border rounded px-4 py-2 transition-colors tracking-wider">
          + Add Another Email
        </button>
      </div>

      {error && <p className="font-mono text-xs text-red-700 dark:text-red-400">{error}</p>}
      {success && (
        <div className="font-mono text-xs text-emerald-700 dark:text-accent border border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5 px-4 py-3 rounded">
          Campaign created and now active.
        </div>
      )}

      <button
        type="submit" disabled={creating}
        className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60">
        {creating ? 'Creating...' : 'Create Campaign'}
      </button>
    </form>
  )
}

// ── Tab 2: Active Campaigns ───────────────────────────────────────────────────

function CampaignsTab({
  campaigns, loading, onRefresh, router,
}: {
  campaigns: Campaign[]
  loading: boolean
  onRefresh: () => void
  router: ReturnType<typeof useRouter>
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleStatus = async (c: Campaign) => {
    setToggling(c.id)
    try {
      const res = await fetch(`/api/admin/automated-emails/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: c.status === 'active' ? 'paused' : 'active' }),
      })
      if (res.status === 401) { router.push('/admin'); return }
      if (res.ok) onRefresh()
    } finally {
      setToggling(null)
    }
  }

  const deleteCampaign = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/automated-emails/${id}`, { method: 'DELETE' })
      if (res.status === 401) { router.push('/admin'); return }
      if (res.ok) { setConfirmDelete(null); onRefresh() }
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <div className="text-center py-16 font-mono text-sm text-muted">Loading campaigns...</div>
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 font-mono text-sm text-muted">
        No campaigns yet. Use the Campaign Builder tab to create one.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onRefresh} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
          Refresh
        </button>
      </div>

      {campaigns.map((c) => (
        <div key={c.id} className="bg-card border border-border rounded-lg shadow-sm dark:shadow-none">
          {/* Card header */}
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h3 className="font-heading text-xl text-primary">{c.name}</h3>
                <AudienceBadge audience={c.audience} />
                <StatusBadge status={c.status} />
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-muted flex-wrap">
                <span>{c.emails.length} email{c.emails.length !== 1 ? 's' : ''} in sequence</span>
                <span>{c.enrollmentCount} enrolled</span>
                <span>{c.sentCount} sent</span>
                <span>Created {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleExpand(c.id)}
                className="font-mono text-xs text-muted hover:text-primary border border-border rounded px-3 py-1.5 transition-colors">
                {expanded.has(c.id) ? 'Collapse' : 'Expand'}
              </button>
              <button
                onClick={() => toggleStatus(c)}
                disabled={toggling === c.id}
                className="font-mono text-xs text-muted hover:text-primary border border-border rounded px-3 py-1.5 transition-colors disabled:opacity-50">
                {toggling === c.id ? '...' : c.status === 'active' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => setConfirmDelete(c.id)}
                className="font-mono text-xs text-red-600 dark:text-red-400 hover:opacity-70 border border-red-600/30 dark:border-red-400/30 rounded px-3 py-1.5 transition-opacity">
                Delete
              </button>
            </div>
          </div>

          {/* Expanded email sequence */}
          {expanded.has(c.id) && c.emails.length > 0 && (
            <div className="border-t border-border px-6 py-4 space-y-3">
              <p className="font-mono text-xs text-muted tracking-widest uppercase mb-3">Email Sequence</p>
              {c.emails.map((email) => (
                <div key={email.id} className="bg-bg border border-border rounded p-4">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-xs font-medium text-primary">Step {email.step_number}</span>
                    <span className="font-mono text-xs text-muted">
                      {email.days_after_enrollment === 0
                        ? 'Immediately'
                        : `Day ${email.days_after_enrollment}`}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-primary mb-1">{email.subject}</p>
                  <p className="font-mono text-xs text-muted line-clamp-2">{email.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Delete confirmation inline */}
          {confirmDelete === c.id && (
            <div className="border-t border-border px-6 py-4 bg-red-700/5 dark:bg-red-400/5 flex items-center gap-4">
              <p className="font-mono text-xs text-red-700 dark:text-red-400 flex-1">
                Delete &ldquo;{c.name}&rdquo;? This cannot be undone.
              </p>
              <button
                onClick={() => deleteCampaign(c.id)}
                disabled={deleting === c.id}
                className="font-mono text-xs bg-red-600 dark:bg-red-500 text-white px-4 py-1.5 rounded hover:opacity-80 transition-opacity disabled:opacity-50">
                {deleting === c.id ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="font-mono text-xs text-muted hover:text-primary transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Tab 3: Results ────────────────────────────────────────────────────────────

function ResultsTab({
  campaigns, loading, onRefresh,
}: {
  campaigns: Campaign[]
  loading: boolean
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (loading) {
    return <div className="text-center py-16 font-mono text-sm text-muted">Loading results...</div>
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 font-mono text-sm text-muted">
        No campaign data yet.
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={onRefresh} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
          Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm dark:shadow-none">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {['Campaign Name', 'Audience', 'Enrollments', 'Emails Sent', 'Completion Rate', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => {
              const maxPossibleSends = c.enrollmentCount * c.emails.length
              const completionRate = maxPossibleSends > 0
                ? Math.round((c.sentCount / maxPossibleSends) * 100)
                : 0
              const isExpanded = expanded.has(c.id)
              const isLast = i === campaigns.length - 1

              return (
                <>
                  <tr
                    key={c.id}
                    onClick={() => toggleExpand(c.id)}
                    className={`cursor-pointer hover:bg-black/3 dark:hover:bg-white/3 transition-colors ${!isLast || isExpanded ? 'border-b border-border' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-3 h-3 text-muted shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="font-mono text-sm text-primary">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><AudienceBadge audience={c.audience} /></td>
                    <td className="px-5 py-4 font-mono text-sm text-primary">{c.enrollmentCount}</td>
                    <td className="px-5 py-4 font-mono text-sm text-primary">{c.sentCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted">{completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${c.id}-expanded`} className={!isLast ? 'border-b border-border' : ''}>
                      <td colSpan={6} className="px-5 py-4 bg-bg">
                        {c.emails.length === 0 ? (
                          <p className="font-mono text-xs text-muted">No emails in this campaign.</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-mono text-xs text-muted tracking-widest uppercase mb-3">Email Steps</p>
                            {c.emails.map((email) => (
                              <div key={email.id} className="flex items-start gap-4 bg-card border border-border rounded p-3">
                                <div className="shrink-0 text-center">
                                  <div className="font-mono text-xs font-medium text-primary">Step {email.step_number}</div>
                                  <div className="font-mono text-xs text-muted">
                                    {email.days_after_enrollment === 0 ? 'Day 0' : `Day ${email.days_after_enrollment}`}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-mono text-xs font-medium text-primary truncate">{email.subject}</p>
                                  <p className="font-mono text-xs text-muted line-clamp-1 mt-0.5">{email.body}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
