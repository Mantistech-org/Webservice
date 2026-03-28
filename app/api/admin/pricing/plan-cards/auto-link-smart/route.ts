import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'
import type { PlanCard } from '@/app/api/admin/pricing/plan-cards/route'

const PLACEHOLDER_THRESHOLD_CENTS = 100

// ── Fuzzy matching helpers ────────────────────────────────────────────────────

// Words that carry no plan-identity signal — strip before matching
const NOISE_WORDS = [
  'mantis', 'tech', 'monthly', 'setup', 'fee', 'plan', 'subscription',
  'billing', 'price', 'service', 'package', 'add', 'on', 'addon',
]

// Extract the core plan tier from any string
function coreTier(s: string): 'starter' | 'growth' | 'pro' | null {
  const n = s.toLowerCase()
  if (n.includes('pro'))     return 'pro'
  if (n.includes('growth'))  return 'growth'
  if (n.includes('starter')) return 'starter'
  return null
}

function isDiscountName(s: string): boolean {
  return /discount/i.test(s)
}

// Score a Stripe product name against a plan card name.
// Returns null if there is no tier match (hard requirement).
function matchScore(stripeName: string, cardName: string): number | null {
  const stripeDiscount = isDiscountName(stripeName)
  const cardDiscount   = isDiscountName(cardName)
  if (stripeDiscount !== cardDiscount) return null   // discount mismatch — skip

  const stripeTier = coreTier(stripeName)
  const cardTier   = coreTier(cardName)
  if (!stripeTier || !cardTier || stripeTier !== cardTier) return null

  // Base score: tier match
  let score = 100

  // Bonus: fewer noise-stripped words in stripe name → more specific match
  const stripeWords = stripeName.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/)
  const noiseCount  = stripeWords.filter((w) => NOISE_WORDS.includes(w)).length
  score -= noiseCount * 2

  return score
}

// ── Pagination ────────────────────────────────────────────────────────────────

async function listAll<T>(
  fetcher: (after?: string) => Promise<Stripe.ApiList<T & { id: string }>>
): Promise<T[]> {
  const items: T[] = []
  let after: string | undefined
  while (true) {
    const page = await fetcher(after)
    items.push(...(page.data as T[]))
    if (!page.has_more || page.data.length === 0) break
    after = (page.data[page.data.length - 1] as { id: string }).id
  }
  return items
}

