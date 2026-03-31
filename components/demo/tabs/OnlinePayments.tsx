'use client'

import { useState } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'
type InvoiceFilter = 'all' | InvoiceStatus

interface LineItem {
  description: string
  qty: number
  rate: number
}

interface Invoice {
  id: string
  client: string
  email: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  items: LineItem[]
}

const FAKE_INVOICES: Invoice[] = [
  {
    id: 'INV-1041',
    client: 'Riverside Auto Repair',
    email: 'billing@riversideauto.com',
    issueDate: 'Mar 22',
    dueDate: 'Apr 5',
    status: 'unpaid',
    items: [
      { description: 'Monthly service fee',       qty: 1, rate: 125 },
      { description: 'SEO Optimization add-on',   qty: 1, rate: 25  },
    ],
  },
  {
    id: 'INV-1040',
    client: 'Green Valley Landscaping',
    email: 'accounts@greenvalleyls.com',
    issueDate: 'Mar 15',
    dueDate: 'Mar 29',
    status: 'paid',
    items: [
      { description: 'Monthly service fee',            qty: 1, rate: 250 },
      { description: 'SMS/Text Marketing add-on',      qty: 1, rate: 29  },
      { description: 'Custom Referral System add-on',  qty: 1, rate: 19  },
    ],
  },
  {
    id: 'INV-1039',
    client: 'Lakeside Dental Studio',
    email: 'front@lakesidedental.com',
    issueDate: 'Mar 10',
    dueDate: 'Mar 24',
    status: 'paid',
    items: [
      { description: 'Monthly service fee',             qty: 1, rate: 125 },
      { description: 'Missed Call Auto-Reply add-on',   qty: 1, rate: 19  },
    ],
  },
  {
    id: 'INV-1038',
    client: 'Apex Fitness Co.',
    email: 'ops@apexfitness.com',
    issueDate: 'Feb 28',
    dueDate: 'Mar 14',
    status: 'overdue',
    items: [
      { description: 'Monthly service fee',       qty: 1, rate: 40  },
      { description: 'Review Management add-on',  qty: 1, rate: 19  },
      { description: 'Email with Domain add-on',  qty: 1, rate: 12  },
    ],
  },
  {
    id: 'INV-1037',
    client: 'Northside Pet Clinic',
    email: 'admin@northsidepet.com',
    issueDate: 'Feb 25',
    dueDate: 'Mar 11',
    status: 'paid',
    items: [
      { description: 'Monthly service fee',             qty: 1, rate: 250 },
      { description: 'Online Payments add-on',          qty: 1, rate: 29  },
    ],
  },
  {
    id: 'INV-1036',
    client: 'Summit Roofing LLC',
    email: 'billing@summitroofing.com',
    issueDate: 'Feb 20',
    dueDate: 'Mar 6',
    status: 'overdue',
    items: [
      { description: 'Monthly service fee',           qty: 1, rate: 125 },
      { description: 'Social Media Automation add-on',qty: 1, rate: 24  },
    ],
  },
  {
    id: 'INV-1035',
    client: 'Blue Harbor Catering',
    email: 'pay@blueharborco.com',
    issueDate: 'Feb 15',
    dueDate: 'Mar 1',
    status: 'paid',
    items: [
      { description: 'Monthly service fee', qty: 1, rate: 40 },
    ],
  },
]

const STATUS_STYLE: Record<InvoiceStatus, { color: string; label: string }> = {
  paid:    { color: '#00aa55', label: 'Paid'    },
  unpaid:  { color: '#f59e0b', label: 'Unpaid'  },
  overdue: { color: '#ef4444', label: 'Overdue' },
}

const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

function invoiceTotal(inv: Invoice) {
  return inv.items.reduce((s, item) => s + item.qty * item.rate, 0)
}

