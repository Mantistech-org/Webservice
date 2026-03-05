'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import ReviewManagement from './tabs/ReviewManagement'
import SocialMedia from './tabs/SocialMedia'
import LeadGeneration from './tabs/LeadGeneration'
import EmailMarketing from './tabs/EmailMarketing'
import SEOOptimization from './tabs/SEOOptimization'
import ECommerceAutomation from './tabs/ECommerceAutomation'
import AdCreative from './tabs/AdCreative'
import WebsiteChatbot from './tabs/WebsiteChatbot'

export interface DemoContact {
  name: string
  email: string
  source: 'upload' | 'leads'
}

const TABS = [
  { id: 'review',    label: 'Review Management' },
  { id: 'social',    label: 'Social Media Automation' },
  { id: 'leads',     label: 'Lead Generation' },
  { id: 'email',     label: 'Email Marketing' },
  { id: 'seo',       label: 'SEO Optimization' },
  { id: 'ecommerce', label: 'E-Commerce Automation' },
  { id: 'ads',       label: 'Ad Creative Generation' },
  { id: 'chatbot',   label: 'Website Chatbot' },
]

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('review')
  const [sessionId, setSessionId] = useState('')
  const [contacts, setContacts] = useState<DemoContact[]>([])
  const tabBarRef = useRef<HTMLDivElement>(null)

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

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    const el = tabBarRef.current?.querySelector(`[data-tab="${id}"]`) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
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
    handleTabChange('email')
  }

  const handleAddContacts = (newContacts: DemoContact[]) => {
    setContacts((prev) => {
      const existing = new Set(prev.map((c) => c.email))
      const unique = newContacts.filter((c) => !existing.has(c.email))
      return [...prev, ...unique]
    })
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'review':    return <ReviewManagement sessionId={sessionId} />
      case 'social':    return <SocialMedia sessionId={sessionId} />
      case 'leads':     return <LeadGeneration sessionId={sessionId} onImportContacts={handleImportFromLeads} />
      case 'email':     return <EmailMarketing sessionId={sessionId} contacts={contacts} onAddContacts={handleAddContacts} />
      case 'seo':       return <SEOOptimization sessionId={sessionId} />
      case 'ecommerce': return <ECommerceAutomation sessionId={sessionId} />
      case 'ads':       return <AdCreative sessionId={sessionId} />
      case 'chatbot':   return <WebsiteChatbot sessionId={sessionId} />
      default:          return null
    }
  }

  return (
    <div className="demo-page min-h-screen bg-bg">
      {/* Banner */}
      <div style={{ backgroundColor: '#000000' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="inline-block font-mono text-xs tracking-widest uppercase px-2 py-0.5 rounded mb-1" style={{ backgroundColor: '#00ff88', color: '#000000' }}>
              Free Trial
            </span>
            <p className="font-heading text-lg leading-tight" style={{ color: '#f0f0f0' }}>
              You are trying all Mantis Tech tools at no cost. No sign-up required.
            </p>
          </div>
          <Link
            href="/intake"
            className="shrink-0 font-mono text-sm px-6 py-3 rounded tracking-wider whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#f0f0f0', color: '#000000' }}
          >
            Get Your Business Set Up Today
          </Link>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border bg-card sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div
            ref={tabBarRef}
            className="flex gap-1 overflow-x-auto py-1"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`shrink-0 font-mono text-xs tracking-wider px-4 py-3 border-b-2 transition-all duration-150 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#1a1a1a] text-[#1a1a1a]'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {renderTab()}
      </div>
    </div>
  )
}
