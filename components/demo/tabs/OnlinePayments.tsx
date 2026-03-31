'use client'

import { useState } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

type ActiveTab = 'overview' | 'invoices' | 'clients' | 'services' | 'recurring' | 'reminders' | 'templates'
type InvoiceStatus = 'paid' | 'unpaid' | 'overdue'

interface LineItem { description: string; qty: number; rate: number }

interface Invoice {
  id: string; clientId: number; client: string; email: string
  issueDate: string; dueDate: string; status: InvoiceStatus; items: LineItem[]
}

interface Client {
  id: number; name: string; email: string; phone: string; address: string
  invoiceCount: number; totalBilled: number; lastInvoice: string
}

interface ServiceItem { id: number; name: string; description: string; defaultPrice: number }

interface RecurringInvoice {
  id: number; clientId: number; clientName: string; serviceIds: number[]
  schedule: 'weekly' | 'monthly' | 'quarterly'; nextDate: string; active: boolean
}

interface Reminder { id: number; timing: 'before' | 'after'; days: number; message: string; enabled: boolean }

// ── Seed data ─────────────────────────────────────────────────────────────────

const INIT_CLIENTS: Client[] = [
  { id: 1, name: 'Riverside Auto Repair',     email: 'billing@riversideauto.com',  phone: '(555) 204-3310', address: '1421 River Rd, Little Rock, AR', invoiceCount: 8, totalBilled: 1200, lastInvoice: 'Mar 22' },
  { id: 2, name: 'Green Valley Landscaping',  email: 'accounts@greenvalleyls.com', phone: '(555) 318-0092', address: '804 Valley Dr, Conway, AR',      invoiceCount: 6, totalBilled: 1794, lastInvoice: 'Mar 15' },
  { id: 3, name: 'Lakeside Dental Studio',    email: 'front@lakesidedental.com',   phone: '(555) 441-7730', address: '210 Lakeside Blvd, Benton, AR',  invoiceCount: 5, totalBilled: 720,  lastInvoice: 'Mar 10' },
  { id: 4, name: 'Apex Fitness Co.',          email: 'ops@apexfitness.com',        phone: '(555) 572-4481', address: '3300 Fitness Way, North Little Rock, AR', invoiceCount: 4, totalBilled: 284, lastInvoice: 'Feb 28' },
  { id: 5, name: 'Northside Pet Clinic',      email: 'admin@northsidepet.com',     phone: '(555) 613-9954', address: '519 Pet Clinic Ln, Cabot, AR',   invoiceCount: 7, totalBilled: 1953, lastInvoice: 'Feb 25' },
  { id: 6, name: 'Summit Roofing LLC',        email: 'billing@summitroofing.com',  phone: '(555) 784-2200', address: '987 Summit Ave, Searcy, AR',     invoiceCount: 3, totalBilled: 447,  lastInvoice: 'Feb 20' },
]

const INIT_SERVICES: ServiceItem[] = [
  { id: 1, name: 'Monthly Website Plan — Starter',  description: 'Base plan: custom website, hosting, SSL',    defaultPrice: 40  },
  { id: 2, name: 'Monthly Website Plan — Growth',   description: 'Growth plan with bundled marketing services', defaultPrice: 125 },
  { id: 3, name: 'Monthly Website Plan — Pro',      description: 'Pro plan with all services included',          defaultPrice: 250 },
  { id: 4, name: 'SEO Optimization',                description: 'Ongoing local SEO management',                defaultPrice: 25  },
  { id: 5, name: 'Review Management',               description: 'Automated review monitoring and posting',     defaultPrice: 19  },
  { id: 6, name: 'Social Media Automation',         description: 'Automated social media posting',              defaultPrice: 24  },
  { id: 7, name: 'SMS/Text Marketing',              description: 'Bulk SMS campaigns and automation',           defaultPrice: 29  },
  { id: 8, name: 'Missed Call Auto-Reply',          description: 'Instant text reply to missed calls',          defaultPrice: 19  },
  { id: 9, name: 'Custom Referral System',          description: 'Referral tracking and reward management',     defaultPrice: 19  },
  { id: 10, name: 'Email with Domain',              description: 'Professional business email setup',           defaultPrice: 12  },
  { id: 11, name: 'One-Time Setup Fee',             description: 'Website build and onboarding',                defaultPrice: 150 },
]

