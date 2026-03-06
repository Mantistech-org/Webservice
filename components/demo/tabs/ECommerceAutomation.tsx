'use client'

import { useState, useEffect } from 'react'

interface Props { sessionId: string; initialSubTab?: 'automations' | 'inventory' | 'sequences' }

// ── Types ────────────────────────────────────────────────────────────────────

interface AutomationEmail { id: number; name: string; trigger: string; lastSent: string; active: boolean; subject: string; body: string }
interface InventoryItem { id: number; name: string; sku: string; quantity: number; status: 'In Stock' | 'Low Stock' | 'Out of Stock'; restockDate: string | null }
interface EmailItem { subject: string; preview: string; body: string; delayLabel: string }
interface ECommerceResult {
  abandonedCart: { emails: EmailItem[] }
  postPurchase: { emails: EmailItem[] }
  restockAlert: { emails: EmailItem[] }
}

// ── Mock data ─────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────

function EmailCard({ email, index, color }: { email: EmailItem; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded shrink-0 flex items-center justify-center font-mono text-xs font-bold text-black mt-0.5" style={{ backgroundColor: color }}>{index + 1}</div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs text-muted mb-0.5">{email.delayLabel}</div>
            <div className="font-mono text-sm text-primary leading-tight">{email.subject}</div>
            <div className="font-mono text-xs text-dim mt-0.5 truncate">{email.preview}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={copy} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
          <button onClick={() => setOpen(!open)} className="font-mono text-xs text-muted hover:text-primary transition-colors">{open ? 'Hide' : 'View'}</button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[#d0d0d0] px-4 py-4 bg-card">
          <p className="text-sm text-teal leading-relaxed whitespace-pre-line">{email.body}</p>
        </div>
      )}
    </div>
  )
}

// ── Automated Emails sub-tab ──────────────────────────────────────────────────

function AutomatedEmails() {
  const [automations, setAutomations] = useState(INITIAL_AUTOMATIONS)
  const [editing, setEditing] = useState<number | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')

  const toggle = (id: number) => setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, active: !a.active } : a))
  const startEdit = (a: AutomationEmail) => { setEditing(a.id); setEditSubject(a.subject); setEditBody(a.body) }
  const saveEdit = (id: number) => {
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, subject: editSubject, body: editBody } : a))
    setEditing(null)
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted mb-4">These automations run in the background and send emails based on customer actions. Toggle any off to pause it.</p>
      {automations.map((a) => (
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
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
                  a.active ? 'bg-[#1a1a1a]' : 'bg-[#d0d0d0]'
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                    a.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          {editing === a.id && (
            <div className="border-t border-border bg-[#efefef] p-5 space-y-3">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Subject Line</label>
                <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Email Body</label>
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => saveEdit(a.id)} className="font-mono text-xs px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save Changes</button>
                <button onClick={() => setEditing(null)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:text-primary transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Inventory sub-tab ─────────────────────────────────────────────────────────

function Inventory() {
  const [items, setItems] = useState(INITIAL_INVENTORY)
  const [schedulingId, setSchedulingId] = useState<number | null>(null)
  const [restockDate, setRestockDate] = useState('')
  const [restockQty, setRestockQty] = useState('')
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'uploading' | 'done'>('idle')

  const saveRestock = (id: number) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, restockDate: restockDate || null } : item))
    setSchedulingId(null)
    setRestockDate('')
    setRestockQty('')
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
              {items.map((item) => (
                <>
                  <tr key={item.id}>
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
                            <input type="date" value={restockDate} onChange={(e) => setRestockDate(e.target.value)} className="bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-xs focus:outline-none" />
                          </div>
                          <div>
                            <label className="font-mono text-xs text-muted block mb-1">Quantity Coming In</label>
                            <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="100" className="w-24 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-1.5 font-mono text-xs focus:outline-none" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => saveRestock(item.id)} className="font-mono text-xs px-4 py-1.5 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save</button>
                            <button onClick={() => setSchedulingId(null)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-1.5 rounded hover:text-primary transition-colors">Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Email Sequences sub-tab ───────────────────────────────────────────────────

function EmailSequences({ sessionId }: { sessionId: string }) {
  const [storeName, setStoreName] = useState('')
  const [productTypes, setProductTypes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ECommerceResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/demo/ecommerce-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, storeName, productTypes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as ECommerceResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const sequences = result ? [
    { key: 'abandonedCart' as const, label: 'Abandoned Cart Recovery', description: 'Sends when a shopper leaves without completing checkout', color: '#f97316' },
    { key: 'postPurchase' as const, label: 'Post-Purchase Follow-up', description: 'Sends immediately after a confirmed order', color: '#3b82f6' },
    { key: 'restockAlert' as const, label: 'Restock Alert', description: 'Sends when a previously out-of-stock item is available', color: '#8ab4cc' },
  ] : []

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>Sequence Builder</p>
          <h3 className="font-heading text-xl text-primary">Generate Email Sequences</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Store Name</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Summit Supply Co." required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Product Types</label>
                <input type="text" value={productTypes} onChange={(e) => setProductTypes(e.target.value)} placeholder="Outdoor gear, hiking equipment, apparel" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Building sequences...' : 'Generate Email Sequences'}
            </button>
          </form>
          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
              Writing your automated email sequences...
            </div>
          )}
          {error && <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>}
        </div>
      </div>

      {result && sequences.map(({ key, label, description, color }) => (
        <div key={key} className="bg-card border border-border rounded">
          <div className="px-6 py-4 border-b border-border">
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color }}>{label}</p>
            <h3 className="font-heading text-xl text-primary">{result[key].emails.length} Emails</h3>
            <p className="font-mono text-xs text-muted mt-1">{description}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {result[key].emails.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="bg-[#efefef] border border-[#d0d0d0] rounded px-2 py-1">
                    <div className="font-mono text-xs text-muted">Email {i + 1}</div>
                    <div className="font-mono text-xs text-primary">{e.delayLabel}</div>
                  </div>
                  {i < result[key].emails.length - 1 && <span className="font-mono text-xs text-muted">&#8594;</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-3">
            {result[key].emails.map((email, i) => <EmailCard key={i} email={email} index={i} color={color} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ECommerceAutomation({ sessionId, initialSubTab = 'automations' }: Props) {
  const [activeSubTab, setActiveSubTab] = useState<'automations' | 'inventory' | 'sequences'>(initialSubTab)

  useEffect(() => {
    setActiveSubTab(initialSubTab)
  }, [initialSubTab])

  const subTabs: { id: typeof activeSubTab; label: string }[] = [
    { id: 'automations', label: 'Automated Emails' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'sequences', label: 'Email Sequences' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3a6a8a' }}>E-Commerce Automation</p>
        <h2 className="font-heading text-2xl text-primary">Store Management</h2>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-2 border-b border-border">
        {subTabs.map((tab) => (
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

      {activeSubTab === 'automations' && <AutomatedEmails />}
      {activeSubTab === 'inventory'  && <Inventory />}
      {activeSubTab === 'sequences'  && <EmailSequences sessionId={sessionId} />}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your Shopify, WooCommerce, or custom store.
      </p>
    </div>
  )
}
