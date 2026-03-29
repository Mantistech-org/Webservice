import { createClient } from '@supabase/supabase-js'
import dns from 'dns'

// ── DNS reliability fix ────────────────────────────────────────────────────
// node:20-alpine uses musl libc which, inside Docker, gets assigned the
// container's internal DNS resolver (typically 127.0.0.11). That resolver
// occasionally fails to resolve external hostnames (ENOTFOUND) when the
// Docker network is under load or when Railway's DNS is slow.
//
// Fix 1: prefer IPv4 results — Supabase hostnames have both A and AAAA records
// and the IPv6 paths can be unreachable inside Docker.
dns.setDefaultResultOrder('ipv4first')

// Fix 2: append public DNS servers as fallback alongside the Docker resolver.
// We READ the current servers (127.0.0.11 inside Docker) and ADD Google + CF
// public DNS so that if the internal resolver returns NXDOMAIN we still
// resolve correctly. Using setServers() replaces the list, so we preserve
// whatever Docker assigned first.
//
// This restores the DNS reliability fix that was previously applied via
// resolv.conf — that approach cannot work in containers because Docker
// overwrites /etc/resolv.conf at container start-up regardless of image
// contents.
if (process.env.NODE_ENV === 'production') {
  try {
    const existing = dns.getServers()
    const withFallback = Array.from(new Set([...existing, '8.8.8.8', '8.8.4.4', '1.1.1.1']))
    dns.setServers(withFallback)
  } catch {
    // Best-effort — never break startup
  }
}

// ── Environment variables ──────────────────────────────────────────────────
// .trim() guards against accidental trailing newlines or spaces that can
// appear when env vars are copy-pasted into Railway's dashboard and cause
// ENOTFOUND on the malformed hostname.
const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim()
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Supabase disabled, using local JSON fallback'
  )
} else {
  // Log full URL so misconfigured URLs (wrong project ID, extra chars) are visible in logs
  console.log('[supabase] connecting to:', supabaseUrl)
}

// Service role client bypasses Row Level Security and has full table access.
// Never expose this client to the browser.
// Use placeholder values when env vars are missing so the module loads without throwing.
// supabaseEnabled guards all actual usage.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const supabaseEnabled = !!(supabaseUrl && supabaseServiceKey)

// ── Connection error utilities ─────────────────────────────────────────────

/**
 * Returns true when the error is a network/DNS failure rather than an
 * application-level error. Covers:
 *  - ENOTFOUND  — hostname not resolvable (Supabase project paused or wrong URL)
 *  - ECONNREFUSED — port not open
 *  - ETIMEDOUT  — network timeout
 *  - "fetch failed" — Node fetch wrapper around the above
 */
export function isConnectionError(err: unknown): boolean {
  if (!err) return false

  const asObj = err as {
    message?: unknown
    code?: unknown
    cause?: { code?: unknown }
  }

  const msg = typeof asObj.message === 'string' ? asObj.message : ''
  const causeCode = asObj.cause?.code

  const CONNECTION_CODES = ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN']

  if (typeof causeCode === 'string' && CONNECTION_CODES.includes(causeCode)) return true
  if (typeof asObj.code === 'string' && CONNECTION_CODES.includes(asObj.code)) return true

  return (
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('EAI_AGAIN') ||
    msg.toLowerCase().includes('fetch failed') ||
    msg.toLowerCase().includes('network socket disconnected') ||
    msg.toLowerCase().includes('failed to fetch')
  )
}

/**
 * Standard user-facing message when the database cannot be reached.
 * Used consistently across all API routes.
 */
export const DB_UNAVAILABLE_MSG =
  'Database unavailable — your Supabase project may be paused or the URL is misconfigured. ' +
  'Check the project status at supabase.com/dashboard.'
