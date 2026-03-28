import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

export type PricingPromotion = {
  id: string
  stripe_coupon_id: string
  stripe_promo_code_id: string | null
  code: string
  label: string | null
  discount_type: 'percent' | 'amount'
  discount_value: number
  applies_to: string
  duration_months: number | null
  max_redemptions: number | null
  times_redeemed: number
  expires_at: string | null
  active: boolean
  display_on_pricing: boolean
  created_at: string
  updated_at: string
}

// GET /api/admin/pricing/coupons — list all promotions
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ coupons: [] })

  try {
    const coupons = await query<PricingPromotion>(
      `SELECT * FROM public.pricing_promotions ORDER BY created_at DESC`
    )
    return NextResponse.json({ coupons })
  } catch (err) {
    console.error('[pricing/coupons] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load discount codes.' }, { status: 500 })
  }
}

type CreateCouponBody = {
  code: string
  label?: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  applies_to?: string
  duration_months?: number
  max_redemptions?: number
  expires_at?: string
  display_on_pricing?: boolean
}

// POST /api/admin/pricing/coupons — create Stripe coupon + promo code, save to DB
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = (await req.json()) as CreateCouponBody

  if (!body.code?.trim()) {
    return NextResponse.json({ error: 'code is required.' }, { status: 400 })
  }
  if (!['percent', 'amount'].includes(body.discount_type)) {
    return NextResponse.json({ error: 'discount_type must be percent or amount.' }, { status: 400 })
  }
  if (!body.discount_value || body.discount_value <= 0) {
    return NextResponse.json({ error: 'discount_value must be a positive number.' }, { status: 400 })
  }
  if (body.discount_type === 'percent' && body.discount_value > 100) {
    return NextResponse.json({ error: 'Percentage cannot exceed 100.' }, { status: 400 })
  }

  const code = body.code.trim().toUpperCase()

  try {
    const stripe = await getStripe()

    // Build Stripe coupon params
    let stripeDuration: 'once' | 'repeating' | 'forever' = 'forever'
    let durationInMonths: number | undefined
    if (body.duration_months && body.duration_months > 0) {
      stripeDuration = 'repeating'
      durationInMonths = body.duration_months
    }

    const couponParams: Stripe.CouponCreateParams = {
      name: body.label?.trim() || code,
      duration: stripeDuration,
    }
    if (stripeDuration === 'repeating') {
      couponParams.duration_in_months = durationInMonths
    }
    if (body.discount_type === 'percent') {
      couponParams.percent_off = body.discount_value
    } else {
      couponParams.amount_off = Math.round(body.discount_value * 100)
      couponParams.currency = 'usd'
    }
    if (body.max_redemptions) {
      couponParams.max_redemptions = body.max_redemptions
    }
    if (body.expires_at) {
      couponParams.redeem_by = Math.floor(new Date(body.expires_at).getTime() / 1000)
    }

    const stripeCoupon = await stripe.coupons.create(couponParams)

    // Create a Stripe Promotion Code so customers can enter the code at checkout
    const promoCodeParams: Stripe.PromotionCodeCreateParams = {
      coupon: stripeCoupon.id,
      code,
    }
    if (body.max_redemptions) {
      promoCodeParams.max_redemptions = body.max_redemptions
    }
    if (body.expires_at) {
      promoCodeParams.expires_at = Math.floor(new Date(body.expires_at).getTime() / 1000)
    }

    const promoCode = await stripe.promotionCodes.create(promoCodeParams)

    // Persist to DB
    const rows = await query<PricingPromotion>(
      `INSERT INTO public.pricing_promotions
         (stripe_coupon_id, stripe_promo_code_id, code, label, discount_type, discount_value,
          applies_to, duration_months, max_redemptions, expires_at, display_on_pricing)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        stripeCoupon.id,
        promoCode.id,
        code,
        body.label?.trim() || null,
        body.discount_type,
        body.discount_value,
        body.applies_to ?? 'all',
        body.duration_months ?? null,
        body.max_redemptions ?? null,
        body.expires_at ? new Date(body.expires_at).toISOString() : null,
        body.display_on_pricing ?? false,
      ]
    )

    return NextResponse.json({ coupon: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[pricing/coupons] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Failed to create discount code.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
