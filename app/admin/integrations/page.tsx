'use client'

import { useState, useEffect } from 'react'

interface KeyStatus {
  set: boolean
  last4: string | null
}

interface StatusMap {
  [key: string]: KeyStatus
}

interface EnvField {
  key: string
  label: string
}

interface Service {
  id: string
  name: string
  description: string
  fields: EnvField[]
  docsUrl: string
  docsLabel: string
  infoOnly?: boolean
}

const CATEGORIES: { label: string; services: Service[] }[] = [
  {
    label: 'AI',
    services: [
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Used for AI-powered content generation and automated site building.',
        fields: [{ key: 'ANTHROPIC_API_KEY', label: 'API Key' }],
        docsUrl: 'https://console.anthropic.com/account/keys',
        docsLabel: 'console.anthropic.com',
      },
    ],
  },
  {
    label: 'Email',
    services: [
      {
        id: 'resend',
        name: 'Resend',
        description: 'Used for transactional emails and client outreach campaigns.',
        fields: [{ key: 'RESEND_API_KEY', label: 'API Key' }],
        docsUrl: 'https://resend.com/api-keys',
        docsLabel: 'resend.com/api-keys',
      },
    ],
  },
  {
    label: 'Database',
    services: [
      {
        id: 'supabase',
        name: 'Supabase',
        description: 'Used as the primary database for all project and client data.',
        fields: [
          { key: 'SUPABASE_URL', label: 'Project URL' },
          { key: 'SUPABASE_ANON_KEY', label: 'Anon Key' },
          { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service Role Key' },
          { key: 'SUPABASE_DB_URL', label: 'Database URL' },
        ],
        docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
        docsLabel: 'supabase.com/dashboard',
      },
    ],
  },
  {
    label: 'Payments',
    services: [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Used for processing client payments and managing subscriptions.',
        fields: [
          { key: 'STRIPE_SECRET_KEY', label: 'Secret Key' },
          { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret' },
        ],
        docsUrl: 'https://dashboard.stripe.com/apikeys',
        docsLabel: 'dashboard.stripe.com',
      },
    ],
  },
  {
    label: 'Marketing & Lead Generation',
    services: [
      {
        id: 'google-places',
        name: 'Google Places',
        description: 'Used for lead generation search to find local businesses by industry and location.',
        fields: [{ key: 'GOOGLE_PLACES_API_KEY', label: 'API Key' }],
        docsUrl: 'https://console.cloud.google.com/apis/credentials',
        docsLabel: 'console.cloud.google.com',
      },
      {
        id: 'google-search-console',
        name: 'Google Search Console',
        description: 'Used for SEO monitoring and organic search performance tracking.',
        fields: [{ key: 'GOOGLE_SEARCH_CONSOLE_KEY', label: 'API Key' }],
        docsUrl: 'https://console.cloud.google.com/apis/credentials',
        docsLabel: 'console.cloud.google.com',
      },
    ],
  },
  {
    label: 'Deployment',
    services: [
      {
        id: 'railway',
        name: 'Railway',
        description: 'Used to host and deploy this application. Manage environment variables and deployments from the Railway dashboard.',
        fields: [],
        docsUrl: 'https://railway.app',
        docsLabel: 'railway.app',
        infoOnly: true,
      },
    ],
  },
]

function ServiceIcon({ id }: { id: string }) {
  const cls = 'shrink-0 text-muted'
  if (id === 'anthropic') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
  if (id === 'resend') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
  if (id === 'supabase') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  )
  if (id === 'stripe') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
  if (id === 'google-places' || id === 'google-search-console') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
  if (id === 'railway') return (
    <svg className={cls} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
  return null
}

type OverallStatus = 'connected' | 'partial' | 'disconnected' | 'info'

function OverallBadge({ status }: { status: OverallStatus }) {
  if (status === 'info') return (
    <span className="font-mono text-xs px-2 py-0.5 rounded border border-border text-muted">Informational</span>
  )
  if (status === 'connected') return (
    <span className="font-mono text-xs px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">Connected</span>
  )
  if (status === 'partial') return (
    <span className="font-mono text-xs px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">Partial</span>
  )
  return (
    <span className="font-mono text-xs px-2 py-0.5 rounded border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30">Not Connected</span>
  )
}

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}
    />
  )
}

