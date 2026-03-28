import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import type { PlanCard } from '@/app/api/admin/pricing/plan-cards/route'

type PatchBody =
  | { visible: boolean }
  | { field: 'setup' | 'monthly'; price_id: string }
  | { field: 'setup' | 'monthly'; unlink: true }

// PATCH /api/admin/pricing/plan-cards/[id]
//
// Three operations:
//   { visible: boolean }                              — toggle public visibility
//   { field: 'setup' | 'monthly', price_id: string } — link a Stripe Price ID (read-only Stripe call)
//   { field: 'setup' | 'monthly', unlink: true }      — remove a linked price
//
// For price linking: calls stripe.prices.retrieve() — the ONLY Stripe call allowed.
// Saves the confirmed unit_amount alongside the price ID. Never saves null, zero,
// or any amount that was not returned directly by Stripe.
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

  // Confirm the card exists
  const rows = await query<PlanCard>(
    `SELECT * FROM public.plan_cards WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Plan card not found.' }, { status: 404 })
  }

  // ── Visibility toggle ───────────────────────────────────────────────────────
  if ('visible' in body && typeof body.visible === 'boolean') {
    const updated = await query<PlanCard>(
      `UPDATE public.plan_cards SET visible = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, body.visible]
    )
    return NextResponse.json({ card: updated[0] })
  }

  // ── Unlink a price ──────────────────────────────────────────────────────────
  if ('field' in body && 'unlink' in body && body.unlink === true) {
    const col = body.field === 'setup'
      ? { id: 'setup_price_id', amount: 'setup_amount' }
      : { id: 'monthly_price_id', amount: 'monthly_amount' }

    const updated = await query<PlanCard>(
      `UPDATE public.plan_cards
       SET ${col.id} = NULL, ${col.amount} = NULL, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id]
    )
    return NextResponse.json({ card: updated[0] })
  }

  // ── Link a Stripe Price ID ──────────────────────────────────────────────────
  if ('field' in body && 'price_id' in body) {
    const priceId = (body.price_id as string).trim()

    if (!priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: 'Invalid Price ID — must start with "price_".' },
        { status: 422 }
      )
    }

    // Read-only Stripe call: retrieve the price to confirm its amount.
    // This is the ONLY Stripe interaction allowed in this route.
    let confirmedAmount: number
    try {
      const stripe = await getStripe()
      const price = await stripe.prices.retrieve(priceId)

      if (price.currency !== 'usd') {
        return NextResponse.json(
          { error: `Price ${priceId} is in ${price.currency.toUpperCase()}, not USD.` },
          { status: 422 }
        )
      }

      if (price.unit_amount == null || price.unit_amount <= 0) {
        return NextResponse.json(
          { error: `Price ${priceId} has no valid unit_amount (received ${price.unit_amount}).` },
          { status: 422 }
        )
      }

      // Convert cents → dollars with full decimal precision. Never round.
      confirmedAmount = price.unit_amount / 100
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Stripe lookup failed.'
      console.error('[plan-cards] Stripe price retrieve failed:', err)
      return NextResponse.json(
        { error: `Could not retrieve Price from Stripe: ${msg}` },
        { status: 502 }
      )
    }

    const col = body.field === 'setup'
      ? { id: 'setup_price_id', amount: 'setup_amount' }
      : { id: 'monthly_price_id', amount: 'monthly_amount' }

    const updated = await query<PlanCard>(
      `UPDATE public.plan_cards
       SET ${col.id} = $2, ${col.amount} = $3, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, priceId, confirmedAmount]
    )
    return NextResponse.json({ card: updated[0] })
  }

  return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
}
