'use client'

import { useState, useEffect, useCallback } from 'react'
import type { OutreachLead } from '@/types/leads'

interface LeadsTabProps {
  refreshSignal: number
  onLeadsChange: (leads: OutreachLead[]) => void
}

const STATUS_COLORS: Record<string, string> = {
  new:     'text-primary border-border',
  called:  'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30',
  emailed: 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30',
  bounced: 'text-red-700 dark:text-red-400 border-red-700/20 dark:border-red-400/20',
}

function escapeCell(val: unknown): string {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const CSV_FIELDS: (keyof OutreachLead)[] = [
  'id', 'business_name', 'address', 'phone', 'email', 'website',
  'rating', 'category', 'location_searched', 'place_id',
  'status', 'notes', 'last_emailed_at', 'created_at', 'updated_at',
]

export default function LeadsTab({ refreshSignal, onLeadsChange }: LeadsTabProps) {
  const [leads, setLeads] = useState<OutreachLead[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ email: string; notes: string; status: string }>({ email: '', notes: '', status: 'new' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [findingEmail, setFindingEmail] = useState<Set<string>>(new Set())
  const [emailNotFound, setEmailNotFound] = useState<Set<string>>(new Set())
  const [findingAllEmails, setFindingAllEmails] = useState(false)
  const [findAllProgress, setFindAllProgress] = useState<{ done: number; total: number } | null>(null)
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; leads_reached: number }>>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [addToCampaignLead, setAddToCampaignLead] = useState<OutreachLead | null>(null)
  const [showBulkCampaignModal, setShowBulkCampaignModal] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [addingToCampaign, setAddingToCampaign] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (viewMode === 'deleted') {
        params.set('deleted', 'true')
      } else {
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (search) params.set('search', search)
      }
      const res = await fetch(`/api/admin/leads?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load leads.')
      setLeads(data.leads ?? [])
      onLeadsChange(data.leads ?? [])
      setSelectedIds(new Set())
      setConfirmDeleteId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [viewMode, statusFilter, search, onLeadsChange])

  useEffect(() => { fetchLeads() }, [fetchLeads, refreshSignal])

  const startEdit = (lead: OutreachLead) => {
    setEditingId(lead.id)
    setEditValues({ email: lead.email ?? '', notes: lead.notes ?? '', status: lead.status })
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editValues.email || null,
          notes: editValues.notes || null,
          status: editValues.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed.')
      setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)))
      onLeadsChange(leads.map((l) => (l.id === id ? data.lead : l)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setConfirmDeleteId(null)
    try {
      const res = await fetch(`/api/admin/leads?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed.')
      setLeads((prev) => prev.filter((l) => l.id !== id))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    } catch {
      setError('Delete failed.')
    }
  }

  const restoreLead = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads?id=${id}&action=restore`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Restore failed.')
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError('Restore failed.')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const allSelected = visibleLeads.every((l) => selectedIds.has(l.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) visibleLeads.forEach((l) => next.delete(l.id))
      else visibleLeads.forEach((l) => next.add(l.id))
      return next
    })
  }

  const exportCSV = () => {
    const rows = visibleLeads.filter((l) => selectedIds.has(l.id))
    if (rows.length === 0) return
    const header = CSV_FIELDS.join(',')
    const lines = rows.map((l) => CSV_FIELDS.map((f) => escapeCell(l[f])).join(','))
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const findEmail = async (lead: OutreachLead) => {
    if (!lead.website) return
    setFindingEmail((prev) => new Set([...prev, lead.id]))
    try {
      const res = await fetch('/api/admin/leads/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website: lead.website,
          businessName: lead.business_name,
          city: lead.location_searched ?? '',
        }),
      })
      const data = await res.json()
      if (data.found && data.email) {
        const patchRes = await fetch(`/api/admin/leads/${lead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email }),
        })
        const patchData = await patchRes.json()
        if (patchRes.ok) {
          setLeads((prev) => prev.map((l) => (l.id === lead.id ? patchData.lead : l)))
        }
      } else {
        setEmailNotFound((prev) => new Set([...prev, lead.id]))
        setTimeout(() => {
          setEmailNotFound((prev) => {
            const next = new Set(prev)
            next.delete(lead.id)
            return next
          })
        }, 3000)
      }
    } catch {
      // non-fatal
    } finally {
      setFindingEmail((prev) => {
        const next = new Set(prev)
        next.delete(lead.id)
        return next
      })
    }
  }

  const findAllEmails = async () => {
    const targets = leads.filter((l) => !!l.website && !l.email)
    if (targets.length === 0) return
    setFindingAllEmails(true)
    setFindAllProgress({ done: 0, total: targets.length })
    for (let i = 0; i < targets.length; i++) {
      await findEmail(targets[i])
      setFindAllProgress({ done: i + 1, total: targets.length })
      if (i < targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
    setFindingAllEmails(false)
    setFindAllProgress(null)
  }

  const fetchCampaigns = async () => {
    setCampaignsLoading(true)
    try {
      const res = await fetch('/api/admin/leads/campaigns')
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      // non-fatal
    } finally {
      setCampaignsLoading(false)
    }
  }

  const addLeadsToCampaign = async (campaignId: string, campaignName: string, leadIds: string[]) => {
    setAddingToCampaign(true)
    try {
      const res = await fetch(`/api/admin/leads/campaigns/${campaignId}/add-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: leadIds }),
      })
      const data = await res.json()
      if (res.ok) {
        setToast(`${data.added} lead${data.added !== 1 ? 's' : ''} added to ${campaignName}.`)
        setTimeout(() => setToast(null), 4000)
      }
    } catch {
      // non-fatal
    } finally {
      setAddingToCampaign(false)
      setAddToCampaignLead(null)
      setShowBulkCampaignModal(false)
      setSelectedCampaignId('')
    }
  }

  const categories = ['all', ...Array.from(new Set(leads.map((l) => l.category).filter(Boolean))).sort()] as string[]

  const visibleLeads = leads.filter((l) => {
    if (categoryFilter !== 'all' && l.category !== categoryFilter) return false
    return true
  })

  const allVisibleSelected = visibleLeads.length > 0 && visibleLeads.every((l) => selectedIds.has(l.id))
  const someVisibleSelected = visibleLeads.some((l) => selectedIds.has(l.id))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {['all', 'new', 'called', 'emailed', 'bounced'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setViewMode('active') }}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                viewMode === 'active' && statusFilter === s
                  ? 'bg-accent text-black border-accent'
                  : 'border-border text-muted hover:text-primary'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setViewMode('deleted')}
            className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
              viewMode === 'deleted'
                ? 'bg-accent text-black border-accent'
                : 'border-border text-muted hover:text-primary'
            }`}
          >
            Deleted Leads
          </button>
        </div>
        {viewMode === 'active' && (
          <>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-bg border border-border text-primary rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accent transition-colors"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search by name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-bg border border-border text-primary rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accent transition-colors w-64"
            />
          </>
        )}
        <button
          onClick={fetchLeads}
          className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary transition-colors"
        >
          Refresh
        </button>
        {someVisibleSelected && (
          <button
            onClick={exportCSV}
            className="font-mono text-xs px-3 py-1.5 border border-border rounded text-primary hover:border-accent transition-colors"
          >
            Export Selected ({selectedIds.size})
          </button>
        )}
        {someVisibleSelected && (
          <button
            onClick={() => { fetchCampaigns(); setShowBulkCampaignModal(true) }}
            className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary transition-colors"
          >
            Add to Campaign ({selectedIds.size})
          </button>
        )}
        {viewMode === 'active' && (
          findingAllEmails ? (
            <span className="font-mono text-xs text-muted">
              Finding emails... {findAllProgress?.done ?? 0}/{findAllProgress?.total ?? 0} complete
            </span>
          ) : (
            <button
              onClick={findAllEmails}
              className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary transition-colors"
            >
              Find All Emails
            </button>
          )
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-700/5 dark:bg-red-400/5 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-card border border-border rounded animate-pulse" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm text-muted">
          {viewMode === 'deleted'
            ? 'No deleted leads.'
            : 'No leads found. Use the Search tab to find and save prospects.'}
        </div>
      ) : (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-bg font-mono text-xs text-muted">
            {visibleLeads.length}{visibleLeads.length !== leads.length ? ` of ${leads.length}` : ''} lead{visibleLeads.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected }}
                      onChange={toggleSelectAll}
                      className="accent-emerald-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Business</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Website</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Notes</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                        className="accent-emerald-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-primary font-medium">{lead.business_name}</div>
                      {lead.address && (
                        <div className="text-muted text-[11px] mt-0.5 max-w-[200px] truncate">{lead.address}</div>
                      )}
                      {lead.category && (
                        <span className="inline-block mt-1 border border-border rounded px-1.5 py-0.5 text-[10px] text-muted font-mono">
                          {lead.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === lead.id ? (
                        <input
                          type="email"
                          value={editValues.email}
                          onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                          placeholder="email@example.com"
                          className="bg-bg border border-border text-primary rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-accent w-44"
                        />
                      ) : lead.email ? (
                        <span className="text-muted">{lead.email}</span>
                      ) : findingEmail.has(lead.id) ? (
                        <span className="text-muted italic">Searching...</span>
                      ) : emailNotFound.has(lead.id) ? (
                        <span className="text-muted italic">Not found</span>
                      ) : lead.website ? (
                        <button
                          onClick={() => findEmail(lead)}
                          className="font-mono text-xs text-muted hover:text-primary transition-colors underline underline-offset-2"
                        >
                          Find Email
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 dark:text-accent underline truncate max-w-[140px] block"
                        >
                          {lead.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{lead.rating ?? '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === lead.id ? (
                        <select
                          value={editValues.status}
                          onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                          className="bg-bg border border-border text-primary rounded px-2 py-1 font-mono text-xs focus:outline-none"
                        >
                          <option value="new">new</option>
                          <option value="called">called</option>
                          <option value="emailed">emailed</option>
                          <option value="bounced">bounced</option>
                        </select>
                      ) : (
                        <span className={`border rounded px-2 py-0.5 ${STATUS_COLORS[lead.status] ?? ''}`}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === lead.id ? (
                        <input
                          type="text"
                          value={editValues.notes}
                          onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                          placeholder="Notes..."
                          className="bg-bg border border-border text-primary rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-accent w-40"
                        />
                      ) : (
                        <span className="text-muted truncate max-w-[140px] block">{lead.notes || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {viewMode === 'deleted' ? (
                        <button
                          onClick={() => restoreLead(lead.id)}
                          className="text-muted hover:text-primary transition-colors"
                        >
                          Restore
                        </button>
                      ) : editingId === lead.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(lead.id)}
                            disabled={saving}
                            className="text-emerald-700 dark:text-accent hover:underline disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button onClick={cancelEdit} className="text-muted hover:text-primary">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(lead)}
                            className="text-muted hover:text-primary transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { fetchCampaigns(); setAddToCampaignLead(lead) }}
                            className="text-muted hover:text-primary transition-colors"
                          >
                            Campaign
                          </button>
                          <button
                            onClick={() => handleDeleteClick(lead.id)}
                            className={`transition-colors ${
                              confirmDeleteId === lead.id
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-muted hover:text-red-500'
                            }`}
                          >
                            {confirmDeleteId === lead.id ? 'Confirm Delete' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-lead campaign modal */}
      {addToCampaignLead && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-12 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAddToCampaignLead(null) }}
        >
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-primary">Add to Campaign</h2>
              <button onClick={() => setAddToCampaignLead(null)} className="text-muted hover:text-primary text-2xl leading-none">&times;</button>
            </div>
            <p className="font-mono text-xs text-muted mb-4">{addToCampaignLead.business_name}</p>
            {campaignsLoading ? (
              <p className="font-mono text-xs text-muted">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="font-mono text-xs text-muted">No campaigns found. Create one in the Campaigns tab.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addLeadsToCampaign(c.id, c.name, [addToCampaignLead.id])}
                    disabled={addingToCampaign}
                    className="w-full text-left px-4 py-3 border border-border rounded-lg hover:border-accent transition-colors disabled:opacity-50"
                  >
                    <div className="font-mono text-sm text-primary">{c.name}</div>
                    <div className="font-mono text-xs text-muted mt-0.5">{c.leads_reached} lead{c.leads_reached !== 1 ? 's' : ''} enrolled</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk campaign modal */}
      {showBulkCampaignModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-12 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowBulkCampaignModal(false) }}
        >
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg text-primary">Add to Campaign</h2>
              <button onClick={() => setShowBulkCampaignModal(false)} className="text-muted hover:text-primary text-2xl leading-none">&times;</button>
            </div>
            <p className="font-mono text-xs text-muted mb-4">{selectedIds.size} lead{selectedIds.size !== 1 ? 's' : ''} selected</p>
            {campaignsLoading ? (
              <p className="font-mono text-xs text-muted">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <p className="font-mono text-xs text-muted">No campaigns found. Create one in the Campaigns tab.</p>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {campaigns.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
                    >
                      <input
                        type="radio"
                        name="bulk-campaign"
                        value={c.id}
                        checked={selectedCampaignId === c.id}
                        onChange={() => setSelectedCampaignId(c.id)}
                        className="accent-emerald-600"
                      />
                      <div>
                        <div className="font-mono text-sm text-primary">{c.name}</div>
                        <div className="font-mono text-xs text-muted mt-0.5">{c.leads_reached} lead{c.leads_reached !== 1 ? 's' : ''} enrolled</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowBulkCampaignModal(false)}
                    className="font-mono text-xs px-4 py-2 border border-border rounded-lg text-muted hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const c = campaigns.find((x) => x.id === selectedCampaignId)
                      if (c) addLeadsToCampaign(c.id, c.name, Array.from(selectedIds))
                    }}
                    disabled={!selectedCampaignId || addingToCampaign}
                    className="font-mono text-xs px-4 py-2 bg-accent text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {addingToCampaign ? 'Adding...' : 'Add to Campaign'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-surface border border-border rounded-lg shadow-xl font-mono text-sm text-primary">
          {toast}
        </div>
      )}
    </div>
  )
}
