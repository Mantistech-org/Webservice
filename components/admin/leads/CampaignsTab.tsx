'use client'

import { useState, useEffect } from 'react'
import type { OutreachLead } from '@/types/leads'

interface Campaign {
  id: string
  name: string
  template_id: string | null
  template_name: string | null
  status: string
  send_mode: string
  scheduled_at: string | null
  daily_limit: number | null
  weekly_limit: number | null
  sent_count: number
  total_leads: number
  open_count: number
  bounce_count: number
  created_at: string
}

interface EmailTemplate {
  id: string
  name: string
}

interface CampaignsTabProps {
  savedLeads: OutreachLead[]
}

const STATUS_BADGE: Record<string, string> = {
  draft:     'text-muted border-border',
  scheduled: 'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30',
  sending:   'text-blue-700 dark:text-blue-400 border-blue-700/30 dark:border-blue-400/30',
  paused:    'text-muted border-border',
  completed: 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30',
}

function pct(num: number, denom: number) {
  if (denom === 0) return '—'
  return `${Math.round((num / denom) * 100)}%`
}

export default function CampaignsTab({ savedLeads }: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreator, setShowCreator] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignLeads, setCampaignLeads] = useState<unknown[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Creator form state
  const [form, setForm] = useState({
    name: '',
    template_id: '',
    send_mode: 'immediate' as 'immediate' | 'scheduled' | 'drip',
    scheduled_at: '',
    daily_limit: '',
    weekly_limit: '',
  })
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [leadCategoryFilter, setLeadCategoryFilter] = useState('all')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchCampaigns()
    fetchTemplates()
  }, [])

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads/campaigns')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load campaigns.')
      setCampaigns(data.campaigns ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    const res = await fetch('/api/admin/leads/templates')
    const data = await res.json()
    if (res.ok) setTemplates(data.templates ?? [])
  }

  const openCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setShowCreator(false)
    try {
      const res = await fetch(`/api/admin/leads/campaigns/${campaign.id}`)
      const data = await res.json()
      if (res.ok) setCampaignLeads(data.leads ?? [])
    } catch {
      // non-fatal
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.template_id) {
      setError('Name and template are required.')
      return
    }
    if (selectedLeadIds.size === 0) {
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
          name: form.name,
          template_id: form.template_id,
          lead_ids: Array.from(selectedLeadIds),
          send_mode: form.send_mode,
          scheduled_at: form.scheduled_at || undefined,
          daily_limit: form.daily_limit ? Number(form.daily_limit) : undefined,
          weekly_limit: form.weekly_limit ? Number(form.weekly_limit) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign.')

      setSuccessMsg(`Campaign created with ${data.total_leads} lead${data.total_leads !== 1 ? 's' : ''}${data.skipped > 0 ? ` (${data.skipped} already emailed, skipped)` : ''}.`)
      setShowCreator(false)
      setForm({ name: '', template_id: '', send_mode: 'immediate', scheduled_at: '', daily_limit: '', weekly_limit: '' })
      setSelectedLeadIds(new Set())
      fetchCampaigns()

      // Auto-send if immediate
      if (form.send_mode === 'immediate' && data.campaign_id) {
        const sendRes = await fetch(`/api/admin/leads/campaigns/${data.campaign_id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const sendData = await sendRes.json()
        if (sendRes.ok) {
          setSuccessMsg(`Campaign created and sent. ${sendData.sent} email${sendData.sent !== 1 ? 's' : ''} delivered.`)
          fetchCampaigns()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  const handleSend = async (campaignId: string) => {
    setSending(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/leads/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed.')
      setSuccessMsg(data.message ?? `${data.sent} email${data.sent !== 1 ? 's' : ''} sent.`)
      fetchCampaigns()
      if (selectedCampaign) openCampaign(selectedCampaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed.')
    } finally {
      setSending(false)
    }
  }

  const toggleLeadSelect = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const freshLeads = savedLeads.filter((l) => l.status !== 'emailed')
  const leadCategories = ['all', ...Array.from(new Set(freshLeads.map((l) => l.category).filter(Boolean))).sort()] as string[]
  const filteredLeads = leadCategoryFilter === 'all'
    ? freshLeads
    : freshLeads.filter((l) => l.category === leadCategoryFilter)

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: campaigns.reduce((s, c) => s + c.total_leads, 0) },
            { label: 'Total Sent', value: campaigns.reduce((s, c) => s + c.sent_count, 0) },
            {
              label: 'Open Rate',
              value: pct(
                campaigns.reduce((s, c) => s + (c.open_count ?? 0), 0),
                campaigns.reduce((s, c) => s + c.sent_count, 0)
              ),
            },
            {
              label: 'Bounce Rate',
              value: pct(
                campaigns.reduce((s, c) => s + (c.bounce_count ?? 0), 0),
                campaigns.reduce((s, c) => s + c.sent_count, 0)
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded p-4">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{stat.label}</div>
              <div className="font-heading text-3xl text-primary">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl text-primary">Campaigns</h2>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="font-mono text-xs text-emerald-700 dark:text-accent">{successMsg}</span>
          )}
          <button
            onClick={() => { setShowCreator(!showCreator); setSelectedCampaign(null); setError(''); setSuccessMsg('') }}
            className="font-mono text-xs px-4 py-2 rounded bg-accent text-black hover:opacity-90 transition-opacity"
          >
            {showCreator ? 'Cancel' : 'New Campaign'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-700/5 dark:bg-red-400/5 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Campaign creator */}
      {showCreator && (
        <div className="bg-card border border-border rounded p-6">
          <h3 className="font-heading text-lg text-primary mb-5">Create Campaign</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. March Plumbers Outreach"
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Email Template <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.template_id}
                  onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">Select a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Send Mode
                </label>
                <select
                  value={form.send_mode}
                  onChange={(e) => setForm({ ...form, send_mode: e.target.value as 'immediate' | 'scheduled' | 'drip' })}
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="immediate">Immediate — send all now</option>
                  <option value="scheduled">Scheduled — send at a specific time</option>
                  <option value="drip">Drip — send within daily/weekly limits</option>
                </select>
              </div>
              {form.send_mode === 'scheduled' && (
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                    Scheduled Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              )}
              {form.send_mode === 'drip' && (
                <>
                  <div>
                    <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                      Daily Send Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 5"
                      value={form.daily_limit}
                      onChange={(e) => setForm({ ...form, daily_limit: e.target.value })}
                      className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                      Weekly Send Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={form.weekly_limit}
                      onChange={(e) => setForm({ ...form, weekly_limit: e.target.value })}
                      className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Lead selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-xs text-muted tracking-widest uppercase">
                  Select Leads ({selectedLeadIds.size} selected)
                </label>
                <div className="flex items-center gap-3">
                  {leadCategories.length > 1 && (
                    <select
                      value={leadCategoryFilter}
                      onChange={(e) => setLeadCategoryFilter(e.target.value)}
                      className="bg-bg border border-border text-primary rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-accent transition-colors"
                    >
                      {leadCategories.map((c) => (
                        <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const visibleIds = filteredLeads.map((l) => l.id)
                      const allSelected = visibleIds.every((id) => selectedLeadIds.has(id))
                      setSelectedLeadIds((prev) => {
                        const next = new Set(prev)
                        if (allSelected) visibleIds.forEach((id) => next.delete(id))
                        else visibleIds.forEach((id) => next.add(id))
                        return next
                      })
                    }}
                    className="font-mono text-xs text-muted hover:text-primary transition-colors"
                  >
                    {filteredLeads.every((l) => selectedLeadIds.has(l.id)) && filteredLeads.length > 0
                      ? 'Deselect visible'
                      : 'Select visible'}
                  </button>
                </div>
              </div>
              {freshLeads.length === 0 ? (
                <p className="font-mono text-xs text-muted p-3 border border-dashed border-border rounded">
                  No leads available. Save leads from the Search tab first.
                </p>
              ) : filteredLeads.length === 0 ? (
                <p className="font-mono text-xs text-muted p-3 border border-dashed border-border rounded">
                  No leads in this category.
                </p>
              ) : (
                <div className="border border-border rounded overflow-hidden max-h-64 overflow-y-auto">
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
                        onChange={() => toggleLeadSelect(lead.id)}
                        className="accent-emerald-600 shrink-0"
                      />
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary truncate">{lead.business_name}</span>
                        {lead.category && (
                          <span className="border border-border rounded px-1.5 py-0.5 text-[10px] text-muted font-mono shrink-0">
                            {lead.category}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted truncate w-full">
                          {lead.email ? lead.email : <span className="italic">No email</span>}
                          {lead.address && ` — ${lead.address}`}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {freshLeads.length > 0 && (
                <p className="font-mono text-[11px] text-muted mt-1.5">
                  Only leads with an email address will receive emails. Leads already emailed are excluded.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="font-mono text-xs px-6 py-2.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
            >
              {creating ? 'Creating...' : form.send_mode === 'immediate' ? 'Create & Send' : 'Create Campaign'}
            </button>
          </form>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-card border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-muted">
          No campaigns yet.
        </div>
      ) : (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Template</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-muted tracking-widest uppercase">Leads</th>
                  <th className="px-4 py-3 text-right text-muted tracking-widest uppercase">Sent</th>
                  <th className="px-4 py-3 text-right text-muted tracking-widest uppercase">Opens</th>
                  <th className="px-4 py-3 text-right text-muted tracking-widest uppercase">Bounces</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openCampaign(c)}
                        className="text-primary font-medium hover:underline text-left"
                      >
                        {c.name}
                      </button>
                      {c.scheduled_at && c.send_mode === 'scheduled' && (
                        <div className="text-muted text-[11px] mt-0.5">
                          {new Date(c.scheduled_at).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{c.template_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted">{c.send_mode}</td>
                    <td className="px-4 py-3">
                      <span className={`border rounded px-2 py-0.5 ${STATUS_BADGE[c.status] ?? 'text-muted border-border'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{c.total_leads}</td>
                    <td className="px-4 py-3 text-right text-muted">{c.sent_count}</td>
                    <td className="px-4 py-3 text-right text-muted">{c.open_count ?? 0}</td>
                    <td className="px-4 py-3 text-right text-muted">{c.bounce_count ?? 0}</td>
                    <td className="px-4 py-3">
                      {c.status !== 'completed' && c.send_mode !== 'immediate' && (
                        <button
                          onClick={() => handleSend(c.id)}
                          disabled={sending}
                          className="text-emerald-700 dark:text-accent hover:underline disabled:opacity-50"
                        >
                          {sending ? 'Sending...' : 'Send now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign detail drawer */}
      {selectedCampaign && (
        <div className="bg-card border border-border rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg text-primary">{selectedCampaign.name}</h3>
            <button
              onClick={() => setSelectedCampaign(null)}
              className="font-mono text-xs text-muted hover:text-primary transition-colors"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-muted">Template:</span>{' '}
              <span className="text-primary">{selectedCampaign.template_name ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted">Mode:</span>{' '}
              <span className="text-primary">{selectedCampaign.send_mode}</span>
            </div>
            <div>
              <span className="text-muted">Status:</span>{' '}
              <span className="text-primary">{selectedCampaign.status}</span>
            </div>
          </div>
          {campaignLeads.length > 0 && (
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="px-4 py-2 text-left text-muted tracking-widest uppercase">Business</th>
                    <th className="px-4 py-2 text-left text-muted tracking-widest uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-muted tracking-widest uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-muted tracking-widest uppercase">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {(campaignLeads as Array<{
                    campaign_lead_id?: string
                    id?: string
                    business_name: string
                    email: string | null
                    status: string
                    sent_at: string | null
                  }>).map((cl) => (
                    <tr key={cl.campaign_lead_id ?? cl.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 text-primary">{cl.business_name}</td>
                      <td className="px-4 py-2.5 text-muted">{cl.email ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`border rounded px-2 py-0.5 text-[11px] ${STATUS_BADGE[cl.status] ?? 'text-muted border-border'}`}>
                          {cl.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {cl.sent_at ? new Date(cl.sent_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
