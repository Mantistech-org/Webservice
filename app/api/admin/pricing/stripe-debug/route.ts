import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

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

// GET /api/admin/pricing/stripe-debug
// Read-only. Lists every active Stripe product with its exact name, ID,
// and all active USD price IDs and amounts. Used to verify name mapping
// before auto-linking plan cards.
export async function GET() {
  const stripe = await getStripe()

  const products = await listAll<Stripe.Product>((startingAfter) =>
    stripe.products.list({
      active: true,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
  )

  const result = await Promise.all(
    products
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (product) => {
        const prices = await listAll<Stripe.Price>((startingAfter) =>
          stripe.prices.list({
            product: product.id,
            active: true,
            limit: 100,
            ...(startingAfter ? { starting_after: startingAfter } : {}),
          })
        )

        const usdPrices = prices
          .filter((p) => p.currency === 'usd')
          .map((p) => ({
            id: p.id,
            type: p.type,
            interval: p.recurring?.interval ?? null,
            amount_cents: p.unit_amount,
            amount_dollars: p.unit_amount != null ? p.unit_amount / 100 : null,
          }))
          .sort((a, b) => (a.type === 'one_time' ? -1 : 1) - (b.type === 'one_time' ? -1 : 1))

        return {
          id: product.id,
          name: product.name,
          default_price: typeof product.default_price === 'string'
            ? product.default_price
            : (product.default_price as Stripe.Price | null)?.id ?? null,
          usd_prices: usdPrices,
        }
      })
  )

  return NextResponse.json({ total: result.length, products: result })
}
