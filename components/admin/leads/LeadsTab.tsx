'use client'

import { useState, useEffect, useCallback } from 'react'

interface OutreachLead {
  id: string
  business_name: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  rating: number | null
  category: string | null
  location_searched: string | null
  status: 'new' | 'emailed' | 'bounced'
  notes: string | null
  last_emailed_at: string | null
  created_at: string
}

interface LeadsTabProps {
  refreshSignal: number
  onLeadsChange: (leads: OutreachLead[]) => void
}

const STATUS_COLORS: Record<string, string> = {
  new: 'text-primary border-border',
  emailed: 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30',
  bounced: 'text-red-700 dark:text-red-400 border-red-700/20 dark:border-red-400/20',
}

export default function LeadsTab({ refreshSignal, onLeadsChange }: LeadsTabProps) {
  const [leads, setLeads] = useState<OutreachLead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ email: string; notes: string; status: string }>({ email: '', notes: '', status: 'new' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/leads?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load leads.')
      setLeads(data.leads ?? [])
      onLeadsChange(data.leads ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search, onLeadsChange])

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

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError('Delete failed.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {['all', 'new', 'emailed', 'bounced'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                statusFilter === s
                  ? 'bg-accent text-black border-accent'
                  : 'border-border text-muted hover:text-primary'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bg border border-border text-primary rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-accent transition-colors w-64"
        />
        <button
          onClick={fetchLeads}
          className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary transition-colors"
        >
          Refresh
        </button>
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
          No leads found. Use the Search tab to find and save prospects.
        </div>
      ) : (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-bg font-mono text-xs text-muted">
            {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-bg">
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
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-primary font-medium">{lead.business_name}</div>
                      {lead.address && (
                        <div className="text-muted text-[11px] mt-0.5 max-w-[200px] truncate">{lead.address}</div>
                      )}
                      {lead.category && (
                        <div className="text-muted/60 text-[11px] mt-0.5">{lead.category}</div>
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
                      ) : (
                        <span className="text-muted">{lead.email || '—'}</span>
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
                      {editingId === lead.id ? (
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
                            onClick={() => deleteLead(lead.id)}
                            className="text-muted hover:text-red-500 transition-colors"
                          >
                            Delete
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
    </div>
  )
}
