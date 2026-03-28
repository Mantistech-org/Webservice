import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

type StepResult = {
  step: string
  status: 'ok' | 'skipped' | 'error'
  detail?: string
}

// POST /api/admin/pricing/migrate-v2
// One-time migration: adds stripe_setup_product_id + stripe_monthly_product_id
// to pricing_plans and removes the old stripe_product_id column.
// Safe to run multiple times — each step is idempotent.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'SUPABASE_DB_URL is not configured.' }, { status: 503 })
  }

  const results: StepResult[] = []

  // Helper: run one DDL/DML step and record the result
  async function step(name: string, sql: string) {
    try {
      await query(sql)
      results.push({ step: name, status: 'ok' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ step: name, status: 'error', detail: msg })
      throw err  // abort on first failure
    }
  }

  try {
    // 1 — Add new columns (IF NOT EXISTS makes this safe to re-run)
    await step(
      'Add stripe_setup_product_id',
      `ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS stripe_setup_product_id text`
    )

    await step(
      'Add stripe_monthly_product_id',
      `ALTER TABLE public.pricing_plans ADD COLUMN IF NOT EXISTS stripe_monthly_product_id text`
    )

    // 2 — Migrate existing data only if stripe_product_id column still exists
    const cols = await query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'pricing_plans'
        AND column_name  = 'stripe_product_id'
    `)

    const oldColExists = cols.length > 0

    if (oldColExists) {
      await step(
        'Migrate upfront-only plans → stripe_setup_product_id',
        `UPDATE public.pricing_plans
         SET stripe_setup_product_id = stripe_product_id
         WHERE stripe_product_id IS NOT NULL
           AND upfront > 0
           AND stripe_setup_product_id IS NULL`
      )

      await step(
        'Migrate monthly-only plans → stripe_monthly_product_id',
        `UPDATE public.pricing_plans
         SET stripe_monthly_product_id = stripe_product_id
         WHERE stripe_product_id IS NOT NULL
           AND monthly > 0
           AND upfront = 0
           AND stripe_monthly_product_id IS NULL`
      )

      await step(
        'Migrate plans with both prices → stripe_monthly_product_id',
        `UPDATE public.pricing_plans
         SET stripe_monthly_product_id = stripe_product_id
         WHERE stripe_product_id IS NOT NULL
           AND monthly > 0
           AND upfront > 0
           AND stripe_monthly_product_id IS NULL`
      )

      await step(
        'Drop old stripe_product_id column',
        `ALTER TABLE public.pricing_plans DROP COLUMN stripe_product_id`
      )
    } else {
      results.push({ step: 'Migrate existing data', status: 'skipped', detail: 'stripe_product_id column not found — already migrated' })
    }

    // 3 — Confirm final state
    const finalCols = await query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'pricing_plans'
        AND column_name IN ('stripe_product_id', 'stripe_setup_product_id', 'stripe_monthly_product_id')
      ORDER BY column_name
    `)
    const finalNames = finalCols.map((r) => r.column_name)

    return NextResponse.json({
      success: true,
      results,
      columns: {
        stripe_product_id: finalNames.includes('stripe_product_id') ? 'still exists (unexpected)' : 'removed',
        stripe_setup_product_id: finalNames.includes('stripe_setup_product_id') ? 'present' : 'missing',
        stripe_monthly_product_id: finalNames.includes('stripe_monthly_product_id') ? 'present' : 'missing',
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      results,
      error: err instanceof Error ? err.message : 'Migration failed.',
    }, { status: 500 })
  }
}
