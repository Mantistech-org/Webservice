import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import type { PricingPromotion } from '@/app/api/admin/pricing/coupons/route'

type PatchBody = {
  active?: boolean
  display_on_pricing?: boolean
}

// PATCH /api/admin/pricing/coupons/[id]
// Handles: deactivate (archives Stripe coupon), toggle display_on_pricing
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

  const rows = await query<PricingPromotion>(
    `SELECT * FROM public.pricing_promotions WHERE id = $1`,
    [id]
  )
  if (!rows[0]) {
    return NextResponse.json({ error: 'Discount code not found.' }, { status: 404 })
  }
  const promo = rows[0]

  // Deactivating — delete the Stripe coupon so it can no longer be used
  if (typeof body.active === 'boolean' && !body.active && promo.active) {
    try {
      const stripe = await getStripe()
      await stripe.coupons.del(promo.stripe_coupon_id)
    } catch (err) {
      // Coupon may already be deleted in Stripe — log but continue
      console.warn('[pricing/coupons] Could not delete Stripe coupon:', err)
    }
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.active === 'boolean') updates.active = body.active
  if (typeof body.display_on_pricing === 'boolean') updates.display_on_pricing = body.display_on_pricing

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ coupon: promo })
  }

  const allowed = new Set(['active', 'display_on_pricing'])
  const setEntries = Object.entries(updates).filter(([k]) => allowed.has(k))
  const setClauses = setEntries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = setEntries.map(([, v]) => v)

  const updated = await query<PricingPromotion>(
    `UPDATE public.pricing_promotions
     SET ${setClauses}, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  )

  return NextResponse.json({ coupon: updated[0] })
}
