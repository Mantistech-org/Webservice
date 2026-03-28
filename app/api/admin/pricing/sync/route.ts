import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { invalidateApiKeyCache } from '@/lib/api-keys'
import Stripe from 'stripe'

type ExistingPlan = {
  id: string
  plan_key: string
  visible: boolean
  pages: number
  features: string[]
  stripe_product_id: string | null
  sort_order: number
}

type SyncResult = {
  plan_key: string
  name: string
  action: 'updated' | 'inserted'
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50)
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

// POST /api/admin/pricing/sync
// Fetches all active Stripe products and their prices, then upserts into pricing_plans.
// Preserves: visible, pages, features, plan_key, sort_order for existing records.
// Updates:   name, monthly, upfront, stripe_*_price_id from Stripe.
// Also syncs price IDs into the api_keys table for any plan_key that matches the
// checkout flow's expected service name pattern (stripe_price_{plan_key}_{monthly|upfront}).
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    const stripe = await getStripe()

    // 1 — Load all active Stripe products
    const products = await listAll<Stripe.Product>((startingAfter) =>
      stripe.products.list({ active: true, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
    )

    if (products.length === 0) {
      return NextResponse.json({ synced: 0, results: [], message: 'No active products found in Stripe.' })
    }

    // 2 — Load existing DB records so we can preserve admin-customized fields
    const existing = await query<ExistingPlan>(
      `SELECT id, plan_key, visible, pages, features, stripe_product_id, sort_order
       FROM public.pricing_plans`
    )

    // Index by stripe_product_id for O(1) lookup
    const existingByProductId = new Map<string, ExistingPlan>()
    const usedPlanKeys = new Set<string>()
    for (const row of existing) {
      if (row.stripe_product_id) existingByProductId.set(row.stripe_product_id, row)
      usedPlanKeys.add(row.plan_key)
    }

    const results: SyncResult[] = []
    let sortCounter = existing.length

    // 3 — Process each product
    for (const product of products) {
      // Fetch active prices for this product
      const prices = await listAll<Stripe.Price>((startingAfter) =>
        stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
      )

      // Classify prices — prefer USD; take most recently created when multiple match
      const monthlyPrices = prices
        .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month' && p.currency === 'usd')
        .sort((a, b) => b.created - a.created)

      const upfrontPrices = prices
        .filter((p) => p.type === 'one_time' && p.currency === 'usd')
        .sort((a, b) => b.created - a.created)

      const monthlyPrice = monthlyPrices[0] ?? null
      const upfrontPrice = upfrontPrices[0] ?? null

      // Skip products that have no recognisable prices
      if (!monthlyPrice && !upfrontPrice) {
        console.log(`[pricing/sync] Skipping product "${product.name}" (${product.id}) — no USD prices found`)
        continue
      }

      const monthly = monthlyPrice ? Math.round((monthlyPrice.unit_amount ?? 0) / 100) : 0
      const upfront = upfrontPrice ? Math.round((upfrontPrice.unit_amount ?? 0) / 100) : 0

      const existingRecord = existingByProductId.get(product.id)

      if (existingRecord) {
        // Update Stripe-sourced fields only — leave visible/pages/features/plan_key untouched
        await query(
          `UPDATE public.pricing_plans
           SET name                    = $2,
               monthly                 = $3,
               upfront                 = $4,
               stripe_monthly_price_id = $5,
               stripe_upfront_price_id = $6,
               updated_at              = now()
           WHERE id = $1`,
          [
            existingRecord.id,
            product.name,
            monthly,
            upfront,
            monthlyPrice?.id ?? null,
            upfrontPrice?.id ?? null,
          ]
        )

        // Sync price IDs to api_keys so the checkout flow picks them up
        await syncApiKeys(existingRecord.plan_key, monthlyPrice?.id, upfrontPrice?.id)

        results.push({ plan_key: existingRecord.plan_key, name: product.name, action: 'updated' })
      } else {
        // New product — generate a unique plan_key
        // Prefer explicit plan_key from Stripe product metadata if set
        let planKey: string = (product.metadata?.plan_key as string | undefined)?.trim() || slugify(product.name)

        if (usedPlanKeys.has(planKey)) {
          let counter = 2
          while (usedPlanKeys.has(`${planKey}_${counter}`)) counter++
          planKey = `${planKey}_${counter}`
        }
        usedPlanKeys.add(planKey)

        // pages and features can be stored in Stripe product metadata
        const pages = product.metadata?.pages ? parseInt(product.metadata.pages as string, 10) || 1 : 1
        let features: string[] = []
        if (product.metadata?.features) {
          try { features = JSON.parse(product.metadata.features as string) as string[] } catch { /* ignore */ }
        }
        // Fall back to product description split by newline or comma
        if (features.length === 0 && product.description) {
          features = product.description
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        }

        sortCounter++
        await query(
          `INSERT INTO public.pricing_plans
             (plan_key, name, upfront, monthly, pages, features,
              stripe_product_id, stripe_monthly_price_id, stripe_upfront_price_id,
              visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, true, $10)
           ON CONFLICT (plan_key) DO UPDATE SET
             name                    = EXCLUDED.name,
             upfront                 = EXCLUDED.upfront,
             monthly                 = EXCLUDED.monthly,
             stripe_product_id       = EXCLUDED.stripe_product_id,
             stripe_monthly_price_id = EXCLUDED.stripe_monthly_price_id,
             stripe_upfront_price_id = EXCLUDED.stripe_upfront_price_id,
             updated_at              = now()`,
          [
            planKey,
            product.name,
            upfront,
            monthly,
            pages,
            JSON.stringify(features),
            product.id,
            monthlyPrice?.id ?? null,
            upfrontPrice?.id ?? null,
            sortCounter,
          ]
        )

        await syncApiKeys(planKey, monthlyPrice?.id, upfrontPrice?.id)

        results.push({ plan_key: planKey, name: product.name, action: 'inserted' })
      }
    }

    return NextResponse.json({
      synced: results.length,
      results,
    })
  } catch (err) {
    console.error('[pricing/sync] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Sync failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Keep api_keys in sync so the existing Stripe checkout flow (which reads
// stripe_price_{plan_key}_monthly / _upfront via getApiKey) stays current.
async function syncApiKeys(
  planKey: string,
  monthlyPriceId: string | undefined,
  upfrontPriceId: string | undefined
) {
  if (!supabaseEnabled) return

  const rows: { scope: string; service: string; key_value: string }[] = []

  if (monthlyPriceId) {
    rows.push({ scope: 'admin', service: `stripe_price_${planKey}_monthly`, key_value: monthlyPriceId })
    invalidateApiKeyCache(`stripe_price_${planKey}_monthly`)
  }
  if (upfrontPriceId) {
    rows.push({ scope: 'admin', service: `stripe_price_${planKey}_upfront`, key_value: upfrontPriceId })
    invalidateApiKeyCache(`stripe_price_${planKey}_upfront`)
  }

  if (rows.length === 0) return

  await supabase
    .from('api_keys')
    .upsert(rows, { onConflict: 'scope,service' })
}
