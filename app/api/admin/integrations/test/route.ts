import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { JWT } from 'google-auth-library'
import { parseServiceAccountJson } from '@/lib/google-search-console'
import { ENV_FALLBACKS } from '@/lib/api-keys'

// Reverse map: env var name → service name
const ENV_TO_SERVICE = Object.fromEntries(
  Object.entries(ENV_FALLBACKS).map(([service, envVar]) => [envVar, service])
)

// POST /api/admin/integrations/test
// Body: { key: 'GOOGLE_SEARCH_CONSOLE_KEY', value: '<raw value>' }
// Returns: { ok: true } | { ok: false, error: string }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await req.json()
  const service = ENV_TO_SERVICE[key]

  if (service === 'google_search_console') {
    try {
      const sa = parseServiceAccountJson(value)

      const client = new JWT({
        email: sa.client_email,
        key: sa.private_key,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
      })

      const { token } = await client.getAccessToken()
      if (!token) {
        return NextResponse.json({ ok: false, error: 'Failed to obtain access token from Google' })
      }

      // Verify by listing GSC sites — lightweight call that confirms auth
      const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[integrations/test] GSC sites list failed:', res.status, text)
        return NextResponse.json({
          ok: false,
          error: `Google API returned ${res.status}: ${text}`,
        })
      }

      return NextResponse.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[integrations/test] GSC test failed:', err)
      return NextResponse.json({ ok: false, error: msg })
    }
  }

  return NextResponse.json({ error: `No test available for service: ${service ?? key}` }, { status: 400 })
}
