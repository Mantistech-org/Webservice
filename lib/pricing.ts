import { query, pgEnabled } from '@/lib/pg'
import { PLANS } from '@/types'

export type PlanPromotion = {
  label: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  duration_months: number | null
  discounted_monthly: number
}

export type PublicPlan = {
  plan_key: string
  name: string
  upfront: number | null            // null = not linked; never display $0 when null
  monthly: number                   // always a confirmed Stripe amount (plans without this are excluded)
  pages: number
  features: string[]
  visible: boolean
  promotion: PlanPromotion | null
}

type PlanCardRow = {
  id: string
  plan_name: string
  is_discount: boolean
  setup_price_id: string | null
  setup_amount: number | null
  monthly_price_id: string | null
  monthly_amount: number | null
  visible: boolean
  sort_order: number
}

type PricingPlanRow = {
  plan_key: string
  name: string
  upfront: number
  monthly: number
  monthly_original: number | null
  pages: number
  features: unknown          // jsonb — pg returns this already parsed
  visible: boolean
  sort_order: number
}

type PromoRow = {
  label: string | null
  discount_type: 'percent' | 'amount'
  discount_value: number
  applies_to: string
  duration_months: number | null
}

// Derive a stable plan_key and feature metadata from the plan name.
// Uses the same plan_key strings the intake form expects ('starter', 'mid', 'pro').
function planMeta(planName: string): { plan_key: string; pages: number; features: string[] } {
  const n = planName.toLowerCase()
  const isDiscount = n.includes('discount')

  if (n.includes('pro')) {
    return {
      plan_key: isDiscount ? 'pro_discount' : 'pro',
      pages: PLANS.pro.pages,
      features: [...PLANS.pro.features],
    }
  }
  if (n.includes('growth')) {
    return {
      plan_key: isDiscount ? 'mid_discount' : 'mid',
      pages: PLANS.mid.pages,
      features: [...PLANS.mid.features],
    }
  }
  return {
    plan_key: isDiscount ? 'starter_discount' : 'starter',
    pages: PLANS.starter.pages,
    features: [...PLANS.starter.features],
  }
}

/**
 * Returns plans with confirmed monthly prices for public display, with any
 * active display promotions attached. Called from the Pricing server component
 * and the public API route.
 *
 * Primary source: plan_cards rows where monthly_amount has been confirmed via
 * the Pricing Manager (non-null, > 0).
 *
 * Fallback: when plan_cards has no confirmed amounts (e.g. before the admin
 * has linked Stripe prices), reads from pricing_plans which is populated by
 * the Stripe sync. This ensures the public page always shows live pricing.
 *
 * CRITICAL: only plans with a real, non-zero monthly amount are returned.
 * No hardcoded amounts. If the database is unavailable, returns [].
 */
export async function getPublicPricing(): Promise<PublicPlan[]> {
  if (!pgEnabled) return []

  try {
    const [cardRows, promoRows] = await Promise.all([
      query<PlanCardRow>(
        `SELECT id, plan_name, is_discount, setup_price_id, setup_amount,
                monthly_price_id, monthly_amount, visible, sort_order
         FROM public.plan_cards
         WHERE visible = true
           AND monthly_amount IS NOT NULL
           AND monthly_amount > 0
         ORDER BY sort_order ASC`
      ),
      query<PromoRow>(
        `SELECT label, discount_type, discount_value, applies_to, duration_months
         FROM public.pricing_promotions
         WHERE active = true
           AND display_on_pricing = true
           AND (expires_at IS NULL OR expires_at > now())
         ORDER BY created_at DESC`
      ),
    ])

    // ── Primary path: plan_cards has confirmed prices ─────────────────────────
    if (cardRows.length > 0) {
      return cardRows.map((row) => {
        const { plan_key, pages, features } = planMeta(row.plan_name)

        const promo = promoRows.find(
          (pr) => pr.applies_to === 'all' || pr.applies_to === plan_key
        )

        let promotion: PlanPromotion | null = null
        if (promo && row.monthly_amount != null) {
          const raw = Number(promo.discount_value)
          const discounted =
            promo.discount_type === 'percent'
              ? Math.round(row.monthly_amount * (1 - raw / 100) * 100) / 100
              : Math.max(0, row.monthly_amount - raw)
          promotion = {
            label: promo.label ?? 'Special Pricing',
            discount_type: promo.discount_type,
            discount_value: raw,
            duration_months: promo.duration_months,
            discounted_monthly: discounted,
          }
        }

        return {
          plan_key,
          name: row.plan_name,
          upfront: row.setup_amount != null && row.setup_amount > 0 ? Number(row.setup_amount) : null,
          monthly: Number(row.monthly_amount),
          pages,
          features,
          visible: row.visible,
          promotion,
        }
      })
    }

    // ── Fallback path: plan_cards not yet confirmed — read from pricing_plans ─
    // pricing_plans is populated by the Stripe sync and always has live amounts.
    // Filter to core plan products only (starter / growth / pro) by name keyword.
    // Discount variants are excluded — pricing_plans pairs them into the base
    // plan row via monthly_original (regular price) and monthly (discount price).
    const fallbackRows = await query<PricingPlanRow>(
      `SELECT plan_key, name, upfront, monthly, monthly_original, pages, features, visible, sort_order
       FROM public.pricing_plans
       WHERE visible = true
         AND monthly > 0
         AND (
           name ILIKE '%starter%'
           OR name ILIKE '%growth%'
           OR name ILIKE '%pro%'
         )
         AND name NOT ILIKE '%discount%'
       ORDER BY sort_order ASC`
    )

    return fallbackRows.map((row) => {
      const { plan_key, pages, features } = planMeta(row.name)

      // Check pricing_promotions first (admin-created display promotions)
      const promo = promoRows.find(
        (pr) => pr.applies_to === 'all' || pr.applies_to === plan_key
      )

      let promotion: PlanPromotion | null = null

      if (promo) {
        const raw = Number(promo.discount_value)
        const baseMonthly = Number(row.monthly)
        const discounted =
          promo.discount_type === 'percent'
            ? Math.round(baseMonthly * (1 - raw / 100) * 100) / 100
            : Math.max(0, baseMonthly - raw)
        promotion = {
          label: promo.label ?? 'Special Pricing',
          discount_type: promo.discount_type,
          discount_value: raw,
          duration_months: promo.duration_months,
          discounted_monthly: discounted,
        }
      } else if (
        row.monthly_original != null &&
        Number(row.monthly_original) > Number(row.monthly)
      ) {
        // Launch discount active: monthly = discounted price, monthly_original = full price
        promotion = {
          label: 'Launch Discount',
          discount_type: 'amount',
          discount_value: Number(row.monthly_original) - Number(row.monthly),
          duration_months: null,
          discounted_monthly: Number(row.monthly),
        }
      }

      // When a launch discount is active, display the full price with strikethrough
      // and the discounted price prominently — same UX as plan_cards promotions.
      const displayMonthly =
        row.monthly_original != null && Number(row.monthly_original) > Number(row.monthly)
          ? Number(row.monthly_original)
          : Number(row.monthly)

      return {
        plan_key,
        name: row.name,
        upfront: row.upfront != null && Number(row.upfront) > 0 ? Number(row.upfront) : null,
        monthly: displayMonthly,
        pages,
        features,
        visible: row.visible,
        promotion,
      }
    })
  } catch (err) {
    console.error('[pricing] getPublicPricing failed:', err)
    return []
  }
}
