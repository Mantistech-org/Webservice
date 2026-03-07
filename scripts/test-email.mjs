// Resend email send smoke test
// Run with: node scripts/test-email.mjs

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ────────────────────────────────────────────────────────
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
  console.log('[test] Loaded .env.local')
} catch {
  console.log('[test] No .env.local found — using existing env vars')
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM     = process.env.EMAIL_FROM ?? 'onboarding@resend.dev'
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL ?? ''

console.log('[test] RESEND_API_KEY present:', !!RESEND_API_KEY)
console.log('[test] RESEND_API_KEY prefix: ', RESEND_API_KEY ? RESEND_API_KEY.slice(0, 14) + '...' : 'MISSING')
console.log('[test] EMAIL_FROM:            ', EMAIL_FROM)
console.log('[test] ADMIN_EMAIL:           ', ADMIN_EMAIL)

if (!RESEND_API_KEY) {
  console.error('[test] FATAL: RESEND_API_KEY is not set. Aborting.')
  process.exit(1)
}

async function testSend(label, to) {
  console.log(`\n[test] --- ${label} ---`)
  console.log(`[test] FROM: ${EMAIL_FROM}  TO: ${to}`)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: `Mantis Tech Email Test — ${label}`,
      html: `<p>Test email from Mantis Tech intake pipeline. Label: ${label}</p>`,
    }),
  })

  const body = await response.json()
  console.log(`[test] HTTP ${response.status}:`, JSON.stringify(body))

  if (response.ok && !body.statusCode) {
    console.log(`[test] ✓ SUCCESS — message id: ${body.id}`)
    return true
  } else {
    console.error(`[test] ✗ FAILED — ${body.name}: ${body.message}`)
    return false
  }
}

// Test 1: Send to the Resend-registered account email (should always work)
// This proves the API key and code path are functional.
// With onboarding@resend.dev, Resend only allows sending to this address.
const registeredEmail = 'thundereater57@gmail.com'
const t1 = await testSend('Registered account email (should succeed)', registeredEmail)

// Test 2: Send to support@mantistech.org (requires domain verification)
const t2 = await testSend('support@mantistech.org (requires verified domain)', 'support@mantistech.org')

// Test 3: Send to the configured ADMIN_EMAIL
if (ADMIN_EMAIL && ADMIN_EMAIL !== registeredEmail) {
  await testSend(`ADMIN_EMAIL (${ADMIN_EMAIL})`, ADMIN_EMAIL)
}

console.log('\n[test] ══════════════════════════════════════════════')
console.log('[test] SUMMARY')
console.log('[test] ══════════════════════════════════════════════')
if (t1 && !t2) {
  console.log('[test] The Resend API key is valid and working.')
  console.log('[test] The problem: onboarding@resend.dev is a SHARED TEST SENDER.')
  console.log('[test] It can only send to the Resend account email (thundereater57@gmail.com).')
  console.log('[test] ALL other recipients (clients, admin) are blocked with 403.')
  console.log('')
  console.log('[test] ── REQUIRED ACTION TO FIX THIS ──────────────────────')
  console.log('[test] 1. Log in to resend.com → go to Domains')
  console.log('[test] 2. Add and verify mantistech.io (or mantistech.org)')
  console.log('[test] 3. In Railway environment variables, change:')
  console.log('[test]      EMAIL_FROM=noreply@mantistech.io')
  console.log('[test]    (or any address at your verified domain)')
  console.log('[test] 4. Redeploy — emails will then deliver to any address')
} else if (t1 && t2) {
  console.log('[test] ✓ ALL TESTS PASSED — emails sending to all recipients')
} else {
  console.log('[test] API key or configuration issue — check errors above')
}
