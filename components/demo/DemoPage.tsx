'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import type { DemoView } from './Sidebar'
import DashboardHome from './pages/DashboardHome'
import WebsitePage from './pages/WebsitePage'
import BillingPage from './pages/BillingPage'
import ReviewManagement from './tabs/ReviewManagement'
import SocialMedia from './tabs/SocialMedia'
import LeadGeneration from './tabs/LeadGeneration'
import EmailMarketing from './tabs/EmailMarketing'
import SEOOptimization from './tabs/SEOOptimization'
import ECommerceAutomation from './tabs/ECommerceAutomation'
import AdCreative from './tabs/AdCreative'
import WebsiteChatbot from './tabs/WebsiteChatbot'
import CalendarPage from './tabs/CalendarPage'

export interface DemoContact {
  name: string
  email: string
  source: 'upload' | 'leads'
}

export default function DemoView() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [activePage, setActivePage] = useState<DemoView>('dashboard')
  const [sessionId, setSessionId] = useState('')
  const [contacts, setContacts] = useState<DemoContact[]>([])
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [gateInput, setGateInput] = useState('')
  const [gateType, setGateType] = useState('')
  const [gateSubmitted, setGateSubmitted] = useState(false)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('demo-dark-mode') === 'true' } catch { return false }
  })
  const mountedPages = useRef<Set<DemoView>>(new Set())

  useEffect(() => {
    try { localStorage.setItem('demo-dark-mode', String(darkMode)) } catch {}
  }, [darkMode])

  useEffect(() => {
    const stored = sessionStorage.getItem('demo-session-id')
    if (stored) {
      setSessionId(stored)
    } else {
      const id = crypto.randomUUID()
      sessionStorage.setItem('demo-session-id', id)
      setSessionId(id)
    }
    const storedBiz = sessionStorage.getItem('demo-business-name')
    const storedType = sessionStorage.getItem('demo-business-type')
    if (storedBiz) {
      setBusinessName(storedBiz)
      setGateSubmitted(true)
    }
    if (storedType) setBusinessType(storedType)
  }, [])

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gateInput.trim()) return
    const biz = gateInput.trim()
    const type = gateType.trim()
    setBusinessName(biz)
    setBusinessType(type)
    sessionStorage.setItem('demo-business-name', biz)
    sessionStorage.setItem('demo-business-type', type)
    setGateSubmitted(true)
  }

  const handleImportFromLeads = (leads: { businessName: string; email: string }[]) => {
    const incoming: DemoContact[] = leads.map((l) => ({
      name: l.businessName,
      email: l.email,
      source: 'leads',
    }))
    setContacts((prev) => {
      const existing = new Set(prev.map((c) => c.email))
      const unique = incoming.filter((c) => !existing.has(c.email))
      return [...prev, ...unique]
    })
    setActivePage('email')
  }

  const handleAddContacts = (newContacts: DemoContact[]) => {
    setContacts((prev) => {
      const existing = new Set(prev.map((c) => c.email))
      const unique = newContacts.filter((c) => !existing.has(c.email))
      return [...prev, ...unique]
    })
  }

  const sidebarWidth = sidebarExpanded ? 240 : 64

  // Track mounted pages for lazy mount persistence
  if (gateSubmitted) {
    mountedPages.current.add(activePage)
  }

  const renderPage = (page: DemoView) => {
    switch (page) {
      case 'dashboard':  return <DashboardHome businessName={businessName} darkMode={darkMode} />
      case 'website':    return <WebsitePage darkMode={darkMode} />
      case 'review':     return <ReviewManagement sessionId={sessionId} darkMode={darkMode} />
      case 'social':     return <SocialMedia sessionId={sessionId} darkMode={darkMode} />
      case 'leads':      return <LeadGeneration sessionId={sessionId} onImportContacts={handleImportFromLeads} darkMode={darkMode} />
      case 'email':      return <EmailMarketing sessionId={sessionId} contacts={contacts} onAddContacts={handleAddContacts} darkMode={darkMode} />
      case 'seo':        return <SEOOptimization sessionId={sessionId} darkMode={darkMode} />
      case 'ecommerce':
      case 'ecommerce-inventory':
      case 'ecommerce-automations':
        return (
          <ECommerceAutomation
            sessionId={sessionId}
            initialSubTab={page === 'ecommerce-inventory' ? 'inventory' : 'automations'}
            darkMode={darkMode}
          />
        )
      case 'ads':        return <AdCreative sessionId={sessionId} darkMode={darkMode} />
      case 'chatbot':    return <WebsiteChatbot sessionId={sessionId} darkMode={darkMode} />
      case 'calendar':   return <CalendarPage darkMode={darkMode} />
      case 'billing':    return <BillingPage darkMode={darkMode} />
      default:           return <DashboardHome businessName={businessName} darkMode={darkMode} />
    }
  }

  if (!gateSubmitted) {
    return (
      <div
        className={darkMode ? 'demo-page demo-dark' : 'demo-page'}
        style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem' }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }} />
              <span className="font-heading text-xl" style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}>Mantis Tech Demo</span>
            </div>
            <h1 className="font-heading text-4xl mb-3" style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}>Welcome to Your Demo</h1>
            <p className="font-mono text-sm" style={{ color: darkMode ? '#aaaaaa' : '#555555' }}>
              Enter your business name to personalize the experience.
            </p>
          </div>
          <form
            onSubmit={handleGateSubmit}
            className="border rounded-lg p-8 shadow-sm space-y-4"
            style={{ backgroundColor: darkMode ? '#1a1a1a' : '#ffffff', borderColor: darkMode ? '#333333' : '#e0e0e0' }}
          >
            <div>
              <label className="font-mono text-xs tracking-widest uppercase block mb-2" style={{ color: darkMode ? '#aaaaaa' : '#555555' }}>Business Name</label>
              <input
                type="text"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="e.g. Riverside Auto Repair"
                required
                autoFocus
                className="w-full border rounded px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: darkMode ? '#252525' : '#f5f5f5',
                  borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
                  color: darkMode ? '#f0f0f0' : '#1a1a1a',
                }}
              />
            </div>
            <div>
              <label className="font-mono text-xs tracking-widest uppercase block mb-2" style={{ color: darkMode ? '#aaaaaa' : '#555555' }}>Business Type <span style={{ color: darkMode ? '#aaaaaa' : '#777777' }}>(optional)</span></label>
              <input
                type="text"
                value={gateType}
                onChange={(e) => setGateType(e.target.value)}
                placeholder="e.g. Auto Repair, Restaurant, Law Firm"
                className="w-full border rounded px-4 py-3 font-mono text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: darkMode ? '#252525' : '#f5f5f5',
                  borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
                  color: darkMode ? '#f0f0f0' : '#1a1a1a',
                }}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded font-mono text-sm tracking-wider transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              Enter Demo
            </button>
            <p className="font-mono text-xs text-center" style={{ color: darkMode ? '#aaaaaa' : '#666666' }}>
              No sign-up required. All tools are fully functional.
            </p>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={darkMode ? 'demo-page demo-dark' : 'demo-page'} style={{ minHeight: '100vh' }}>
      <TopBar
        onToggleSidebar={() => setSidebarExpanded((v) => !v)}
        onNavigate={setActivePage}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((v) => !v)}
      />
      <Sidebar
        expanded={sidebarExpanded}
        activePage={activePage}
        onNavigate={setActivePage}
        darkMode={darkMode}
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
          <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
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
              href="/intake"
              className="shrink-0 font-mono text-xs px-5 py-2 rounded tracking-wider whitespace-nowrap transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#f0f0f0', color: '#000000' }}
            >
              Get Set Up Today
            </Link>
          </div>
        </div>

        {/* Page content — lazy mount for persistence */}
        <div className="max-w-5xl mx-auto px-6 py-8">
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
