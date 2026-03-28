import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import type { PricingPlan } from '@/app/api/admin/pricing/plans/route'

type Body = {
  amount_dollars: number
}

// POST /api/admin/pricing/plans/[id]/update-price
//
// Creates a new recurring monthly Stripe Price for an add-on plan, archives
// the old one, verifies the new price against Stripe, updates the DB, and
// revalidates the public pricing path. Full rollback on any failure.
export async function POST(
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
  const body = (await req.json()) as Body

  // 1. Validate request
  if (typeof body.amount_dollars !== 'number' || isNaN(body.amount_dollars) || body.amount_dollars <= 0) {
    return NextResponse.json({ error: 'amount_dollars must be a positive number.' }, { status: 422 })
  }

  const amountCents = Math.round(body.amount_dollars * 100)

  // 2. Load current plan from DB
  const rows = await query<PricingPlan>(
    `SELECT * FROM public.pricing_plans WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })
  }
  const plan = rows[0]

  // Error if monthly product or price not linked
  if (!plan.stripe_monthly_product_id) {
    return NextResponse.json(
      { error: 'No monthly product ID is linked to this plan. Link a Stripe product first.' },
      { status: 422 }
    )
  }
  if (!plan.stripe_monthly_price_id) {
    return NextResponse.json(
      { error: 'No monthly price ID is linked to this plan. Link a Stripe product first to auto-populate the price.' },
      { status: 422 }
    )
  }

  const oldPriceId = plan.stripe_monthly_price_id
  const oldAmount = plan.monthly
  const productId = plan.stripe_monthly_product_id

  const stripe = await getStripe()

  // 5. Create new Stripe recurring monthly price
  let newPriceId: string
  try {
    const newPrice = await stripe.prices.create({
      product: productId,
      currency: 'usd',
      unit_amount: amountCents,
      recurring: { interval: 'month' },
    })
    newPriceId = newPrice.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe price creation failed.'
    console.error('[plans/update-price] Failed to create new Stripe Price:', err)
    return NextResponse.json(
      { error: `Could not create new Stripe Price: ${msg}` },
      { status: 502 }
    )
  }

  // 6. Archive old Stripe price
  try {
    await stripe.prices.update(oldPriceId, { active: false })
  } catch (err) {
    // Archive new price since old one is still active and we never saved to DB
    console.error('[plans/update-price] Failed to archive old Stripe Price, rolling back new price:', err)
    try {
      await stripe.prices.update(newPriceId, { active: false })
    } catch (rollbackErr) {
      console.error('[plans/update-price] Failed to archive new price during rollback:', rollbackErr)
    }
    const msg = err instanceof Error ? err.message : 'Unknown error.'
    return NextResponse.json(
      { error: `Failed to archive old Stripe Price: ${msg}` },
      { status: 502 }
    )
  }

  // 7. Save new price_id and amount to DB
  const updatedRows = await query<PricingPlan>(
    `UPDATE public.pricing_plans
     SET stripe_monthly_price_id = $2, monthly = $3, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, newPriceId, body.amount_dollars]
  )
  const updatedPlan = updatedRows[0]

  // 8. Verify: fetch new price from Stripe and confirm amount
  let verifiedAmount: number
  try {
    const verifyPrice = await stripe.prices.retrieve(newPriceId)
    if (verifyPrice.unit_amount == null) {
      throw new Error('Stripe returned null unit_amount for new price.')
    }
    verifiedAmount = verifyPrice.unit_amount / 100
  } catch (err) {
    // 9. Verification failed — full rollback
    console.error('[plans/update-price] Verification failed, rolling back:', err)
    try { await stripe.prices.update(newPriceId, { active: false }) } catch (e) {
      console.error('[plans/update-price] Rollback: failed to archive new price:', e)
    }
    try { await stripe.prices.update(oldPriceId, { active: true }) } catch (e) {
      console.error('[plans/update-price] Rollback: failed to reactivate old price:', e)
    }
    // Restore old price_id and old amount to DB
    await query(
      `UPDATE public.pricing_plans
       SET stripe_monthly_price_id = $2, monthly = $3, updated_at = now()
       WHERE id = $1`,
      [id, oldPriceId, oldAmount]
    )
    const verifyMsg = err instanceof Error ? err.message : 'Verification failed.'
    return NextResponse.json(
      { error: `CRITICAL: Price verification failed. All changes rolled back. ${verifyMsg}` },
      { status: 500 }
    )
  }

  // 9b. Confirm amounts match exactly
  if (verifiedAmount !== body.amount_dollars) {
    console.error(`[plans/update-price] Amount mismatch — expected ${body.amount_dollars}, got ${verifiedAmount}. Rolling back.`)
    try { await stripe.prices.update(newPriceId, { active: false }) } catch (e) {
      console.error('[plans/update-price] Rollback: failed to archive new price:', e)
    }
    try { await stripe.prices.update(oldPriceId, { active: true }) } catch (e) {
      console.error('[plans/update-price] Rollback: failed to reactivate old price:', e)
    }
    await query(
      `UPDATE public.pricing_plans
       SET stripe_monthly_price_id = $2, monthly = $3, updated_at = now()
       WHERE id = $1`,
      [id, oldPriceId, oldAmount]
    )
    return NextResponse.json(
      {
        error: `CRITICAL: Amount mismatch after verification (expected $${body.amount_dollars}, Stripe returned $${verifiedAmount}). All changes rolled back.`,
      },
      { status: 500 }
    )
  }

  // 10. Revalidate public pricing
  revalidatePath('/')

  // 11. Return success
  return NextResponse.json({
    plan: updatedPlan,
    old_price_id: oldPriceId,
    old_amount: oldAmount,
    new_price_id: newPriceId,
    new_amount: verifiedAmount,
  })
}
