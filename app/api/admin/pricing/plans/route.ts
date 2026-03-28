import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { PLANS } from '@/types'

export type PricingPlan = {
  id: string
  plan_key: string
  name: string
  upfront: number
  monthly: number
  pages: number
  features: string[]
  stripe_product_id: string | null
  stripe_monthly_price_id: string | null
  stripe_upfront_price_id: string | null
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// GET /api/admin/pricing/plans — list all plans, seeding defaults if the table is empty
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ plans: [] })

  try {
    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM public.pricing_plans`
    )
    if (parseInt(countRows[0]?.count ?? '0', 10) === 0) {
      await seedDefaultPlans()
    }

    const plans = await query<PricingPlan>(
      `SELECT * FROM public.pricing_plans ORDER BY sort_order ASC`
    )
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[pricing/plans] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load plans.' }, { status: 500 })
  }
}

async function seedDefaultPlans() {
  const entries: Array<'starter' | 'mid' | 'pro'> = ['starter', 'mid', 'pro']
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i]
    const p = PLANS[key]
    await query(
      `INSERT INTO public.pricing_plans
         (plan_key, name, upfront, monthly, pages, features, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       ON CONFLICT (plan_key) DO NOTHING`,
      [key, p.name, p.upfront, p.monthly, p.pages, JSON.stringify(p.features), i + 1]
    )
  }
}
