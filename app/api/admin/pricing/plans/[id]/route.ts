import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { invalidateApiKeyCache } from '@/lib/api-keys'
import Stripe from 'stripe'
import type { PricingPlan } from '@/app/api/admin/pricing/plans/route'

type PatchBody = {
  visible?: boolean
  product_type?: 'plan' | 'addon'
  stripe_setup_product_id?: string | null
  stripe_monthly_product_id?: string | null
}

// Fetch all pages of a Stripe list resource
async function listAll<T>(
  fetcher: (startingAfter?: string) => Promise<Stripe.ApiList<T & { id: string }>>
): Promise<T[]> {
  const results: T[] = []
  let startingAfter: string | undefined
  while (true) {
    const page = await fetcher(startingAfter)
    results.push(...(page.data as T[]))
    if (!page.has_more || page.data.length === 0) break
    startingAfter = (page.data[page.data.length - 1] as { id: string }).id
  }
  return results
}

// PATCH /api/admin/pricing/plans/[id]
// Handles: visibility toggle, setup/monthly product linking (auto-fetches prices from Stripe)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = (await req.json()) as PatchBody

  const rows = await query<PricingPlan>(
    `SELECT * FROM public.pricing_plans WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  }
  const plan = rows[0]

  const updates: Record<string, unknown> = {}

  // product_type reclassification — no Stripe interaction needed
  if (body.product_type === 'plan' || body.product_type === 'addon') {
    updates.product_type = body.product_type
  }

  // Visibility toggle — no Stripe interaction needed
  if (typeof body.visible === 'boolean') {
    updates.visible = body.visible
  }

  // Setup product link — look up one-time price from Stripe
  if ('stripe_setup_product_id' in body) {
    const productId = typeof body.stripe_setup_product_id === 'string'
      ? body.stripe_setup_product_id.trim() || null
      : null

    if (productId === null) {
      // Unlinking: clear setup fields
      updates.stripe_setup_product_id = null
      updates.upfront = 0
      updates.stripe_upfront_price_id = null
    } else if (productId !== plan.stripe_setup_product_id) {
      // New product: fetch its one-time price from Stripe
      try {
        const stripe = await getStripe()
        const prices = await listAll<Stripe.Price>((startingAfter) =>
          stripe.prices.list({
            product: productId,
            active: true,
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          })
        )
        const oneTimePrices = prices
          .filter((p) => p.type === 'one_time' && p.currency === 'usd')
          .sort((a, b) => b.created - a.created)

        if (oneTimePrices.length === 0) {
          return NextResponse.json(
            { error: 'Selected setup product has no active one-time USD price.' },
            { status: 422 }
          )
        }

        const price = oneTimePrices[0]
        updates.stripe_setup_product_id = productId
        updates.upfront = Math.round((price.unit_amount ?? 0) / 100)
        updates.stripe_upfront_price_id = price.id

        if (supabaseEnabled) {
          await supabase.from('api_keys').upsert(
            { scope: 'admin', service: `stripe_price_${plan.plan_key}_upfront`, key_value: price.id },
            { onConflict: 'scope,service' }
          )
          invalidateApiKeyCache(`stripe_price_${plan.plan_key}_upfront`)
        }
      } catch (err) {
        console.error('[pricing/plans] Setup product lookup failed:', err)
        return NextResponse.json({ error: 'Failed to fetch setup product prices from Stripe.' }, { status: 500 })
      }
    }
  }

  // Monthly product link — look up recurring price from Stripe
  if ('stripe_monthly_product_id' in body) {
    const productId = typeof body.stripe_monthly_product_id === 'string'
      ? body.stripe_monthly_product_id.trim() || null
      : null

    if (productId === null) {
      // Unlinking: clear monthly fields
      updates.stripe_monthly_product_id = null
      updates.monthly = 0
      updates.stripe_monthly_price_id = null
    } else if (productId !== plan.stripe_monthly_product_id) {
      // New product: fetch its recurring price from Stripe
      try {
        const stripe = await getStripe()
        const prices = await listAll<Stripe.Price>((startingAfter) =>
          stripe.prices.list({
            product: productId,
            active: true,
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          })
        )
        const recurringPrices = prices
          .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month' && p.currency === 'usd')
          .sort((a, b) => b.created - a.created)

        if (recurringPrices.length === 0) {
          return NextResponse.json(
            { error: 'Selected monthly product has no active recurring monthly USD price.' },
            { status: 422 }
          )
        }

        const price = recurringPrices[0]
        updates.stripe_monthly_product_id = productId
        updates.monthly = Math.round((price.unit_amount ?? 0) / 100)
        updates.stripe_monthly_price_id = price.id

        if (supabaseEnabled) {
          await supabase.from('api_keys').upsert(
            { scope: 'admin', service: `stripe_price_${plan.plan_key}_monthly`, key_value: price.id },
            { onConflict: 'scope,service' }
          )
          invalidateApiKeyCache(`stripe_price_${plan.plan_key}_monthly`)
        }
      } catch (err) {
        console.error('[pricing/plans] Monthly product lookup failed:', err)
        return NextResponse.json({ error: 'Failed to fetch monthly product prices from Stripe.' }, { status: 500 })
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ plan: rows[0] })
  }

  // Build parameterized SET clause from safe, code-controlled keys only
  const allowed = new Set([
    'visible', 'monthly', 'upfront', 'product_type',
    'stripe_setup_product_id', 'stripe_monthly_product_id',
    'stripe_monthly_price_id', 'stripe_upfront_price_id',
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
