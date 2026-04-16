'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import type { DemoView } from './Sidebar'
import DashboardHome from './pages/DashboardHome'
import BillingPage from './pages/BillingPage'
import PerformancePage from './pages/PerformancePage'
import ReviewManagement from './tabs/ReviewManagement'
import SEOOptimization from './tabs/SEOOptimization'
import CalendarPage from './tabs/CalendarPage'
import SMSTextMarketing from './tabs/SMSTextMarketing'
import WeatherActivation from './tabs/WeatherActivation'
import EmailMarketing from './tabs/EmailMarketing'
import CRM from './tabs/CRM'

// ── Shared style constants ────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 12,
  padding: 20,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00C27C',
  fontWeight: 600,
  marginBottom: 4,
}

// ── Google Business Profile page ──────────────────────────────────────────────

const GBP_STATS = [
  { label: 'Profile Views',      value: '1,247' },
  { label: 'Search Appearances', value: '3,891' },
  { label: 'Direction Requests', value: '84'    },
  { label: 'Phone Calls',        value: '61'    },
]

const GBP_POSTS = [
  {
    date: 'Apr 5, 2026',
    type: 'Update',
    text: 'Spring is here. Time to schedule your AC tune-up before the heat hits. Book online now and get priority scheduling.',
  },
  {
    date: 'Mar 20, 2026',
    type: 'Offer',
    text: 'Limited time: $49 furnace inspection through March. Catch any issues before they turn into costly repairs.',
  },
  {
    date: 'Mar 3, 2026',
    type: 'Update',
    text: 'We now offer same-day emergency service 7 days a week. Call us anytime. Our technicians are standing by.',
  },
]

