import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { JWT } from 'google-auth-library'
import { parseServiceAccountJson } from '@/lib/google-search-console'
import { ENV_FALLBACKS, getApiKey } from '@/lib/api-keys'
import { supabaseEnabled } from '@/lib/supabase'

// Reverse map: env var name → service name
const ENV_TO_SERVICE = Object.fromEntries(
  Object.entries(ENV_FALLBACKS).map(([service, envVar]) => [envVar, service])
)

type TestResult =
  | { ok: true; siteCount: number; sites: string[]; detail: string }
  | { ok: false; error: string; detail?: string }

async function testGscCredentials(privateKey: string, clientEmail: string): Promise<TestResult> {
  const client = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })

  let token: string | null | undefined
  try {
    const result = await client.getAccessToken()
    token = result.token
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `JWT / token exchange failed: ${msg}` }
  }

  if (!token) {
    return { ok: false, error: 'Google returned no access token (check service account permissions)' }
  }

  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
  })

  const rawBody = await res.text()

  if (!res.ok) {
    return {
      ok: false,
      error: `Google API returned HTTP ${res.status}`,
      detail: rawBody,
    }
  }

  let data: { siteEntry?: { siteUrl: string }[] }
  try {
    data = JSON.parse(rawBody)
  } catch {
    return { ok: false, error: 'Google returned non-JSON response', detail: rawBody }
  }

  const sites = (data.siteEntry ?? []).map((s) => s.siteUrl)
  return { ok: true, siteCount: sites.length, sites, detail: rawBody }
}

// GET /api/admin/integrations/test?service=google_search_console
// Tests the key currently stored in the database.
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = req.nextUrl.searchParams.get('service')

  if (service === 'google_search_console') {
    if (!supabaseEnabled) {
      return NextResponse.json({
        ok: false,
        error: 'Supabase is not configured — cannot read stored key. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      })
    }

    const raw = await getApiKey('google_search_console')
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'No key stored for google_search_console in the database.' })
    }

    let sa: ReturnType<typeof parseServiceAccountJson>
    try {
      sa = parseServiceAccountJson(raw)
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
    }

    try {
      const result = await testGscCredentials(sa.private_key, sa.client_email)
      console.log('[integrations/test] GSC GET test result:', result.ok ? `ok, ${(result as { siteCount: number }).siteCount} sites` : result.error)
      return NextResponse.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[integrations/test] GSC GET test threw:', err)
      return NextResponse.json({ ok: false, error: msg })
    }
  }

  return NextResponse.json({ error: `No test available for service: ${service ?? '(none)'}` }, { status: 400 })
}

// POST /api/admin/integrations/test
// Body: { key: 'GOOGLE_SEARCH_CONSOLE_KEY', value: '<raw JSON string>' }
// Tests credentials from the request body — used immediately after saving.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await req.json()
  const service = ENV_TO_SERVICE[key]

  if (service === 'google_search_console') {
    let sa: ReturnType<typeof parseServiceAccountJson>
    try {
      sa = parseServiceAccountJson(value)
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) })
    }

    try {
      const result = await testGscCredentials(sa.private_key, sa.client_email)
      console.log('[integrations/test] GSC POST test result:', result.ok ? `ok, ${(result as { siteCount: number }).siteCount} sites` : result.error)
      return NextResponse.json(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[integrations/test] GSC POST test threw:', err)
      return NextResponse.json({ ok: false, error: msg })
    }
  }

  return NextResponse.json({ error: `No test available for service: ${service ?? key}` }, { status: 400 })
}
