import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export type PricingPlan = {
  id: string
  plan_key: string
  name: string
  upfront: number
  monthly: number
  monthly_original: number | null             // regular/display price when a launch discount is active (shown with strikethrough)
  pages: number
  features: string[]
  stripe_setup_product_id: string | null      // one-time/setup Stripe product
  stripe_monthly_product_id: string | null    // recurring Stripe product (discount product when launch pricing is active)
  stripe_monthly_price_id: string | null
  stripe_upfront_price_id: string | null
  product_type: 'plan' | 'addon'
  visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// GET /api/admin/pricing/plans — list all plans from the DB
// Plans are populated by POST /api/admin/pricing/sync (Stripe sync), not auto-seeded.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ plans: [] })

  try {
    const plans = await query<PricingPlan>(
      `SELECT * FROM public.pricing_plans ORDER BY sort_order ASC, created_at ASC`
    )
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[pricing/plans] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load plans.' }, { status: 500 })
  }
}
