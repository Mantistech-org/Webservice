import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import type { PlanCard } from '@/app/api/admin/pricing/plan-cards/route'
import type { PricingPlan } from '@/app/api/admin/pricing/plans/route'

type MismatchItem = {
  name: string
  field: string
  price_id: string
  supabase_amount: number
  stripe_amount: number | null
}

// GET /api/admin/pricing/verify
// Checks all linked prices in plan_cards and pricing_plans against Stripe.
// Returns { ok: boolean, mismatches: MismatchItem[] }
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const stripe = await getStripe()
  const mismatches: MismatchItem[] = []

  // Load all plan_cards where at least one price is linked
  const cards = await query<PlanCard>(
    `SELECT * FROM public.plan_cards WHERE setup_price_id IS NOT NULL OR monthly_price_id IS NOT NULL`
  )

  // Load all pricing_plans that are add-ons with a monthly price linked
  const plans = await query<PricingPlan>(
    `SELECT * FROM public.pricing_plans WHERE product_type = 'addon' AND stripe_monthly_price_id IS NOT NULL`
  )

  // Check plan_cards setup prices
  for (const card of cards) {
    if (card.setup_price_id && card.setup_amount != null) {
      let stripeAmount: number | null = null
      try {
        const price = await stripe.prices.retrieve(card.setup_price_id)
        stripeAmount = price.unit_amount != null ? price.unit_amount / 100 : null
      } catch (err) {
        console.error(`[pricing/verify] Failed to fetch setup price ${card.setup_price_id}:`, err)
      }
      if (stripeAmount === null || stripeAmount !== card.setup_amount) {
        mismatches.push({
          name: card.plan_name,
          field: 'setup',
          price_id: card.setup_price_id,
          supabase_amount: card.setup_amount,
          stripe_amount: stripeAmount,
        })
      }
    }

    if (card.monthly_price_id && card.monthly_amount != null) {
      let stripeAmount: number | null = null
      try {
        const price = await stripe.prices.retrieve(card.monthly_price_id)
        stripeAmount = price.unit_amount != null ? price.unit_amount / 100 : null
      } catch (err) {
        console.error(`[pricing/verify] Failed to fetch monthly price ${card.monthly_price_id}:`, err)
      }
      if (stripeAmount === null || stripeAmount !== card.monthly_amount) {
        mismatches.push({
          name: card.plan_name,
          field: 'monthly',
          price_id: card.monthly_price_id,
          supabase_amount: card.monthly_amount,
          stripe_amount: stripeAmount,
        })
      }
    }
  }

  // Check pricing_plans monthly prices
  for (const plan of plans) {
    if (plan.stripe_monthly_price_id) {
      let stripeAmount: number | null = null
      try {
        const price = await stripe.prices.retrieve(plan.stripe_monthly_price_id)
        stripeAmount = price.unit_amount != null ? price.unit_amount / 100 : null
      } catch (err) {
        console.error(`[pricing/verify] Failed to fetch plan price ${plan.stripe_monthly_price_id}:`, err)
      }
      if (stripeAmount === null || stripeAmount !== plan.monthly) {
        mismatches.push({
          name: plan.name,
          field: 'monthly',
          price_id: plan.stripe_monthly_price_id,
          supabase_amount: plan.monthly,
          stripe_amount: stripeAmount,
        })
      }
    }
  }

  return NextResponse.json({
    ok: mismatches.length === 0,
    mismatches,
  })
}
