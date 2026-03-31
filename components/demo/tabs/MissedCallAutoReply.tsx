'use client'

import { useState } from 'react'

interface Props { sessionId: string; darkMode?: boolean }

interface CallLog {
  id: number
  caller: string
  phone: string
  time: string
  date: string
  replySent: boolean
  replyText: string
}

const DEFAULT_MESSAGE = "Hi, you reached us at [Business Name]. We missed your call but will get back to you shortly. Reply to this text if you need anything in the meantime."

const CALL_LOG: CallLog[] = [
  { id: 1,  caller: 'Unknown',      phone: '(555) 203-4491', time: '4:47 PM', date: 'Today',     replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 2,  caller: 'James T.',     phone: '(555) 334-9021', time: '2:12 PM', date: 'Today',     replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 3,  caller: 'Rachel K.',    phone: '(555) 409-1177', time: '11:58 AM',date: 'Today',     replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 4,  caller: 'Unknown',      phone: '(555) 512-7720', time: '9:03 AM', date: 'Today',     replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 5,  caller: 'Mike R.',      phone: '(555) 623-5589', time: '6:31 PM', date: 'Yesterday', replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 6,  caller: 'Unknown',      phone: '(555) 748-2210', time: '3:44 PM', date: 'Yesterday', replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 7,  caller: 'Lisa H.',      phone: '(555) 907-3318', time: '1:15 PM', date: 'Yesterday', replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 8,  caller: 'Unknown',      phone: '(555) 051-8834', time: '10:22 AM',date: 'Yesterday', replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 9,  caller: 'Carlos V.',    phone: '(555) 022-9945', time: '8:55 AM', date: 'Mar 27',    replySent: true,  replyText: DEFAULT_MESSAGE },
  { id: 10, caller: 'Amy F.',       phone: '(555) 193-4401', time: '5:18 PM', date: 'Mar 27',    replySent: true,  replyText: DEFAULT_MESSAGE },
]

export default function MissedCallAutoReply({ sessionId, darkMode }: Props) {
  const [enabled, setEnabled] = useState(true)
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [saved, setSaved] = useState(false)
  const [expandedLog, setExpandedLog] = useState<number | null>(null)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const todayCount     = CALL_LOG.filter((c) => c.date === 'Today').length
  const yesterdayCount = CALL_LOG.filter((c) => c.date === 'Yesterday').length
  const replyRate      = Math.round((CALL_LOG.filter((c) => c.replySent).length / CALL_LOG.length) * 100)

  return (
    <div className="space-y-8">
      {/* Status + toggle */}
      <div className="bg-card border border-border rounded px-6 py-5 flex items-center justify-between gap-6">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Feature Status</p>
          <h2 className="font-heading text-2xl text-primary">Missed Call Auto-Reply</h2>
          <p className="font-mono text-sm text-muted mt-1">
            {enabled
              ? 'Active — callers receive a text immediately when a call goes unanswered.'
              : 'Inactive — callers will not receive an automatic reply.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-sm" style={{ color: enabled ? '#00aa55' : '#888888' }}>
            {enabled ? 'On' : 'Off'}
          </span>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className="relative w-12 h-6 rounded-full transition-colors duration-200"
            style={{ backgroundColor: enabled ? '#00aa55' : '#cccccc' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: enabled ? 'translateX(24px)' : 'translateX(0)' }}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Missed Today',     value: todayCount.toString()         },
          { label: 'Missed Yesterday', value: yesterdayCount.toString()     },
          { label: 'Total This Week',  value: CALL_LOG.length.toString()    },
          { label: 'Reply Rate',       value: `${replyRate}%`               },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded px-5 py-4">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1">{s.label}</div>
            <div className="font-heading text-2xl text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Auto-reply message editor */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Auto-Reply Message</p>
          <h2 className="font-heading text-2xl text-primary">Customize Your Reply</h2>
        </div>
        <div className="p-6">
          {saved && (
            <div className="mb-4 bg-[#00aa5512] border border-[#00aa5530] rounded px-4 py-3 font-mono text-sm" style={{ color: '#00aa55' }}>
              Message saved successfully.
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <textarea
              className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your auto-reply message..."
              required
            />
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-muted">
                Use [Business Name] to insert your business name automatically.
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-muted">{message.length}/160</span>
                <button
                  type="submit"
                  className="font-mono text-sm px-5 py-2 rounded tracking-wider transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
                >
                  Save Message
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Missed call log */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Recent Activity</p>
          <h2 className="font-heading text-2xl text-primary">Missed Call Log</h2>
        </div>
        <div className="p-6 space-y-2">
          {CALL_LOG.map((entry) => (
            <div key={entry.id} className="bg-[#efefef] border border-[#d0d0d0] rounded overflow-hidden">
              <div
                className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedLog(expandedLog === entry.id ? null : entry.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1a1a1a' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0f0f0" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-[#1a1a1a] font-medium">{entry.caller}</div>
                    <div className="font-mono text-xs text-[#888888]">{entry.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="font-mono text-xs text-[#888888]">{entry.date}</div>
                    <div className="font-mono text-xs text-[#888888]">{entry.time}</div>
                  </div>
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded border"
                    style={{ color: entry.replySent ? '#00aa55' : '#888888', borderColor: entry.replySent ? '#00aa5530' : '#cccccc', backgroundColor: entry.replySent ? '#00aa5508' : 'transparent' }}
                  >
                    {entry.replySent ? 'Reply sent' : 'No reply'}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedLog === entry.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#888888' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {expandedLog === entry.id && (
                <div className="border-t border-[#d0d0d0] px-4 py-3 bg-white">
                  <p className="font-mono text-xs text-[#888888] mb-1 uppercase tracking-widest">Reply sent</p>
                  <p className="font-mono text-sm text-[#333333] leading-relaxed">{message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-xs text-dim text-center">
        The full version monitors your business phone line in real time and sends auto-replies the moment a call is missed.
      </p>
    </div>
  )
}