const INIT_INVOICES: Invoice[] = [
  { id: 'INV-1041', clientId: 1, client: 'Riverside Auto Repair',    email: 'billing@riversideauto.com',  issueDate: 'Mar 22', dueDate: 'Apr 5',  status: 'unpaid',  items: [{ description: 'Monthly Website Plan — Growth', qty: 1, rate: 125 }, { description: 'SEO Optimization', qty: 1, rate: 25 }] },
  { id: 'INV-1040', clientId: 2, client: 'Green Valley Landscaping', email: 'accounts@greenvalleyls.com', issueDate: 'Mar 15', dueDate: 'Mar 29', status: 'paid',    items: [{ description: 'Monthly Website Plan — Pro', qty: 1, rate: 250 }, { description: 'SMS/Text Marketing', qty: 1, rate: 29 }, { description: 'Custom Referral System', qty: 1, rate: 19 }] },
  { id: 'INV-1039', clientId: 3, client: 'Lakeside Dental Studio',   email: 'front@lakesidedental.com',   issueDate: 'Mar 10', dueDate: 'Mar 24', status: 'paid',    items: [{ description: 'Monthly Website Plan — Growth', qty: 1, rate: 125 }, { description: 'Missed Call Auto-Reply', qty: 1, rate: 19 }] },
  { id: 'INV-1038', clientId: 4, client: 'Apex Fitness Co.',         email: 'ops@apexfitness.com',        issueDate: 'Feb 28', dueDate: 'Mar 14', status: 'overdue', items: [{ description: 'Monthly Website Plan — Starter', qty: 1, rate: 40 }, { description: 'Review Management', qty: 1, rate: 19 }, { description: 'Email with Domain', qty: 1, rate: 12 }] },
  { id: 'INV-1037', clientId: 5, client: 'Northside Pet Clinic',     email: 'admin@northsidepet.com',     issueDate: 'Feb 25', dueDate: 'Mar 11', status: 'paid',    items: [{ description: 'Monthly Website Plan — Pro', qty: 1, rate: 250 }, { description: 'Custom Referral System', qty: 1, rate: 19 }] },
  { id: 'INV-1036', clientId: 6, client: 'Summit Roofing LLC',       email: 'billing@summitroofing.com',  issueDate: 'Feb 20', dueDate: 'Mar 6',  status: 'overdue', items: [{ description: 'Monthly Website Plan — Growth', qty: 1, rate: 125 }, { description: 'Social Media Automation', qty: 1, rate: 24 }] },
  { id: 'INV-1035', clientId: 1, client: 'Riverside Auto Repair',    email: 'billing@riversideauto.com',  issueDate: 'Feb 22', dueDate: 'Mar 8',  status: 'paid',    items: [{ description: 'Monthly Website Plan — Growth', qty: 1, rate: 125 }] },
]

const INIT_RECURRING: RecurringInvoice[] = [
  { id: 1, clientId: 1, clientName: 'Riverside Auto Repair',    serviceIds: [2], schedule: 'monthly',   nextDate: 'Apr 22', active: true  },
  { id: 2, clientId: 2, clientName: 'Green Valley Landscaping', serviceIds: [3, 7], schedule: 'monthly', nextDate: 'Apr 15', active: true  },
  { id: 3, clientId: 3, clientName: 'Lakeside Dental Studio',   serviceIds: [2, 8], schedule: 'monthly', nextDate: 'Apr 10', active: true  },
  { id: 4, clientId: 5, clientName: 'Northside Pet Clinic',     serviceIds: [3], schedule: 'monthly',   nextDate: 'Mar 25', active: false },
]

const INIT_REMINDERS: Reminder[] = [
  { id: 1, timing: 'before', days: 7,  message: 'Hi [Client], just a heads-up that invoice [InvoiceID] for $[Amount] is due in 7 days. Pay online at [Link].',   enabled: true  },
  { id: 2, timing: 'before', days: 1,  message: 'Hi [Client], a reminder that invoice [InvoiceID] for $[Amount] is due tomorrow. Pay online at [Link].',          enabled: true  },
  { id: 3, timing: 'after',  days: 1,  message: 'Hi [Client], invoice [InvoiceID] for $[Amount] was due yesterday and is now overdue. Please pay at [Link].',     enabled: true  },
  { id: 4, timing: 'after',  days: 7,  message: 'Hi [Client], invoice [InvoiceID] for $[Amount] is now 7 days past due. Please pay promptly at [Link].',         enabled: false },
]

const TEMPLATE_STYLES = [
  { id: 'clean',      label: 'Clean',       accent: '#1a1a1a', border: '#e0e0e0', headerBg: '#f8f8f8'  },
  { id: 'bold',       label: 'Bold',        accent: '#000000', border: '#000000', headerBg: '#1a1a1a'  },
  { id: 'minimal',    label: 'Minimal',     accent: '#007bff', border: '#d0e8ff', headerBg: '#f0f7ff'  },
]

const STATUS_STYLE: Record<InvoiceStatus, { color: string; label: string }> = {
  paid:    { color: '#00aa55', label: 'Paid'    },
  unpaid:  { color: '#f59e0b', label: 'Unpaid'  },
  overdue: { color: '#ef4444', label: 'Overdue' },
}

const inputClass  = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'
const smallInput  = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'
const labelClass  = 'font-mono text-xs tracking-widest uppercase block mb-2 text-muted'

function invTotal(inv: Invoice) { return inv.items.reduce((s, i) => s + i.qty * i.rate, 0) }

