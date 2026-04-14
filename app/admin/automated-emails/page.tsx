'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Campaign {
  id: string
  campaign_name: string
  subject: string
  audience: string
  recipient_count: number
  sent_at: string
}

export default function AutomatedEmailsPage() {
  const router = useRouter()

  // ── Campaign builder form ────────────────────────────────────────────────
  const [campaignName, setCampaignName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<'all' | 'engaged'>('all')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ count: number } | null>(null)
  const [sendError, setSendError] = useState('')

  // ── Campaign history ─────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/automated-emails')
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch {
      // silently fail
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendResult(null)
    setSendError('')
    try {
      const res = await fetch('/api/admin/automated-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignName, subject, body, audience }),
      })
      if (res.status === 401) { router.push('/admin'); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send campaign.')
      setSendResult({ count: data.recipientCount })
      setCampaignName('')
      setSubject('')
      setBody('')
      setAudience('all')
      loadHistory()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-1 min-w-0 px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-5xl text-primary mb-2">Automated Emails</h1>
        <p className="font-mono text-sm text-muted">Manage automated email campaigns sent to demo leads.</p>
      </div>

      {/* Section 1 — Campaign Builder */}
      <div className="mb-16">
        <h2 className="font-heading text-3xl text-primary mb-1">Campaign Builder</h2>
        <p className="font-mono text-sm text-muted mb-6">Compose and send an email campaign to demo leads.</p>

        <form onSubmit={handleSend} className="bg-card border border-border rounded-lg p-6 space-y-5 max-w-2xl">
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Campaign Name</label>
            <input
              type="text" required value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="form-input w-full" placeholder="e.g. Spring Outreach" />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Subject Line</label>
            <input
              type="text" required value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="form-input w-full" placeholder="e.g. Get started with Mantis Tech" />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Email Body</label>
            <textarea
              required rows={10} value={body}
              onChange={(e) => setBody(e.target.value)}
              className="form-input w-full resize-y"
              placeholder="Write your email body here..." />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'all' | 'engaged')}
              className="form-input w-full">
              <option value="all">All Demo Leads</option>
              <option value="engaged">Engaged Leads Only</option>
            </select>
          </div>

          {sendError && (
            <p className="font-mono text-xs text-red-700 dark:text-red-400">{sendError}</p>
          )}
          {sendResult && (
            <div className="font-mono text-xs text-emerald-700 dark:text-accent border border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5 px-4 py-3 rounded">
              Campaign sent to {sendResult.count} recipient{sendResult.count !== 1 ? 's' : ''}.
            </div>
          )}

          <button
            type="submit" disabled={sending}
            className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60">
            {sending ? 'Sending...' : 'Send Campaign'}
          </button>
        </form>
      </div>

      {/* Section 2 — Campaign History */}
      <div className="pt-10 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-3xl text-primary mb-1">Campaign History</h2>
            <p className="font-mono text-sm text-muted">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} sent</p>
          </div>
          <button onClick={loadHistory} disabled={historyLoading}
            className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
            {historyLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12 font-mono text-sm text-muted">
            No campaigns sent yet.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm dark:shadow-none">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Campaign Name', 'Subject', 'Audience', 'Recipients', 'Sent Date'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => (
                  <tr key={c.id} className={i < campaigns.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-5 py-4 font-mono text-sm text-primary">{c.campaign_name}</td>
                    <td className="px-5 py-4 font-mono text-sm text-muted">{c.subject}</td>
                    <td className="px-5 py-4 font-mono text-sm text-muted">
                      {c.audience === 'engaged' ? 'Engaged Leads Only' : 'All Demo Leads'}
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-primary">{c.recipient_count}</td>
                    <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                      {new Date(c.sent_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
