'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SearchAnalyticsRow } from '@/lib/google-search-console'

type GscData = {
  keywords: SearchAnalyticsRow[]
  pages: SearchAnalyticsRow[]
  startDate: string
  endDate: string
}

const DAY_OPTIONS = [
  { label: '7 days',  value: 7 },
  { label: '28 days', value: 28 },
  { label: '90 days', value: 90 },
]

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

function pos(n: number) {
  return n.toFixed(1)
}

export default function SearchConsoleTab() {
  const [days, setDays]         = useState(28)
  const [data, setData]         = useState<GscData | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async (d: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/search-console?days=${d}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load Search Console data.')
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(days)
  }, [days, load])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-xs text-muted">
          Keyword rankings, impressions, and click data pulled from Google Search Console.
        </p>
        <div className="flex gap-1">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-all ${
                days === opt.value
                  ? 'border-accent bg-accent/10 text-emerald-700 dark:text-accent'
                  : 'border-border text-muted hover:text-primary hover:border-border-light'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-border rounded-lg bg-card p-6 text-center">
          <p className="font-mono text-sm text-muted mb-2">{error}</p>
          {error.includes('not configured') && (
            <p className="font-mono text-xs text-dim">
              Add <span className="text-primary">GOOGLE_SEARCH_CONSOLE_KEY</span> to your environment variables with the service account JSON key.
            </p>
          )}
        </div>
      )}

      {loading && !data && (
        <p className="font-mono text-sm text-muted animate-pulse">Loading Search Console data...</p>
      )}

      {data && (
        <div className="space-y-8">
          {data.startDate && (
            <p className="font-mono text-xs text-dim">
              {data.startDate} to {data.endDate}
            </p>
          )}

          {/* Top Keywords */}
          <div>
            <h2 className="font-heading text-xl text-primary mb-4">Top Keywords</h2>
            {data.keywords.length === 0 ? (
              <p className="font-mono text-sm text-muted">No keyword data for this period.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="text-left px-4 py-3 text-muted font-medium">Query</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Clicks</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Impressions</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">CTR</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.keywords.map((row, i) => (
                      <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-bg/50'}`}>
                        <td className="px-4 py-3 text-primary">{row.keys[0]}</td>
                        <td className="px-4 py-3 text-right text-primary">{row.clicks.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted">{row.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted">{pct(row.ctr)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full ${
                            row.position <= 3  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            row.position <= 10 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                 'bg-bg text-muted'
                          }`}>
                            {pos(row.position)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div>
            <h2 className="font-heading text-xl text-primary mb-4">Top Pages</h2>
            {data.pages.length === 0 ? (
              <p className="font-mono text-sm text-muted">No page data for this period.</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="text-left px-4 py-3 text-muted font-medium">Page</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Clicks</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Impressions</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">CTR</th>
                      <th className="text-right px-4 py-3 text-muted font-medium">Avg Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pages.map((row, i) => {
                      const pageUrl = row.keys[0] ?? ''
                      const path = pageUrl.replace(/^https?:\/\/[^/]+/, '') || '/'
                      return (
                        <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-bg/50'}`}>
                          <td className="px-4 py-3">
                            <a
                              href={pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              {path}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-right text-primary">{row.clicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted">{row.impressions.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted">{pct(row.ctr)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full ${
                              row.position <= 3  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              row.position <= 10 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                   'bg-bg text-muted'
                            }`}>
                              {pos(row.position)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
