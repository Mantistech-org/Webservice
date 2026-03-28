import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

export type StripeProductOption = {
  id: string
  name: string
  price: number      // dollars
  price_id: string
}

// Fetch all pages of a Stripe list resource
async function listAll<T>(
  fetcher: (startingAfter?: string) => Promise<Stripe.ApiList<T & { id: string }>>
): Promise<T[]> {
  const results: T[] = []
  let startingAfter: string | undefined
  while (true) {
    const page = await fetcher(startingAfter)
    results.push(...(page.data as T[]))
    if (!page.has_more || page.data.length === 0) break
    startingAfter = (page.data[page.data.length - 1] as { id: string }).id
  }
  return results
}

// GET /api/admin/pricing/stripe-products
// Returns all active Stripe products classified as setup (one-time) or monthly (recurring).
// Used to populate the product dropdowns on plan cards.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stripe = await getStripe()

    const products = await listAll<Stripe.Product>((startingAfter) =>
      stripe.products.list({
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
    )

    const setup_products: StripeProductOption[] = []
    const monthly_products: StripeProductOption[] = []

    for (const product of products) {
      const prices = await listAll<Stripe.Price>((startingAfter) =>
        stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
      )

      const usdPrices = prices.filter((p) => p.currency === 'usd')

      const oneTimePrices = usdPrices
        .filter((p) => p.type === 'one_time')
        .sort((a, b) => b.created - a.created)

      const recurringPrices = usdPrices
        .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month')
        .sort((a, b) => b.created - a.created)

      if (oneTimePrices.length > 0) {
        const price = oneTimePrices[0]
        setup_products.push({
          id: product.id,
          name: product.name,
          price: Math.round((price.unit_amount ?? 0) / 100),
          price_id: price.id,
        })
      }

      if (recurringPrices.length > 0) {
        const price = recurringPrices[0]
        monthly_products.push({
          id: product.id,
          name: product.name,
          price: Math.round((price.unit_amount ?? 0) / 100),
          price_id: price.id,
        })
      }
    }

    return NextResponse.json({ setup_products, monthly_products })
  } catch (err) {
    console.error('[stripe-products] GET failed:', err)
    const msg = err instanceof Error ? err.message : 'Failed to fetch Stripe products.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
