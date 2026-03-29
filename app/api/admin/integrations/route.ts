import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled, isConnectionError, DB_UNAVAILABLE_MSG } from '@/lib/supabase'
import { ENV_FALLBACKS, invalidateApiKeyCache } from '@/lib/api-keys'
import { parseServiceAccountJson } from '@/lib/google-search-console'

// Reverse map: env var name → service name
const ENV_TO_SERVICE = Object.fromEntries(
  Object.entries(ENV_FALLBACKS).map(([service, envVar]) => [envVar, service])
)

const TRACKED_KEYS = [
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_SEARCH_CONSOLE_KEY',
  'CRON_SECRET',
]

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load all admin-scope keys from Supabase in one query
  const dbMap: Record<string, string> = {}
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('service, key_value')
        .eq('scope', 'admin')
      if (error) {
        console.error('[integrations] GET Supabase error:', error.message)
      }
      for (const row of data ?? []) {
        dbMap[row.service] = row.key_value
      }
    } catch (err) {
      // ENOTFOUND / connection errors are logged; fall through to env vars
      console.error('[integrations] GET Supabase threw:', err instanceof Error ? err.message : err)
    }
  }

  const status: Record<string, { set: boolean; last4: string | null }> = {}
  for (const envKey of TRACKED_KEYS) {
    const service = ENV_TO_SERVICE[envKey]
    const val = (service && dbMap[service]) || process.env[envKey] || ''
    status[envKey] = {
      set: !!val,
      last4: val && val.length >= 4 ? val.slice(-4) : null,
    }
  }

  return NextResponse.json({ status })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await req.json()

  if (!value || typeof value !== 'string' || !value.trim()) {
    return NextResponse.json({ error: 'Value is required' }, { status: 400 })
  }

  const service = ENV_TO_SERVICE[key]
  if (!service) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
  }

  const trimmedValue = value.trim()

  // Validate service-specific formats before storing
  if (service === 'google_search_console') {
    try {
      parseServiceAccountJson(trimmedValue)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid service account JSON'
      console.error('[integrations] GSC validation failed:', msg)
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  if (!supabaseEnabled) {
    // Supabase not configured — key will only live in this process and be lost on restart
    console.warn('[integrations] Supabase not configured — key saved in-process only (will not persist)')
    process.env[key] = trimmedValue
    return NextResponse.json({
      ok: true,
      warning: 'Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing). Key saved in memory only and will be lost on restart.',
    })
  }

  const { error: upsertError } = await supabase
    .from('api_keys')
    .upsert(
      { scope: 'admin', service, key_value: trimmedValue },
      { onConflict: 'scope,service' }
    )

  if (upsertError) {
    console.error('[integrations] Supabase upsert failed:', upsertError)

    // Connection / DNS failures get a specific actionable message
    if (isConnectionError(upsertError)) {
      return NextResponse.json(
        { error: `Cannot save — database is unreachable. ${DB_UNAVAILABLE_MSG}` },
        { status: 503 }
      )
    }

    // All other database errors: surface the actual Postgres message
    const detail = [upsertError.message, upsertError.details, upsertError.hint]
      .filter(Boolean)
      .join(' | ')
    return NextResponse.json(
      { error: `Database error: ${detail || JSON.stringify(upsertError)}` },
      { status: 500 }
    )
  }

  invalidateApiKeyCache(service)

  // Mirror into process env so in-flight requests pick it up immediately
  process.env[key] = trimmedValue

  return NextResponse.json({ ok: true })
}