export default function OnlinePayments({ sessionId, darkMode }: Props) {
  const [activeTab, setActiveTab]     = useState<ActiveTab>('overview')
  const [invoices, setInvoices]       = useState<Invoice[]>(INIT_INVOICES)
  const [clients, setClients]         = useState<Client[]>(INIT_CLIENTS)
  const [services, setServices]       = useState<ServiceItem[]>(INIT_SERVICES)
  const [recurring, setRecurring]     = useState<RecurringInvoice[]>(INIT_RECURRING)
  const [reminders, setReminders]     = useState<Reminder[]>(INIT_REMINDERS)
  const [selectedTemplate, setSelectedTemplate] = useState('clean')

  // Invoice list state
  const [invFilter, setInvFilter]         = useState<'all' | InvoiceStatus>('all')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCreateInv, setShowCreateInv] = useState(false)

  // Create invoice form
  const [newInvClientId, setNewInvClientId] = useState<number | ''>('')
  const [newInvDue, setNewInvDue]           = useState('')
  const [newInvItems, setNewInvItems]       = useState<LineItem[]>([{ description: '', qty: 1, rate: 0 }])
  const [createInvSaved, setCreateInvSaved] = useState(false)
  const [invStep, setInvStep]               = useState<'form' | 'preview'>('form')

  // Client form
  const [showAddClient, setShowAddClient]   = useState(false)
  const [editClientId, setEditClientId]     = useState<number | null>(null)
  const [clientForm, setClientForm]         = useState({ name: '', email: '', phone: '', address: '' })
  const [clientSaved, setClientSaved]       = useState(false)

  // Service form
  const [showAddService, setShowAddService] = useState(false)
  const [editServiceId, setEditServiceId]   = useState<number | null>(null)
  const [svcForm, setSvcForm]               = useState({ name: '', description: '', defaultPrice: '' })
  const [svcSaved, setSvcSaved]             = useState(false)

  // Recurring form
  const [showAddRecurring, setShowAddRecurring] = useState(false)
  const [recForm, setRecForm]               = useState({ clientId: '' as number | '', serviceIds: [] as number[], schedule: 'monthly' as RecurringInvoice['schedule'], nextDate: '' })
  const [recSaved, setRecSaved]             = useState(false)

  // Reminder editing
  const [editReminderId, setEditReminderId] = useState<number | null>(null)
  const [reminderMessage, setReminderMessage] = useState('')
  const [reminderDays, setReminderDays]     = useState('')
  const [reminderSaved, setReminderSaved]   = useState(false)

  // ── Computed ────────────────────────────────────────────────────────────────
  const paidList    = invoices.filter((i) => i.status === 'paid')
  const unpaidList  = invoices.filter((i) => i.status === 'unpaid')
  const overdueList = invoices.filter((i) => i.status === 'overdue')
  const collectedThisMonth = paidList.reduce((s, inv) => s + invTotal(inv), 0)
  const outstandingTotal   = [...unpaidList, ...overdueList].reduce((s, inv) => s + invTotal(inv), 0)
  const filteredInvoices   = invFilter === 'all' ? invoices : invoices.filter((i) => i.status === invFilter)
  const selectedClient     = newInvClientId !== '' ? clients.find((c) => c.id === Number(newInvClientId)) : null
  const newInvTotal        = newInvItems.reduce((s, i) => s + i.qty * i.rate, 0)
  const recentInvoices     = [...invoices].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5)
  const tmpl               = TEMPLATE_STYLES.find((t) => t.id === selectedTemplate) ?? TEMPLATE_STYLES[0]

  // ── Invoice handlers ────────────────────────────────────────────────────────
  const addInvItem = () => setNewInvItems((p) => [...p, { description: '', qty: 1, rate: 0 }])
  const updateInvItem = (i: number, f: keyof LineItem, v: string) =>
    setNewInvItems((p) => p.map((item, idx) => idx === i ? { ...item, [f]: f === 'description' ? v : Number(v) } : item))
  const removeInvItem = (i: number) => setNewInvItems((p) => p.filter((_, idx) => idx !== i))

  const addServiceToInvoice = (svc: ServiceItem) => {
    setNewInvItems((p) => [...p, { description: svc.name, qty: 1, rate: svc.defaultPrice }])
  }

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || newInvTotal === 0) return
    const nextNum = 1042 + invoices.length - INIT_INVOICES.length
    const inv: Invoice = {
      id: `INV-${nextNum}`,
      clientId: selectedClient.id,
      client: selectedClient.name,
      email: selectedClient.email,
      issueDate: 'Mar 29',
      dueDate: newInvDue || 'Apr 12',
      status: 'unpaid',
      items: newInvItems.filter((i) => i.description.trim() && i.rate > 0),
    }
    setInvoices((p) => [inv, ...p])
    setCreateInvSaved(true)
    setNewInvClientId(''); setNewInvDue(''); setNewInvItems([{ description: '', qty: 1, rate: 0 }]); setInvStep('form')
    setTimeout(() => { setCreateInvSaved(false); setShowCreateInv(false) }, 2000)
  }

  const markPaid = (id: string) => {
    setInvoices((p) => p.map((inv) => inv.id === id ? { ...inv, status: 'paid' } : inv))
    if (selectedInvoice?.id === id) setSelectedInvoice((p) => p ? { ...p, status: 'paid' } : p)
  }

  // ── Client handlers ─────────────────────────────────────────────────────────
  const openAddClient = () => {
    setEditClientId(null); setClientForm({ name: '', email: '', phone: '', address: '' }); setShowAddClient(true)
  }
  const openEditClient = (c: Client) => {
    setEditClientId(c.id); setClientForm({ name: c.name, email: c.email, phone: c.phone, address: c.address }); setShowAddClient(true)
  }
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientForm.name.trim()) return
    if (editClientId !== null) {
      setClients((p) => p.map((c) => c.id === editClientId ? { ...c, ...clientForm } : c))
    } else {
      setClients((p) => [{ id: Date.now(), ...clientForm, invoiceCount: 0, totalBilled: 0, lastInvoice: 'Mar 29' }, ...p])
    }
    setClientSaved(true)
    setTimeout(() => { setClientSaved(false); setShowAddClient(false) }, 1800)
  }

  // ── Service handlers ─────────────────────────────────────────────────────────
  const openAddService = () => { setEditServiceId(null); setSvcForm({ name: '', description: '', defaultPrice: '' }); setShowAddService(true) }
  const openEditService = (s: ServiceItem) => { setEditServiceId(s.id); setSvcForm({ name: s.name, description: s.description, defaultPrice: String(s.defaultPrice) }); setShowAddService(true) }
  const deleteService = (id: number) => setServices((p) => p.filter((s) => s.id !== id))
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    const price = Number(svcForm.defaultPrice) || 0
    if (!svcForm.name.trim()) return
    if (editServiceId !== null) {
      setServices((p) => p.map((s) => s.id === editServiceId ? { ...s, name: svcForm.name, description: svcForm.description, defaultPrice: price } : s))
    } else {
      setServices((p) => [...p, { id: Date.now(), name: svcForm.name, description: svcForm.description, defaultPrice: price }])
    }
    setSvcSaved(true)
    setTimeout(() => { setSvcSaved(false); setShowAddService(false) }, 1800)
  }

  // ── Recurring handlers ───────────────────────────────────────────────────────
  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recForm.clientId || recForm.serviceIds.length === 0) return
    const c = clients.find((cl) => cl.id === Number(recForm.clientId))
    if (!c) return
    setRecurring((p) => [...p, {
      id: Date.now(), clientId: Number(recForm.clientId), clientName: c.name,
      serviceIds: recForm.serviceIds, schedule: recForm.schedule, nextDate: recForm.nextDate || 'Apr 29', active: true,
    }])
    setRecForm({ clientId: '', serviceIds: [], schedule: 'monthly', nextDate: '' })
    setRecSaved(true)
    setTimeout(() => { setRecSaved(false); setShowAddRecurring(false) }, 1800)
  }
  const toggleRecurring = (id: number) => setRecurring((p) => p.map((r) => r.id === id ? { ...r, active: !r.active } : r))

  // ── Reminder handlers ────────────────────────────────────────────────────────
  const startEditReminder = (r: Reminder) => { setEditReminderId(r.id); setReminderMessage(r.message); setReminderDays(String(r.days)) }
  const saveReminder = (id: number) => {
    setReminders((p) => p.map((r) => r.id === id ? { ...r, message: reminderMessage, days: Number(reminderDays) || r.days } : r))
    setEditReminderId(null)
    setReminderSaved(true)
    setTimeout(() => setReminderSaved(false), 2000)
  }
  const toggleReminder = (id: number) => setReminders((p) => p.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r))

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'overview',   label: 'Overview'    },
    { id: 'invoices',   label: 'Invoices'    },
    { id: 'clients',    label: 'Clients'     },
    { id: 'services',   label: 'Services'    },
    { id: 'recurring',  label: 'Recurring'   },
    { id: 'reminders',  label: 'Reminders'   },
    { id: 'templates',  label: 'Templates'   },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        {/* Tab nav */}
        <div className="border-b border-border flex flex-wrap">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className="px-4 py-3 font-mono text-sm tracking-wide transition-colors"
              style={activeTab === t.id ? { borderBottom: '2px solid #00aa55', color: '#00aa55' } : { borderBottom: '2px solid transparent', color: '#888888' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Collected This Month', value: `$${collectedThisMonth.toLocaleString()}` },
                { label: 'Outstanding',          value: `$${outstandingTotal.toLocaleString()}`   },
                { label: 'Paid Invoices',        value: paidList.length.toString()               },
                { label: 'Unpaid Invoices',      value: (unpaidList.length + overdueList.length).toString() },
              ].map((s) => (
                <div key={s.label} className="bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-4">
                  <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-1">{s.label}</div>
                  <div className="font-heading text-2xl text-[#1a1a1a]">{s.value}</div>
                </div>
              ))}
            </div>
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Recent Invoices</p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {['Invoice', 'Client', 'Amount', 'Due', 'Status'].map((h) => (
                        <th key={h} className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase last:pr-0">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs text-muted">{inv.id}</td>
                        <td className="py-3 pr-4 font-mono text-sm text-primary">{inv.client}</td>
                        <td className="py-3 pr-4 font-mono text-sm text-primary">${invTotal(inv).toFixed(2)}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted">{inv.dueDate}</td>
                        <td className="py-3">
                          <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: STATUS_STYLE[inv.status].color, borderColor: `${STATUS_STYLE[inv.status].color}30`, backgroundColor: `${STATUS_STYLE[inv.status].color}08` }}>
                            {STATUS_STYLE[inv.status].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── INVOICES ─────────────────────────────────────────────────────── */}
        {activeTab === 'invoices' && (
          <div>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'paid', 'unpaid', 'overdue'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setInvFilter(f)}
                    className="font-mono text-xs px-3 py-1.5 rounded border transition-colors capitalize"
                    style={invFilter === f ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5512' } : { borderColor: '#d0d0d0', color: '#888888' }}
                  >{f}</button>
                ))}
              </div>
              <button type="button" onClick={() => { setShowCreateInv((v) => !v); setSelectedInvoice(null); setInvStep('form') }}
                className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                {showCreateInv ? 'Cancel' : 'New Invoice'}
              </button>
            </div>

            {/* Create invoice */}
            {showCreateInv && (
              <div className="px-6 py-6 border-b border-border bg-[#fafafa]">
                <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#00aa55' }}>
                  {invStep === 'form' ? 'Create Invoice' : 'Preview Invoice'}
                </p>
                {createInvSaved && (
                  <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>Invoice created.</div>
                )}

                {invStep === 'form' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Select Client</label>
                        <select className={inputClass} value={newInvClientId} onChange={(e) => setNewInvClientId(e.target.value === '' ? '' : Number(e.target.value))}>
                          <option value="">Choose a client...</option>
                          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Due Date</label>
                        <input type="text" className={inputClass} placeholder="e.g. Apr 12" value={newInvDue} onChange={(e) => setNewInvDue(e.target.value)} />
                      </div>
                    </div>

                    {/* Quick-add from saved services */}
                    <div>
                      <label className={labelClass}>Add from Saved Services</label>
                      <div className="flex flex-wrap gap-2">
                        {services.map((s) => (
                          <button key={s.id} type="button" onClick={() => addServiceToInvoice(s)}
                            className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
                            style={{ borderColor: '#d0d0d0', color: '#555555' }}
                          >
                            + {s.name} (${s.defaultPrice})
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Line Items</label>
                      <div className="space-y-2">
                        {newInvItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="text" className="flex-1 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none" placeholder="Description" value={item.description} onChange={(e) => updateInvItem(i, 'description', e.target.value)} />
                            <input type="number" min="1" className="w-14 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm text-center focus:outline-none" placeholder="Qty" value={item.qty || ''} onChange={(e) => updateInvItem(i, 'qty', e.target.value)} />
                            <input type="number" min="0" step="0.01" className="w-24 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none" placeholder="$0.00" value={item.rate || ''} onChange={(e) => updateInvItem(i, 'rate', e.target.value)} />
                            {newInvItems.length > 1 && <button type="button" onClick={() => removeInvItem(i)} className="font-mono text-xs text-muted hover:text-primary transition-colors">Remove</button>}
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addInvItem} className="mt-2 font-mono text-xs text-muted hover:text-primary transition-colors">+ Add line</button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="font-mono text-sm text-primary">Total: <span className="font-medium">${newInvTotal.toFixed(2)}</span></div>
                      <button type="button" onClick={() => setInvStep('preview')} disabled={!selectedClient || newInvTotal === 0}
                        className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                      >Preview Invoice</button>
                    </div>
                  </div>
                )}

                {invStep === 'preview' && selectedClient && (
                  <form onSubmit={handleCreateInvoice} className="space-y-4">
                    <div className="bg-white border border-[#d0d0d0] rounded overflow-hidden">
                      <div className="px-6 py-4 border-b border-[#d0d0d0] flex justify-between items-start gap-4" style={{ backgroundColor: '#f8f8f8' }}>
                        <div>
                          <div className="font-heading text-lg text-[#1a1a1a]">[Your Business Name]</div>
                          <div className="font-mono text-xs text-[#888888]">Invoice Preview</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-[#1a1a1a] font-medium">{selectedClient.name}</div>
                          <div className="font-mono text-xs text-[#888888]">{selectedClient.email}</div>
                          <div className="font-mono text-xs text-[#888888] mt-1">Due: {newInvDue || 'Apr 12'}</div>
                        </div>
                      </div>
                      <div className="px-6 py-4">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#efefef]">
                              {['Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
                                <th key={h} className={`${i === 0 ? 'text-left' : 'text-right'} pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {newInvItems.filter((i) => i.description.trim() && i.rate > 0).map((item, i) => (
                              <tr key={i} className="border-b border-[#efefef] last:border-0">
                                <td className="py-2 font-mono text-sm text-[#1a1a1a]">{item.description}</td>
                                <td className="py-2 font-mono text-sm text-[#888888] text-right">{item.qty}</td>
                                <td className="py-2 font-mono text-sm text-[#888888] text-right">${item.rate.toFixed(2)}</td>
                                <td className="py-2 font-mono text-sm text-[#1a1a1a] text-right">${(item.qty * item.rate).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3 pt-3 border-t border-[#efefef] flex justify-between">
                          <div className="font-mono text-sm text-[#888888]">Total Due</div>
                          <div className="font-heading text-xl text-[#1a1a1a]">${newInvTotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <button type="button" onClick={() => setInvStep('form')} className="font-mono text-sm px-4 py-2 rounded border tracking-wider transition-colors" style={{ borderColor: '#d0d0d0', color: '#888888' }}>Back</button>
                      <button type="submit" className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Send Invoice</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Invoice list */}
            <div className="divide-y divide-border">
              {filteredInvoices.map((inv) => {
                const total = invTotal(inv)
                const isOpen = selectedInvoice?.id === inv.id
                return (
                  <div key={inv.id}>
                    <div className="px-6 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#fafafa] transition-colors" onClick={() => { setSelectedInvoice(isOpen ? null : inv); setShowCreateInv(false) }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-muted">{inv.id}</div>
                        <div className="font-mono text-sm text-primary font-medium">{inv.client}</div>
                        <div className="font-mono text-xs text-muted hidden sm:block">{inv.email}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="font-mono text-xs text-muted">Issued {inv.issueDate}</div>
                          <div className="font-mono text-xs text-muted">Due {inv.dueDate}</div>
                        </div>
                        <div className="font-heading text-lg text-primary">${total.toFixed(2)}</div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: STATUS_STYLE[inv.status].color, borderColor: `${STATUS_STYLE[inv.status].color}30`, backgroundColor: `${STATUS_STYLE[inv.status].color}08` }}>
                          {STATUS_STYLE[inv.status].label}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#888888' }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-6 pb-6 pt-2 bg-[#fafafa] border-t border-border">
                        <div className="bg-white border border-[#d0d0d0] rounded overflow-hidden">
                          <div className="px-6 py-4 border-b border-[#d0d0d0] flex justify-between items-start gap-4">
                            <div>
                              <div className="font-mono text-xs text-[#888888]">{inv.id}</div>
                              <div className="font-heading text-lg text-[#1a1a1a]">{inv.client}</div>
                              <div className="font-mono text-xs text-[#888888]">{inv.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-xs text-[#888888]">Issued {inv.issueDate}</div>
                              <div className="font-mono text-xs text-[#888888]">Due {inv.dueDate}</div>
                            </div>
                          </div>
                          <div className="px-6 py-4">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-[#efefef]">
                                  <th className="text-left pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase">Description</th>
                                  <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-12">Qty</th>
                                  <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-20">Rate</th>
                                  <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-20">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item, i) => (
                                  <tr key={i} className="border-b border-[#efefef] last:border-0">
                                    <td className="py-2.5 font-mono text-sm text-[#1a1a1a]">{item.description}</td>
                                    <td className="py-2.5 font-mono text-sm text-[#888888] text-right">{item.qty}</td>
                                    <td className="py-2.5 font-mono text-sm text-[#888888] text-right">${item.rate.toFixed(2)}</td>
                                    <td className="py-2.5 font-mono text-sm text-[#1a1a1a] text-right">${(item.qty * item.rate).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="mt-4 pt-3 border-t border-[#efefef] flex justify-between">
                              <div className="font-mono text-sm text-[#888888]">Total Due</div>
                              <div className="font-heading text-2xl text-[#1a1a1a]">${invTotal(inv).toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="px-6 py-4 border-t border-[#d0d0d0] flex items-center justify-between gap-4">
                            {inv.status === 'paid' ? (
                              <div className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00aa55" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                <span className="font-mono text-sm" style={{ color: '#00aa55' }}>Payment received</span>
                              </div>
                            ) : (
                              <>
                                <p className="font-mono text-xs text-[#888888]">Stripe-powered — clients pay securely via a one-click link.</p>
                                <button type="button" onClick={() => markPaid(inv.id)} className="font-mono text-sm px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
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
        )}

        {/* ── CLIENTS ──────────────────────────────────────────────────────── */}
        {activeTab === 'clients' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Client Profiles</p>
                <h2 className="font-heading text-2xl text-primary">Saved Clients</h2>
              </div>
              <button type="button" onClick={openAddClient} className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                Add Client
              </button>
            </div>

            {showAddClient && (
              <div className="bg-[#fafafa] border border-[#d0d0d0] rounded p-5 space-y-4">
                <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#00aa55' }}>
                  {editClientId ? 'Edit Client' : 'New Client'}
                </p>
                {clientSaved && <div className="bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>Saved.</div>}
                <form onSubmit={handleSaveClient} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelClass}>Name</label><input type="text" className={smallInput} value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} required /></div>
                    <div><label className={labelClass}>Email</label><input type="email" className={smallInput} value={clientForm.email} onChange={(e) => setClientForm((p) => ({ ...p, email: e.target.value }))} /></div>
                    <div><label className={labelClass}>Phone</label><input type="text" className={smallInput} value={clientForm.phone} onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div><label className={labelClass}>Address</label><input type="text" className={smallInput} value={clientForm.address} onChange={(e) => setClientForm((p) => ({ ...p, address: e.target.value }))} /></div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddClient(false)} className="font-mono text-xs px-4 py-2 rounded border transition-colors" style={{ borderColor: '#d0d0d0', color: '#888888' }}>Cancel</button>
                    <button type="submit" className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {clients.map((c) => (
                <div key={c.id} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-[#1a1a1a] font-medium">{c.name}</div>
                    <div className="font-mono text-xs text-[#888888] mt-0.5">{c.email} · {c.phone}</div>
                    <div className="font-mono text-xs text-[#888888] mt-0.5">{c.address}</div>
                    <div className="font-mono text-xs text-[#888888] mt-1">{c.invoiceCount} invoices · ${c.totalBilled.toLocaleString()} billed · Last: {c.lastInvoice}</div>
                  </div>
                  <button type="button" onClick={() => openEditClient(c)} className="font-mono text-xs text-muted hover:text-primary transition-colors shrink-0">Edit</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICES ─────────────────────────────────────────────────────── */}
        {activeTab === 'services' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Price List</p>
                <h2 className="font-heading text-2xl text-primary">Saved Services</h2>
              </div>
              <button type="button" onClick={openAddService} className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                Add Service
              </button>
            </div>

            {showAddService && (
              <div className="bg-[#fafafa] border border-[#d0d0d0] rounded p-5 space-y-3">
                <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#00aa55' }}>{editServiceId ? 'Edit Service' : 'New Service'}</p>
                {svcSaved && <div className="bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>Saved.</div>}
                <form onSubmit={handleSaveService} className="space-y-3">
                  <div><label className={labelClass}>Service Name</label><input type="text" className={smallInput} value={svcForm.name} onChange={(e) => setSvcForm((p) => ({ ...p, name: e.target.value }))} required /></div>
                  <div><label className={labelClass}>Description</label><input type="text" className={smallInput} value={svcForm.description} onChange={(e) => setSvcForm((p) => ({ ...p, description: e.target.value }))} /></div>
                  <div><label className={labelClass}>Default Price ($)</label><input type="number" min="0" step="0.01" className={smallInput} value={svcForm.defaultPrice} onChange={(e) => setSvcForm((p) => ({ ...p, defaultPrice: e.target.value }))} /></div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddService(false)} className="font-mono text-xs px-4 py-2 rounded border transition-colors" style={{ borderColor: '#d0d0d0', color: '#888888' }}>Cancel</button>
                    <button type="submit" className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save</button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Service</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase hidden sm:table-cell">Description</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Price</th>
                    <th className="text-left py-2 font-mono text-xs text-muted tracking-widest uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-mono text-sm text-primary">{s.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-muted hidden sm:table-cell">{s.description}</td>
                      <td className="py-3 pr-4 font-mono text-sm text-primary">${s.defaultPrice.toFixed(2)}</td>
                      <td className="py-3 flex items-center gap-3">
                        <button type="button" onClick={() => openEditService(s)} className="font-mono text-xs text-muted hover:text-primary transition-colors">Edit</button>
                        <button type="button" onClick={() => deleteService(s.id)} className="font-mono text-xs transition-colors" style={{ color: '#ef4444' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── RECURRING ────────────────────────────────────────────────────── */}
        {activeTab === 'recurring' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Recurring Invoices</p>
                <h2 className="font-heading text-2xl text-primary">Auto-Invoice Schedule</h2>
              </div>
              <button type="button" onClick={() => setShowAddRecurring((v) => !v)} className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                {showAddRecurring ? 'Cancel' : 'Add Schedule'}
              </button>
            </div>

            {showAddRecurring && (
              <div className="bg-[#fafafa] border border-[#d0d0d0] rounded p-5 space-y-3">
                <p className="font-mono text-xs tracking-widest uppercase" style={{ color: '#00aa55' }}>New Recurring Invoice</p>
                {recSaved && <div className="bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>Schedule saved.</div>}
                <form onSubmit={handleSaveRecurring} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Client</label>
                      <select className={smallInput} value={recForm.clientId} onChange={(e) => setRecForm((p) => ({ ...p, clientId: e.target.value === '' ? '' : Number(e.target.value) }))}>
                        <option value="">Select client...</option>
                        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Schedule</label>
                      <select className={smallInput} value={recForm.schedule} onChange={(e) => setRecForm((p) => ({ ...p, schedule: e.target.value as RecurringInvoice['schedule'] }))}>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Services to Invoice</label>
                    <div className="flex flex-wrap gap-2">
                      {services.map((s) => (
                        <button key={s.id} type="button"
                          onClick={() => setRecForm((p) => ({ ...p, serviceIds: p.serviceIds.includes(s.id) ? p.serviceIds.filter((id) => id !== s.id) : [...p.serviceIds, s.id] }))}
                          className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
                          style={recForm.serviceIds.includes(s.id) ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5508' } : { borderColor: '#d0d0d0', color: '#555555' }}
                        >
                          {s.name} (${s.defaultPrice})
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className={labelClass}>First Invoice Date</label><input type="text" className={smallInput} placeholder="e.g. Apr 1" value={recForm.nextDate} onChange={(e) => setRecForm((p) => ({ ...p, nextDate: e.target.value }))} /></div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowAddRecurring(false)} className="font-mono text-xs px-4 py-2 rounded border" style={{ borderColor: '#d0d0d0', color: '#888888' }}>Cancel</button>
                    <button type="submit" className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>Save Schedule</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-2">
              {recurring.map((r) => {
                const svcNames = r.serviceIds.map((id) => services.find((s) => s.id === id)?.name ?? '').filter(Boolean).join(', ')
                return (
                  <div key={r.id} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-[#1a1a1a] font-medium">{r.clientName}</div>
                      <div className="font-mono text-xs text-[#888888] mt-0.5 capitalize">{r.schedule} · Next: {r.nextDate}</div>
                      <div className="font-mono text-xs text-[#888888] mt-0.5">{svcNames}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs" style={{ color: r.active ? '#00aa55' : '#888888' }}>{r.active ? 'Active' : 'Paused'}</span>
                      <button type="button" onClick={() => toggleRecurring(r.id)}
                        className="relative w-10 h-5 rounded-full transition-colors duration-200"
                        style={{ backgroundColor: r.active ? '#00aa55' : '#cccccc' }}
                      >
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: r.active ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── REMINDERS ────────────────────────────────────────────────────── */}
        {activeTab === 'reminders' && (
          <div className="p-6 space-y-4">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Payment Reminders</p>
              <h2 className="font-heading text-2xl text-primary">Automated Reminders</h2>
              <p className="font-mono text-xs text-muted mt-1">Set reminders that send automatically based on due dates.</p>
            </div>
            {reminderSaved && <div className="bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>Reminder updated.</div>}
            <div className="space-y-3">
              {reminders.map((r) => (
                <div key={r.id} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: r.timing === 'before' ? '#007bff' : '#ef4444', borderColor: r.timing === 'before' ? '#007bff30' : '#ef444430', backgroundColor: r.timing === 'before' ? '#007bff08' : '#ef444408' }}>
                        {r.timing === 'before' ? 'Before due' : 'After due'}
                      </span>
                      {editReminderId === r.id ? (
                        <input type="number" min="1" className="w-16 bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-2 py-1 font-mono text-sm text-center focus:outline-none" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />
                      ) : (
                        <span className="font-mono text-sm text-[#1a1a1a]">{r.days} day{r.days !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {editReminderId === r.id ? (
                        <>
                          <button type="button" onClick={() => saveReminder(r.id)} className="font-mono text-xs" style={{ color: '#00aa55' }}>Save</button>
                          <button type="button" onClick={() => setEditReminderId(null)} className="font-mono text-xs text-muted">Cancel</button>
                        </>
                      ) : (
                        <button type="button" onClick={() => startEditReminder(r)} className="font-mono text-xs text-muted hover:text-primary transition-colors">Edit</button>
                      )}
                      <button type="button" onClick={() => toggleReminder(r.id)}
                        className="relative w-10 h-5 rounded-full transition-colors duration-200"
                        style={{ backgroundColor: r.enabled ? '#00aa55' : '#cccccc' }}
                      >
                        <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: r.enabled ? 'translateX(20px)' : 'translateX(0)' }} />
                      </button>
                    </div>
                  </div>
                  {editReminderId === r.id ? (
                    <textarea className="w-full bg-white border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none resize-none" rows={3} value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} />
                  ) : (
                    <p className="font-mono text-sm text-[#444444] leading-relaxed">{r.message}</p>
                  )}
                  <p className="font-mono text-xs text-[#888888] mt-1">Placeholders: [Client] [InvoiceID] [Amount] [Link]</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEMPLATES ────────────────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Invoice Templates</p>
              <h2 className="font-heading text-2xl text-primary">Branded Invoice Styles</h2>
            </div>
            <div className="flex items-center gap-3">
              {TEMPLATE_STYLES.map((t) => (
                <button key={t.id} type="button" onClick={() => setSelectedTemplate(t.id)}
                  className="font-mono text-sm px-4 py-2 rounded border transition-colors capitalize"
                  style={selectedTemplate === t.id ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5508' } : { borderColor: '#d0d0d0', color: '#888888' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Invoice preview */}
            <div className="border rounded overflow-hidden" style={{ borderColor: tmpl.border }}>
              {/* Header */}
              <div className="px-6 py-5 flex items-start justify-between gap-4" style={{ backgroundColor: tmpl.headerBg }}>
                <div>
                  <div className="w-24 h-6 rounded mb-2" style={{ backgroundColor: tmpl.accent, opacity: 0.15 }} />
                  <div className="font-heading text-xl" style={{ color: tmpl.accent }}>Your Business Name</div>
                  <div className="font-mono text-xs mt-1" style={{ color: tmpl.accent, opacity: 0.6 }}>yourbusiness.com · (555) 000-0000</div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-2xl" style={{ color: tmpl.accent }}>INVOICE</div>
                  <div className="font-mono text-xs mt-1" style={{ color: tmpl.accent, opacity: 0.6 }}>INV-1042</div>
                  <div className="font-mono text-xs" style={{ color: tmpl.accent, opacity: 0.6 }}>Issued Mar 29, 2026</div>
                </div>
              </div>

              {/* Bill to */}
              <div className="px-6 py-4 border-t" style={{ borderColor: tmpl.border }}>
                <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-1">Bill To</div>
                <div className="font-mono text-sm text-[#1a1a1a] font-medium">Riverside Auto Repair</div>
                <div className="font-mono text-xs text-[#888888]">billing@riversideauto.com</div>
                <div className="font-mono text-xs text-[#888888]">Due April 12, 2026</div>
              </div>

              {/* Line items */}
              <div className="px-6 py-4 border-t" style={{ borderColor: tmpl.border }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: tmpl.border }}>
                      <th className="text-left pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase">Description</th>
                      <th className="text-right pb-2 font-mono text-xs text-[#888888] tracking-widest uppercase w-20">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" style={{ borderColor: tmpl.border }}>
                      <td className="py-2.5 font-mono text-sm text-[#1a1a1a]">Monthly Website Plan — Growth</td>
                      <td className="py-2.5 font-mono text-sm text-[#1a1a1a] text-right">$125.00</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-mono text-sm text-[#1a1a1a]">SEO Optimization</td>
                      <td className="py-2.5 font-mono text-sm text-[#1a1a1a] text-right">$25.00</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: tmpl.border }}>
                  <div className="font-mono text-sm text-[#888888]">Total Due</div>
                  <div className="font-heading text-2xl" style={{ color: tmpl.accent }}>$150.00</div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t text-center" style={{ borderColor: tmpl.border, backgroundColor: tmpl.headerBg }}>
                <div className="font-mono text-xs text-[#888888]">Thank you for your business. Pay securely at yourbusiness.com/pay</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version connects to your Stripe account, sends invoices directly to clients, and processes payments automatically.
      </p>
    </div>
  )
}
