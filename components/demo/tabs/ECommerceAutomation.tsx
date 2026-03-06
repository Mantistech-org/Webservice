'use client'

import React, { useState, useEffect } from 'react'

interface Props { sessionId: string; initialSubTab?: 'automations' | 'inventory' }

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutomationEmail { id: number; name: string; trigger: string; lastSent: string; active: boolean; subject: string; body: string }
interface InventoryItem { id: number; name: string; sku: string; quantity: number; status: 'In Stock' | 'Low Stock' | 'Out of Stock'; restockDate: string | null }
interface EmailItem { subject: string; preview: string; body: string; delayLabel: string }
interface ECommerceResult {
  abandonedCart: { emails: EmailItem[] }
  postPurchase: { emails: EmailItem[] }
  restockAlert: { emails: EmailItem[] }
}
interface EditableEmail { subject: string; body: string; delay: string; active: boolean }

// ── Mock data ──────────────────────────────────────────────────────────────────

const INITIAL_AUTOMATIONS: AutomationEmail[] = [
  { id: 1, name: 'Welcome Email', trigger: 'New customer account created', lastSent: '2 hours ago', active: true, subject: 'Welcome to our store!', body: 'Thanks for joining us. Here is a 10% discount on your first order.' },
  { id: 2, name: 'Abandoned Cart Recovery', trigger: 'Cart abandoned for 1 hour', lastSent: '45 minutes ago', active: true, subject: 'You left something behind', body: 'Your cart is waiting. Complete your purchase before items sell out.' },
  { id: 3, name: 'Post-Purchase Thank You', trigger: 'Order confirmed', lastSent: '1 hour ago', active: true, subject: 'Your order is confirmed', body: 'Thank you for your order. We will keep you updated on your shipping.' },
  { id: 4, name: 'Review Request', trigger: '7 days after delivery confirmed', lastSent: 'Yesterday', active: false, subject: 'How did we do?', body: 'We hope you love your order. Would you take a moment to leave a review?' },
  { id: 5, name: 'Restock Notification', trigger: 'Watched item back in stock', lastSent: '2 days ago', active: true, subject: 'Good news, it is back!', body: 'The item you had your eye on is back in stock. Grab it before it goes again.' },
  { id: 6, name: 'Win-Back Campaign', trigger: '60 days since last purchase', lastSent: '3 days ago', active: false, subject: 'We miss you', body: 'It has been a while. Here is a special offer to welcome you back.' },
]

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Classic Crew Neck Tee', sku: 'APP-001', quantity: 142, status: 'In Stock', restockDate: null },
  { id: 2, name: 'Slim Fit Chinos', sku: 'APP-002', quantity: 8, status: 'Low Stock', restockDate: null },
  { id: 3, name: 'Canvas Sneakers', sku: 'FOOT-001', quantity: 0, status: 'Out of Stock', restockDate: null },
  { id: 4, name: 'Wool Blend Sweater', sku: 'APP-003', quantity: 55, status: 'In Stock', restockDate: null },
  { id: 5, name: 'Leather Belt', sku: 'ACC-001', quantity: 3, status: 'Low Stock', restockDate: null },
  { id: 6, name: 'Bucket Hat', sku: 'ACC-002', quantity: 27, status: 'In Stock', restockDate: null },
]

const STATUS_COLORS: Record<string, string> = {
  'In Stock': '#4ade80',
  'Low Stock': '#facc15',
  'Out of Stock': '#f87171',
}

const DELAY_OPTIONS = ['Immediately', '1 day later', '3 days later', '7 days later', '14 days later']

