import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled, isConnectionError, DB_UNAVAILABLE_MSG, withDbRetry } from '@/lib/supabase'

// GET /api/admin/db-health
// Returns { ok, latency_ms, error? }
// Called by the admin layout to drive the DB status indicator.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseEnabled) {
    return NextResponse.json({
      ok: false,
      error: 'Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    })
  }

  const start = Date.now()

  try {
    // Lightweight query — just tests TCP + TLS + auth connectivity.
    // withDbRetry retries up to 3× on transient connection errors.
    const { error } = await withDbRetry(() =>
      supabase.from('api_keys').select('service').limit(1)
    )

    const latency_ms = Date.now() - start

    if (error) {
      if (isConnectionError(error)) {
        console.error('[db-health] connection error:', error.message)
        return NextResponse.json({ ok: false, error: DB_UNAVAILABLE_MSG, latency_ms })
      }
      // Table might not exist yet — that is still "connected"
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return NextResponse.json({ ok: true, latency_ms, warning: 'api_keys table not found — run the SQL migration.' })
      }
      return NextResponse.json({ ok: false, error: error.message, latency_ms })
    }

    return NextResponse.json({ ok: true, latency_ms })
  } catch (err) {
    const latency_ms = Date.now() - start
    if (isConnectionError(err)) {
      console.error('[db-health] connection error (thrown):', err)
      return NextResponse.json({ ok: false, error: DB_UNAVAILABLE_MSG, latency_ms })
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[db-health] unexpected error:', err)
    return NextResponse.json({ ok: false, error: msg, latency_ms })
  }
}
