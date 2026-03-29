import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled } from '@/lib/supabase'
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
      const { data } = await supabase
        .from('api_keys')
        .select('service, key_value')
        .eq('scope', 'admin')
      for (const row of data ?? []) {
        dbMap[row.service] = row.key_value
      }
    } catch {
      // Fall through to env vars only
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

  if (supabaseEnabled) {
    const { error } = await supabase
      .from('api_keys')
      .upsert(
        { scope: 'admin', service, key_value: trimmedValue },
        { onConflict: 'scope,service' }
      )
    if (error) {
      console.error('[integrations] Supabase upsert failed:', error)
      return NextResponse.json({ error: 'Failed to save key' }, { status: 500 })
    }
    invalidateApiKeyCache(service)
  }

  // Apply to current process immediately as well
  process.env[key] = trimmedValue

  return NextResponse.json({ ok: true })
}
