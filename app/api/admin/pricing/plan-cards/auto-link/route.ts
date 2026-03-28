import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'
import type { PlanCard } from '@/app/api/admin/pricing/plan-cards/route'

// One-time prices at or below this threshold (cents) are ignored as placeholders.
// $1.00 = 100 cents — only prices strictly greater than $1 are treated as real fees.
const PLACEHOLDER_THRESHOLD_CENTS = 100

type LinkedPrice = {
  card_id: string
  plan_name: string
  field: 'setup' | 'monthly'
  price_id: string
  amount: number          // confirmed dollars, exact (e.g. 87.5 for $87.50)
  stripe_product_id: string
  stripe_product_name: string
}

type SkippedCard = {
  plan_name: string
  reason: string
}

type AutoLinkResult = {
  linked: LinkedPrice[]
  skipped: SkippedCard[]
}

// Fetch all pages of a Stripe list resource
async function listAll<T>(
  fetcher: (startingAfter?: string) => Promise<Stripe.ApiList<T & { id: string }>>
): Promise<T[]> {
  const items: T[] = []
  let startingAfter: string | undefined
  while (true) {
    const page = await fetcher(startingAfter)
    items.push(...(page.data as T[]))
    if (!page.has_more || page.data.length === 0) break
    startingAfter = (page.data[page.data.length - 1] as { id: string }).id
  }
  return items
}

// Prefer default_price if present in the valid set, otherwise most recently created.
function pickPrice(prices: Stripe.Price[], defaultPriceId: string | null): Stripe.Price | null {
  if (prices.length === 0) return null
  if (defaultPriceId) {
    const def = prices.find((p) => p.id === defaultPriceId)
    if (def) return def
  }
  return [...prices].sort((a, b) => b.created - a.created)[0]
}

// POST /api/admin/pricing/plan-cards/auto-link
//
// Read-only Stripe operation: fetches all active Stripe products and their
// prices, matches them to plan_cards rows by name (case-insensitive), then
// saves the confirmed price ID and amount to Supabase.
//
// Matching: plan card "Mantis Tech Pro (Discount)" matches the Stripe product
// whose name normalises to the same string (case-insensitive).
//
// For each match, the validated unit_amount from the Stripe price object is
// saved directly — no hardcoded or fabricated amounts. If a price cannot be
// matched or has no valid USD amount it is skipped and reported.
//
// Never creates, modifies, or archives anything in Stripe.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    const stripe = await getStripe()

    // 1 — Load all plan cards from DB
    const cards = await query<PlanCard>(
      `SELECT * FROM public.plan_cards ORDER BY sort_order ASC`
    )

    if (cards.length === 0) {
      return NextResponse.json({
        error: 'No plan cards found. Run the plan-cards-migration.sql first.',
      }, { status: 404 })
    }

    // 2 — Fetch all active Stripe products
    const products = await listAll<Stripe.Product>((startingAfter) =>
      stripe.products.list({
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
    )

    // Build a lookup: normalised product name → Stripe product
    const productByName = new Map<string, Stripe.Product>()
    for (const product of products) {
      productByName.set(product.name.toLowerCase().trim(), product)
    }

    const linked: LinkedPrice[] = []
    const skipped: SkippedCard[] = []

    // 3 — Match each plan card to a Stripe product
    for (const card of cards) {
      const normalisedCardName = card.plan_name.toLowerCase().trim()
      const matchedProduct = productByName.get(normalisedCardName)

      if (!matchedProduct) {
        skipped.push({
          plan_name: card.plan_name,
          reason: `No active Stripe product found with the name "${card.plan_name}" (case-insensitive).`,
        })
        continue
      }

      const defaultPriceId =
        typeof matchedProduct.default_price === 'string'
          ? matchedProduct.default_price
          : (matchedProduct.default_price as Stripe.Price | null)?.id ?? null

      // Fetch all active USD prices for this product
      const allPrices = await listAll<Stripe.Price>((startingAfter) =>
        stripe.prices.list({
          product: matchedProduct.id,
          active: true,
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
      )

      const usdPrices = allPrices.filter((p) => p.currency === 'usd')

      // Setup fee: one-time USD price strictly greater than $1 placeholder threshold
      const oneTimePrices = usdPrices.filter(
        (p) => p.type === 'one_time' && (p.unit_amount ?? 0) > PLACEHOLDER_THRESHOLD_CENTS
      )

      // Monthly: recurring monthly USD price
      const monthlyPrices = usdPrices.filter(
        (p) => p.type === 'recurring' && p.recurring?.interval === 'month'
      )

      const setupPrice = pickPrice(oneTimePrices, defaultPriceId)
      const monthlyPrice = pickPrice(monthlyPrices, defaultPriceId)

      let foundAny = false

      // Link setup price if found
      if (setupPrice && setupPrice.unit_amount != null && setupPrice.unit_amount > 0) {
        const amount = setupPrice.unit_amount / 100
        await query(
          `UPDATE public.plan_cards
           SET setup_price_id = $2, setup_amount = $3, updated_at = now()
           WHERE id = $1`,
          [card.id, setupPrice.id, amount]
        )
        linked.push({
          card_id: card.id,
          plan_name: card.plan_name,
          field: 'setup',
          price_id: setupPrice.id,
          amount,
          stripe_product_id: matchedProduct.id,
          stripe_product_name: matchedProduct.name,
        })
        foundAny = true
      }

      // Link monthly price if found
      if (monthlyPrice && monthlyPrice.unit_amount != null && monthlyPrice.unit_amount > 0) {
        const amount = monthlyPrice.unit_amount / 100
        await query(
          `UPDATE public.plan_cards
           SET monthly_price_id = $2, monthly_amount = $3, updated_at = now()
           WHERE id = $1`,
          [card.id, monthlyPrice.id, amount]
        )
        linked.push({
          card_id: card.id,
          plan_name: card.plan_name,
          field: 'monthly',
          price_id: monthlyPrice.id,
          amount,
          stripe_product_id: matchedProduct.id,
          stripe_product_name: matchedProduct.name,
        })
        foundAny = true
      }

      if (!foundAny) {
        const reasons: string[] = []
        if (oneTimePrices.length === 0) {
          const allOneTime = usdPrices.filter((p) => p.type === 'one_time')
          reasons.push(
            allOneTime.length > 0
              ? `setup: only placeholder one-time prices found ($${Math.max(...allOneTime.map((p) => (p.unit_amount ?? 0) / 100))} max)`
              : 'setup: no active one-time USD prices'
          )
        }
        if (monthlyPrices.length === 0) {
          reasons.push('monthly: no active recurring monthly USD prices')
        }
        skipped.push({
          plan_name: card.plan_name,
          reason: `Matched product "${matchedProduct.name}" but: ${reasons.join('; ')}.`,
        })
      }
    }

    return NextResponse.json({
      linked,
      skipped,
      summary: `${linked.length} price${linked.length === 1 ? '' : 's'} linked across ${new Set(linked.map((l) => l.card_id)).size} card${new Set(linked.map((l) => l.card_id)).size === 1 ? '' : 's'}.`,
    })
  } catch (err) {
    console.error('[plan-cards/auto-link] POST failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Auto-link failed.' },
      { status: 500 }
    )
  }
}
