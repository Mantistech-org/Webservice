/**
 * Next.js Instrumentation — runs once when the server process starts,
 * before any requests are served. This is the earliest place to apply
 * DNS fixes and run startup diagnostics.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run in the Node.js runtime (not Edge / Vercel Edge Functions).
  // Using !== 'nodejs' (not just === 'edge') prevents Next.js from trying to
  // bundle node:dns / undici for any non-Node runtime at build time.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  // ── Import Node.js DNS module ──────────────────────────────────────────
  const dns = await import('dns')

  // ── Step 1: Apply all DNS fixes BEFORE any network call ───────────────

  // Fix A: IPv4-first ordering for dns.lookup() (affects undici/fetch indirectly)
  dns.setDefaultResultOrder('ipv4first')

  // Fix B: Set NODE_OPTIONS flag (belt-and-suspenders; already set via Dockerfile ENV
  // but setting it here ensures it's present even in non-Docker environments)
  if (!process.env.NODE_OPTIONS?.includes('dns-result-order')) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ''} --dns-result-order=ipv4first`.trim()
  }

  // Fix C: Configure dns.Resolver with public DNS servers.
  // IMPORTANT: dns.setServers() only affects dns.resolve*() calls, NOT dns.lookup()
  // and NOT fetch()/undici. DNS resolution is handled by resolv.conf patching in
  // docker-entrypoint.sh combined with the ipv4first fixes above.
  try {
    const existing = dns.getServers()
    // Public servers first so they're tried before Docker's 127.0.0.11
    const merged = Array.from(new Set(['8.8.8.8', '8.8.4.4', '1.1.1.1', ...existing]))
    dns.setServers(merged)
    console.log('[instrumentation] dns.setServers:', dns.getServers().join(', '))
  } catch (err) {
    console.error('[instrumentation] dns.setServers failed:', err instanceof Error ? err.message : err)
  }

  // ── Step 2: Startup diagnostics ───────────────────────────────────────
  // All output goes to stdout → visible in Railway logs

  const SUPABASE_HOST = (() => {
    try {
      const raw = process.env.SUPABASE_URL ?? ''
      return raw.trim() ? new URL(raw.trim()).hostname : null
    } catch {
      return null
    }
  })()

  console.log('[startup-diag] ========== DNS / Supabase Startup Diagnostic ==========')
  console.log('[startup-diag] NEXT_RUNTIME          :', process.env.NEXT_RUNTIME ?? '(not set — means nodejs)')
  console.log('[startup-diag] NODE_ENV              :', process.env.NODE_ENV)
  console.log('[startup-diag] RAILWAY_ENVIRONMENT   :', process.env.RAILWAY_ENVIRONMENT ?? '(not set)')
  console.log('[startup-diag] NODE_OPTIONS          :', process.env.NODE_OPTIONS ?? '(not set)')
  console.log('[startup-diag] DNS_DEFAULT_RESULT_ORDER:', process.env.DNS_DEFAULT_RESULT_ORDER ?? '(not set)')
  console.log('[startup-diag] dns.getServers()      :', dns.getServers().join(', '))

  // Inspect SUPABASE_URL for invisible characters that cause ENOTFOUND
  const rawUrl = process.env.SUPABASE_URL ?? ''
  const trimmedUrl = rawUrl.trim()
  console.log('[startup-diag] SUPABASE_URL raw length:', rawUrl.length)
  console.log('[startup-diag] SUPABASE_URL trimmed length:', trimmedUrl.length)
  if (rawUrl.length !== trimmedUrl.length) {
    console.warn('[startup-diag] ⚠ WARNING: SUPABASE_URL has leading/trailing whitespace — this causes ENOTFOUND!')
  }
  if (trimmedUrl) {
    const first3 = Array.from(trimmedUrl.slice(0, 3))
      .map((c) => `'${c}'[${c.charCodeAt(0)}]`)
      .join(' ')
    const last3 = Array.from(trimmedUrl.slice(-3))
      .map((c) => `'${c}'[${c.charCodeAt(0)}]`)
      .join(' ')
    console.log('[startup-diag] SUPABASE_URL first 3 chars:', first3)
    console.log('[startup-diag] SUPABASE_URL last  3 chars:', last3)
    console.log('[startup-diag] SUPABASE_URL value        :', trimmedUrl)
  }

  if (!SUPABASE_HOST) {
    console.error('[startup-diag] ✗ Cannot parse hostname from SUPABASE_URL — skipping DNS tests')
    console.log('[startup-diag] ===================================================')
    return
  }

  console.log('[startup-diag] SUPABASE_HOST         :', SUPABASE_HOST)

  // dns.lookup — uses system resolver (musl getaddrinfo / /etc/resolv.conf)
  await new Promise<void>((resolve) => {
    dns.lookup(SUPABASE_HOST, { family: 4 }, (err, address) => {
      if (err) {
        console.error('[startup-diag] dns.lookup(IPv4) FAILED:', err.message, `code=${err.code}`)
      } else {
        console.log('[startup-diag] dns.lookup(IPv4)  :', address)
      }
      resolve()
    })
  })

  await new Promise<void>((resolve) => {
    dns.lookup(SUPABASE_HOST, { family: 6 }, (err, address) => {
      if (err) {
        console.log('[startup-diag] dns.lookup(IPv6)  :', err.code ?? err.message, '(expected on IPv4-only networks)')
      } else {
        console.log('[startup-diag] dns.lookup(IPv6)  :', address)
      }
      resolve()
    })
  })

  // dns.resolve4 — uses Node.js dns.Resolver with our custom servers (not musl)
  try {
    const addrs = await dns.promises.resolve4(SUPABASE_HOST)
    console.log('[startup-diag] dns.resolve4(8.8.8.8):', addrs.join(', '))
  } catch (err) {
    console.error('[startup-diag] dns.resolve4 FAILED:', err instanceof Error ? err.message : err)
  }

  // Direct HTTP connectivity test with 5 s timeout
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`https://${SUPABASE_HOST}`, {
      signal: controller.signal,
      // Redirect to /rest/v1/ gives 401 but confirms TCP+TLS connectivity
    }).finally(() => clearTimeout(timer))
    console.log(`[startup-diag] fetch https://${SUPABASE_HOST}: HTTP ${res.status} ✓`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const code = (err as { cause?: { code?: string } })?.cause?.code
    console.error(`[startup-diag] fetch https://${SUPABASE_HOST} FAILED: ${msg}${code ? ` (${code})` : ''}`)
  }

  console.log('[startup-diag] ===================================================')
}
