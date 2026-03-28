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
  upfront: number
  monthly: number
  pages: number
  features: string[]
  visible: boolean
  promotion: PlanPromotion | null
}

type PlanRow = {
  id: string
  plan_key: string
  name: string
  upfront: number
  monthly: number
  pages: number
  features: string[]
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

const FALLBACK_PLAN_KEYS = ['starter', 'mid', 'pro'] as const

function fallbackPlans(): PublicPlan[] {
  return FALLBACK_PLAN_KEYS.map((key) => {
    const p = PLANS[key]
    return {
      plan_key: key,
      name: p.name,
      upfront: p.upfront,
      monthly: p.monthly,
      pages: p.pages,
      features: [...p.features],
      visible: true,
      promotion: null,
    }
  })
}

/**
 * Returns visible plans with any active display promotions attached.
 * Called directly from the Pricing server component and the public API route.
 * Falls back to hardcoded PLANS if the database is unavailable.
 */
export async function getPublicPricing(): Promise<PublicPlan[]> {
  if (!pgEnabled) return fallbackPlans()

  try {
    const [planRows, promoRows] = await Promise.all([
      query<PlanRow>(
        `SELECT id, plan_key, name, upfront, monthly, pages, features, visible, sort_order
         FROM public.pricing_plans
         WHERE visible = true
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

    return planRows.map((p) => {
      const promo = promoRows.find(
        (pr) => pr.applies_to === 'all' || pr.applies_to === p.plan_key
      )

      let promotion: PlanPromotion | null = null
      if (promo) {
        const raw = Number(promo.discount_value)
        const discounted =
          promo.discount_type === 'percent'
            ? Math.round(p.monthly * (1 - raw / 100) * 100) / 100
            : Math.max(0, p.monthly - raw)
        promotion = {
          label: promo.label ?? 'Special Pricing',
          discount_type: promo.discount_type,
          discount_value: raw,
          duration_months: promo.duration_months,
          discounted_monthly: discounted,
        }
      }

      return {
        plan_key: p.plan_key,
        name: p.name,
        upfront: p.upfront,
        monthly: p.monthly,
        pages: p.pages,
        features: Array.isArray(p.features) ? p.features : [],
        visible: p.visible,
        promotion,
      }
    })
  } catch (err) {
    console.error('[pricing] getPublicPricing failed, using fallback:', err)
    return fallbackPlans()
  }
}
