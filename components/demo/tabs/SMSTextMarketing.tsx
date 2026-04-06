'use client'

import { useState, useRef } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

type ActiveTab = 'campaigns' | 'templates' | 'scheduled' | 'contacts'

interface Campaign {
  id: number
  name: string
  message: string
  sent: number
  delivered: number
  replies: number
  date: string
  status: 'sent' | 'scheduled'
}

interface Contact {
  id: number
  name: string
  phone: string
  email: string
  tag: string
  added: string
}

interface Template {
  id: number
  name: string
  category: string
  body: string
}

const INITIAL_CONTACTS: Contact[] = [
  { id: 1,  name: 'Sandra M.',  phone: '(555) 201-4830', email: 'sandra.m@email.com',  tag: 'Customer', added: 'Mar 12' },
  { id: 2,  name: 'James T.',   phone: '(555) 334-9021', email: 'james.t@email.com',   tag: 'Lead',     added: 'Mar 10' },
  { id: 3,  name: 'Rachel K.',  phone: '(555) 409-1177', email: 'rachel.k@email.com',  tag: 'Customer', added: 'Mar 9'  },
  { id: 4,  name: 'David L.',   phone: '(555) 511-0043', email: 'david.l@email.com',   tag: 'Customer', added: 'Mar 8'  },
  { id: 5,  name: 'Mike R.',    phone: '(555) 623-5589', email: 'mike.r@email.com',    tag: 'Lead',     added: 'Mar 7'  },
  { id: 6,  name: 'Priya S.',   phone: '(555) 748-2210', email: 'priya.s@email.com',   tag: 'Customer', added: 'Mar 5'  },
  { id: 7,  name: 'Tom W.',     phone: '(555) 814-6634', email: 'tom.w@email.com',     tag: 'VIP',      added: 'Mar 3'  },
  { id: 8,  name: 'Lisa H.',    phone: '(555) 907-3318', email: 'lisa.h@email.com',    tag: 'Customer', added: 'Feb 28' },
  { id: 9,  name: 'Carlos V.',  phone: '(555) 022-9945', email: 'carlos.v@email.com',  tag: 'VIP',      added: 'Feb 25' },
  { id: 10, name: 'Amy F.',     phone: '(555) 193-4401', email: 'amy.f@email.com',     tag: 'Lead',     added: 'Feb 22' },
  { id: 11, name: 'Brian K.',   phone: '(555) 267-8892', email: 'brian.k@email.com',   tag: 'Customer', added: 'Feb 20' },
  { id: 12, name: 'Nicole P.',  phone: '(555) 385-1156', email: 'nicole.p@email.com',  tag: 'Customer', added: 'Feb 18' },
]

const INITIAL_CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Cold Snap Emergency Blast',  message: 'Heating emergency? We have same-day availability tonight. Call or reply to book now. Reply STOP to opt out.',  sent: 1247, delivered: 1231, replies: 94, date: 'Mar 15', status: 'sent'      },
  { id: 2, name: 'Service Reminder',           message: 'Hi [Name], your HVAC tune-up is due this month. Book now and lock in our spring rate before it ends.',          sent: 312,  delivered: 308,  replies: 61, date: 'Mar 13', status: 'sent'      },
  { id: 3, name: 'Maintenance Plan Offer',     message: 'Join our annual maintenance plan and get priority scheduling plus 10% off all repairs. Reply for details.',      sent: 188,  delivered: 185,  replies: 24, date: 'Mar 10', status: 'sent'      },
  { id: 4, name: 'Review Request',             message: 'Thanks for trusting us with your HVAC. A quick Google review means a lot to our team. [link]',                  sent: 203,  delivered: 199,  replies: 22, date: 'Mar 7',  status: 'sent'      },
  { id: 5, name: 'Summer AC Tune-Up Promo',    message: 'Summer is coming fast. Book your AC tune-up now and skip the rush. 10% off this month only.',                  sent: 0,    delivered: 0,    replies: 0,  date: 'Apr 1',  status: 'scheduled' },
]

