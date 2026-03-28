import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { invalidateApiKeyCache } from '@/lib/api-keys'
import type { PricingPlan } from '@/app/api/admin/pricing/plans/route'

type PatchBody = {
  monthly?: number
  upfront?: number
  visible?: boolean
  stripe_product_id?: string
}

// PATCH /api/admin/pricing/plans/[id]
// Handles: visibility toggle, price updates (with Stripe sync), product ID linking
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = params
  const body = (await req.json()) as PatchBody

  const rows = await query<PricingPlan>(
    `SELECT * FROM public.pricing_plans WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  }
  const plan = rows[0]

  // Effective product ID — use new value from body if provided, otherwise existing
  const effectiveProductId =
    typeof body.stripe_product_id === 'string'
      ? body.stripe_product_id.trim() || null
      : plan.stripe_product_id

  const updates: Record<string, unknown> = {}

  // Visibility toggle — no Stripe interaction needed
  if (typeof body.visible === 'boolean') {
    updates.visible = body.visible
  }

  // Stripe product ID link — just a DB update
  if (
    typeof body.stripe_product_id === 'string' &&
    body.stripe_product_id.trim() !== (plan.stripe_product_id ?? '')
  ) {
    updates.stripe_product_id = effectiveProductId
  }

  // Monthly price change
  if (typeof body.monthly === 'number' && body.monthly !== plan.monthly) {
    if (effectiveProductId) {
      try {
        const stripe = await getStripe()

        const newPrice = await stripe.prices.create({
          product: effectiveProductId,
          currency: 'usd',
          unit_amount: body.monthly * 100,
          recurring: { interval: 'month' },
          nickname: `${plan.name} Monthly (updated ${new Date().toISOString().slice(0, 10)})`,
        })

        // Archive old price (non-fatal if it fails)
        if (plan.stripe_monthly_price_id) {
          await stripe.prices
            .update(plan.stripe_monthly_price_id, { active: false })
            .catch((e) =>
              console.warn('[pricing/plans] Could not archive old monthly price:', e)
            )
        }

        updates.stripe_monthly_price_id = newPrice.id

        // Keep api_keys table in sync so the checkout flow picks up the new ID
        if (supabaseEnabled) {
          await supabase.from('api_keys').upsert(
            {
              scope: 'admin',
              service: `stripe_price_${plan.plan_key}_monthly`,
              key_value: newPrice.id,
            },
            { onConflict: 'scope,service' }
          )
          invalidateApiKeyCache(`stripe_price_${plan.plan_key}_monthly`)
        }
      } catch (err) {
        console.error('[pricing/plans] Stripe monthly price creation failed:', err)
        return NextResponse.json({ error: 'Failed to create new Stripe price.' }, { status: 500 })
      }
    }
    updates.monthly = body.monthly
  }

  // Upfront price change
  if (typeof body.upfront === 'number' && body.upfront !== plan.upfront) {
    if (effectiveProductId) {
      try {
        const stripe = await getStripe()

        const newPrice = await stripe.prices.create({
          product: effectiveProductId,
          currency: 'usd',
          unit_amount: body.upfront * 100,
          nickname: `${plan.name} Upfront (updated ${new Date().toISOString().slice(0, 10)})`,
        })

        if (plan.stripe_upfront_price_id) {
          await stripe.prices
            .update(plan.stripe_upfront_price_id, { active: false })
            .catch((e) =>
              console.warn('[pricing/plans] Could not archive old upfront price:', e)
            )
        }

        updates.stripe_upfront_price_id = newPrice.id

        if (supabaseEnabled) {
          await supabase.from('api_keys').upsert(
            {
              scope: 'admin',
              service: `stripe_price_${plan.plan_key}_upfront`,
              key_value: newPrice.id,
            },
            { onConflict: 'scope,service' }
          )
          invalidateApiKeyCache(`stripe_price_${plan.plan_key}_upfront`)
        }
      } catch (err) {
        console.error('[pricing/plans] Stripe upfront price creation failed:', err)
        return NextResponse.json({ error: 'Failed to create new Stripe price.' }, { status: 500 })
      }
    }
    updates.upfront = body.upfront
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ plan: rows[0] })
  }

  // Build parameterized SET clause from safe, code-controlled keys only
  const allowed = new Set([
    'visible', 'monthly', 'upfront',
    'stripe_product_id', 'stripe_monthly_price_id', 'stripe_upfront_price_id',
  ])
  const setEntries = Object.entries(updates).filter(([k]) => allowed.has(k))
  const setClauses = setEntries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = setEntries.map(([, v]) => v)

  const updated = await query<PricingPlan>(
    `UPDATE public.pricing_plans
     SET ${setClauses}, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  )

  return NextResponse.json({ plan: updated[0] })
}
