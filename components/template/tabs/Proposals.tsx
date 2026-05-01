'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedContent {
  summary: string
  scope_of_work: string[]
  parts_list: Array<{ item: string; description: string; cost: number }>
  labor_hours: number
  labor_rate: number
  labor_total: number
  parts_total: number
  grand_total: number
  timeline: string
  warranty: string
  closing: string
}

interface Proposal {
  id: string
  proposal_token: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_address: string | null
  service_type: string | null
  complaint: string | null
  findings: string | null
  recommended_work: string | null
  parts_cost: number
  labor_hours: number
  labor_rate: number
  notes: string | null
  valid_until: string | null
  generated_content: GeneratedContent | null
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  last_sent_at: string | null
  created_at: string
}

interface PricebookItem {
  id: string
  item_name: string
  unit_price: number
  category: string
}

// ── Style constants ───────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 12,
  padding: 20,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00C27C',
  fontWeight: 600,
  marginBottom: 4,
}

const COL_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  color: '#111827',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
}

const SERVICE_TYPES = [
  'AC Repair',
  'AC Installation',
  'Furnace Repair',
  'Furnace Installation',
  'Heat Pump Installation',
  'Maintenance Tune-Up',
  'Duct Cleaning',
  'Emergency Service',
  'Other',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

function defaultValidUntil(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    draft:    { backgroundColor: 'rgba(0,0,0,0.06)',      color: '#6b7280' },
    sent:     { backgroundColor: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
    accepted: { backgroundColor: 'rgba(0,194,124,0.1)',   color: '#00C27C' },
    declined: { backgroundColor: 'rgba(239,68,68,0.1)',   color: '#ef4444' },
  }
  const s = map[status] ?? map.draft
  return (
    <span style={{ ...s, fontSize: 11, fontWeight: 600, borderRadius: 5, padding: '3px 10px', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {status}
    </span>
  )
}

// ── Generated content preview (shared) ───────────────────────────────────────

function GeneratedPreview({ gc }: { gc: GeneratedContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)' }}>
        <p style={{ ...COL_LABEL, marginBottom: 8 }}>Summary</p>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{gc.summary}</p>
      </div>

      <div>
        <p style={{ ...COL_LABEL, marginBottom: 10 }}>Scope of Work</p>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          {gc.scope_of_work.map((task, i) => (
            <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 6 }}>{task}</li>
          ))}
        </ol>
      </div>

      {gc.parts_list?.length > 0 && (
        <div>
          <p style={{ ...COL_LABEL, marginBottom: 10 }}>Parts & Materials</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                {['Item', 'Description', 'Cost'].map(h => (
                  <th key={h} style={{ padding: '8px 0', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', paddingRight: 16 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gc.parts_list.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#111827', fontWeight: 500, paddingRight: 16 }}>{p.item}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#6b7280', paddingRight: 16 }}>{p.description}</td>
                  <td style={{ padding: '10px 0', fontSize: 13, color: '#111827' }}>${Number(p.cost).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <p style={{ ...COL_LABEL, marginBottom: 4 }}>Labor</p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{gc.labor_hours} hrs × ${gc.labor_rate}/hr = <strong>${Number(gc.labor_total).toFixed(2)}</strong></p>
        </div>
        <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <p style={{ ...COL_LABEL, marginBottom: 4 }}>Parts Total</p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}><strong>${Number(gc.parts_total).toFixed(2)}</strong></p>
        </div>
      </div>

      <div style={{ padding: 20, backgroundColor: '#111827', borderRadius: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Investment</p>
        <p style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', margin: 0 }}>${Number(gc.grand_total).toFixed(2)}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <p style={{ ...COL_LABEL, marginBottom: 4 }}>Timeline</p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{gc.timeline}</p>
        </div>
        <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
          <p style={{ ...COL_LABEL, marginBottom: 4 }}>Warranty</p>
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>{gc.warranty}</p>
        </div>
      </div>

      <div style={{ padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
        <p style={{ ...COL_LABEL, marginBottom: 8 }}>Closing</p>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0 }}>{gc.closing}</p>
      </div>
    </div>
  )
}

// ── View modal ────────────────────────────────────────────────────────────────

function ViewModal({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '40px 20px', overflowY: 'auto' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 32, width: '100%', maxWidth: 680, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Proposal for {proposal.customer_name}</h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              {proposal.service_type}{proposal.service_address ? ` · ${proposal.service_address}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        {proposal.generated_content
          ? <GeneratedPreview gc={proposal.generated_content} />
          : <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>No generated content — this is a draft.</p>
        }
      </div>
    </div>
  )
}

// ── Sub-tab 1: All Proposals ──────────────────────────────────────────────────

function AllProposals({
  clientToken,
  proposals,
  loading,
  onRefresh,
}: {
  clientToken: string
  proposals: Proposal[]
  loading: boolean
  onRefresh: () => void
}) {
  const [viewProposal, setViewProposal] = useState<Proposal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actioning, setActioning] = useState<string | null>(null)

  const handleSend = async (p: Proposal) => {
    setActioning(p.id)
    try {
      await fetch(`/api/client/${clientToken}/proposals/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent', last_sent_at: new Date().toISOString() }),
      })
      onRefresh()
    } finally { setActioning(null) }
  }

  const handleDelete = async (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setActioning(id)
    try {
      await fetch(`/api/client/${clientToken}/proposals/${id}`, { method: 'DELETE' })
      setConfirmDelete(null)
      onRefresh()
    } finally { setActioning(null) }
  }

  if (loading) return <div style={{ ...CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>Loading proposals...</div>

  if (proposals.length === 0) return (
    <div style={{ ...CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
      No proposals yet. Use the Create Proposal tab to build your first one.
    </div>
  )

  return (
    <>
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#f9fafb' }}>
              {['Customer', 'Service Type', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proposals.map((p, i) => {
              const total = p.generated_content?.grand_total
              return (
                <tr key={p.id} style={{ borderBottom: i < proposals.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{p.customer_name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{p.service_type ?? '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827' }}>{total != null ? `$${Number(total).toFixed(2)}` : '—'}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(p.created_at)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setViewProposal(p)}
                        style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, backgroundColor: 'transparent', color: '#374151', cursor: 'pointer' }}
                      >View</button>
                      {p.status !== 'accepted' && p.status !== 'declined' && (
                        <button
                          onClick={() => handleSend(p)}
                          disabled={actioning === p.id}
                          style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', border: 'none', borderRadius: 6, backgroundColor: '#00C27C', color: '#ffffff', cursor: 'pointer' }}
                        >{actioning === p.id ? '...' : 'Send'}</button>
                      )}
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={actioning === p.id}
                        style={{
                          fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                          border: confirmDelete === p.id ? 'none' : '1px solid #ef4444',
                          backgroundColor: confirmDelete === p.id ? '#ef4444' : 'transparent',
                          color: confirmDelete === p.id ? '#ffffff' : '#ef4444',
                        }}
                      >{confirmDelete === p.id ? 'Confirm' : 'Delete'}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {viewProposal && <ViewModal proposal={viewProposal} onClose={() => setViewProposal(null)} />}
    </>
  )
}

// ── Sub-tab 2: Create Proposal ────────────────────────────────────────────────

function CreateProposal({ clientToken, onCreated }: { clientToken: string; onCreated: () => void }) {
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [serviceAddress, setServiceAddress] = useState('')
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0])
  const [complaint, setComplaint] = useState('')
  const [findings, setFindings] = useState('')
  const [recommendedWork, setRecommendedWork] = useState('')
  const [partsCost, setPartsCost] = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [laborRate, setLaborRate] = useState('95')
  const [notes, setNotes] = useState('')
  const [validUntil, setValidUntil] = useState(defaultValidUntil)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)

  const formData = {
    customer_name: customerName,
    customer_email: customerEmail || undefined,
    customer_phone: customerPhone || undefined,
    service_address: serviceAddress || undefined,
    service_type: serviceType,
    complaint: complaint || undefined,
    findings: findings || undefined,
    recommended_work: recommendedWork || undefined,
    parts_cost: partsCost ? parseFloat(partsCost) : 0,
    labor_hours: laborHours ? parseFloat(laborHours) : 0,
    labor_rate: laborRate ? parseFloat(laborRate) : 95,
    notes: notes || undefined,
    valid_until: validUntil || undefined,
  }

  const resetForm = () => {
    setCustomerName(''); setCustomerEmail(''); setCustomerPhone(''); setServiceAddress('')
    setServiceType(SERVICE_TYPES[0]); setComplaint(''); setFindings(''); setRecommendedWork('')
    setPartsCost(''); setLaborHours(''); setLaborRate('95'); setNotes('')
    setValidUntil(defaultValidUntil()); setGeneratedContent(null); setError('')
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true); setError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/proposals/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json() as { generated_content?: GeneratedContent; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setGeneratedContent(data.generated_content ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal')
    } finally { setGenerating(false) }
  }

  const handleSaveDraft = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to save draft')
      resetForm(); onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleSaveGenerated = async () => {
    if (!generatedContent) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, generated_content: generatedContent }),
      })
      if (!res.ok) throw new Error('Failed to save proposal')
      resetForm(); onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <form onSubmit={handleGenerate}>
        <div style={{ ...CARD, marginBottom: 16 }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 16 }}>Customer Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Customer Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Customer Email</label>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="name@email.com" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Customer Phone</label>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 000-0000" style={INPUT_STYLE} />
              </div>
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Service Address</label>
              <input value={serviceAddress} onChange={e => setServiceAddress(e.target.value)} placeholder="123 Main St, City, OH" style={INPUT_STYLE} />
            </div>
          </div>
        </div>

        <div style={{ ...CARD, marginBottom: 16 }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 16 }}>Job Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Service Type</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>What is the customer complaining about?</label>
              <textarea value={complaint} onChange={e => setComplaint(e.target.value)} placeholder="e.g. AC not cooling, blowing warm air" rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>What did you find on inspection?</label>
              <textarea value={findings} onChange={e => setFindings(e.target.value)} placeholder="e.g. Refrigerant leak at evaporator coil, capacitor weak" rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>What work needs to be done?</label>
              <textarea value={recommendedWork} onChange={e => setRecommendedWork(e.target.value)} placeholder="e.g. Replace capacitor, recharge refrigerant, check for further leaks" rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Estimated Parts Cost ($)</label>
                <input type="number" min="0" step="0.01" value={partsCost} onChange={e => setPartsCost(e.target.value)} placeholder="0.00" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Estimated Labor Hours</label>
                <input type="number" min="0" step="0.5" value={laborHours} onChange={e => setLaborHours(e.target.value)} placeholder="0" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Labor Rate ($/hr)</label>
                <input type="number" min="0" step="1" value={laborRate} onChange={e => setLaborRate(e.target.value)} placeholder="95" style={INPUT_STYLE} />
              </div>
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Notes or Warranty Terms</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes, warranty information, etc." rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ ...INPUT_STYLE, width: 'auto' }} />
            </div>
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={generating || saving || !customerName.trim()}
            style={{
              padding: '11px 24px', fontSize: 14, fontWeight: 600,
              backgroundColor: generating || !customerName.trim() ? '#d1d5db' : '#00C27C',
              color: '#ffffff', border: 'none', borderRadius: 8,
              cursor: generating || !customerName.trim() ? 'default' : 'pointer',
            }}
          >{generating ? 'Generating your proposal...' : 'Generate Proposal'}</button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !customerName.trim()}
            style={{
              padding: '11px 24px', fontSize: 14, fontWeight: 600,
              backgroundColor: 'transparent', color: '#00C27C',
              border: '1.5px solid #00C27C', borderRadius: 8,
              cursor: saving || !customerName.trim() ? 'default' : 'pointer',
            }}
          >{saving ? 'Saving...' : 'Save as Draft'}</button>
        </div>
      </form>

      {generatedContent && (
        <div style={{ ...CARD, marginTop: 24 }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 20 }}>Generated Proposal Preview</p>
          <GeneratedPreview gc={generatedContent} />
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={handleSaveGenerated}
              disabled={saving}
              style={{ padding: '11px 24px', fontSize: 14, fontWeight: 600, backgroundColor: saving ? '#d1d5db' : '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer' }}
            >{saving ? 'Saving...' : 'Save Proposal'}</button>
            <button
              onClick={resetForm}
              style={{ padding: '11px 24px', fontSize: 14, fontWeight: 600, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
            >Start Over</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-tab 3: Pricebook ──────────────────────────────────────────────────────

function Pricebook({ clientToken }: { clientToken: string }) {
  const [items, setItems] = useState<PricebookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addingItem, setAddingItem] = useState(false)
  const [itemName, setItemName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [category, setCategory] = useState('Other')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchItems = useCallback(async () => {
    if (!clientToken) return
    try {
      const res = await fetch(`/api/client/${clientToken}/pricebook`)
      const data = await res.json() as { items?: PricebookItem[] }
      setItems(data.items ?? [])
    } catch { /* silent */ } finally { setLoading(false) }
  }, [clientToken])

  useEffect(() => { void fetchItems() }, [fetchItems])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || saving) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/pricebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: itemName.trim(), unit_price: parseFloat(unitPrice) || 0, category }),
      })
      const data = await res.json() as { item?: PricebookItem; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to add item')
      setItems(prev => [...prev, data.item!])
      setItemName(''); setUnitPrice(''); setCategory('Other'); setAddingItem(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/client/${clientToken}/pricebook?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { /* silent */ }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={() => setAddingItem(v => !v)}
          style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, backgroundColor: 'transparent', color: '#00C27C', border: '1.5px solid #00C27C', borderRadius: 8, cursor: 'pointer' }}
        >{addingItem ? 'Cancel' : 'Add Item'}</button>
      </div>

      {addingItem && (
        <form onSubmit={handleAdd} style={{ ...CARD, marginBottom: 16 }}>
          <p style={{ ...LABEL_STYLE, marginBottom: 16 }}>New Pricebook Item</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Item Name</label>
              <input required value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. Capacitor Replacement" style={INPUT_STYLE} />
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Unit Price ($)</label>
              <input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0.00" style={{ ...INPUT_STYLE, width: 120 }} />
            </div>
            <div>
              <label style={{ ...COL_LABEL, display: 'block', marginBottom: 6 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...INPUT_STYLE, width: 140, cursor: 'pointer' }}>
                {['Labor', 'Parts', 'Equipment', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 10 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
            <button type="submit" disabled={saving || !itemName.trim()}
              style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, backgroundColor: saving || !itemName.trim() ? '#d1d5db' : '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >{saving ? 'Adding...' : 'Add Item'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>Loading pricebook...</div>
      ) : items.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>No pricebook items yet. Add your first item above.</div>
      ) : (
        <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#f9fafb' }}>
                {['Item Name', 'Unit Price', 'Category', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.item_name}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827' }}>${Number(item.unit_price).toFixed(2)}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.06)', color: '#374151', borderRadius: 5, padding: '3px 10px' }}>{item.category}</span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <button onClick={() => handleDelete(item.id)}
                      style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #ef4444', borderRadius: 6, backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Sub-tab 4: Follow-ups ─────────────────────────────────────────────────────

function FollowUps({ clientToken, proposals, onRefresh }: { clientToken: string; proposals: Proposal[]; onRefresh: () => void }) {
  const [actioning, setActioning] = useState<string | null>(null)

  const waiting = proposals.filter(
    p => p.status === 'sent' && daysSince(p.last_sent_at ?? p.created_at) >= 3
  )

  const patch = async (p: Proposal, status: 'accepted' | 'declined' | 'sent') => {
    setActioning(p.id)
    try {
      await fetch(`/api/client/${clientToken}/proposals/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(status === 'sent' ? { last_sent_at: new Date().toISOString() } : {}) }),
      })
      onRefresh()
    } finally { setActioning(null) }
  }

  if (waiting.length === 0) return (
    <div style={{ ...CARD, textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: 14 }}>
      No proposals waiting for a response.
    </div>
  )

  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#f9fafb' }}>
            {['Customer', 'Total', 'Sent Date', 'Days Waiting', 'Actions'].map(h => (
              <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {waiting.map((p, i) => {
            const sentDate = p.last_sent_at ?? p.created_at
            const days = daysSince(sentDate)
            const total = p.generated_content?.grand_total
            return (
              <tr key={p.id} style={{ borderBottom: i < waiting.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{p.customer_name}</td>
                <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827' }}>{total != null ? `$${Number(total).toFixed(2)}` : '—'}</td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(sentDate)}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, borderRadius: 5, padding: '3px 10px',
                    backgroundColor: days >= 7 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                    color: days >= 7 ? '#ef4444' : '#F59E0B',
                  }}>{days} days</span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => patch(p, 'sent')} disabled={actioning === p.id}
                      style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, backgroundColor: 'transparent', color: '#374151', cursor: 'pointer' }}
                    >Resend</button>
                    <button onClick={() => patch(p, 'accepted')} disabled={actioning === p.id}
                      style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', border: 'none', borderRadius: 6, backgroundColor: '#00C27C', color: '#ffffff', cursor: 'pointer' }}
                    >Accepted</button>
                    <button onClick={() => patch(p, 'declined')} disabled={actioning === p.id}
                      style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', border: '1px solid #ef4444', borderRadius: 6, backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >Declined</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Proposals({ clientToken }: { clientToken: string }) {
  const [subTab, setSubTab] = useState<'all' | 'create' | 'pricebook' | 'followups'>('all')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loadingProposals, setLoadingProposals] = useState(true)

  const fetchProposals = useCallback(async () => {
    if (!clientToken) return
    setLoadingProposals(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/proposals`)
      const data = await res.json() as { proposals?: Proposal[] }
      setProposals(data.proposals ?? [])
    } catch { /* silent */ } finally { setLoadingProposals(false) }
  }, [clientToken])

  useEffect(() => { void fetchProposals() }, [fetchProposals])

  const SUB_TABS = [
    { key: 'all',       label: 'All Proposals' },
    { key: 'create',    label: 'Create Proposal' },
    { key: 'pricebook', label: 'Pricebook' },
    { key: 'followups', label: 'Follow-ups' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={LABEL_STYLE}>Proposal Generator</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Proposals</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Build, send, and track service proposals for your customers.</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: 4 }}>
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 500,
              border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
              color: subTab === t.key ? '#111827' : '#6b7280',
              borderBottom: subTab === t.key ? '2px solid #00C27C' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{t.label}</button>
        ))}
      </div>

      {subTab === 'all' && <AllProposals clientToken={clientToken} proposals={proposals} loading={loadingProposals} onRefresh={fetchProposals} />}
      {subTab === 'create' && <CreateProposal clientToken={clientToken} onCreated={() => { setSubTab('all'); void fetchProposals() }} />}
      {subTab === 'pricebook' && <Pricebook clientToken={clientToken} />}
      {subTab === 'followups' && <FollowUps clientToken={clientToken} proposals={proposals} onRefresh={fetchProposals} />}
    </div>
  )
}
