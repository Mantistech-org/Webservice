// Resend email test — CommonJS, no external deps, raw HTTPS
// Run with: node scripts/test-email.js
'use strict'

const fs   = require('fs')
const path = require('path')
const https = require('https')

// ── Load .env.local ────────────────────────────────────────────────────────
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
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
} catch (e) {
  console.log('[test] No .env.local found — using existing env vars')
}

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM     = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || ''

console.log('[test] RESEND_API_KEY present:', !!RESEND_API_KEY)
console.log('[test] RESEND_API_KEY prefix: ', RESEND_API_KEY ? RESEND_API_KEY.slice(0, 14) + '...' : 'MISSING')
console.log('[test] EMAIL_FROM:            ', EMAIL_FROM)
console.log('[test] ADMIN_EMAIL:           ', ADMIN_EMAIL)

if (!RESEND_API_KEY) {
  console.error('[test] FATAL: RESEND_API_KEY not set. Exiting.')
  process.exit(1)
}

// ── Raw HTTPS POST to Resend ───────────────────────────────────────────────
function resendPost(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const TO = ADMIN_EMAIL || 'support@mantistech.org'

  console.log('\n[test] EMAIL SEND ATTEMPTED')
  console.log('[test] Sending to:', TO)
  console.log('[test] Sending from:', EMAIL_FROM)

  let result
  try {
    result = await resendPost({
      from: EMAIL_FROM,
      to: [TO],
      subject: 'Mantis Tech — Intake Confirmation Test',
      html: '<div style="font-family:monospace;padding:24px"><h2 style="color:#00ff88">Test Email</h2><p>This is a test from the Mantis Tech intake pipeline.</p></div>',
    })
  } catch (err) {
    console.error('[test] HTTPS request error:', err.message)
    process.exit(1)
  }

  console.log('[test] EMAIL SEND COMPLETE')
  console.log('[test] HTTP status:', result.status)
  console.log('[test] Full Resend response:', JSON.stringify(result.body, null, 2))

  if (result.status === 200 || result.status === 201) {
    console.log('\n[test] SUCCESS — email sent, id:', result.body.id)
  } else {
    console.error('\n[test] FAILED')
    console.error('[test] Error name:   ', result.body.name)
    console.error('[test] Error message:', result.body.message)

    if (result.status === 403) {
      console.error('\n[test] DOMAIN NOT VERIFIED or RESTRICTED SENDER')
      console.error('[test] EMAIL_FROM must use a domain you have verified in Resend.')
      console.error('[test] Steps: resend.com/domains → Add Domain → verify DNS records')
      console.error('[test] Then update EMAIL_FROM in Railway to noreply@yourdomain.com')
    } else if (result.status === 401) {
      console.error('[test] INVALID API KEY — check RESEND_API_KEY in Railway')
    } else if (result.status === 422) {
      console.error('[test] INVALID PAYLOAD — check from/to addresses')
    }

    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[test] Unhandled error:', err)
  process.exit(1)
})
