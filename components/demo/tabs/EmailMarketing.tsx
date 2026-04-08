'use client'

import { useState, useRef } from 'react'
import type { DemoContact } from '../DemoPage'

interface Props {
  sessionId: string
  contacts: DemoContact[]
  onAddContacts: (contacts: DemoContact[]) => void
  darkMode?: boolean
}

interface EmailItem {
  day?: number
  dayLabel?: string
  subject: string
  preview: string
  body: string
}

interface EmailResult {
  welcomeSequence: EmailItem[]
  newsletter: EmailItem
  reEngagement: EmailItem[]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return <button onClick={copy} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
}

function EmailCard({ email, badge, badgeColor }: { email: EmailItem; badge: string; badgeColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="font-mono text-xs px-2 py-0.5 rounded shrink-0 mt-0.5 border" style={{ color: badgeColor, borderColor: `${badgeColor}30`, backgroundColor: `${badgeColor}08` }}>
            {badge}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm text-primary leading-tight">{email.subject}</div>
            <div className="font-mono text-xs text-dim mt-0.5 truncate">{email.preview}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CopyButton text={`Subject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}`} />
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

const CALENDAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CALENDAR_EVENTS: Record<number, { label: string; color: string }> = {
  1: { label: 'Welcome 1', color: '#00aa55' }, 2: { label: 'Welcome 2', color: '#00aa55' },
  4: { label: 'Welcome 3', color: '#00aa55' }, 8: { label: 'Welcome 4', color: '#00aa55' },
  15: { label: 'Welcome 5', color: '#00aa55' }, 18: { label: 'Newsletter', color: '#00ff88' },
  25: { label: 'Re-engage 1', color: '#f97316' }, 30: { label: 'Welcome 6', color: '#00aa55' },
  31: { label: 'Re-engage 2', color: '#f97316' },
}

// Mock contacts for file upload simulation
const MOCK_UPLOADED: DemoContact[][] = [
  [
    { name: 'Maria Johnson', email: 'maria.johnson@email.com', source: 'upload' },
    { name: 'Robert Chen', email: 'r.chen@business.com', source: 'upload' },
    { name: 'Sarah Williams', email: 'swilliams@company.net', source: 'upload' },
    { name: 'James Martinez', email: 'jmartinez@outlook.com', source: 'upload' },
    { name: 'Lisa Thompson', email: 'lisa.t@gmail.com', source: 'upload' },
  ],
]

export default function EmailMarketing({ sessionId, contacts, onAddContacts, darkMode }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [customerDescription, setCustomerDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)
  const [error, setError] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'done'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/demo/email-marketing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, industry, customerDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as EmailResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setUploadStatus('parsing')
    setTimeout(() => {
      onAddContacts(MOCK_UPLOADED[0])
      setUploadStatus('done')
      setTimeout(() => setUploadStatus('idle'), 2000)
    }, 1200)
    e.target.value = ''
  }

  const sourceLabel: Record<DemoContact['source'], string> = { upload: 'Uploaded', leads: 'From Lead Gen' }
  const sourceColor: Record<DemoContact['source'], string> = { upload: '#00ff88', leads: '#4ade80' }

  return (
    <div className="space-y-8">
      {/* Contact List */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Contact List</p>
            <h2 className="font-heading text-2xl text-primary">
              {contacts.length > 0 ? `${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}` : 'No Contacts Yet'}
            </h2>
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadStatus !== 'idle'}
              className="font-mono text-xs border border-[#d0d0d0] text-muted px-4 py-2 rounded hover:border-[#b0b0b0] hover:text-primary transition-all disabled:opacity-50"
            >
              {uploadStatus === 'parsing' ? 'Parsing file...' : uploadStatus === 'done' ? 'Contacts added' : 'Upload Contact List'}
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.docx,.csv" onChange={handleFileUpload} className="hidden" />
            <p className="font-mono text-xs text-dim mt-1 text-right">Accepts XLSX, DOCX, CSV</p>
          </div>
        </div>

        {contacts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-mono text-sm text-muted mb-2">No contacts in your list yet.</p>
            <p className="font-mono text-xs text-dim">Upload a contact list above, or use the Lead Generation tab to import leads directly.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Name</th>
                  <th className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Email</th>
                  <th className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((c, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 font-mono text-sm text-primary">{c.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{c.email}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs border px-2 py-0.5 rounded-full" style={{ color: sourceColor[c.source], borderColor: `${sourceColor[c.source]}30` }}>
                        {sourceLabel[c.source]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign generator */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Campaign Builder</p>
          <h2 className="font-heading text-2xl text-primary">Generate Email Campaigns</h2>
          {contacts.length > 0 && (
            <p className="font-mono text-xs text-muted mt-1">Campaigns will be sent to {contacts.length} contact{contacts.length !== 1 ? 's' : ''} in your list.</p>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Northside Wellness Center" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Industry</label>
                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Health and Wellness" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Who Are Your Customers?</label>
              <textarea value={customerDescription} onChange={(e) => setCustomerDescription(e.target.value)} placeholder="Adults 30 to 60 looking to improve their health. They value quality, expertise, and personal attention." required rows={3} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none" />
            </div>
            <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
              {loading ? 'Writing campaigns...' : 'Generate Email Marketing Package'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
              Writing your complete email marketing package...
            </div>
          )}
          {error && <div className="mt-6 rounded p-4 text-sm" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b' }}>{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Campaign calendar */}
          <div className="bg-card border border-border rounded p-6">
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Send Schedule</p>
            <h3 className="font-heading text-xl text-primary mb-4">30-Day Campaign Calendar</h3>
            {(() => {
              // Offset so day 1 starts on today's day of week (Mon=0 in Mon-indexed grid)
              const todayDow = new Date().getDay() // 0=Sun
              const startOffset = todayDow === 0 ? 6 : todayDow - 1
              const totalCells = startOffset + 31
              const rows = Math.ceil(totalCells / 7)
              return (
                <div className="grid grid-cols-7 gap-1">
                  {CALENDAR_DAYS.map((d) => <div key={d} className="font-mono text-xs text-dim text-center py-1">{d}</div>)}
                  {Array.from({ length: rows * 7 }, (_, i) => {
                    const day = i - startOffset + 1
                    const event = day >= 1 && day <= 31 ? CALENDAR_EVENTS[day] : undefined
                    const visible = day >= 1 && day <= 31
                    return (
                      <div key={i} className={`aspect-square rounded flex flex-col items-center justify-center p-0.5 ${visible ? 'bg-[#efefef] border border-[#d8d8d8]' : 'opacity-0 pointer-events-none'}`}>
                        {visible && <span className="font-mono text-xs text-dim">{day}</span>}
                        {visible && event && <span className="font-mono text-center leading-none mt-0.5 px-0.5" style={{ fontSize: '9px', color: event.color }}>{event.label}</span>}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <div className="flex flex-wrap gap-4 mt-4">
              {[{ color: '#00aa55', label: 'Welcome Sequence' }, { color: '#00ff88', label: 'Newsletter' }, { color: '#f97316', label: 'Re-engagement' }].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-mono text-xs text-muted">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Welcome sequence */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Welcome Sequence</p>
              <h3 className="font-heading text-xl text-primary">{result.welcomeSequence?.length ?? 0} Emails</h3>
              <p className="font-mono text-xs text-muted mt-1">Sent automatically when a contact joins your list</p>
            </div>
            <div className="p-6 space-y-3">
              {(result.welcomeSequence ?? []).map((email, i) => <EmailCard key={i} email={email} badge={email.day === 0 ? 'Day 0' : `Day ${email.day}`} badgeColor="#4ade80" />)}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00ff88' }}>Monthly Newsletter</p>
              <h3 className="font-heading text-xl text-primary">Newsletter Template</h3>
              <p className="font-mono text-xs text-muted mt-1">Sent on the first Tuesday of each month</p>
            </div>
            <div className="p-6"><EmailCard email={result.newsletter} badge="Monthly" badgeColor="#00ff88" /></div>
          </div>

          {/* Re-engagement */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#f97316' }}>Re-Engagement Campaign</p>
              <h3 className="font-heading text-xl text-primary">{result.reEngagement?.length ?? 0} Emails</h3>
              <p className="font-mono text-xs text-muted mt-1">Triggers when a contact has not opened in 90 days</p>
            </div>
            <div className="p-6 space-y-3">
              {(result.reEngagement ?? []).map((email, i) => <EmailCard key={i} email={email} badge={email.dayLabel ?? `Email ${i + 1}`} badgeColor="#f97316" />)}
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects to Mailchimp, Klaviyo, or any major email platform and sends to your contact list automatically.
      </p>
    </div>
  )
}