const TEMPLATES: Template[] = [
  { id: 1, name: 'Appointment Reminder',   category: 'Reminders',  body: 'Hi [Name], reminder that your HVAC service appointment is tomorrow at [Time]. Reply YES to confirm or call us to reschedule.' },
  { id: 2, name: 'Emergency Availability', category: 'Urgent',     body: 'Hi [Name], we have same-day availability for heating and cooling emergencies. Call or reply to book a technician now.' },
  { id: 3, name: 'Seasonal Offer',         category: 'Promotions', body: 'Hi [Name], [Season] is here. Book your HVAC tune-up before the rush and save [Discount]. Reply to schedule or visit [link].' },
  { id: 4, name: 'Post-Service Follow-Up', category: 'Engagement', body: 'Hi [Name], thanks for having our team out. How is everything running? Reply with any questions and we will get right back to you.' },
  { id: 5, name: 'Review Request',         category: 'Reviews',    body: 'Hi [Name], we hope you are staying comfortable! If you have a moment, a quick Google review means a great deal to our team. [link]' },
]

const TAG_COLORS: Record<string, string> = {
  Customer: '#007bff',
  Lead:     '#f59e0b',
  VIP:      '#8b5cf6',
}

const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'
const smallInput = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

export default function SMSTextMarketing({ sessionId, darkMode }: Props) {
  const [activeTab, setActiveTab]       = useState<ActiveTab>('campaigns')
  const [contacts, setContacts]         = useState<Contact[]>(INITIAL_CONTACTS)
  const [campaigns, setCampaigns]       = useState<Campaign[]>(INITIAL_CAMPAIGNS)

  // Campaign compose
  const [composeName, setComposeName]           = useState('')
  const [composeMessage, setComposeMessage]     = useState('')
  const [composeAudience, setComposeAudience]   = useState<'all' | 'customers' | 'leads' | 'vip'>('all')
  const [composeSent, setComposeSent]           = useState(false)
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null)
  const [copiedTemplate, setCopiedTemplate]     = useState<number | null>(null)

  // Contact management
  const [contactSearch, setContactSearch]     = useState('')
  const [selected, setSelected]               = useState<Set<number>>(new Set())
  const [showAddModal, setShowAddModal]       = useState(false)
  const [addName, setAddName]                 = useState('')
  const [addPhone, setAddPhone]               = useState('')
  const [addEmail, setAddEmail]               = useState('')
  const [addTag, setAddTag]                   = useState('Customer')
  const [addSaved, setAddSaved]               = useState(false)
  const [importFeedback, setImportFeedback]   = useState('')
  const [bulkCampaignSent, setBulkCampaignSent] = useState(false)
  const csvInputRef = useRef<HTMLInputElement>(null)
  let nextId = useRef(INITIAL_CONTACTS.length + 1)

  const audienceCount = {
    all:       contacts.length,
    customers: contacts.filter((c) => c.tag === 'Customer').length,
    leads:     contacts.filter((c) => c.tag === 'Lead').length,
    vip:       contacts.filter((c) => c.tag === 'VIP').length,
  }

  const sentCampaigns      = campaigns.filter((c) => c.status === 'sent')
  const scheduledCampaigns = campaigns.filter((c) => c.status === 'scheduled')
  const totalSent          = sentCampaigns.reduce((s, c) => s + c.sent, 0)
  const totalReplies       = sentCampaigns.reduce((s, c) => s + c.replies, 0)
  const avgReplyRate        = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0

  // ── Campaign handlers ──────────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeName.trim() || !composeMessage.trim()) return
    const count = audienceCount[composeAudience]
    setCampaigns((prev) => [{
      id: prev.length + 1, name: composeName.trim(), message: composeMessage.trim(),
      sent: count, delivered: Math.round(count * 0.98), replies: Math.round(count * 0.13),
      date: 'Mar 29', status: 'sent',
    }, ...prev])
    setComposeName(''); setComposeMessage(''); setComposeAudience('all')
    setComposeSent(true)
    setTimeout(() => setComposeSent(false), 4000)
  }

  const copyTemplate = (id: number, body: string) => {
    navigator.clipboard.writeText(body)
    setCopiedTemplate(id)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }

  // ── Contact handlers ──────────────────────────────────────────────────────
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addName.trim() || !addPhone.trim()) return
    const newContact: Contact = {
      id: nextId.current++,
      name: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim(),
      tag: addTag,
      added: 'Mar 29',
    }
    setContacts((prev) => [newContact, ...prev])
    setAddName(''); setAddPhone(''); setAddEmail(''); setAddTag('Customer')
    setAddSaved(true)
    setTimeout(() => { setAddSaved(false); setShowAddModal(false) }, 1800)
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      if (!text) return
      const lines = text.split('\n').filter((l) => l.trim())
      // Skip header row if it contains "name" or "phone"
      const start = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('phone') ? 1 : 0
      const parsed: Contact[] = []
      for (let i = start; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
        const name = cols[0]; const phone = cols[1]; const email = cols[2] ?? ''
        if (name && phone) {
          parsed.push({ id: nextId.current++, name, phone, email, tag: 'Lead', added: 'Mar 29' })
        }
      }
      if (parsed.length > 0) {
        setContacts((prev) => [...parsed, ...prev])
        setImportFeedback(`${parsed.length} contact${parsed.length !== 1 ? 's' : ''} imported.`)
      } else {
        // Demo fallback — add sample contacts if CSV was empty or unreadable
        const demo: Contact[] = [
          { id: nextId.current++, name: 'Imported Contact A', phone: '(555) 400-0001', email: 'a@import.com', tag: 'Lead', added: 'Mar 29' },
          { id: nextId.current++, name: 'Imported Contact B', phone: '(555) 400-0002', email: 'b@import.com', tag: 'Lead', added: 'Mar 29' },
          { id: nextId.current++, name: 'Imported Contact C', phone: '(555) 400-0003', email: 'c@import.com', tag: 'Lead', added: 'Mar 29' },
        ]
        setContacts((prev) => [...demo, ...prev])
        setImportFeedback('3 sample contacts imported from CSV.')
      }
      setTimeout(() => setImportFeedback(''), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = (filtered: Contact[]) => {
    if (filtered.every((c) => selected.has(c.id))) {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((c) => next.delete(c.id)); return next })
    } else {
      setSelected((prev) => { const next = new Set(prev); filtered.forEach((c) => next.add(c.id)); return next })
    }
  }

  const deleteSelected = () => {
    setContacts((prev) => prev.filter((c) => !selected.has(c.id)))
    setSelected(new Set())
  }

  const sendToSelected = () => {
    const count = selected.size
    setCampaigns((prev) => [{
      id: prev.length + 1, name: 'Campaign to Selected',
      message: 'Hi [Name], thanks for being a valued customer. We have a special offer just for you this week.',
      sent: count, delivered: Math.round(count * 0.98), replies: Math.round(count * 0.12),
      date: 'Mar 29', status: 'sent',
    }, ...prev])
    setSelected(new Set())
    setBulkCampaignSent(true)
    setTimeout(() => setBulkCampaignSent(false), 4000)
  }

  const filteredContacts = contacts.filter((c) =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)
  )

  const allFilteredSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selected.has(c.id))

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'templates', label: 'Templates' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'contacts',  label: 'Contacts'  },
  ]

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts',  value: contacts.length.toString()          },
          { label: 'Campaigns Sent',  value: sentCampaigns.length.toString()     },
          { label: 'Texts Delivered', value: totalSent.toLocaleString()          },
          { label: 'Avg Reply Rate',  value: `${avgReplyRate}%`                  },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded px-5 py-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{s.label}</div>
            <div className="font-heading text-2xl text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="bg-card border border-border rounded">
        {/* Tab nav */}
        <div className="border-b border-border flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-5 py-3 font-mono text-sm tracking-wide transition-colors"
              style={activeTab === t.id
                ? { borderBottom: '2px solid #00aa55', color: '#00aa55' }
                : { borderBottom: '2px solid transparent', color: '#888888' }
              }
            >
              {t.label}
              {t.id === 'scheduled' && scheduledCampaigns.length > 0 && (
                <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#00aa5515', color: '#00aa55' }}>
                  {scheduledCampaigns.length}
                </span>
              )}
              {t.id === 'contacts' && (
                <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#efefef', color: '#888888' }}>
                  {contacts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Campaigns tab */}
        {activeTab === 'campaigns' && (
          <div className="p-6 space-y-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>New Campaign</p>
              {composeSent && (
                <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                  Campaign sent to {audienceCount[composeAudience]} contacts.
                </div>
              )}
              <form onSubmit={handleSend} className="space-y-3">
                <input type="text" className={inputClass} placeholder="Campaign name (e.g. Spring Promo)" value={composeName} onChange={(e) => setComposeName(e.target.value)} required />
                <textarea className={inputClass + ' resize-none'} rows={3} placeholder="Your message text... (160 characters recommended)" value={composeMessage} onChange={(e) => setComposeMessage(e.target.value)} required />
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted">Send to:</span>
                    {(['all', 'customers', 'leads', 'vip'] as const).map((a) => (
                      <button key={a} type="button" onClick={() => setComposeAudience(a)}
                        className="font-mono text-xs px-3 py-1.5 rounded border transition-colors capitalize"
                        style={composeAudience === a ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5512' } : { borderColor: '#d0d0d0', color: '#888888', backgroundColor: 'transparent' }}
                      >
                        {a === 'all' ? `All (${audienceCount.all})` : `${a.charAt(0).toUpperCase() + a.slice(1)} (${audienceCount[a]})`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{composeMessage.length}/160</span>
                    <button type="submit" className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                      Send Campaign
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Sent Campaigns</p>
              <div className="space-y-2">
                {sentCampaigns.map((c) => (
                  <div key={c.id} className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
                    <div className="p-4 flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-[#1a1a1a] font-medium">{c.name}</div>
                        <div className="font-mono text-xs text-[#888888] mt-0.5">{c.date}, {c.delivered} delivered</div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-xs text-[#888888]">Delivered</div>
                          <div className="font-mono text-sm text-[#1a1a1a]">{Math.round((c.delivered / c.sent) * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-xs text-[#888888]">Replies</div>
                          <div className="font-mono text-sm" style={{ color: '#00aa55' }}>{c.replies}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedCampaign === c.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#888888' }}>
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                    {expandedCampaign === c.id && (
                      <div className="border-t border-[#d0d0d0] px-4 py-3 bg-white">
                        <p className="font-mono text-sm text-[#333333]">{c.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates tab */}
        {activeTab === 'templates' && (
          <div className="p-6 space-y-3">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#00aa55' }}>Message Templates</p>
            {TEMPLATES.map((t) => (
              <div key={t.id} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="font-mono text-sm text-[#1a1a1a] font-medium">{t.name}</div>
                    <div className="font-mono text-xs mt-0.5 text-[#888888]">{t.category}</div>
                  </div>
                  <button onClick={() => copyTemplate(t.id, t.body)} className="font-mono text-xs tracking-wider transition-colors shrink-0" style={{ color: copiedTemplate === t.id ? '#00aa55' : '#888888' }}>
                    {copiedTemplate === t.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-sm text-[#444444] leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Scheduled tab */}
        {activeTab === 'scheduled' && (
          <div className="p-6">
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#00aa55' }}>Scheduled Messages</p>
            {scheduledCampaigns.length === 0 ? (
              <p className="font-mono text-sm text-muted">No messages scheduled.</p>
            ) : (
              <div className="space-y-3">
                {scheduledCampaigns.map((c) => (
                  <div key={c.id} className="bg-[#efefef] border border-[#d0d0d0] rounded p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-mono text-sm text-[#1a1a1a] font-medium">{c.name}</div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: '#f59e0b', borderColor: '#f59e0b30', backgroundColor: '#f59e0b08' }}>Scheduled</span>
                      </div>
                      <p className="font-mono text-sm text-[#444444]">{c.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs text-[#888888]">Sends</div>
                      <div className="font-mono text-sm text-[#1a1a1a]">{c.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contacts tab */}
        {activeTab === 'contacts' && (
          <div className="p-6">
            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex-1 min-w-48 relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded pl-9 pr-4 py-2 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors"
                  placeholder="Search by name or phone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <button type="button" onClick={() => setShowAddModal(true)}
                className="font-mono text-sm px-4 py-2 rounded tracking-wider transition-opacity hover:opacity-80 shrink-0"
                style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
              >
                Add Contact
              </button>
              <button type="button" onClick={() => csvInputRef.current?.click()}
                className="font-mono text-sm px-4 py-2 rounded tracking-wider border transition-colors shrink-0"
                style={{ borderColor: '#d0d0d0', color: '#333333', backgroundColor: 'transparent' }}
              >
                Import CSV
              </button>
              <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVUpload} />
            </div>

            {importFeedback && (
              <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                {importFeedback}
              </div>
            )}
            {bulkCampaignSent && (
              <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                Campaign sent to {selected.size} selected contacts.
              </div>
            )}

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div className="mb-4 flex items-center justify-between gap-4 bg-[#efefef] border border-[#d0d0d0] rounded px-4 py-3">
                <span className="font-mono text-sm text-[#1a1a1a]">{selected.size} contact{selected.size !== 1 ? 's' : ''} selected</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={sendToSelected} className="font-mono text-xs px-3 py-1.5 rounded border transition-colors" style={{ borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5508' }}>
                    Send Campaign
                  </button>
                  <button type="button" onClick={deleteSelected} className="font-mono text-xs px-3 py-1.5 rounded border transition-colors" style={{ borderColor: '#ef444430', color: '#ef4444', backgroundColor: '#ef444408' }}>
                    Delete
                  </button>
                  <button type="button" onClick={() => setSelected(new Set())} className="font-mono text-xs text-muted hover:text-primary transition-colors">
                    Clear
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 w-8">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={() => toggleSelectAll(filteredContacts)}
                        className="rounded border-[#d0d0d0] cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Name</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Phone</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase hidden sm:table-cell">Email</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Tag</th>
                    <th className="text-left py-2 font-mono text-xs text-muted tracking-widest uppercase hidden sm:table-cell">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center font-mono text-sm text-muted">No contacts match your search.</td>
                    </tr>
                  ) : filteredContacts.map((c) => (
                    <tr key={c.id} className={`border-b border-border last:border-0 transition-colors ${selected.has(c.id) ? 'bg-[#00aa5504]' : ''}`}>
                      <td className="py-3 pr-3">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} className="rounded border-[#d0d0d0] cursor-pointer" />
                      </td>
                      <td className="py-3 pr-4 font-mono text-sm text-primary">{c.name}</td>
                      <td className="py-3 pr-4 font-mono text-sm text-muted">{c.phone}</td>
                      <td className="py-3 pr-4 font-mono text-sm text-muted hidden sm:table-cell">{c.email || '-'}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: TAG_COLORS[c.tag] ?? '#888888', borderColor: `${TAG_COLORS[c.tag] ?? '#888888'}30`, backgroundColor: `${TAG_COLORS[c.tag] ?? '#888888'}08` }}>
                          {c.tag}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-sm text-muted hidden sm:table-cell">{c.added}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-mono text-xs text-muted mt-3">
              CSV format: name, phone, email (one contact per line, header row optional)
            </p>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md bg-white rounded border border-[#d0d0d0] shadow-xl">
            <div className="px-6 py-4 border-b border-[#d0d0d0] flex items-center justify-between">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: '#00aa55' }}>Contacts</p>
                <h3 className="font-heading text-lg text-[#1a1a1a]">Add Contact</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="font-mono text-sm text-[#888888] hover:text-[#1a1a1a] transition-colors">
                Close
              </button>
            </div>
            <div className="p-6">
              {addSaved && (
                <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                  Contact added.
                </div>
              )}
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-[#888888]">Name</label>
                  <input type="text" className={smallInput} placeholder="Full name" value={addName} onChange={(e) => setAddName(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-[#888888]">Phone Number</label>
                  <input type="text" className={smallInput} placeholder="(555) 000-0000" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} required />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-[#888888]">Email <span className="normal-case text-[#aaaaaa]">(optional)</span></label>
                  <input type="email" className={smallInput} placeholder="email@example.com" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
                </div>
                <div>
                  <label className="font-mono text-xs tracking-widest uppercase block mb-2 text-[#888888]">Tag</label>
                  <select className={smallInput} value={addTag} onChange={(e) => setAddTag(e.target.value)}>
                    <option>Customer</option>
                    <option>Lead</option>
                    <option>VIP</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 font-mono text-sm py-2.5 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                    Add Contact
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 font-mono text-sm py-2.5 rounded tracking-wider border transition-colors" style={{ borderColor: '#d0d0d0', color: '#888888' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version sends from a dedicated business number and integrates with your contact list automatically.
      </p>
    </div>
  )
}
