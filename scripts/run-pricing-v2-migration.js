// scripts/run-pricing-v2-migration.js
// Adds stripe_setup_product_id + stripe_monthly_product_id to pricing_plans,
// migrates existing stripe_product_id data, then drops the old column.
//
// Usage:
//   node scripts/run-pricing-v2-migration.js
//
// Requires SUPABASE_DB_URL in the environment or in .env.local.

'use strict'

const fs = require('fs')
const path = require('path')
const { Client } = require(require.resolve('pg', { paths: [path.join(__dirname, '..')] }))

// ── Load .env.local if SUPABASE_DB_URL is not already set ─────────────────────
if (!process.env.SUPABASE_DB_URL) {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const connectionString = process.env.SUPABASE_DB_URL

if (!connectionString) {
  console.error('ERROR: SUPABASE_DB_URL is not set.')
  console.error('Set it in .env.local or pass it as an environment variable:')
  console.error('  SUPABASE_DB_URL="postgresql://..." node scripts/run-pricing-v2-migration.js')
  process.exit(1)
}

// ── Migration steps ────────────────────────────────────────────────────────────

const steps = [
  {
    name: 'Add stripe_setup_product_id column',
    sql: `ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS stripe_setup_product_id text`,
  },
  {
    name: 'Add stripe_monthly_product_id column',
    sql: `ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS stripe_monthly_product_id text`,
  },
  {
    name: 'Migrate: upfront-only plans → stripe_setup_product_id',
    sql: `
      UPDATE public.pricing_plans
      SET stripe_setup_product_id = stripe_product_id
      WHERE stripe_product_id IS NOT NULL
        AND upfront > 0
        AND stripe_setup_product_id IS NULL
    `,
  },
  {
    name: 'Migrate: monthly-only plans → stripe_monthly_product_id',
    sql: `
      UPDATE public.pricing_plans
      SET stripe_monthly_product_id = stripe_product_id
      WHERE stripe_product_id IS NOT NULL
        AND monthly > 0
        AND upfront = 0
        AND stripe_monthly_product_id IS NULL
    `,
  },
  {
    name: 'Migrate: plans with both → stripe_monthly_product_id',
    sql: `
      UPDATE public.pricing_plans
      SET stripe_monthly_product_id = stripe_product_id
      WHERE stripe_product_id IS NOT NULL
        AND monthly > 0
        AND upfront > 0
        AND stripe_monthly_product_id IS NULL
    `,
  },
  {
    name: 'Drop old stripe_product_id column',
    sql: `ALTER TABLE public.pricing_plans DROP COLUMN IF EXISTS stripe_product_id`,
  },
]

// ── Run ────────────────────────────────────────────────────────────────────────

async function run() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('Connected to database.\n')

  try {
    for (const step of steps) {
      process.stdout.write(`  ${step.name}... `)
      const result = await client.query(step.sql)
      const affected = result.rowCount ?? 0
      if (step.sql.trimStart().toUpperCase().startsWith('UPDATE') && affected > 0) {
        console.log(`done (${affected} row${affected === 1 ? '' : 's'} updated)`)
      } else {
        console.log('done')
      }
    }

    // Verify final column state
    const cols = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'pricing_plans'
        AND column_name IN (
          'stripe_product_id',
          'stripe_setup_product_id',
          'stripe_monthly_product_id'
        )
      ORDER BY column_name
    `)

    console.log('\nColumn state after migration:')
    const names = cols.rows.map((r) => r.column_name)
    console.log('  stripe_product_id:        ' + (names.includes('stripe_product_id') ? 'EXISTS (unexpected)' : 'removed'))
    console.log('  stripe_setup_product_id:  ' + (names.includes('stripe_setup_product_id') ? 'present' : 'MISSING (unexpected)'))
    console.log('  stripe_monthly_product_id:' + (names.includes('stripe_monthly_product_id') ? 'present' : 'MISSING (unexpected)'))

    const success =
      !names.includes('stripe_product_id') &&
      names.includes('stripe_setup_product_id') &&
      names.includes('stripe_monthly_product_id')

    console.log(success ? '\nMigration completed successfully.' : '\nMigration finished with unexpected column state — review above.')
    process.exit(success ? 0 : 1)
  } finally {
    await client.end()
  }
}

run().catch((err) => {
  console.error('\nMigration failed:', err.message)
  process.exit(1)
})