function GBPPage({ businessName }: { businessName: string }) {
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const [posts, setPosts] = useState(GBP_POSTS)

  const publish = useCallback(() => {
    if (!draft.trim()) return
    setPosts(prev => [{
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'Update',
      text: draft.trim(),
    }, ...prev])
    setDraft('')
    setComposing(false)
  }, [draft])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <p style={LABEL_STYLE}>Google Business Profile</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Profile Management</h1>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
        </div>
        <button
          onClick={() => setComposing(v => !v)}
          style={{
            padding: '10px 20px', fontSize: 13, fontWeight: 600,
            backgroundColor: '#00C27C', color: '#ffffff',
            border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          Post Now
        </button>
      </div>

      {/* Compose panel */}
      {composing && (
        <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>New Post</p>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Write your Google Business post..."
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 14, color: '#111827',
              border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setComposing(false); setDraft('') }}
              style={{ padding: '8px 16px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={publish}
              style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {GBP_STATS.map(s => (
          <div key={s.label} style={CARD}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent posts */}
      <div style={CARD}>
        <p style={{ ...LABEL_STYLE, marginBottom: 16 }}>Recent Posts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map((post, i) => (
            <div
              key={i}
              style={{
                padding: 16, borderRadius: 8,
                backgroundColor: '#f9fafb',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{post.date}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#00C27C',
                    backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 4,
                    padding: '2px 8px',
                  }}>{post.type}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#374151',
                  backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4,
                  padding: '2px 8px',
                }}>Published</span>
              </div>
              <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{post.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Missed Call Auto-Reply page ───────────────────────────────────────────────

const MISSED_CALL_STATS = [
  { label: 'Calls Missed This Month', value: '24'   },
  { label: 'Auto-Replies Sent',       value: '24'   },
  { label: 'Bookings From Replies',   value: '6'    },
  { label: 'Reply Rate',              value: '100%' },
]

const DEFAULT_REPLY = `Hi, you reached {businessName}. Sorry we missed you. We're likely on another call. We have same-day availability for repairs and installs. Book online at mantistech.org/book or reply here and we'll call you right back.`

const REPLY_LOG = [
  { time: 'Today, 2:14 PM',    caller: '(614) 882-4401', sent: 'Yes', outcome: 'Booked appointment'    },
  { time: 'Today, 11:07 AM',   caller: '(614) 553-9182', sent: 'Yes', outcome: 'No response'           },
  { time: 'Yesterday, 4:38 PM',caller: '(740) 291-6630', sent: 'Yes', outcome: 'Called back, booked'   },
  { time: 'Yesterday, 1:52 PM',caller: '(614) 774-2253', sent: 'Yes', outcome: 'Requested estimate'    },
  { time: 'Apr 5, 9:19 AM',    caller: '(614) 308-5577', sent: 'Yes', outcome: 'No response'           },
]

function MissedCallPage({ businessName }: { businessName: string }) {
  const [editing, setEditing] = useState(false)
  const [replyText, setReplyText] = useState(DEFAULT_REPLY)
  const [draft, setDraft] = useState(replyText)

  const displayReply = replyText.replace('{businessName}', businessName || 'Your Business')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <p style={LABEL_STYLE}>Missed Call Auto-Reply</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Auto-Reply Configuration</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{businessName}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {MISSED_CALL_STATS.map(s => (
          <div key={s.label} style={CARD}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Active auto-reply */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Active Auto-Reply</p>
          {!editing && (
            <button
              onClick={() => { setDraft(replyText); setEditing(true) }}
              style={{ fontSize: 13, fontWeight: 600, color: '#00C27C', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={5}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14, color: '#111827',
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Use {'{businessName}'} to insert your business name automatically.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(false)}
                style={{ padding: '8px 16px', fontSize: 13, backgroundColor: 'transparent', color: '#6b7280', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setReplyText(draft); setEditing(false) }}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              backgroundColor: '#00C27C', color: '#ffffff',
              fontSize: 14, lineHeight: 1.6,
              padding: '12px 16px', borderRadius: '16px 16px 4px 16px',
              maxWidth: '80%',
            }}>
              {displayReply}
            </div>
          </div>
        )}
      </div>

      {/* Reply log */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ ...LABEL_STYLE, margin: 0 }}>Reply Log</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              {['Time', 'Caller', 'Reply Sent', 'Outcome'].map(h => (
                <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPLY_LOG.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < REPLY_LOG.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>{row.time}</td>
                <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{row.caller}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 4, padding: '2px 8px' }}>{row.sent}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151' }}>{row.outcome}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Engagement tracker ───────────────────────────────────────────────────────

const trackEngagement = (event: string, detail?: string) => {
  const sessionId = sessionStorage.getItem('demo-session-id')
  const email = sessionStorage.getItem('demo-email')
  if (!sessionId) return
  fetch('/api/demo/engagement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, email, event, detail }),
  }).catch(() => {})
}

// Retained for backward-compat with ClientDashboard
export interface DemoContact {
  name: string
  email: string
  source: 'upload' | 'leads'
}

export default function DemoView() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [activePage, setActivePage]     = useState<DemoView>('dashboard')
  const [sessionId,  setSessionId]      = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [gateInput,  setGateInput]      = useState('')
  const [gateEmail,  setGateEmail]      = useState('')
  const [gateType,   setGateType]       = useState('')
  const [gateSubmitted, setGateSubmitted] = useState(false)
  const mountedPages = useRef<Set<DemoView>>(new Set())

  useEffect(() => {
    const stored = sessionStorage.getItem('demo-session-id')
    if (stored) {
      setSessionId(stored)
    } else {
      const id = crypto.randomUUID()
      sessionStorage.setItem('demo-session-id', id)
      setSessionId(id)
    }
    const storedBiz  = sessionStorage.getItem('demo-business-name')
    const storedType = sessionStorage.getItem('demo-business-type')
    if (storedBiz) { setBusinessName(storedBiz); setGateSubmitted(true) }
    if (storedType) setBusinessType(storedType)
  }, [])

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gateInput.trim()) return
    const biz  = gateInput.trim()
    const type = gateType.trim()
    setBusinessName(biz)
    setBusinessType(type)
    sessionStorage.setItem('demo-business-name', biz)
    sessionStorage.setItem('demo-business-type', type)
    sessionStorage.setItem('demo-email', gateEmail.trim())
    fetch('/api/demo/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: gateEmail.trim(),
        businessName: gateInput.trim(),
        businessType: gateType.trim(),
        sessionId,
      }),
    }).catch(() => {})
    setGateSubmitted(true)
  }

  const sidebarWidth = sidebarExpanded ? 240 : 64

  if (gateSubmitted) mountedPages.current.add(activePage)

  const renderPage = (page: DemoView) => {
    switch (page) {
      case 'dashboard': return (
        <DashboardHome
          businessName={businessName}
          onNavigateToWeather={() => { trackEngagement('activate_now_click'); setActivePage('weather') }}
          onNavigate={setActivePage}
        />
      )
      case 'weather':     return <WeatherActivation sessionId={sessionId} businessName={businessName} />
      case 'bookings':    return <CalendarPage />
      case 'review':      return <ReviewManagement sessionId={sessionId} />
      case 'seo':         return <SEOOptimization sessionId={sessionId} />
      case 'sms':         return <SMSTextMarketing sessionId={sessionId} />
      case 'email':       return <EmailMarketing sessionId={sessionId} contacts={[]} onAddContacts={() => {}} />
      case 'gbp':         return <GBPPage businessName={businessName} />
      case 'missed-call': return <MissedCallPage businessName={businessName} />
      case 'crm':         return <CRM sessionId={sessionId} businessName={businessName} />
      case 'performance': return <PerformancePage />
      case 'settings':
      case 'billing':     return <BillingPage />
      default:            return <DashboardHome businessName={businessName} onNavigateToWeather={() => setActivePage('weather')} onNavigate={setActivePage} />
    }
  }

  // ── Gate form ─────────────────────────────────────────────────────────────

  if (!gateSubmitted) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 1.5rem',
        }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }} />
              <span className="font-heading text-xl" style={{ color: '#1a1a1a' }}>Mantis Tech Demo</span>
            </div>
            <h1 className="font-heading text-4xl mb-3" style={{ color: '#1a1a1a' }}>Welcome to Your Demo</h1>
            <p className="font-mono text-sm" style={{ color: '#555555' }}>
              Enter your business name to personalize the experience.
            </p>
          </div>
          <form
            onSubmit={handleGateSubmit}
            className="rounded-xl p-8 shadow-sm space-y-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid #d0d0d0' }}
          >
            <div>
              <label
                className="font-mono text-xs tracking-widest uppercase block mb-2"
                style={{ color: '#555555' }}
              >
                Business Name
              </label>
              <input
                type="text"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="e.g. Riverside Heating &amp; Cooling"
                required
                autoFocus
                className="w-full border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#d0d0d0',
                  color: '#1a1a1a',
                }}
              />
            </div>
            <div>
              <label
                className="font-mono text-xs tracking-widest uppercase block mb-2"
                style={{ color: '#555555' }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                required
                className="w-full border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#d0d0d0',
                  color: '#1a1a1a',
                }}
              />
            </div>
            <div>
              <label
                className="font-mono text-xs tracking-widest uppercase block mb-2"
                style={{ color: '#555555' }}
              >
                Business Type{' '}
                <span style={{ color: '#777777' }}>(optional)</span>
              </label>
              <select
                value={gateType}
                onChange={(e) => setGateType(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: '#f5f5f5',
                  borderColor: '#d0d0d0',
                  color: gateType ? '#1a1a1a' : '#888888',
                }}
              >
                <option value="">Select a business type…</option>
                <option value="Residential HVAC">Residential HVAC</option>
                <option value="Commercial HVAC">Commercial HVAC</option>
                <option value="Both Residential and Commercial">Both Residential and Commercial</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-mono text-sm tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              Enter Demo
            </button>
            <p className="font-mono text-xs text-center" style={{ color: '#666666' }}>
              No sign-up required. All tools are fully functional.
            </p>
          </form>
        </div>
      </div>
    )
  }

  // ── Main dashboard layout ─────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar
        businessName={businessName}
        onToggleSidebar={() => setSidebarExpanded((v) => !v)}
        onNavigate={setActivePage}
      />
      <Sidebar
        expanded={sidebarExpanded}
        activePage={activePage}
        onNavigate={(page) => { trackEngagement('tab_click', page); setActivePage(page) }}
      />

      <main
        className="transition-all duration-200"
        style={{
          marginTop: 56,
          marginLeft: sidebarWidth,
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        {/* Free trial banner */}
        <div style={{ backgroundColor: '#000000' }}>
          <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-xs tracking-widest uppercase px-2 py-0.5 rounded"
                style={{ backgroundColor: '#00ff88', color: '#000000' }}
              >
                Free Trial
              </span>
              <p className="font-mono text-xs" style={{ color: '#aaaaaa' }}>
                Try all Mantis Tech tools at no cost. No sign-up required.
              </p>
            </div>
            <Link
              href="/consultation"
              className="shrink-0 font-mono text-xs px-5 py-2 rounded-lg tracking-wider whitespace-nowrap transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#f0f0f0', color: '#000000' }}
            >
              Get Set Up Today
            </Link>
          </div>
        </div>

        {/* Page content - lazy mount for persistence */}
        <div style={{ padding: 24 }}>
          {Array.from(mountedPages.current).map((page) => (
            <div key={page} style={{ display: page === activePage ? 'block' : 'none' }}>
              {renderPage(page)}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
