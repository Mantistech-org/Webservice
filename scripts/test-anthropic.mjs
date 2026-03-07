// Quick Anthropic API key smoke test
// Run with: node scripts/test-anthropic.mjs

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually
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
  console.log('[test] No .env.local found, relying on existing env vars')
}

const apiKey = process.env.ANTHROPIC_API_KEY
console.log('[test] ANTHROPIC_API_KEY present:', !!apiKey)
console.log('[test] ANTHROPIC_API_KEY prefix:', apiKey ? apiKey.slice(0, 10) + '...' : 'MISSING')

if (!apiKey) {
  console.error('[test] FATAL: ANTHROPIC_API_KEY is not set')
  process.exit(1)
}

console.log('[test] Sending test request to Anthropic API...')
const startMs = Date.now()

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 64,
    messages: [{ role: 'user', content: 'Reply with exactly: API_OK' }],
  }),
})

const elapsed = Date.now() - startMs
console.log(`[test] HTTP status: ${response.status} (${elapsed}ms)`)

const data = await response.json()

if (!response.ok) {
  console.error('[test] API ERROR:', JSON.stringify(data, null, 2))
  process.exit(1)
}

const text = data.content?.[0]?.text ?? '(no text)'
console.log('[test] Response text:', text)
console.log('[test] stop_reason:', data.stop_reason)
console.log('[test] Model used:', data.model)
console.log('[test] SUCCESS — Anthropic API is working correctly')
