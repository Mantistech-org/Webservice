'use client'

import { useState } from 'react'
import MetaTagsTab from '@/components/admin/seo/MetaTagsTab'
import LocationPagesTab from '@/components/admin/seo/LocationPagesTab'
import BlogTab from '@/components/admin/seo/BlogTab'
import SearchConsoleTab from '@/components/admin/seo/SearchConsoleTab'

type Tab = 'meta' | 'locations' | 'blog' | 'search-console'

const TABS: { id: Tab; label: string }[] = [
  { id: 'meta',           label: 'Meta Tags' },
  { id: 'locations',      label: 'Location Pages' },
  { id: 'blog',           label: 'Blog Posts' },
  { id: 'search-console', label: 'Search Console' },
]

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('meta')

  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8">
        <h1 className="font-heading text-5xl text-primary mb-2">SEO Tools</h1>
        <p className="font-mono text-sm text-muted">
          Generate and manage meta tags, location landing pages, blog content, and keyword rankings.
        </p>
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

      {activeTab === 'meta'           && <MetaTagsTab />}
      {activeTab === 'locations'      && <LocationPagesTab />}
      {activeTab === 'blog'           && <BlogTab />}
      {activeTab === 'search-console' && <SearchConsoleTab />}
    </div>
  )
}
