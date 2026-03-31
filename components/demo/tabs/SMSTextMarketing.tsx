'use client'

import { useState } from 'react'

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
  tag: string
  added: string
}

interface Template {
  id: number
  name: string
  category: string
  body: string
}

const FAKE_CONTACTS: Contact[] = [
  { id: 1,  name: 'Sandra M.',    phone: '(555) 201-4830', tag: 'Customer',  added: 'Mar 12' },
  { id: 2,  name: 'James T.',     phone: '(555) 334-9021', tag: 'Lead',      added: 'Mar 10' },
  { id: 3,  name: 'Rachel K.',    phone: '(555) 409-1177', tag: 'Customer',  added: 'Mar 9'  },
  { id: 4,  name: 'David L.',     phone: '(555) 511-0043', tag: 'Customer',  added: 'Mar 8'  },
  { id: 5,  name: 'Mike R.',      phone: '(555) 623-5589', tag: 'Lead',      added: 'Mar 7'  },
  { id: 6,  name: 'Priya S.',     phone: '(555) 748-2210', tag: 'Customer',  added: 'Mar 5'  },
  { id: 7,  name: 'Tom W.',       phone: '(555) 814-6634', tag: 'VIP',       added: 'Mar 3'  },
  { id: 8,  name: 'Lisa H.',      phone: '(555) 907-3318', tag: 'Customer',  added: 'Feb 28' },
  { id: 9,  name: 'Carlos V.',    phone: '(555) 022-9945', tag: 'VIP',       added: 'Feb 25' },
  { id: 10, name: 'Amy F.',       phone: '(555) 193-4401', tag: 'Lead',      added: 'Feb 22' },
  { id: 11, name: 'Brian K.',     phone: '(555) 267-8892', tag: 'Customer',  added: 'Feb 20' },
  { id: 12, name: 'Nicole P.',    phone: '(555) 385-1156', tag: 'Customer',  added: 'Feb 18' },
]

const FAKE_CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Spring Promo',         message: 'Spring is here! Get 20% off your next visit — this week only. Reply STOP to opt out.',         sent: 312, delivered: 307, replies: 41, date: 'Mar 15', status: 'sent'      },
  { id: 2, name: 'Appointment Reminder', message: 'Hi, just a reminder that your appointment is tomorrow at 2 PM. Reply YES to confirm.',           sent: 88,  delivered: 88,  replies: 64, date: 'Mar 13', status: 'sent'      },
  { id: 3, name: 'Loyalty Rewards',      message: "You've earned a free service after 5 visits. Come in this month to redeem your reward!",         sent: 145, delivered: 142, replies: 19, date: 'Mar 10', status: 'sent'      },
  { id: 4, name: 'Review Request',       message: 'Thanks for visiting! If you have a moment, we would love a quick Google review. [link] ',        sent: 203, delivered: 199, replies: 22, date: 'Mar 7',  status: 'sent'      },
  { id: 5, name: 'April Flash Sale',     message: 'Flash sale this Saturday only — 15% off everything. Show this text at checkout.',                 sent: 0,   delivered: 0,   replies: 0,  date: 'Apr 1',  status: 'scheduled' },
]

const TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Appointment Reminder',
    category: 'Reminders',
    body: 'Hi [Name], just a reminder that your appointment is tomorrow at [Time]. Reply YES to confirm or RESCHEDULE to change it.',
  },
  {
    id: 2,
    name: 'Promotional Offer',
    category: 'Promotions',
    body: 'Hi [Name]! For a limited time, [Business] is offering [Offer]. Use code [Code] or just show this text. Valid through [Date].',
  },
  {
    id: 3,
    name: 'Follow-Up After Visit',
    category: 'Engagement',
    body: "Thanks for coming in, [Name]. Hope everything was great. If you have a moment, we'd love a quick review — it means a lot. [Link]",
  },
  {
    id: 4,
    name: 'Loyalty Reward',
    category: 'Retention',
    body: "Great news, [Name]! You've earned a [Reward] after your recent visits. Come redeem it before [Date] — we appreciate your loyalty.",
  },
  {
    id: 5,
    name: 'Reactivation',
    category: 'Win-Back',
    body: "We miss you, [Name]! It has been a while since your last visit. Come back this month and get [Offer] — just show this text.",
  },
]

const TAG_COLORS: Record<string, string> = {
  Customer: '#007bff',
  Lead:     '#f59e0b',
  VIP:      '#8b5cf6',
}

const inputClass = 'w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors'

