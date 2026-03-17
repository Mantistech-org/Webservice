'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  intake:  { thisMonth: number; lastMonth: number }
  active:  { total: number; thisMonth: number; lastMonth: number }
  mrr:     { dollars: number; stripeError: string | null }
  demo:    { thisMonth: number; lastMonth: number; total: number }
  leads:   { thisMonth: number; lastMonth: number }
  totals:  { projects: number }
}

function Delta({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  if (lastMonth === 0 && thisMonth === 0) {
    return <span className="font-mono text-xs text-muted">No data</span>
  }
  if (lastMonth === 0) {
    return (
      <span className="flex items-center gap-1 font-mono text-xs text-emerald-700 dark:text-accent">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        New this month
      </span>
    )
  }
  const diff = thisMonth - lastMonth
  const pct = Math.round((diff / lastMonth) * 100)
  if (diff === 0) {
    return <span className="font-mono text-xs text-muted">Same as last month</span>
  }
  const up = diff > 0
  return (
    <span className={`flex items-center gap-1 font-mono text-xs ${up ? 'text-emerald-700 dark:text-accent' : 'text-red-700 dark:text-red-400'}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
      </svg>
      {up ? '+' : ''}{pct}% vs last month
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
  delta,
  accent = false,
  error,
}: {
  label: string
  value: string | number
  sub?: string
  delta?: React.ReactNode
  accent?: boolean
  error?: string | null
}) {
  return (
    <div className="bg-card border border-border rounded p-6 flex flex-col gap-2">
      <div className="font-mono text-xs text-muted tracking-widest uppercase">{label}</div>
      {error ? (
        <div className="font-mono text-xs text-muted italic">{error}</div>
      ) : (
        <div className={`font-heading text-4xl ${accent ? 'text-emerald-700 dark:text-accent' : 'text-primary'}`}>
          {value}
        </div>
      )}
      {sub && !error && (
        <div className="font-mono text-xs text-muted">{sub}</div>
      )}
      {delta && !error && <div className="mt-1">{delta}</div>}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.status === 401) { router.push('/admin'); return }
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAnalytics() }, [])

  const now = new Date()
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl text-primary mb-2">Analytics</h1>
          <p className="font-mono text-sm text-muted">Real data from your projects, Stripe, and demo sessions.</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-mono text-xs text-muted">{monthLabel}</span>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider border border-border px-3 py-1.5 rounded"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-700/5 dark:bg-red-400/5 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded p-6 animate-pulse">
              <div className="h-3 bg-border rounded w-24 mb-3" />
              <div className="h-9 bg-border rounded w-16 mb-2" />
              <div className="h-3 bg-border rounded w-32" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* This month headline */}
          <div className="mb-3">
            <div className="font-mono text-xs text-muted tracking-widest uppercase">Current Month</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard
              label="Intake Form Submissions"
              value={data.intake.thisMonth}
              sub={`${data.totals.projects} total all time`}
              delta={<Delta thisMonth={data.intake.thisMonth} lastMonth={data.intake.lastMonth} />}
            />
            <StatCard
              label="Active Clients"
              value={data.active.total}
              sub="Total active accounts"
              delta={<Delta thisMonth={data.active.thisMonth} lastMonth={data.active.lastMonth} />}
            />
            <StatCard
              label="MRR from Stripe"
              value={data.mrr.stripeError ? '—' : `$${data.mrr.dollars.toLocaleString()}`}
              sub="Active subscriptions"
              accent={!data.mrr.stripeError}
              error={data.mrr.stripeError}
            />
            <StatCard
              label="Demo Page Visits"
              value={data.demo.thisMonth}
              sub={`${data.demo.total} sessions total`}
              delta={<Delta thisMonth={data.demo.thisMonth} lastMonth={data.demo.lastMonth} />}
            />
            <StatCard
              label="Lead Signals"
              value={data.leads.thisMonth}
              sub="Projects with upsell activity"
              delta={<Delta thisMonth={data.leads.thisMonth} lastMonth={data.leads.lastMonth} />}
            />
          </div>

          {/* Month comparison table */}
          <div className="pt-8 border-t border-border">
            <h2 className="font-heading text-2xl text-primary mb-5">Month-over-Month</h2>
            <div className="bg-card border border-border rounded overflow-hidden">
              <div className="grid grid-cols-4 text-xs font-mono text-muted tracking-widest uppercase border-b border-border px-5 py-3 bg-bg">
                <div>Metric</div>
                <div className="text-right">Last Month</div>
                <div className="text-right">This Month</div>
                <div className="text-right">Change</div>
              </div>
              {[
                { label: 'Intake Submissions', ...data.intake },
                { label: 'Active Clients', thisMonth: data.active.thisMonth, lastMonth: data.active.lastMonth },
                { label: 'Demo Sessions', thisMonth: data.demo.thisMonth, lastMonth: data.demo.lastMonth },
                { label: 'Lead Signals', ...data.leads },
              ].map((row) => {
                const diff = row.thisMonth - row.lastMonth
                const pct = row.lastMonth > 0 ? Math.round((diff / row.lastMonth) * 100) : null
                return (
                  <div key={row.label} className="grid grid-cols-4 text-xs font-mono border-b border-border last:border-0 px-5 py-3.5 hover:bg-bg transition-colors">
                    <div className="text-primary">{row.label}</div>
                    <div className="text-right text-muted">{row.lastMonth}</div>
                    <div className="text-right text-primary font-medium">{row.thisMonth}</div>
                    <div className={`text-right font-medium ${diff > 0 ? 'text-emerald-700 dark:text-accent' : diff < 0 ? 'text-red-700 dark:text-red-400' : 'text-muted'}`}>
                      {diff === 0 ? '—' : `${diff > 0 ? '+' : ''}${diff}${pct !== null ? ` (${pct > 0 ? '+' : ''}${pct}%)` : ''}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stripe note */}
          {data.mrr.stripeError && (
            <div className="mt-6 p-4 bg-yellow-700/5 dark:bg-yellow-400/5 border border-yellow-700/20 dark:border-yellow-400/20 rounded">
              <div className="font-mono text-xs text-yellow-700 dark:text-yellow-400 tracking-widest uppercase mb-1">Stripe</div>
              <p className="font-mono text-xs text-muted">
                {data.mrr.stripeError}. Set <span className="text-primary">STRIPE_SECRET_KEY</span> in your environment to see live MRR data.
              </p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
