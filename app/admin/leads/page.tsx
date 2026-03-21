'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SearchTab from '@/components/admin/leads/SearchTab'
import LeadsTab from '@/components/admin/leads/LeadsTab'
import TemplatesTab from '@/components/admin/leads/TemplatesTab'
import CampaignsTab from '@/components/admin/leads/CampaignsTab'
import type { OutreachLead } from '@/types/leads'

type Tab = 'search' | 'leads' | 'templates' | 'campaigns'

const TABS: { id: Tab; label: string }[] = [
  { id: 'search',    label: 'Search' },
  { id: 'leads',     label: 'Saved Leads' },
  { id: 'templates', label: 'Templates' },
  { id: 'campaigns', label: 'Campaigns' },
]

export default function AdminLeadsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [leadsRefreshSignal, setLeadsRefreshSignal] = useState(0)
  const [savedLeads, setSavedLeads] = useState<OutreachLead[]>([])

  const handleLeadsSaved = useCallback(() => {
    setLeadsRefreshSignal((s) => s + 1)
    setActiveTab('leads')
  }, [])

  const handleLeadsChange = useCallback((leads: OutreachLead[]) => {
    setSavedLeads(leads)
  }, [])

  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl text-primary mb-2">Lead Generation</h1>
          <p className="font-mono text-sm text-muted">
            Find prospects via Google Places, build email templates, and run outreach campaigns.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`font-mono text-xs px-4 py-2.5 border-b-2 -mb-px transition-colors tracking-wider ${
              activeTab === tab.id
                ? 'border-accent text-emerald-700 dark:text-accent'
                : 'border-transparent text-muted hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'search' && (
        <SearchTab onLeadsSaved={handleLeadsSaved} />
      )}
      {activeTab === 'leads' && (
        <LeadsTab
          refreshSignal={leadsRefreshSignal}
          onLeadsChange={handleLeadsChange}
        />
      )}
      {activeTab === 'templates' && (
        <TemplatesTab />
      )}
      {activeTab === 'campaigns' && (
        <CampaignsTab savedLeads={savedLeads} />
      )}
    </div>
  )
}