function pickPrice(prices: Stripe.Price[], defaultId: string | null): Stripe.Price | null {
  if (prices.length === 0) return null
  if (defaultId) {
    const def = prices.find((p) => p.id === defaultId)
    if (def) return def
  }
  return [...prices].sort((a, b) => b.created - a.created)[0]
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    const stripe = await getStripe()

    // 1 — Load plan cards
    const cards = await query<PlanCard>(
      'SELECT * FROM public.plan_cards ORDER BY sort_order ASC'
    )
    if (cards.length === 0) {
      return NextResponse.json({ error: 'No plan cards found — run the migration first.' }, { status: 404 })
    }

    // 2 — Fetch all active Stripe products
    const products = await listAll<Stripe.Product>((after) =>
      stripe.products.list({ active: true, limit: 100, ...(after ? { starting_after: after } : {}) })
    )

    // 3 — Fetch prices for every product
    const pricesByProduct: Record<string, Stripe.Price[]> = {}
    for (const product of products) {
      const prices = await listAll<Stripe.Price>((after) =>
        stripe.prices.list({ product: product.id, active: true, limit: 100, ...(after ? { starting_after: after } : {}) })
      )
      pricesByProduct[product.id] = prices.filter((p) => p.currency === 'usd')
    }

    // 4 — Build the full Stripe catalogue (returned for transparency)
    const catalogue = products
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        id:   p.id,
        name: p.name,
        default_price: typeof p.default_price === 'string' ? p.default_price : (p.default_price as Stripe.Price | null)?.id ?? null,
        prices: pricesByProduct[p.id].map((pr) => ({
          id:             pr.id,
          type:           pr.type,
          interval:       pr.recurring?.interval ?? null,
          amount_cents:   pr.unit_amount,
          amount_dollars: pr.unit_amount != null ? pr.unit_amount / 100 : null,
        })),
      }))

    // 5 — For each plan card, collect all matching Stripe products and their prices
    const linked: {
      plan_name: string
      stripe_products_matched: string[]
      setup_price_id:   string | null; setup_amount:   number | null
      monthly_price_id: string | null; monthly_amount: number | null
    }[] = []

    const skipped: { plan_name: string; reason: string }[] = []
    const matchLog: { plan_name: string; candidates: { product_name: string; score: number }[] }[] = []

    for (const card of cards) {
      // Score every product against this card
      const scored = products
        .map((p) => ({ product: p, score: matchScore(p.name, card.plan_name) }))
        .filter((x): x is { product: Stripe.Product; score: number } => x.score !== null)
        .sort((a, b) => b.score - a.score)

      matchLog.push({
        plan_name: card.plan_name,
        candidates: scored.map((s) => ({ product_name: s.product.name, score: s.score })),
      })

      if (scored.length === 0) {
        skipped.push({ plan_name: card.plan_name, reason: 'No Stripe product matched (no shared tier + discount flag).' })
        continue
      }

      // Aggregate all matching products' prices (handles split setup/monthly products)
      const allMatchedPrices: Stripe.Price[] = []
      const matchedProductNames: string[] = []
      for (const { product } of scored) {
        allMatchedPrices.push(...(pricesByProduct[product.id] ?? []))
        matchedProductNames.push(product.name)
      }

      const defaultId = scored[0]
        ? (typeof scored[0].product.default_price === 'string'
            ? scored[0].product.default_price
            : (scored[0].product.default_price as Stripe.Price | null)?.id ?? null)
        : null

      const oneTimePrices  = allMatchedPrices.filter((p) => p.type === 'one_time' && (p.unit_amount ?? 0) > PLACEHOLDER_THRESHOLD_CENTS)
      const monthlyPrices  = allMatchedPrices.filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month')

      const setupPrice   = pickPrice(oneTimePrices, defaultId)
      const monthlyPrice = pickPrice(monthlyPrices, defaultId)

      if (!setupPrice && !monthlyPrice) {
        skipped.push({
          plan_name: card.plan_name,
          reason: `Matched [${matchedProductNames.join(', ')}] but found no usable prices (no one-time > $1, no recurring monthly).`,
        })
        continue
      }

      // Write to Supabase
      const setClauses: string[] = ['updated_at = now()']
      const values: (string | number)[] = [card.id]
      let i = 2

      if (setupPrice && setupPrice.unit_amount != null) {
        setClauses.push(`setup_price_id = $${i++}, setup_amount = $${i++}`)
        values.push(setupPrice.id, setupPrice.unit_amount / 100)
      }
      if (monthlyPrice && monthlyPrice.unit_amount != null) {
        setClauses.push(`monthly_price_id = $${i++}, monthly_amount = $${i++}`)
        values.push(monthlyPrice.id, monthlyPrice.unit_amount / 100)
      }

      await query(
        `UPDATE public.plan_cards SET ${setClauses.join(', ')} WHERE id = $1`,
        values
      )

      linked.push({
        plan_name:               card.plan_name,
        stripe_products_matched: matchedProductNames,
        setup_price_id:   setupPrice?.id   ?? null,
        setup_amount:     setupPrice   ? (setupPrice.unit_amount   ?? 0) / 100 : null,
        monthly_price_id: monthlyPrice?.id ?? null,
        monthly_amount:   monthlyPrice ? (monthlyPrice.unit_amount ?? 0) / 100 : null,
      })
    }

    return NextResponse.json({
      summary: `${linked.length} card(s) updated, ${skipped.length} skipped.`,
      linked,
      skipped,
      match_log: matchLog,
      stripe_catalogue: catalogue,
    })
  } catch (err) {
    console.error('[auto-link-smart] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed.' }, { status: 500 })
  }
}
