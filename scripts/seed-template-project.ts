/**
 * One-time seed: insert the permanent template project row.
 * Safe to re-run — uses ON CONFLICT (id) DO NOTHING.
 *
 * Run with:
 *   npx ts-node --skip-project --transpile-only scripts/seed-template-project.ts
 */

import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

// ── Load .env.local ────────────────────────────────────────────────────────────
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
  console.log('[seed] Loaded .env.local')
} catch {
  console.log('[seed] No .env.local found, relying on existing env vars')
}

// ── Connect ────────────────────────────────────────────────────────────────────
const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error('[seed] FATAL: SUPABASE_DB_URL is not set')
  process.exit(1)
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })

// ── Template project data ──────────────────────────────────────────────────────
const TEMPLATE_ID           = 'template-project-id'
const TEMPLATE_CLIENT_TOKEN = 'template-preview'
const TEMPLATE_ADMIN_TOKEN  = 'template-admin-token'

const templateProject = {
  id:           TEMPLATE_ID,
  clientToken:  TEMPLATE_CLIENT_TOKEN,
  adminToken:   TEMPLATE_ADMIN_TOKEN,
  businessName: 'Your Business Name',
  ownerName:    'Template User',
  email:        'template@mantistech.org',
  plan:         'platform-plus',
  status:       'active',
  createdAt:    '2024-01-01T00:00:00.000Z',
  updatedAt:    new Date().toISOString(),
  addons:       [],
  changeRequests: [],
  notifications:  [],
  upsellClicks:   [],
  stripeAddonSubscriptions: [],
  customAddons:   [],
}

// ── Seed ───────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect()
  try {
    const result = await client.query(
      `INSERT INTO public.projects (id, admin_token, client_token, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        TEMPLATE_ID,
        TEMPLATE_ADMIN_TOKEN,
        TEMPLATE_CLIENT_TOKEN,
        JSON.stringify(templateProject),
        templateProject.createdAt,
        templateProject.updatedAt,
      ]
    )
    if (result.rowCount === 0) {
      console.log('[seed] Template project already exists — skipped')
    } else {
      console.log('[seed] Template project inserted successfully')
    }
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((err) => {
  console.error('[seed] Error:', err)
  process.exit(1)
})
