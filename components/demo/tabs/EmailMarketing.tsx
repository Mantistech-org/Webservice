'use client'

import { useState } from 'react'

interface Props { sessionId: string }

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
  return <button onClick={copy} className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
}

function EmailCard({ email, badge, badgeColor }: { email: EmailItem; badge: string; badgeColor: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-bg border border-border rounded overflow-hidden">
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
          <button onClick={() => setOpen(!open)} className="font-mono text-xs text-muted hover:text-accent transition-colors">
            {open ? 'Hide' : 'View'}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-4 py-4 bg-card">
          <p className="text-sm text-teal leading-relaxed whitespace-pre-line">{email.body}</p>
        </div>
      )}
    </div>
  )
}

const CALENDAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKS = Array.from({ length: 5 }, (_, i) => i)

// Mock campaign calendar events
const CALENDAR_EVENTS: Record<number, { label: string; color: string }> = {
  1: { label: 'Welcome 1', color: '#00ff88' },
  2: { label: 'Welcome 2', color: '#00ff88' },
  4: { label: 'Welcome 3', color: '#00ff88' },
  8: { label: 'Welcome 4', color: '#00ff88' },
  15: { label: 'Welcome 5', color: '#00ff88' },
  18: { label: 'Newsletter', color: '#3b82f6' },
  25: { label: 'Re-engage 1', color: '#f97316' },
  30: { label: 'Welcome 6', color: '#00ff88' },
  32: { label: 'Re-engage 2', color: '#f97316' },
}

export default function EmailMarketing({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [customerDescription, setCustomerDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/demo/email-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, businessName, industry, customerDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as EmailResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Email Marketing Platform</p>
          <h2 className="font-heading text-2xl text-primary">Generate Email Campaigns</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Northside Wellness Center" required className="form-input" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Industry</label>
                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Health and Wellness" required className="form-input" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Customer Description</label>
              <textarea value={customerDescription} onChange={(e) => setCustomerDescription(e.target.value)} placeholder="Adults 30-60 looking to improve their health. They value quality, expertise, and personal attention. Many are referred by friends or found us through local search." required rows={3} className="form-input resize-none" />
            </div>
            <button type="submit" disabled={loading} className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Writing campaigns...' : 'Generate Email Marketing Package'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Writing your complete email marketing package...
            </div>
          )}
          {error && <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">{error}</div>}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Campaign calendar */}
          <div className="bg-card border border-border rounded p-6">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Campaign Calendar</p>
            <h3 className="font-heading text-xl text-primary mb-4">30-Day Send Schedule</h3>
            <div className="grid grid-cols-7 gap-1">
              {CALENDAR_DAYS.map((d) => (
                <div key={d} className="font-mono text-xs text-dim text-center py-1">{d}</div>
              ))}
              {WEEKS.flatMap((week) =>
                CALENDAR_DAYS.map((_, dayIdx) => {
                  const day = week * 7 + dayIdx + 1
                  const event = CALENDAR_EVENTS[day]
                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded flex flex-col items-center justify-center p-0.5 ${
                        event ? 'bg-bg border border-border' : 'bg-bg/50'
                      } ${day > 31 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                      <span className="font-mono text-xs text-dim">{day <= 31 ? day : ''}</span>
                      {event && (
                        <span className="font-mono text-[9px] leading-none mt-0.5 text-center px-0.5" style={{ color: event.color }}>
                          {event.label}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { color: '#00ff88', label: 'Welcome Sequence' },
                { color: '#3b82f6', label: 'Newsletter' },
                { color: '#f97316', label: 'Re-engagement' },
              ].map((item) => (
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
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00ff88' }}>Welcome Sequence</p>
              <h3 className="font-heading text-xl text-primary">{result.welcomeSequence.length} Emails</h3>
              <p className="font-mono text-xs text-dim mt-1">Sent automatically when someone joins your list</p>
            </div>
            <div className="p-6 space-y-3">
              {result.welcomeSequence.map((email, i) => (
                <EmailCard
                  key={i}
                  email={email}
                  badge={email.day === 0 ? 'Day 0' : `Day ${email.day}`}
                  badgeColor="#00ff88"
                />
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#3b82f6' }}>Monthly Newsletter</p>
              <h3 className="font-heading text-xl text-primary">Newsletter Template</h3>
              <p className="font-mono text-xs text-dim mt-1">Sent on the first Tuesday of each month</p>
            </div>
            <div className="p-6">
              <EmailCard email={result.newsletter} badge="Monthly" badgeColor="#3b82f6" />
            </div>
          </div>

          {/* Re-engagement */}
          <div className="bg-card border border-border rounded">
            <div className="px-6 py-4 border-b border-border">
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#f97316' }}>Re-Engagement Campaign</p>
              <h3 className="font-heading text-xl text-primary">{result.reEngagement.length} Emails</h3>
              <p className="font-mono text-xs text-dim mt-1">Triggers when a subscriber has not opened in 90 days</p>
            </div>
            <div className="p-6 space-y-3">
              {result.reEngagement.map((email, i) => (
                <EmailCard
                  key={i}
                  email={email}
                  badge={email.dayLabel ?? `Email ${i + 1}`}
                  badgeColor="#f97316"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version connects to Mailchimp, Klaviyo, or any major email platform and sends automatically.
      </p>
    </div>
  )
}