export default function SMSTextMarketing({ sessionId, darkMode }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('campaigns')
  const [campaigns, setCampaigns] = useState<Campaign[]>(FAKE_CAMPAIGNS)
  const [composeName, setComposeName] = useState('')
  const [composeMessage, setComposeMessage] = useState('')
  const [composeAudience, setComposeAudience] = useState<'all' | 'customers' | 'leads' | 'vip'>('all')
  const [composeSent, setComposeSent] = useState(false)
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null)
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null)

  const audienceCount = {
    all:       FAKE_CONTACTS.length,
    customers: FAKE_CONTACTS.filter((c) => c.tag === 'Customer').length,
    leads:     FAKE_CONTACTS.filter((c) => c.tag === 'Lead').length,
    vip:       FAKE_CONTACTS.filter((c) => c.tag === 'VIP').length,
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!composeName.trim() || !composeMessage.trim()) return
    const count = audienceCount[composeAudience]
    const newCampaign: Campaign = {
      id:        campaigns.length + 1,
      name:      composeName.trim(),
      message:   composeMessage.trim(),
      sent:      count,
      delivered: Math.round(count * 0.98),
      replies:   Math.round(count * 0.13),
      date:      'Mar 29',
      status:    'sent',
    }
    setCampaigns((prev) => [newCampaign, ...prev])
    setComposeName('')
    setComposeMessage('')
    setComposeAudience('all')
    setComposeSent(true)
    setTimeout(() => setComposeSent(false), 4000)
  }

  const copyTemplate = (id: number, body: string) => {
    navigator.clipboard.writeText(body)
    setCopiedTemplate(id)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'templates', label: 'Templates' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'contacts',  label: 'Contacts'  },
  ]

  const sentCampaigns     = campaigns.filter((c) => c.status === 'sent')
  const scheduledCampaigns = campaigns.filter((c) => c.status === 'scheduled')
  const totalSent          = sentCampaigns.reduce((s, c) => s + c.sent, 0)
  const totalReplies       = sentCampaigns.reduce((s, c) => s + c.replies, 0)
  const avgReplyRate       = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: FAKE_CONTACTS.length.toString() },
          { label: 'Campaigns Sent', value: sentCampaigns.length.toString() },
          { label: 'Texts Delivered', value: totalSent.toLocaleString() },
          { label: 'Avg Reply Rate',  value: `${avgReplyRate}%` },
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
            </button>
          ))}
        </div>

        {/* Campaigns tab */}
        {activeTab === 'campaigns' && (
          <div className="p-6 space-y-6">
            {/* Compose */}
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>New Campaign</p>
              {composeSent && (
                <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
                  Campaign sent to {audienceCount[composeAudience]} contacts.
                </div>
              )}
              <form onSubmit={handleSend} className="space-y-3">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Campaign name (e.g. Spring Promo)"
                  value={composeName}
                  onChange={(e) => setComposeName(e.target.value)}
                  required
                />
                <textarea
                  className={inputClass + ' resize-none'}
                  rows={3}
                  placeholder="Your message text... (160 characters recommended)"
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  required
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">Send to:</span>
                    {(['all', 'customers', 'leads', 'vip'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setComposeAudience(a)}
                        className="font-mono text-xs px-3 py-1.5 rounded border transition-colors capitalize"
                        style={composeAudience === a
                          ? { borderColor: '#00aa55', color: '#00aa55', backgroundColor: '#00aa5512' }
                          : { borderColor: '#d0d0d0', color: '#888888', backgroundColor: 'transparent' }
                        }
                      >
                        {a === 'all' ? `All (${audienceCount.all})` : `${a.charAt(0).toUpperCase() + a.slice(1)} (${audienceCount[a]})`}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{composeMessage.length}/160</span>
                    <button
                      type="submit"
                      className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                    >
                      Send Campaign
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="h-px bg-border" />

            {/* History */}
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#00aa55' }}>Sent Campaigns</p>
              <div className="space-y-2">
                {sentCampaigns.map((c) => (
                  <div key={c.id} className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm text-[#1a1a1a] font-medium">{c.name}</div>
                        <div className="font-mono text-xs text-[#888888] mt-0.5">{c.date} — {c.delivered} delivered</div>
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
                    <div className="font-mono text-xs mt-0.5" style={{ color: '#888888' }}>{t.category}</div>
                  </div>
                  <button
                    onClick={() => copyTemplate(t.id, t.body)}
                    className="font-mono text-xs tracking-wider transition-colors shrink-0"
                    style={{ color: copiedTemplate === t.id ? '#00aa55' : '#888888' }}
                  >
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
            <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: '#00aa55' }}>Contact List — {FAKE_CONTACTS.length} contacts</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Name</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Phone</th>
                    <th className="text-left py-2 pr-4 font-mono text-xs text-muted tracking-widest uppercase">Tag</th>
                    <th className="text-left py-2 font-mono text-xs text-muted tracking-widest uppercase">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {FAKE_CONTACTS.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 font-mono text-sm text-primary">{c.name}</td>
                      <td className="py-3 pr-4 font-mono text-sm text-muted">{c.phone}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded border" style={{ color: TAG_COLORS[c.tag] ?? '#888888', borderColor: `${TAG_COLORS[c.tag] ?? '#888888'}30`, backgroundColor: `${TAG_COLORS[c.tag] ?? '#888888'}08` }}>
                          {c.tag}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-sm text-muted">{c.added}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version sends from a dedicated business number and integrates with your contact list automatically.
      </p>
    </div>
  )
}
