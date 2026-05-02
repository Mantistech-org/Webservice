'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  invoice_token: string
  proposal_id: string | null
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_address: string | null
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date: string | null
  notes: string | null
  stripe_payment_link: string | null
  status: string
  paid_at: string | null
  created_at: string
}

interface FormRow {
  description: string
  quantity: string
  unit_price: string
}

type SubTab = 'all' | 'create' | 'payments' | 'settings'

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 12,
  padding: 20,
}

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: '#00C27C',
  fontWeight: 600,
  marginBottom: 4,
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  color: '#111827',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
}

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
  display: 'block',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft:   ['rgba(0,0,0,0.06)',         '#6b7280'],
    sent:    ['rgba(124,58,237,0.10)',    '#7c3aed'],
    paid:    ['rgba(0,194,124,0.12)',     '#00C27C'],
    overdue: ['rgba(239,68,68,0.10)',     '#ef4444'],
    void:    ['rgba(0,0,0,0.06)',         '#9ca3af'],
  }
  const [bg, color] = map[status] ?? map.draft
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: bg, color }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function fmt(n: number | string | null | undefined) {
  const num = parseFloat(String(n ?? 0))
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return String(d) }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Invoices({ clientToken }: { clientToken: string }) {
  const [subTab, setSubTab] = useState<SubTab>('all')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  // Create form
  const [cust, setCust] = useState({ name: '', email: '', phone: '', address: '' })
  const [rows, setRows] = useState<FormRow[]>([{ description: '', quantity: '1', unit_price: '' }])
  const [taxRate, setTaxRate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const load = useCallback(async () => {
    if (!clientToken) { setLoading(false); return }
    try {
      const res = await fetch(`/api/client/${clientToken}/invoices`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices ?? [])
      }
    } catch {}
    setLoading(false)
  }, [clientToken])

  useEffect(() => { load() }, [load])

  // Computed totals for create form
  const rowTotals = rows.map(r => (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0))
  const subtotal = rowTotals.reduce((a, b) => a + b, 0)
  const taxRateNum = parseFloat(taxRate) || 0
  const taxAmt = subtotal * (taxRateNum / 100)
  const total = subtotal + taxAmt

  // Payment stats
  const totalInvoiced = invoices.reduce((a, i) => a + parseFloat(String(i.total)), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + parseFloat(String(i.total)), 0)
  const totalOutstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((a, i) => a + parseFloat(String(i.total)), 0)

  const handleSend = async (inv: Invoice) => {
    setSending(inv.id)
    try {
      const res = await fetch(`/api/client/${clientToken}/invoices/${inv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(prev => prev.map(i => i.id === inv.id ? data.invoice : i))
      }
    } catch {}
    setSending(null)
  }

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/client/${clientToken}/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(prev => prev.map(i => i.id === id ? data.invoice : i))
      }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return
    try {
      const res = await fetch(`/api/client/${clientToken}/invoices/${id}`, { method: 'DELETE' })
      if (res.ok) setInvoices(prev => prev.filter(i => i.id !== id))
    } catch {}
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cust.name.trim()) return
    setSaving(true)
    setCreateErr('')

    const lineItems = rows
      .filter(r => r.description.trim())
      .map((r, i) => ({
        description: r.description,
        quantity: parseFloat(r.quantity) || 1,
        unit_price: parseFloat(r.unit_price) || 0,
        total: rowTotals[i],
      }))

    try {
      const res = await fetch(`/api/client/${clientToken}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: cust.name.trim(),
          customer_email: cust.email.trim() || null,
          customer_phone: cust.phone.trim() || null,
          service_address: cust.address.trim() || null,
          line_items: lineItems,
          subtotal,
          tax_rate: taxRateNum,
          tax_amount: taxAmt,
          total,
          due_date: dueDate || null,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setInvoices(prev => [data.invoice, ...prev])
        setCust({ name: '', email: '', phone: '', address: '' })
        setRows([{ description: '', quantity: '1', unit_price: '' }])
        setTaxRate('')
        setDueDate('')
        setNotes('')
        setSubTab('all')
      } else {
        const err = await res.json()
        setCreateErr(err.error ?? 'Failed to create invoice')
      }
    } catch {
      setCreateErr('Failed to create invoice')
    }
    setSaving(false)
  }

  const TABS: { id: SubTab; label: string }[] = [
    { id: 'all',      label: 'All Invoices'   },
    { id: 'create',   label: 'Create Invoice' },
    { id: 'payments', label: 'Payments'       },
    { id: 'settings', label: 'Settings'       },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={LABEL}>Invoices</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Invoice Management</h1>
        </div>
        <button
          onClick={() => setSubTab('create')}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
        >
          + New Invoice
        </button>
      </div>

      {/* Sub-tab nav */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: subTab === t.id ? 600 : 400,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: subTab === t.id ? '#111827' : '#6b7280',
              borderBottom: subTab === t.id ? '2px solid #00C27C' : '2px solid transparent',
              marginBottom: -1,
              fontFamily: 'inherit',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── All Invoices ────────────────────────────────────────────────────── */}
      {subTab === 'all' && (
        loading ? (
          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading...</p>
        ) : invoices.length === 0 ? (
          <div style={{ ...CARD, textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 15, color: '#6b7280', margin: 0 }}>No invoices yet.</p>
            <button
              onClick={() => setSubTab('create')}
              style={{ marginTop: 16, padding: '10px 20px', fontSize: 13, fontWeight: 600, backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Create Your First Invoice
            </button>
          </div>
        ) : (
          <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {['Customer', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} style={{ borderBottom: idx < invoices.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{inv.customer_name}</div>
                      {inv.customer_email && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{inv.customer_email}</div>}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{fmt(inv.total)}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{fmtDate(inv.due_date)}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={inv.status} /></td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {inv.status === 'draft' && (
                          <button
                            onClick={() => handleSend(inv)}
                            disabled={sending === inv.id}
                            style={{ fontSize: 12, fontWeight: 600, color: '#00C27C', background: 'none', border: '1px solid rgba(0,194,124,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {sending === inv.id ? 'Sending...' : 'Send'}
                          </button>
                        )}
                        {inv.status === 'sent' && (
                          <button
                            onClick={() => handleMarkPaid(inv.id)}
                            style={{ fontSize: 12, fontWeight: 600, color: '#00C27C', background: 'none', border: '1px solid rgba(0,194,124,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Mark Paid
                          </button>
                        )}
                        {inv.stripe_payment_link && (
                          <a
                            href={inv.stripe_payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', background: 'none', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6, padding: '5px 12px', textDecoration: 'none' }}
                          >
                            Payment Link
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(inv.id)}
                          style={{ fontSize: 12, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Create Invoice ──────────────────────────────────────────────────── */}
      {subTab === 'create' && (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Left: Customer Info */}
            <div style={CARD}>
              <p style={{ ...LABEL, marginBottom: 16 }}>Customer Information</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={FIELD_LABEL}>Customer Name *</label>
                  <input
                    value={cust.name}
                    onChange={e => setCust(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                    required
                    style={INPUT}
                  />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Email Address</label>
                  <input
                    type="email"
                    value={cust.email}
                    onChange={e => setCust(p => ({ ...p, email: e.target.value }))}
                    placeholder="customer@email.com"
                    style={INPUT}
                  />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Phone</label>
                  <input
                    value={cust.phone}
                    onChange={e => setCust(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(555) 000-0000"
                    style={INPUT}
                  />
                </div>
                <div>
                  <label style={FIELD_LABEL}>Service Address</label>
                  <input
                    value={cust.address}
                    onChange={e => setCust(p => ({ ...p, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    style={INPUT}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={FIELD_LABEL}>Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={INPUT} />
                  </div>
                  <div>
                    <label style={FIELD_LABEL}>Tax Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      placeholder="0"
                      style={INPUT}
                    />
                  </div>
                </div>
                <div>
                  <label style={FIELD_LABEL}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Payment terms, additional notes..."
                    rows={3}
                    style={{ ...INPUT, resize: 'vertical' as const }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Line Items + Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={CARD}>
                <p style={{ ...LABEL, marginBottom: 16 }}>Line Items</p>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 72px 28px', gap: 6, paddingBottom: 6, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  {['Description', 'Qty', 'Unit Price', 'Total', ''].map(h => (
                    <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {rows.map((row, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 72px 28px', gap: 6, alignItems: 'center' }}>
                      <input
                        value={row.description}
                        onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))}
                        placeholder="Description"
                        style={{ ...INPUT, padding: '7px 10px', fontSize: 13 }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantity}
                        onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))}
                        style={{ ...INPUT, padding: '7px 8px', fontSize: 13, textAlign: 'right' as const }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unit_price}
                        onChange={e => setRows(prev => prev.map((r, i) => i === idx ? { ...r, unit_price: e.target.value } : r))}
                        placeholder="0.00"
                        style={{ ...INPUT, padding: '7px 8px', fontSize: 13, textAlign: 'right' as const }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textAlign: 'right' as const }}>
                        {rowTotals[idx] > 0 ? fmt(rowTotals[idx]) : '—'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)}
                        style={{ fontSize: 16, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setRows(prev => [...prev, { description: '', quantity: '1', unit_price: '' }])}
                  style={{ marginTop: 10, width: '100%', fontSize: 12, fontWeight: 600, color: '#00C27C', background: 'none', border: '1px dashed rgba(0,194,124,0.4)', borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  + Add Line Item
                </button>

                {/* Totals */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                      <span>Subtotal</span><span>{fmt(subtotal)}</span>
                    </div>
                    {taxRateNum > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                        <span>Tax ({taxRateNum}%)</span><span>{fmt(taxAmt)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111827', paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 2 }}>
                      <span>Total</span><span>{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {createErr && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{createErr}</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSubTab('all')}
                  style={{ padding: '10px 20px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, backgroundColor: '#111827', color: '#ffffff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                >
                  {saving ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ── Payments ────────────────────────────────────────────────────────── */}
      {subTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Invoiced',  value: fmt(totalInvoiced)    },
              { label: 'Total Collected', value: fmt(totalPaid)        },
              { label: 'Outstanding',     value: fmt(totalOutstanding) },
            ].map(s => (
              <div key={s.label} style={CARD}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {invoices.filter(i => i.status === 'sent' || i.status === 'paid' || i.status === 'overdue').length === 0 ? (
            <div style={{ ...CARD, textAlign: 'center', padding: 40 }}>
              <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>No sent or paid invoices yet.</p>
            </div>
          ) : (
            <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Customer', 'Amount', 'Due', 'Status', 'Payment Link'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices
                    .filter(i => i.status === 'sent' || i.status === 'paid' || i.status === 'overdue')
                    .map((inv, i, arr) => (
                      <tr key={inv.id} style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, color: '#111827' }}>{inv.customer_name}</td>
                        <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{fmt(inv.total)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{fmtDate(inv.due_date)}</td>
                        <td style={{ padding: '14px 20px' }}><StatusBadge status={inv.status} /></td>
                        <td style={{ padding: '14px 20px' }}>
                          {inv.stripe_payment_link ? (
                            <a
                              href={inv.stripe_payment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', textDecoration: 'none', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6, padding: '5px 12px' }}
                            >
                              Open Link
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Settings ────────────────────────────────────────────────────────── */}
      {subTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={CARD}>
            <p style={{ ...LABEL, marginBottom: 16 }}>Invoice Defaults</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={FIELD_LABEL}>Default Payment Terms</label>
                <input
                  type="text"
                  readOnly
                  value="Net 30 (30 days from invoice date)"
                  style={{ ...INPUT, color: '#6b7280', backgroundColor: '#f9fafb' }}
                />
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, marginBottom: 0 }}>Due dates are set per-invoice in the Create Invoice form.</p>
              </div>
              <div>
                <label style={FIELD_LABEL}>Default Tax Rate</label>
                <input
                  type="text"
                  readOnly
                  value="No default — set per invoice"
                  style={{ ...INPUT, color: '#6b7280', backgroundColor: '#f9fafb' }}
                />
              </div>
            </div>
          </div>

          <div style={CARD}>
            <p style={{ ...LABEL, marginBottom: 16 }}>Payment Processing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 8, backgroundColor: '#f0fdf4', border: '1px solid rgba(0,194,124,0.2)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#00C27C', margin: 0 }}>Stripe Connected</p>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, marginBottom: 0 }}>
                  Payment links are automatically generated for new invoices when a customer email and total greater than $0 are provided.
                </p>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                To update your Stripe API key, go to <strong>Integrations</strong> in the sidebar.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