const SEQUENCE_CONFIGS: { key: keyof ECommerceResult; label: string; description: string; color: string }[] = [
  { key: 'abandonedCart', label: 'Abandoned Cart Recovery', description: 'Sends when a shopper leaves without completing checkout', color: '#f97316' },
  { key: 'postPurchase', label: 'Post-Purchase Follow-up', description: 'Sends immediately after a confirmed order', color: '#3b82f6' },
  { key: 'restockAlert', label: 'Restock Alert', description: 'Sends when a previously out-of-stock item is available', color: '#8ab4cc' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function QuestionTooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1.5">
      <span className="w-4 h-4 rounded-full border border-[#aaaaaa] text-[#aaaaaa] flex items-center justify-center font-mono text-[9px] cursor-default select-none leading-none">
        ?
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-[#1a1a1a] text-white font-mono text-xs rounded px-3 py-2.5 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 text-left normal-case tracking-normal shadow-lg">
        {text}
      </span>
    </span>
  )
}

// ── Editable email card ────────────────────────────────────────────────────────

function EditableEmailCard({
  email, index, color, onChange, onToggle,
}: {
  email: EditableEmail; index: number; color: string
  onChange: (field: 'subject' | 'body' | 'delay', value: string) => void
  onToggle: () => void
}) {
  return (
    <div className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[#d0d0d0]">
        <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center font-mono text-xs font-bold text-black" style={{ backgroundColor: color }}>
          {index + 1}
        </div>
        <input
          value={email.subject}
          onChange={e => onChange('subject', e.target.value)}
          placeholder="Subject line"
          className="flex-1 bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors"
        />
      </div>
      <div className="p-4 space-y-3">
        <textarea
          value={email.body}
          onChange={e => onChange('body', e.target.value)}
          rows={4}
          className="w-full bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors resize-none"
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <label className="font-mono text-xs text-muted uppercase tracking-widest block mb-1">Sends</label>
            <select
              value={email.delay}
              onChange={e => onChange('delay', e.target.value)}
              className="bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-xs focus:outline-none focus:border-[#888888] transition-colors"
            >
              {DELAY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted">Enable This Email</span>
            <button
              type="button"
              role="switch"
              aria-checked={email.active}
              onClick={onToggle}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${email.active ? 'bg-[#1a1a1a]' : 'bg-[#d0d0d0]'}`}
            >
              <span className={`pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${email.active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Automated Emails + Follow Up Emails sub-tab ───────────────────────────────

function AutomatedEmails({ sessionId }: { sessionId: string }) {
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [editing, setEditing] = useState<number | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')

  const toggle = (id: number) => setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  const startEdit = (a: AutomationEmail) => { setEditing(a.id); setEditSubject(a.subject); setEditBody(a.body) }
  const saveEdit = (id: number) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, subject: editSubject, body: editBody } : a))
    setEditing(null)
  }

  // Follow Up Emails state
  const [storeName, setStoreName] = useState('')
  const [productTypes, setProductTypes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editState, setEditState] = useState<Record<string, EditableEmail[]> | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setEditState(null)
    try {
      const res = await fetch('/api/demo/ecommerce-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, storeName, productTypes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const r = data.result as ECommerceResult
      const next: Record<string, EditableEmail[]> = {}
      for (const cfg of SEQUENCE_CONFIGS) {
        next[cfg.key] = r[cfg.key].emails.map((email, i) => ({
          subject: email.subject,
          body: email.body,
          delay: DELAY_OPTIONS[Math.min(i, DELAY_OPTIONS.length - 1)],
          active: false,
        }))
      }
      setEditState(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const updateEmail = (seqKey: string, emailIdx: number, field: 'subject' | 'body' | 'delay', value: string) => {
    setEditState(prev => {
      if (!prev) return prev
      const seq = [...prev[seqKey]]
      seq[emailIdx] = { ...seq[emailIdx], [field]: value }
      return { ...prev, [seqKey]: seq }
    })
  }

  const toggleEmail = (seqKey: string, emailIdx: number) => {
    setEditState(prev => {
      if (!prev) return prev
      const seq = [...prev[seqKey]]
      seq[emailIdx] = { ...seq[emailIdx], active: !seq[emailIdx].active }
      return { ...prev, [seqKey]: seq }
    })
  }

  const enableAll = () => {
    setEditState(prev => {
      if (!prev) return prev
      const next: Record<string, EditableEmail[]> = {}
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].map(e => ({ ...e, active: true }))
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted mb-4">These automations run in the background and send emails based on customer actions. Toggle any off to pause it.</p>

      {automations.map(a => (
        <div key={a.id} className="bg-card border border-border rounded overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-heading text-base text-primary">{a.name}</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded-full border ${a.active ? 'text-[#16a34a] border-[#4ade80]/50' : 'text-dim border-[#d0d0d0]'}`}>
                  {a.active ? 'Active' : 'Paused'}
                </span>
              </div>
              <div className="font-mono text-xs text-muted">{a.trigger}</div>
              <div className="font-mono text-xs text-dim mt-0.5">Last sent: {a.lastSent}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => startEdit(a)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-3 py-1.5 rounded hover:border-[#b0b0b0] hover:text-primary transition-all">
                Customize
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={a.active}
                onClick={() => toggle(a.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${a.active ? 'bg-[#1a1a1a]' : 'bg-[#d0d0d0]'}`}
              >
                <span className={`pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${a.active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          {editing === a.id && (
            <div className="border-t border-border bg-[#efefef] p-5 space-y-3">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Subject Line</label>
                <input value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Email Body</label>
                <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={3} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => saveEdit(a.id)} className="font-mono text-xs px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save Changes</button>
                <button onClick={() => setEditing(null)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:text-primary transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Follow Up Emails section */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="flex items-center mb-4">
          <h3 className="font-heading text-xl text-primary">Generate and Enable Follow Up Emails</h3>
          <QuestionTooltip text="Follow up emails are a series of emails that automatically send to customers over time after they take an action. For example, after someone makes a purchase they might get a thank you email the same day, a check in email 3 days later, and a review request after 7 days. Write them once and they send themselves." />
        </div>

        <div className="bg-card border border-border rounded">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Store Name</label>
                  <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Summit Supply Co." required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Product Types</label>
                  <input type="text" value={productTypes} onChange={e => setProductTypes(e.target.value)} placeholder="Outdoor gear, hiking equipment, apparel" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                {loading ? 'Building sequences...' : 'Generate Follow Up Emails'}
              </button>
            </form>

            {loading && (
              <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
                <span className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                Writing your follow up email sequences...
              </div>
            )}
            {error && <div className="mt-6 bg-red-50 border border-red-200 rounded p-4 font-mono text-sm text-red-700">{error}</div>}
          </div>
        </div>

        {editState && (
          <div className="mt-6 space-y-6">
            {SEQUENCE_CONFIGS.map(cfg => (
              <div key={cfg.key} className="bg-card border border-border rounded">
                <div className="px-6 py-4 border-b border-border">
                  <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: cfg.color }}>{cfg.label}</p>
                  <p className="font-mono text-xs text-muted mt-0.5">{cfg.description}</p>
                </div>
                <div className="p-6 space-y-3">
                  {editState[cfg.key].map((email, i) => (
                    <EditableEmailCard
                      key={i}
                      email={email}
                      index={i}
                      color={cfg.color}
                      onChange={(field, value) => updateEmail(cfg.key, i, field, value)}
                      onToggle={() => toggleEmail(cfg.key, i)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button
                onClick={enableAll}
                className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Enable All Emails
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inventory sub-tab ──────────────────────────────────────────────────────────

function Inventory() {
  const [items, setItems] = useState(INITIAL_INVENTORY)
  const [schedulingId, setSchedulingId] = useState<number | null>(null)
  const [restockDate, setRestockDate] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'uploading' | 'done'>('idle')

  const saveRestock = (id: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, restockDate: restockDate || null } : item))
    setSchedulingId(null); setRestockDate(''); setRestockQty('')
  }

  const handleBulkUpload = () => {
    setBulkStatus('uploading')
    setTimeout(() => setBulkStatus('done'), 1200)
    setTimeout(() => setBulkStatus('idle'), 3500)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-xs text-muted">Live inventory across all products. New orders automatically subtract from quantities.</p>
        <button
          onClick={handleBulkUpload}
          disabled={bulkStatus !== 'idle'}
          className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:border-[#b0b0b0] hover:text-primary transition-all disabled:opacity-50 shrink-0"
        >
          {bulkStatus === 'uploading' ? 'Uploading...' : bulkStatus === 'done' ? 'Imported' : 'Bulk Upload CSV'}
        </button>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Product</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">SKU</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Quantity</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Status</th>
                <th className="px-4 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map(item => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td className="px-4 py-3 font-mono text-sm text-primary">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{item.sku}</td>
                    <td className="px-4 py-3 font-mono text-sm text-primary">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs" style={{ color: STATUS_COLORS[item.status] }}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.restockDate
                          ? <span className="font-mono text-xs text-muted">Restock: {item.restockDate}</span>
                          : (
                            <button onClick={() => setSchedulingId(schedulingId === item.id ? null : item.id)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-2 py-1 rounded hover:text-primary transition-colors">
                              Schedule Restock
                            </button>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                  {schedulingId === item.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 bg-[#efefef] border-t border-[#d0d0d0]">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div>
                            <label className="font-mono text-xs text-muted block mb-1">Expected Arrival Date</label>
                            <input type="date" value={restockDate} onChange={e => setRestockDate(e.target.value)} className="bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-xs focus:outline-none" />
                          </div>
                          <div>
                            <label className="font-mono text-xs text-muted block mb-1">Quantity Coming In</label>
                            <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="100" className="w-24 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-xs focus:outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => saveRestock(item.id)} className="font-mono text-xs px-4 py-1.5 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save</button>
                            <button onClick={() => setSchedulingId(null)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ECommerceAutomation({ sessionId, initialSubTab = 'automations' }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'automations' | 'inventory'>(initialSubTab)

  useEffect(() => {
    setActiveSubTab(initialSubTab)
  }, [initialSubTab])

  const subTabs: { id: typeof activeSubTab; label: string }[] = [
    { id: 'automations', label: 'Automated Emails' },
    { id: 'inventory',   label: 'Inventory' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>E-Commerce Automation</p>
        <h2 className="font-heading text-2xl text-primary">Store Management</h2>
      </div>

      <div className="flex gap-2 border-b border-border">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`font-mono text-xs px-5 py-3 border-b-2 -mb-px tracking-wider transition-all ${
              activeSubTab === tab.id ? 'border-[#1a1a1a] text-[#1a1a1a]' : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'automations' && <AutomatedEmails sessionId={sessionId} />}
      {activeSubTab === 'inventory'   && <Inventory />}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your Shopify, WooCommerce, or custom store.
      </p>
    </div>
  )
}
