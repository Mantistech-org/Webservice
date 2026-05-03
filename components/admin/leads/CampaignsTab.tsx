'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OutreachLead } from '@/types/leads'

interface EmailStep {
  step_number: number
  subject: string
  body: string
  delay_days: number
}

interface Campaign {
  id: string
  name: string
  description: string | null
  audience: 'all' | 'selected'
  selected_lead_ids: string[]
  status: string
  created_at: string
  email_steps: number
  leads_reached: number
  total_sends: number
}

interface CampaignDetail {
  campaign: Campaign
  email_steps: EmailStep[]
  sends: Array<{ id: string; lead_id: string; lead_email: string; step_number: number; sent_at: string; business_name: string | null }>
}

interface CampaignsTabProps {
  savedLeads: OutreachLead[]
}

const STATUS_COLOR: Record<string, string> = {
  draft:     'text-muted border-border',
  sending:   'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30',
  paused:    'text-muted border-border',
  completed: 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30',
}

const BLANK_STEP = (): EmailStep => ({ step_number: 1, subject: '', body: '', delay_days: 0 })

export default function CampaignsTab({ savedLeads }: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<CampaignDetail | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Create form
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formAudience, setFormAudience] = useState<'all' | 'selected'>('all')
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [emailSteps, setEmailSteps] = useState<EmailStep[]>([BLANK_STEP()])
  const [creating, setCreating] = useState(false)
  const [leadFilter, setLeadFilter] = useState('all')

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads/campaigns')
      const data = await res.json()
      if (res.ok) setCampaigns(data.campaigns ?? [])
      else setError(data.error ?? 'Failed to load campaigns.')
    } catch {
      setError('Failed to load campaigns.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const openDetail = async (campaign: Campaign) => {
    setDetail(null)
    setShowCreate(false)
    try {
      const res = await fetch(`/api/admin/leads/campaigns/${campaign.id}`)
      const data = await res.json()
      if (res.ok) setDetail(data)
    } catch {
      // non-fatal
    }
  }

  const handleSend = async (campaignId: string, stepNumber = 1) => {
    setSending(campaignId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/leads/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_number: stepNumber }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed.')
      setSuccessMsg(`Step ${stepNumber} sent to ${data.sent} lead${data.sent !== 1 ? 's' : ''}${data.skipped > 0 ? ` (${data.skipped} already sent)` : ''}.`)
      fetchCampaigns()
      if (detail) openDetail(detail.campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed.')
    } finally {
      setSending(null)
    }
  }

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    setDeleting(campaignId)
    setError('')
    try {
      await fetch(`/api/admin/leads/campaigns/${campaignId}`, { method: 'DELETE' })
      if (detail?.campaign.id === campaignId) setDetail(null)
      fetchCampaigns()
    } catch {
      setError('Delete failed.')
    } finally {
      setDeleting(null)
    }
  }

  const handlePause = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'paused' ? 'sending' : 'paused'
    await fetch(`/api/admin/leads/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchCampaigns()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { setError('Campaign name is required.'); return }
    if (emailSteps.some((s) => !s.subject.trim() || !s.body.trim())) {
      setError('All email steps require a subject and body.')
      return
    }
    if (formAudience === 'selected' && selectedLeadIds.size === 0) {
      setError('Select at least one lead.')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/leads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc || undefined,
          audience: formAudience,
          selected_lead_ids: formAudience === 'selected' ? Array.from(selectedLeadIds) : [],
          emails: emailSteps.map((s, i) => ({ ...s, step_number: i + 1 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign.')
      setSuccessMsg('Campaign created.')
      setShowCreate(false)
      resetForm()
      fetchCampaigns()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setFormAudience('all')
    setSelectedLeadIds(new Set())
    setEmailSteps([BLANK_STEP()])
    setLeadFilter('all')
  }

  const addStep = () => {
    setEmailSteps((prev) => [...prev, { ...BLANK_STEP(), step_number: prev.length + 1 }])
  }

  const removeStep = (i: number) => {
    setEmailSteps((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateStep = (i: number, field: keyof EmailStep, value: string | number) => {
    setEmailSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const leadsWithEmail = savedLeads.filter((l) => !!l.email && l.deleted_at === null)
  const leadCategories = ['all', ...Array.from(new Set(leadsWithEmail.map((l) => l.category).filter(Boolean))).sort()] as string[]
  const filteredLeads = leadFilter === 'all' ? leadsWithEmail : leadsWithEmail.filter((l) => l.category === leadFilter)

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-primary">Campaigns</h2>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="font-mono text-xs text-emerald-700 dark:text-accent">{successMsg}</span>
          )}
          <button
            onClick={() => { setShowCreate(!showCreate); setDetail(null); setError(''); setSuccessMsg('') }}
            className="font-mono text-xs px-4 py-2 rounded bg-accent text-black hover:opacity-90 transition-opacity"
          >
            {showCreate ? 'Cancel' : 'New Campaign'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create panel */}
      {showCreate && (
        <div className="bg-card border border-border rounded p-6">
          <h3 className="font-heading text-lg text-primary mb-5">Create Campaign</h3>
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Name + Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. May Plumbers Outreach"
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Optional note about this campaign"
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Audience */}
            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">
                Audience
              </label>
              <div className="flex items-center gap-6 mb-3">
                <label className="flex items-center gap-2 font-mono text-sm text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={formAudience === 'all'}
                    onChange={() => setFormAudience('all')}
                    className="accent-emerald-600"
                  />
                  All leads with an email address
                </label>
                <label className="flex items-center gap-2 font-mono text-sm text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="audience"
                    value="selected"
                    checked={formAudience === 'selected'}
                    onChange={() => setFormAudience('selected')}
                    className="accent-emerald-600"
                  />
                  Selected leads only
                </label>
              </div>

              {formAudience === 'selected' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-muted">{selectedLeadIds.size} selected</span>
                    <div className="flex items-center gap-3">
                      {leadCategories.length > 1 && (
                        <select
                          value={leadFilter}
                          onChange={(e) => setLeadFilter(e.target.value)}
                          className="bg-bg border border-border text-primary rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-accent"
                        >
                          {leadCategories.map((c) => (
                            <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const ids = filteredLeads.map((l) => l.id)
                          const allSel = ids.every((id) => selectedLeadIds.has(id))
                          setSelectedLeadIds((prev) => {
                            const next = new Set(prev)
                            if (allSel) ids.forEach((id) => next.delete(id))
                            else ids.forEach((id) => next.add(id))
                            return next
                          })
                        }}
                        className="font-mono text-xs text-muted hover:text-primary transition-colors"
                      >
                        {filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.has(l.id))
                          ? 'Deselect visible'
                          : 'Select visible'}
                      </button>
                    </div>
                  </div>

                  {filteredLeads.length === 0 ? (
                    <p className="font-mono text-xs text-muted p-3 border border-dashed border-border rounded">
                      No leads with an email address saved yet.
                    </p>
                  ) : (
                    <div className="border border-border rounded overflow-hidden max-h-52 overflow-y-auto">
                      {filteredLeads.map((lead) => (
                        <label
                          key={lead.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-border last:border-0 transition-colors ${
                            selectedLeadIds.has(lead.id) ? 'bg-accent/5' : 'hover:bg-bg'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.has(lead.id)}
                            onChange={() => toggleLead(lead.id)}
                            className="accent-emerald-600 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-primary truncate">{lead.business_name}</div>
                            <div className="font-mono text-[11px] text-muted truncate">{lead.email}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email sequence */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono text-xs text-muted tracking-widest uppercase">
                  Email Sequence ({emailSteps.length} step{emailSteps.length !== 1 ? 's' : ''})
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="font-mono text-xs text-muted hover:text-primary transition-colors"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-4">
                {emailSteps.map((step, i) => (
                  <div key={i} className="border border-border rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted uppercase tracking-wider">
                        Step {i + 1}
                        {i > 0 && (
                          <span className="ml-2 normal-case">
                            — send{' '}
                            <input
                              type="number"
                              min="0"
                              value={step.delay_days}
                              onChange={(e) => updateStep(i, 'delay_days', Number(e.target.value))}
                              className="w-12 bg-bg border border-border text-primary rounded px-1.5 py-0.5 font-mono text-xs focus:outline-none focus:border-accent text-center"
                            />
                            {' '}day{step.delay_days !== 1 ? 's' : ''} after previous
                          </span>
                        )}
                      </span>
                      {emailSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStep(i)}
                          className="font-mono text-xs text-muted hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted uppercase tracking-wider mb-1">Subject</label>
                      <input
                        type="text"
                        required
                        value={step.subject}
                        onChange={(e) => updateStep(i, 'subject', e.target.value)}
                        placeholder="Email subject line"
                        className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted uppercase tracking-wider mb-1">Body</label>
                      <textarea
                        required
                        rows={4}
                        value={step.body}
                        onChange={(e) => updateStep(i, 'body', e.target.value)}
                        placeholder="Write your email body here. Each line becomes a paragraph."
                        className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent resize-y"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="font-mono text-xs px-6 py-2.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
            >
              {creating ? 'Creating...' : 'Create Campaign'}
            </button>
          </form>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-muted">
          No campaigns yet. Create one to start sending outreach emails.
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading text-base text-primary">{c.name}</span>
                    <span className={`border rounded px-2 py-0.5 text-[11px] font-mono ${STATUS_COLOR[c.status] ?? 'text-muted border-border'}`}>
                      {c.status}
                    </span>
                  </div>
                  {c.description && (
                    <p className="font-mono text-xs text-muted mt-0.5">{c.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 font-mono text-[11px] text-muted">
                    <span>{c.email_steps} email step{c.email_steps !== 1 ? 's' : ''}</span>
                    <span>
                      {c.audience === 'all'
                        ? 'All leads'
                        : `${Array.isArray(c.selected_lead_ids) ? c.selected_lead_ids.length : 0} selected leads`}
                    </span>
                    <span>{c.leads_reached} lead{c.leads_reached !== 1 ? 's' : ''} reached</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {c.status !== 'completed' && (
                    <button
                      onClick={() => handleSend(c.id, 1)}
                      disabled={sending === c.id}
                      className="font-mono text-xs px-3 py-1.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {sending === c.id ? 'Sending...' : 'Send Step 1'}
                    </button>
                  )}
                  {(c.status === 'sending' || c.status === 'paused') && (
                    <button
                      onClick={() => handlePause(c)}
                      className="font-mono text-xs px-3 py-1.5 rounded border border-border text-muted hover:text-primary transition-colors"
                    >
                      {c.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                  )}
                  <button
                    onClick={() => openDetail(c)}
                    className="font-mono text-xs px-3 py-1.5 rounded border border-border text-muted hover:text-primary transition-colors"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="font-mono text-xs px-3 py-1.5 rounded border border-red-700/20 dark:border-red-400/20 text-red-700 dark:text-red-400 hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign detail */}
      {detail && (
        <div className="bg-card border border-border rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-primary">{detail.campaign.name}</h3>
            <button
              onClick={() => setDetail(null)}
              className="font-mono text-xs text-muted hover:text-primary transition-colors"
            >
              Close
            </button>
          </div>

          {/* Email steps */}
          {detail.email_steps.length > 0 && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-muted uppercase tracking-wider">Email Steps</p>
              {detail.email_steps.map((s) => (
                <div key={s.step_number} className="border border-border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-muted uppercase">
                      Step {s.step_number}
                      {s.delay_days > 0 && ` — ${s.delay_days}d delay`}
                    </span>
                    {detail.campaign.status !== 'completed' && (
                      <button
                        onClick={() => handleSend(detail.campaign.id, s.step_number)}
                        disabled={sending === detail.campaign.id}
                        className="font-mono text-[11px] px-2.5 py-1 rounded bg-accent text-black hover:opacity-90 disabled:opacity-50"
                      >
                        {sending === detail.campaign.id ? 'Sending...' : `Send Step ${s.step_number}`}
                      </button>
                    )}
                  </div>
                  <p className="font-mono text-xs text-primary font-medium">{s.subject}</p>
                  <p className="font-mono text-[11px] text-muted mt-1 whitespace-pre-wrap">{s.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Sends log */}
          {detail.sends.length > 0 ? (
            <div>
              <p className="font-mono text-xs text-muted uppercase tracking-wider mb-2">
                Send Log ({detail.sends.length})
              </p>
              <div className="border border-border rounded overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="px-4 py-2 text-left text-muted">Business</th>
                      <th className="px-4 py-2 text-left text-muted">Email</th>
                      <th className="px-4 py-2 text-left text-muted">Step</th>
                      <th className="px-4 py-2 text-left text-muted">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.sends.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-primary">{s.business_name ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted">{s.lead_email}</td>
                        <td className="px-4 py-2.5 text-muted">{s.step_number}</td>
                        <td className="px-4 py-2.5 text-muted">{new Date(s.sent_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-muted">No emails sent yet for this campaign.</p>
          )}
        </div>
      )}
    </div>
  )
}
