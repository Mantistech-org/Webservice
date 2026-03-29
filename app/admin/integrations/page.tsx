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
  inputType?: 'password' | 'textarea'
}

interface Service {
  id: string
  name: string
  description: string
  fields: EnvField[]
  docsUrl: string
  docsLabel: string
  infoOnly?: boolean
  /** Service name to pass to GET /api/admin/integrations/test?service=... */
  testService?: string
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
        fields: [{ key: 'GOOGLE_SEARCH_CONSOLE_KEY', label: 'Service Account JSON', inputType: 'textarea' }],
        docsUrl: 'https://console.cloud.google.com/apis/credentials',
        docsLabel: 'console.cloud.google.com',
        testService: 'google_search_console',
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

type FieldResult =
  | { status: 'saved' }
  | { status: 'testing' }
  | { status: 'connected'; message?: string }
  | { status: 'warning'; message: string }
  | { status: 'error'; message: string }

const GSC_REQUIRED_FIELDS = ['type', 'project_id', 'private_key', 'client_email'] as const

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'ok'; siteCount: number; sites: string[]; detail: string }
  | { status: 'error'; error: string; detail?: string }

function ServiceTestPanel({ testService }: { testService: string }) {
  const [state, setState] = useState<TestState>({ status: 'idle' })

  async function runTest() {
    setState({ status: 'testing' })
    try {
      const res = await fetch(`/api/admin/integrations/test?service=${encodeURIComponent(testService)}`)
      const data = await res.json()
      if (data.ok) {
        setState({ status: 'ok', siteCount: data.siteCount ?? 0, sites: data.sites ?? [], detail: data.detail ?? '' })
      } else {
        setState({ status: 'error', error: data.error ?? 'Unknown error', detail: data.detail })
      }
    } catch (err) {
      setState({ status: 'error', error: err instanceof Error ? err.message : 'Network error' })
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={runTest}
          disabled={state.status === 'testing'}
          className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded hover:border-border-light hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state.status === 'testing' ? 'Testing...' : 'Test GSC Connection'}
        </button>
        {state.status === 'ok' && (
          <span className="font-mono text-xs text-emerald-700 dark:text-accent">
            Connected — {state.siteCount} site{state.siteCount !== 1 ? 's' : ''} accessible
          </span>
        )}
        {state.status === 'error' && (
          <span className="font-mono text-xs text-red-600 dark:text-red-400">{state.error}</span>
        )}
      </div>
      {state.status === 'ok' && state.sites.length > 0 && (
        <ul className="ml-1 space-y-0.5">
          {state.sites.map((s) => (
            <li key={s} className="font-mono text-xs text-muted">{s}</li>
          ))}
        </ul>
      )}
      {state.status === 'error' && state.detail && (
        <pre className="mt-1 font-mono text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
          {state.detail}
        </pre>
      )}
      {state.status === 'ok' && state.detail && (
        <details className="mt-1">
          <summary className="font-mono text-xs text-muted cursor-pointer hover:text-primary">Raw Google API response</summary>
          <pre className="mt-1 font-mono text-xs text-muted bg-bg border border-border rounded p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
            {state.detail}
          </pre>
        </details>
      )}
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
  const [result, setResult] = useState<Record<string, FieldResult>>({})
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

    // Client-side validation for JSON fields
    if (field.inputType === 'textarea') {
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(value)
      } catch {
        setResult((p) => ({ ...p, [field.key]: { status: 'error', message: 'Not valid JSON — paste the full service account JSON object' } }))
        return
      }
      const missing = GSC_REQUIRED_FIELDS.filter((k) => !parsed[k])
      if (missing.length > 0) {
        setResult((p) => ({ ...p, [field.key]: { status: 'error', message: `Missing required fields: ${missing.join(', ')}` } }))
        return
      }
    }

    setSaving((p) => ({ ...p, [field.key]: true }))
    setResult((p) => { const n = { ...p }; delete n[field.key]; return n })
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: field.key, value }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data?.error ?? `Save failed (${res.status})`
        console.error('[integrations] save error:', msg)
        setResult((p) => ({ ...p, [field.key]: { status: 'error', message: msg } }))
        return
      }

      setLocalConnected((p) => ({ ...p, [field.key]: true }))
      setInputs((p) => ({ ...p, [field.key]: '' }))
      onStatusUpdate(field.key)

      // Surface Supabase-disabled warning
      if (data?.warning) {
        setResult((p) => ({ ...p, [field.key]: { status: 'warning', message: data.warning } }))
        return
      }

      // For JSON fields, auto-test the connection immediately after saving
      if (field.inputType === 'textarea') {
        setResult((p) => ({ ...p, [field.key]: { status: 'testing' } }))
        try {
          const testRes = await fetch('/api/admin/integrations/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: field.key, value }),
          })
          const testData = await testRes.json()
          if (testData.ok) {
            const siteCount: number = testData.siteCount ?? 0
            setResult((p) => ({ ...p, [field.key]: { status: 'connected', message: `${siteCount} site${siteCount !== 1 ? 's' : ''} accessible` } as FieldResult }))
          } else {
            const msg = testData.error ?? 'Connection test failed'
            const detail = testData.detail ? ` — ${testData.detail}` : ''
            console.error('[integrations] connection test failed:', msg, testData.detail)
            setResult((p) => ({ ...p, [field.key]: { status: 'error', message: `Saved — but Google rejected the credentials: ${msg}${detail}` } }))
          }
        } catch (err) {
          console.error('[integrations] connection test error:', err)
          setResult((p) => ({ ...p, [field.key]: { status: 'error', message: 'Saved, but the connection test request failed (network error)' } }))
        }
      } else {
        setResult((p) => ({ ...p, [field.key]: { status: 'saved' } }))
      }
    } catch (err) {
      console.error('[integrations] save threw:', err)
      setResult((p) => ({ ...p, [field.key]: { status: 'error', message: 'Network error — could not reach server' } }))
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
            const isTextarea = field.inputType === 'textarea'
            const fieldResult = result[field.key]
            return (
              <div key={field.key} className={`flex gap-3 ${isTextarea ? 'items-start' : 'items-center'}`}>
                <StatusDot connected={isConnected} />
                <span className={`font-mono text-xs text-muted w-40 shrink-0 ${isTextarea ? 'pt-2' : ''}`}>{field.label}</span>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  {isTextarea ? (
                    <textarea
                      value={inputs[field.key] ?? ''}
                      onChange={(e) => setInputs((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={isConnected && last4 ? `Service account JSON already set (••••${last4})` : 'Paste service account JSON'}
                      rows={5}
                      spellCheck={false}
                      className="w-full font-mono text-xs bg-bg border border-border rounded px-3 py-2 text-primary placeholder:text-muted focus:outline-none focus:border-accent/50 resize-y"
                    />
                  ) : (
                    <input
                      type="password"
                      value={inputs[field.key] ?? ''}
                      onChange={(e) => setInputs((p) => ({ ...p, [field.key]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') save(field) }}
                      placeholder={placeholder}
                      className="w-full font-mono text-xs bg-bg border border-border rounded px-3 py-2 text-primary placeholder:text-muted focus:outline-none focus:border-accent/50"
                    />
                  )}
                  {fieldResult?.status === 'error' && (
                    <p className="font-mono text-xs text-red-600 dark:text-red-400 break-words">{fieldResult.message}</p>
                  )}
                  {fieldResult?.status === 'warning' && (
                    <p className="font-mono text-xs text-amber-700 dark:text-amber-400 break-words">{fieldResult.message}</p>
                  )}
                </div>
                <div className={`flex items-center gap-2 shrink-0 ${isTextarea ? 'pt-1' : ''}`}>
                  <button
                    onClick={() => save(field)}
                    disabled={saving[field.key] || !inputs[field.key]?.trim()}
                    className="font-mono text-xs border border-border text-muted px-3 py-2 rounded hover:border-border-light hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving[field.key] ? 'Saving...' : 'Save'}
                  </button>
                  {fieldResult?.status === 'saved' && (
                    <span className="font-mono text-xs text-emerald-700 dark:text-accent">Saved</span>
                  )}
                  {fieldResult?.status === 'testing' && (
                    <span className="font-mono text-xs text-muted animate-pulse">Testing...</span>
                  )}
                  {fieldResult?.status === 'connected' && (
                    <span className="font-mono text-xs text-emerald-700 dark:text-accent">
                      Connected{fieldResult.message ? ` — ${fieldResult.message}` : ''}
                    </span>
                  )}
                  {fieldResult?.status === 'warning' && (
                    <span className="font-mono text-xs text-amber-700 dark:text-amber-400">Saved (in-memory only)</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {service.testService && service.fields.some((f) => localConnected[f.key]) && (
        <ServiceTestPanel testService={service.testService} />
      )}

      <div className={`${!service.infoOnly && service.fields.length > 0 ? 'border-t border-border pt-3 mt-3' : ''}`}>
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
