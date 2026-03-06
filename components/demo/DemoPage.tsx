'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const stored = sessionStorage.getItem('demo-session-id')
    if (stored) {
      setSessionId(stored)
    } else {
      const id = crypto.randomUUID()
      sessionStorage.setItem('demo-session-id', id)
      setSessionId(id)
    }
  }, [])

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

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':  return <DashboardHome />
      case 'website':    return <WebsitePage />
      case 'review':     return <ReviewManagement sessionId={sessionId} />
      case 'social':     return <SocialMedia sessionId={sessionId} />
      case 'leads':      return <LeadGeneration sessionId={sessionId} onImportContacts={handleImportFromLeads} />
      case 'email':      return <EmailMarketing sessionId={sessionId} contacts={contacts} onAddContacts={handleAddContacts} />
      case 'seo':        return <SEOOptimization sessionId={sessionId} />
      case 'ecommerce':
      case 'ecommerce-inventory':
      case 'ecommerce-automations':
        return (
          <ECommerceAutomation
            sessionId={sessionId}
            initialSubTab={activePage === 'ecommerce-inventory' ? 'inventory' : 'automations'}
          />
        )
      case 'ads':        return <AdCreative sessionId={sessionId} />
      case 'chatbot':    return <WebsiteChatbot sessionId={sessionId} />
      case 'calendar':   return <CalendarPage />
      case 'billing':    return <BillingPage />
      default:           return <DashboardHome />
    }
  }

  return (
    <div style={{ backgroundColor: '#fafaf8', minHeight: '100vh' }}>
      <TopBar onToggleSidebar={() => setSidebarExpanded((v) => !v)} />
      <Sidebar
        expanded={sidebarExpanded}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {/* Main content */}
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

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