function SeedFromEnvButton() {
  const [state, setState] = useState<'idle' | 'seeding' | 'done' | 'error'>('idle')
  const [count, setCount] = useState(0)

  async function seed() {
    setState('seeding')
    try {
      const res = await fetch('/api/admin/integrations/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setCount(data.seeded ?? 0)
        setState('done')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <div className="flex items-center gap-4 mb-8 max-w-3xl">
      <button
        onClick={seed}
        disabled={state === 'seeding'}
        className="font-mono text-xs border border-border text-muted px-4 py-2 rounded hover:border-border-light hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === 'seeding' ? 'Seeding...' : 'Seed from Railway Environment'}
      </button>
      {state === 'done' && (
        <span className="font-mono text-xs text-emerald-700 dark:text-accent">
          {count} {count === 1 ? 'key' : 'keys'} seeded from environment variables
        </span>
      )}
      {state === 'error' && (
        <span className="font-mono text-xs text-red-600 dark:text-red-400">Seed failed</span>
      )}
      <span className="font-mono text-xs text-muted">
        Inserts any keys present in Railway env vars that are not already in the database.
      </span>
    </div>
  )
}

function ServiceCard({
  service,
  statusMap,
  onStatusUpdate,
}: {
  service: Service
  statusMap: StatusMap
  onStatusUpdate: (key: string) => void
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<Record<string, 'saved' | 'error'>>({})
  const [localConnected, setLocalConnected] = useState<Record<string, boolean>>(
    Object.fromEntries(service.fields.map((f) => [f.key, statusMap[f.key]?.set ?? false]))
  )

  useEffect(() => {
    setLocalConnected(
      Object.fromEntries(service.fields.map((f) => [f.key, statusMap[f.key]?.set ?? false]))
    )
  }, [statusMap, service.fields])

  const overallStatus: OverallStatus = service.infoOnly
    ? 'info'
    : service.fields.every((f) => localConnected[f.key])
    ? 'connected'
    : service.fields.some((f) => localConnected[f.key])
    ? 'partial'
    : 'disconnected'

  async function save(field: EnvField) {
    const value = inputs[field.key]?.trim()
    if (!value) return
    setSaving((p) => ({ ...p, [field.key]: true }))
    setResult((p) => { const n = { ...p }; delete n[field.key]; return n })
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: field.key, value }),
      })
      if (res.ok) {
        setResult((p) => ({ ...p, [field.key]: 'saved' }))
        setLocalConnected((p) => ({ ...p, [field.key]: true }))
        setInputs((p) => ({ ...p, [field.key]: '' }))
        onStatusUpdate(field.key)
      } else {
        setResult((p) => ({ ...p, [field.key]: 'error' }))
      }
    } catch {
      setResult((p) => ({ ...p, [field.key]: 'error' }))
    } finally {
      setSaving((p) => ({ ...p, [field.key]: false }))
    }
  }

  return (
    <div className="bg-card border border-border rounded p-6">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <ServiceIcon id={service.id} />
          <span className="font-mono text-sm text-primary font-medium">{service.name}</span>
        </div>
        <OverallBadge status={overallStatus} />
      </div>
      <p className="font-mono text-xs text-muted mb-4 ml-8">{service.description}</p>

      {!service.infoOnly && service.fields.length > 0 && (
        <div className="space-y-3 mb-4">
          {service.fields.map((field) => {
            const isConnected = localConnected[field.key]
            const last4 = statusMap[field.key]?.last4
            const placeholder = isConnected && last4 ? `••••••••••••${last4}` : 'Enter value'
            return (
              <div key={field.key} className="flex items-center gap-3">
                <StatusDot connected={isConnected} />
                <span className="font-mono text-xs text-muted w-40 shrink-0">{field.key}</span>
                <input
                  type="password"
                  value={inputs[field.key] ?? ''}
                  onChange={(e) => setInputs((p) => ({ ...p, [field.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') save(field) }}
                  placeholder={placeholder}
                  className="flex-1 font-mono text-xs bg-bg border border-border rounded px-3 py-2 text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 min-w-0"
                />
                <button
                  onClick={() => save(field)}
                  disabled={saving[field.key] || !inputs[field.key]?.trim()}
                  className="font-mono text-xs border border-border text-muted px-3 py-2 rounded hover:border-border-light hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {saving[field.key] ? 'Saving...' : 'Save'}
                </button>
                {result[field.key] === 'saved' && (
                  <span className="font-mono text-xs text-emerald-700 dark:text-accent shrink-0">Saved</span>
                )}
                {result[field.key] === 'error' && (
                  <span className="font-mono text-xs text-red-600 dark:text-red-400 shrink-0">Error</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={`${!service.infoOnly && service.fields.length > 0 ? 'border-t border-border pt-3' : ''}`}>
        <a
          href={service.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-muted hover:text-primary transition-colors"
        >
          {service.infoOnly ? 'Open dashboard' : 'Get API key'} at {service.docsLabel} &rarr;
        </a>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const [statusMap, setStatusMap] = useState<StatusMap>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/integrations')
      .then((r) => r.json())
      .then((data) => {
        if (data.status) setStatusMap(data.status)
      })
      .finally(() => setLoading(false))
  }, [])

  function handleStatusUpdate(key: string) {
    setStatusMap((prev) => ({
      ...prev,
      [key]: { set: true, last4: prev[key]?.last4 ?? null },
    }))
  }

  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8">
        <h1 className="font-heading text-5xl text-primary mb-2">Integrations</h1>
        <p className="font-mono text-sm text-muted">Manage API keys and external service connections.</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded p-4 mb-4 max-w-3xl">
        <p className="font-mono text-xs text-amber-800 dark:text-amber-400">
          Keys are stored in the Supabase <span className="font-medium">api_keys</span> table and read at runtime.
          Railway environment variables remain as fallback — no outage risk if the table is empty.
          Run the SQL migration in <span className="font-medium">scripts/api-keys-migration.sql</span> once before using this page.
        </p>
      </div>

      <SeedFromEnvButton />

      {loading ? (
        <div className="font-mono text-sm text-muted animate-pulse">Loading status...</div>
      ) : (
        <div className="space-y-10 max-w-3xl">
          {CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <h2 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">
                {cat.label}
              </h2>
              <div className="space-y-4">
                {cat.services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    statusMap={statusMap}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
