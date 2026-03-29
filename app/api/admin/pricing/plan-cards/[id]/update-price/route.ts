import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { logAudit } from '@/lib/audit-log'
import type { PlanCard } from '@/app/api/admin/pricing/plan-cards/route'

type Body = {
  field: 'setup' | 'monthly'
  amount_dollars: number
}

// POST /api/admin/pricing/plan-cards/[id]/update-price
//
// Creates a new Stripe Price at the given amount, archives the old one,
// verifies the new price against Stripe, updates the DB, and revalidates
// the public pricing path. Full rollback on any failure.
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
  if (body.field !== 'setup' && body.field !== 'monthly') {
    return NextResponse.json({ error: 'Invalid field — must be "setup" or "monthly".' }, { status: 422 })
  }
  if (typeof body.amount_dollars !== 'number' || isNaN(body.amount_dollars) || body.amount_dollars <= 0) {
    return NextResponse.json({ error: 'amount_dollars must be a positive number.' }, { status: 422 })
  }

  const amountCents = Math.round(body.amount_dollars * 100)

  // 2. Load current plan card from DB
  const rows = await query<PlanCard>(
    `SELECT * FROM public.plan_cards WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Plan card not found.' }, { status: 404 })
  }
  const card = rows[0]

  const col = body.field === 'setup'
    ? { id: 'setup_price_id', amount: 'setup_amount' }
    : { id: 'monthly_price_id', amount: 'monthly_amount' }

  const oldPriceId = body.field === 'setup' ? card.setup_price_id : card.monthly_price_id
  const oldAmount = body.field === 'setup' ? card.setup_amount : card.monthly_amount

  // Error if price not already linked
  if (!oldPriceId || oldAmount == null) {
    return NextResponse.json(
      { error: `No ${body.field} price is currently linked to this plan card. Link a Price ID first.` },
      { status: 422 }
    )
  }

  const stripe = await getStripe()

  // 4. Fetch old price from Stripe to get the product ID
  let productId: string
  try {
    const oldPrice = await stripe.prices.retrieve(oldPriceId)
    productId = oldPrice.product as string
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe lookup failed.'
    console.error('[update-price] Failed to retrieve old price from Stripe:', err)
    return NextResponse.json(
      { error: `Could not retrieve existing Stripe Price: ${msg}` },
      { status: 502 }
    )
  }

  // 5. Create new Stripe price
  let newPriceId: string
  try {
    const priceParams =
      body.field === 'setup'
        ? {
            product: productId,
            currency: 'usd',
            unit_amount: amountCents,
          }
        : {
            product: productId,
            currency: 'usd',
            unit_amount: amountCents,
            recurring: { interval: 'month' as const },
          }

    const newPrice = await stripe.prices.create(priceParams)
    newPriceId = newPrice.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe price creation failed.'
    console.error('[update-price] Failed to create new Stripe Price:', err)
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
    console.error('[update-price] Failed to archive old Stripe Price, rolling back new price:', err)
    try {
      await stripe.prices.update(newPriceId, { active: false })
    } catch (rollbackErr) {
      console.error('[update-price] Failed to archive new price during rollback:', rollbackErr)
    }
    const msg = err instanceof Error ? err.message : 'Unknown error.'
    return NextResponse.json(
      { error: `Failed to archive old Stripe Price: ${msg}` },
      { status: 502 }
    )
  }

  // 7. Save new price_id and amount to DB
  const updatedRows = await query<PlanCard>(
    `UPDATE public.plan_cards
     SET ${col.id} = $2, ${col.amount} = $3, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, newPriceId, body.amount_dollars]
  )
  const updatedCard = updatedRows[0]

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
    console.error('[update-price] Verification failed, rolling back:', err)
    try { await stripe.prices.update(newPriceId, { active: false }) } catch (e) {
      console.error('[update-price] Rollback: failed to archive new price:', e)
    }
    try { await stripe.prices.update(oldPriceId, { active: true }) } catch (e) {
      console.error('[update-price] Rollback: failed to reactivate old price:', e)
    }
    // Restore old price_id and old amount to DB
    await query(
      `UPDATE public.plan_cards
       SET ${col.id} = $2, ${col.amount} = $3, updated_at = now()
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
    console.error(`[update-price] Amount mismatch — expected ${body.amount_dollars}, got ${verifiedAmount}. Rolling back.`)
    try { await stripe.prices.update(newPriceId, { active: false }) } catch (e) {
      console.error('[update-price] Rollback: failed to archive new price:', e)
    }
    try { await stripe.prices.update(oldPriceId, { active: true }) } catch (e) {
      console.error('[update-price] Rollback: failed to reactivate old price:', e)
    }
    await query(
      `UPDATE public.plan_cards
       SET ${col.id} = $2, ${col.amount} = $3, updated_at = now()
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

  // 11. Audit log
  logAudit('plan_card_price_updated', 'plan_card', id, {
    field: body.field,
    old_price_id: oldPriceId,
    old_amount: parseFloat(String(oldAmount)),
    new_price_id: newPriceId,
    new_amount: verifiedAmount,
    plan_name: card.plan_name,
  })

  // 12. Return success
  return NextResponse.json({
    card: updatedCard,
    old_price_id: oldPriceId,
    old_amount: parseFloat(String(oldAmount)),
    new_price_id: newPriceId,
    new_amount: verifiedAmount,
  })
}
