'use client'

import { useState, useEffect, useRef } from 'react'
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

function GBPPage({ businessName }: { businessName: string }) {
  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00C27C', fontWeight: 600, marginBottom: 8 }}>Google Business Profile</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Profile Management</h1>
      <p style={{ fontSize: 14, color: '#6b7280' }}>Manage your Google Business Profile for {businessName}. Full version coming soon.</p>
    </div>
  )
}

function MissedCallPage({ businessName }: { businessName: string }) {
  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00C27C', fontWeight: 600, marginBottom: 8 }}>Missed Call Auto-Reply</p>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Auto-Reply Configuration</h1>
      <p style={{ fontSize: 14, color: '#6b7280' }}>Configure automatic SMS replies to missed calls for {businessName}. Full version coming soon.</p>
    </div>
  )
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
    setGateSubmitted(true)
  }

  const sidebarWidth = sidebarExpanded ? 240 : 64

  if (gateSubmitted) mountedPages.current.add(activePage)

  const renderPage = (page: DemoView) => {
    switch (page) {
      case 'dashboard': return (
        <DashboardHome
          businessName={businessName}
          onNavigateToWeather={() => setActivePage('weather')}
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
        onNavigate={setActivePage}
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

        {/* Page content — lazy mount for persistence */}
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
