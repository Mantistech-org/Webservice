import { query, pgEnabled } from '@/lib/pg'

export type PlanPromotion = {
  label: string
  discount_type: 'percent' | 'amount'
  discount_value: number
  duration_months: number | null
  discounted_monthly: number
}

export type PublicPlan = {
  plan_key: string
  name: string             // Short clean name: "Starter" | "Growth" | "Pro"
  upfront: number | null   // null = not linked; never display $0 when null
  monthly: number          // full/regular price — shown with strikethrough when promotion is active
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
  features: unknown    // jsonb — pg returns this already parsed
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

// Map a full Stripe product name to the canonical intake plan_key.
// isDiscount variants produce '_discount' suffixes (used for internal pairing only —
// discount cards are never returned as standalone public plans).
function planMeta(planName: string): { plan_key: string; pages: number; features: string[] } {
  const n = planName.toLowerCase()
  const isDiscount = n.includes('discount')

  if (n.includes('pro')) {
    return { plan_key: isDiscount ? 'pro_discount' : 'pro', pages: 9, features: [] }
  }
  if (n.includes('growth')) {
    return { plan_key: isDiscount ? 'mid_discount' : 'mid', pages: 6, features: [] }
  }
  return { plan_key: isDiscount ? 'starter_discount' : 'starter', pages: 4, features: [] }
}

// Return the base tier string ('starter' | 'mid' | 'pro') for pairing
// base cards with their discount counterparts.
function tierKey(planName: string): 'starter' | 'mid' | 'pro' {
  const n = planName.toLowerCase()
  if (n.includes('pro')) return 'pro'
  if (n.includes('growth')) return 'mid'
  return 'starter'
}

// Short clean display name shown on the public pricing card.
function shortPlanName(planName: string): string {
  const n = planName.toLowerCase()
  if (n.includes('pro')) return 'Pro'
  if (n.includes('growth')) return 'Growth'
  return 'Starter'
}

/**
 * Returns exactly 3 public pricing plans (Starter, Growth, Pro) with any
 * active promotions attached. Discount variants are never returned as
 * standalone cards — if a discount card exists for a base plan, it is folded
 * in as a promotion (full price strikethrough + discounted price).
 *
 * Primary source: plan_cards rows confirmed via the admin Pricing Manager.
 * Fallback: pricing_plans populated by the Stripe sync.
 * If the database is unavailable, returns [].
 */
export async function getPublicPricing(): Promise<PublicPlan[]> {
  if (!pgEnabled) return []

  try {
    const [cardRows, promoRows] = await Promise.all([
      // Fetch ALL confirmed plan_cards (base + discount) so we can pair them
      query<PlanCardRow>(
        `SELECT id, plan_name, is_discount, setup_price_id, setup_amount,
                monthly_price_id, monthly_amount, visible, sort_order
         FROM public.plan_cards
         WHERE monthly_amount IS NOT NULL
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

    const baseCards    = cardRows.filter(r => !r.is_discount)
    const discountCards = cardRows.filter(r =>  r.is_discount)

    // ── Primary path: plan_cards has at least one confirmed base-plan price ───
    if (baseCards.length > 0) {
      return baseCards.map((row) => {
        const tier = tierKey(row.plan_name)
        const { plan_key, pages, features } = planMeta(row.plan_name)

        // Find the matching discount card for this tier
        const discountCard = discountCards.find(d => tierKey(d.plan_name) === tier)

        // Check pricing_promotions first (admin-created display promotions)
        const promo = promoRows.find(
          pr => pr.applies_to === 'all' || pr.applies_to === plan_key
        )

        let promotion: PlanPromotion | null = null

        if (promo) {
          const raw = Number(promo.discount_value)
          const monthly = Number(row.monthly_amount)
          const discounted =
            promo.discount_type === 'percent'
              ? Math.round(monthly * (1 - raw / 100) * 100) / 100
              : Math.max(0, monthly - raw)
          promotion = {
            label: promo.label ?? 'Special Pricing',
            discount_type: promo.discount_type,
            discount_value: raw,
            duration_months: promo.duration_months,
            discounted_monthly: discounted,
          }
        } else if (
          discountCard?.monthly_amount != null &&
          Number(discountCard.monthly_amount) < Number(row.monthly_amount)
        ) {
          // Discount card has a lower confirmed price — show launch discount
          promotion = {
            label: 'Launch Discount',
            discount_type: 'amount',
            discount_value: Number(row.monthly_amount) - Number(discountCard.monthly_amount),
            duration_months: null,
            discounted_monthly: Number(discountCard.monthly_amount),
          }
        }

        return {
          plan_key,
          name: shortPlanName(row.plan_name),
          upfront: row.setup_amount != null && Number(row.setup_amount) > 0
            ? Number(row.setup_amount) : null,
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
    // Discount variants are excluded via SQL; monthly_original carries the full
    // price when a launch discount is active.
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

      const promo = promoRows.find(
        pr => pr.applies_to === 'all' || pr.applies_to === plan_key
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
        // Launch discount: monthly = discounted price, monthly_original = full price
        promotion = {
          label: 'Launch Discount',
          discount_type: 'amount',
          discount_value: Number(row.monthly_original) - Number(row.monthly),
          duration_months: null,
          discounted_monthly: Number(row.monthly),
        }
      }

      // When launch discount is active, show the full price with strikethrough
      const displayMonthly =
        row.monthly_original != null && Number(row.monthly_original) > Number(row.monthly)
          ? Number(row.monthly_original)
          : Number(row.monthly)

      return {
        plan_key,
        name: shortPlanName(row.name),
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