export default function OnlinePayments({ sessionId, darkMode }: Props) {
  const [filter, setFilter] = useState<InvoiceFilter>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>(FAKE_INVOICES)
  const [paidInvoices, setPaidInvoices] = useState<Set<string>>(new Set())

  // Create invoice form state
  const [newClient, setNewClient] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newDue, setNewDue] = useState('')
  const [newItems, setNewItems] = useState<LineItem[]>([{ description: '', qty: 1, rate: 0 }])
  const [createSaved, setCreateSaved] = useState(false)

  const addItem = () => setNewItems((prev) => [...prev, { description: '', qty: 1, rate: 0 }])
  const updateItem = (i: number, field: keyof LineItem, value: string) => {
    setNewItems((prev) => prev.map((item, idx) =>
      idx === i ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
    ))
  }
  const removeItem = (i: number) => setNewItems((prev) => prev.filter((_, idx) => idx !== i))

  const newTotal = newItems.reduce((s, item) => s + item.qty * item.rate, 0)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClient.trim() || newTotal === 0) return
    const nextId = `INV-${1000 + invoices.length + 42}`
    const inv: Invoice = {
      id: nextId,
      client: newClient.trim(),
      email: newEmail.trim(),
      issueDate: 'Mar 29',
      dueDate: newDue || 'Apr 12',
      status: 'unpaid',
      items: newItems.filter((i) => i.description.trim() && i.rate > 0),
    }
    setInvoices((prev) => [inv, ...prev])
    setCreateSaved(true)
    setNewClient('')
    setNewEmail('')
    setNewDue('')
    setNewItems([{ description: '', qty: 1, rate: 0 }])
    setTimeout(() => { setCreateSaved(false); setShowCreate(false) }, 2500)
  }

  const handleMarkPaid = (id: string) => {
    setPaidInvoices((prev) => new Set([...prev, id]))
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: 'paid' } : inv))
    if (selectedInvoice?.id === id) {
      setSelectedInvoice((prev) => prev ? { ...prev, status: 'paid' } : prev)
    }
  }

  const paidInvoiceList    = invoices.filter((i) => i.status === 'paid')
  const unpaidInvoiceList  = invoices.filter((i) => i.status === 'unpaid')
  const overdueInvoiceList = invoices.filter((i) => i.status === 'overdue')

  const collectedThisMonth = paidInvoiceList.reduce((s, inv) => s + invoiceTotal(inv), 0)
  const outstandingTotal   = [...unpaidInvoiceList, ...overdueInvoiceList].reduce((s, inv) => s + invoiceTotal(inv), 0)

  const filtered = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter)

  return (
    <div className="space-y-8">
      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Collected This Month', value: `$${collectedThisMonth.toLocaleString()}` },
          { label: 'Outstanding',          value: `$${outstandingTotal.toLocaleString()}`   },
          { label: 'Overdue Invoices',     value: overdueInvoiceList.length.toString()      },
          { label: 'Total Invoices',       value: invoices.length.toString()                },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded px-5 py-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{s.label}</div>
            <div className="font-heading text-2xl text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Invoices</p>
            <h2 className="font-heading text-2xl text-primary">Invoice History</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {(['all', 'paid', 'unpaid', 'overdue'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="font-mono text-xs px-3 py-1.5 rounded border transition-colors capitalize"
                  style={filter === f
                    ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5512' }
                    : { borderColor: '#d0d0d0', color: '#888888', backgroundColor: 'transparent' }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { setShowCreate((v) => !v); setSelectedInvoice(null) }}
              className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              {showCreate ? 'Cancel' : 'New Invoice'}
            </button>
          </div>
        </div>

        {/* Create invoice form */}
        {showCreate && (
          <div className="px-6 py-6 border-b border-border bg-[#fafafa]">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#00aa55' }}>Create Invoice</p>
            {createSaved && (
              <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                Invoice created successfully.
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Client Name</label>
                  <input type="text" className={inputClass} placeholder="Client or business name" value={newClient} onChange={(e) => setNewClient(e.target.value)} required />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Client Email</label>
                  <input type="email" className={inputClass} placeholder="client@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Due Date</label>
                <input type="text" className={inputClass} placeholder="e.g. Apr 12" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
              </div>
              <div>
                <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-muted">Line Items</label>
                <div className="space-y-2">
                  {newItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888]"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        min="1"
                        className="w-16 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] text-center"
                        placeholder="Qty"
                        value={item.qty || ''}
                        onChange={(e) => updateItem(i, 'qty', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888]"
                        placeholder="$0.00"
                        value={item.rate || ''}
                        onChange={(e) => updateItem(i, 'rate', e.target.value)}
                      />
                      {newItems.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="font-mono text-xs text-muted hover:text-primary transition-colors px-1">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 font-mono text-xs text-muted hover:text-primary transition-colors">
                  + Add line item
                </button>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="font-mono text-sm text-primary">
                  Total: <span className="font-medium">${newTotal.toFixed(2)}</span>
                </div>
                <button
                  type="submit"
                  className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoice rows */}
        <div className="divide-y divide-border">
          {filtered.map((inv) => {
            const total     = invoiceTotal(inv)
            const isSelected = selectedInvoice?.id === inv.id
            return (
              <div key={inv.id}>
                <div
                  className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#fafafa] transition-colors"
                  onClick={() => { setSelectedInvoice(isSelected ? null : inv); setShowCreate(false) }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div>
                      <div className="font-mono text-xs text-muted">{inv.id}</div>
                      <div className="font-mono text-sm text-primary font-medium">{inv.client}</div>
                      <div className="font-mono text-xs text-muted">{inv.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="font-mono text-xs text-muted">Due {inv.dueDate}</div>
                      <div className="font-mono text-xs text-muted">Issued {inv.issueDate}</div>
                    </div>
                    <div className="font-heading text-lg text-primary">${total.toFixed(2)}</div>
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded border"
                      style={{ color: STATUS_STYLE[inv.status].color, borderColor: `${STATUS_STYLE[inv.status].color}30`, backgroundColor: `${STATUS_STYLE[inv.status].color}08` }}
                    >
                      {STATUS_STYLE[inv.status].label}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#888888' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Invoice detail */}
                {isSelected && (
                  <div className="px-6 pb-6 pt-2 bg-[#fafafa] border-t border-border">
                    <div className="bg-white border border-[#d0d0d0] rounded overflow-hidden">
                      {/* Invoice header */}
                      <div className="px-6 py-4 border-b border-[#d0d0d0] flex items-center justify-between gap-4">
                        <div>
                          <div className="font-mono text-xs text-[#888888] mb-0.5">{inv.id}</div>
                          <div className="font-heading text-lg text-[#1a1a1a]">{inv.client}</div>
                          <div className="font-mono text-xs text-[#888888]">{inv.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs text-[#888888]">Issued {inv.issueDate}</div>
                          <div className="font-mono text-xs text-[#888888]">Due {inv.dueDate}</div>
                        </div>
                      </div>

                      {/* Line items */}
                      <div className="px-6 py-4">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#efefef]">
                              <th className="text-left pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase">Description</th>
                              <th className="text-center pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-16">Qty</th>
                              <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-24">Rate</th>
                              <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-24">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inv.items.map((item, i) => (
                              <tr key={i} className="border-b border-[#efefef] last:border-0">
                                <td className="py-3 font-mono text-sm text-[#1a1a1a]">{item.description}</td>
                                <td className="py-3 font-mono text-sm text-[#888888] text-center">{item.qty}</td>
                                <td className="py-3 font-mono text-sm text-[#888888] text-right">${item.rate.toFixed(2)}</td>
                                <td className="py-3 font-mono text-sm text-[#1a1a1a] text-right">${(item.qty * item.rate).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="mt-4 pt-4 border-t border-[#efefef] flex items-center justify-between">
                          <div className="font-mono text-sm text-[#888888]">Total Due</div>
                          <div className="font-heading text-2xl text-[#1a1a1a]">${invoiceTotal(inv).toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Payment button */}
                      <div className="px-6 py-4 border-t border-[#d0d0d0] flex items-center justify-between gap-4">
                        {inv.status === 'paid' || paidInvoices.has(inv.id) ? (
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00aa55" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="font-mono text-sm" style={{ color: '#00aa55' }}>Payment received</span>
                          </div>
                        ) : (
                          <>
                            <p className="font-mono text-xs text-[#888888]">
                              Stripe-powered checkout — customers pay securely from the link or directly on your website.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(inv.id)}
                              className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0"
                              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                            >
                              Mark as Paid
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version connects to your Stripe account and sends invoices directly to clients with a one-click payment link.
      </p>
    </div>
  )
}
