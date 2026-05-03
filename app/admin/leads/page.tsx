'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
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

const CSV_COLUMNS = ['business_name', 'phone', 'email', 'website', 'address', 'category', 'rating', 'status', 'notes']

function downloadTemplate() {
  const template = CSV_COLUMNS.join(',') + '\n'
  const blob = new Blob([template], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'leads-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminLeadsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [leadsRefreshSignal, setLeadsRefreshSignal] = useState(0)
  const [savedLeads, setSavedLeads] = useState<OutreachLead[]>([])

  // CSV import state
  const [showImport, setShowImport] = useState(false)
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleLeadsSaved = useCallback(() => {
    setLeadsRefreshSignal((s) => s + 1)
    setActiveTab('leads')
  }, [])

  const handleLeadsChange = useCallback((leads: OutreachLead[]) => {
    setSavedLeads(leads)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[]
        setPreviewRows(data.slice(0, 5))
        setAllRows(data)
        setImportResult(null)
      },
    })
  }

  const handleImport = async () => {
    if (allRows.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/admin/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: allRows }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ imported: data.imported, skipped: data.skipped })
        setLeadsRefreshSignal((s) => s + 1)
        setActiveTab('leads')
      } else {
        setImportResult({ imported: 0, skipped: allRows.length })
      }
    } catch {
      setImportResult({ imported: 0, skipped: allRows.length })
    }
    setImporting(false)
  }

  const closeImport = () => {
    setShowImport(false)
    setPreviewRows([])
    setAllRows([])
    setImportResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl text-primary mb-2">Lead Generation</h1>
          <p className="font-mono text-sm text-muted">
            Find prospects via Google Places, build email templates, and run outreach campaigns.
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="shrink-0 font-mono text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-primary hover:border-accent transition-colors"
        >
          Import CSV
        </button>
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-12 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeImport() }}
        >
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading text-xl text-primary">Import Leads from CSV</h2>
              <button onClick={closeImport} className="text-muted hover:text-primary text-2xl leading-none">&times;</button>
            </div>

            {/* Template download */}
            <p className="font-mono text-xs text-muted mb-4">
              Download the{' '}
              <button
                onClick={downloadTemplate}
                className="text-accent underline underline-offset-2 hover:opacity-80"
              >
                CSV template
              </button>
              {' '}to see the expected column format.
            </p>

            {/* File input */}
            <div className="mb-5">
              <label className="font-mono text-xs text-muted uppercase tracking-wider block mb-2">Select CSV File</label>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="font-mono text-xs text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-border file:bg-surface file:text-xs file:font-mono file:text-muted file:cursor-pointer hover:file:text-primary"
              />
            </div>

            {/* Preview table */}
            {previewRows.length > 0 && (
              <div className="mb-5">
                <p className="font-mono text-xs text-muted uppercase tracking-wider mb-2">
                  Preview — first {previewRows.length} of {allRows.length} rows
                </p>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        {CSV_COLUMNS.map(col => (
                          <th key={col} className="px-3 py-2 text-left text-muted whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {CSV_COLUMNS.map(col => (
                            <td key={col} className="px-3 py-2 text-primary truncate max-w-[120px]" title={row[col] ?? ''}>
                              {row[col] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div className="mb-4 px-4 py-3 rounded-lg border border-border font-mono text-xs text-muted">
                Imported <span className="text-accent font-semibold">{importResult.imported}</span> leads.
                {importResult.skipped > 0 && <> Skipped <span className="text-red-500 font-semibold">{importResult.skipped}</span> rows (missing business name and phone).</>}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeImport}
                className="font-mono text-xs px-4 py-2 rounded-lg border border-border text-muted hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={allRows.length === 0 || importing}
                className="font-mono text-xs px-4 py-2 rounded-lg bg-accent text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${allRows.length} Lead${allRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}


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
