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
  upfront: number
  monthly: number
  stripe_setup_product_id: string | null
  stripe_monthly_product_id: string | null
  stripe_upfront_price_id: string | null
  stripe_monthly_price_id: string | null
  sort_order: number
}

type SyncResult = {
  plan_key: string
  name: string
  action: 'updated' | 'inserted'
  type: 'setup' | 'monthly' | 'mixed'
  upfront: number
  monthly: number
  upfront_price_id: string | null
  monthly_price_id: string | null
}

type SkippedProduct = {
  id: string
  name: string
  reason: string
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

// Select the best price from a list: prefer the product's default_price, then most recently created.
function pickPrice(
  prices: Stripe.Price[],
  defaultPriceId: string | null
): Stripe.Price | null {
  if (prices.length === 0) return null
  if (defaultPriceId) {
    const def = prices.find((p) => p.id === defaultPriceId)
    if (def) return def
  }
  return prices.sort((a, b) => b.created - a.created)[0]
}

// Convert Stripe unit_amount (cents integer) to dollars, preserving cents as a decimal.
function centsToDollars(unitAmount: number | null): number {
  return unitAmount != null ? unitAmount / 100 : 0
}

// POST /api/admin/pricing/sync
// Fetches all active Stripe products and their prices, classifies them as
// setup (one-time) or monthly (recurring), then upserts into pricing_plans.
//
// Preserves:  visible, pages, features, plan_key, sort_order for existing records.
// Preserves:  upfront/monthly from DB when the product being synced only covers one side.
// Uses:       product.default_price when selecting which active price to use.
// Reports:    skipped products (no USD prices) and orphaned DB plans.
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
      return NextResponse.json({ synced: 0, results: [], skipped: [], orphaned: [], message: 'No active products found in Stripe.' })
    }

    // 2 — Load existing DB records (includes upfront/monthly so we can preserve them)
    const existing = await query<ExistingPlan>(
      `SELECT id, plan_key, visible, pages, features,
              upfront, monthly,
              stripe_setup_product_id, stripe_monthly_product_id,
              stripe_upfront_price_id, stripe_monthly_price_id,
              sort_order
       FROM public.pricing_plans`
    )

    // Index by both product ID columns for O(1) lookup
    const existingBySetupId = new Map<string, ExistingPlan>()
    const existingByMonthlyId = new Map<string, ExistingPlan>()
    const usedPlanKeys = new Set<string>()
    for (const row of existing) {
      if (row.stripe_setup_product_id) existingBySetupId.set(row.stripe_setup_product_id, row)
      if (row.stripe_monthly_product_id) existingByMonthlyId.set(row.stripe_monthly_product_id, row)
      usedPlanKeys.add(row.plan_key)
    }

    const results: SyncResult[] = []
    const skipped: SkippedProduct[] = []
    const syncedProductIds = new Set<string>()
    let sortCounter = existing.length

    // 3 — Process each Stripe product
    for (const product of products) {
      const defaultPriceId =
        typeof product.default_price === 'string'
          ? product.default_price
          : (product.default_price as Stripe.Price | null)?.id ?? null

      const prices = await listAll<Stripe.Price>((startingAfter) =>
        stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
      )

      const usdPrices = prices.filter((p) => p.currency === 'usd')

      const monthlyPrices = usdPrices.filter(
        (p) => p.type === 'recurring' && p.recurring?.interval === 'month'
      )
      const oneTimePrices = usdPrices.filter((p) => p.type === 'one_time')

      const hasMonthly = monthlyPrices.length > 0
      const hasOneTime = oneTimePrices.length > 0

      if (!hasMonthly && !hasOneTime) {
        skipped.push({ id: product.id, name: product.name, reason: 'no active USD prices found' })
        continue
      }

      // Pick the best price for each type — prefer default_price, then most recently created
      const monthlyPrice = hasMonthly ? pickPrice(monthlyPrices, defaultPriceId) : null
      const upfrontPrice = hasOneTime ? pickPrice(oneTimePrices, defaultPriceId) : null

      // Use exact Stripe amounts (dollars with decimals preserved)
      const monthly = monthlyPrice ? centsToDollars(monthlyPrice.unit_amount) : null
      const upfront = upfrontPrice ? centsToDollars(upfrontPrice.unit_amount) : null

      const productType: 'setup' | 'monthly' | 'mixed' =
        hasOneTime && hasMonthly ? 'mixed' : hasOneTime ? 'setup' : 'monthly'

      // Track which Stripe product IDs we've processed
      syncedProductIds.add(product.id)

      const existingRecord =
        existingBySetupId.get(product.id) ?? existingByMonthlyId.get(product.id)

      if (existingRecord) {
        // Update only the fields this product type covers; preserve the other side from the DB.
        if (productType === 'setup') {
          await query(
            `UPDATE public.pricing_plans
             SET name                    = $2,
                 upfront                 = $3,
                 stripe_upfront_price_id = $4,
                 stripe_setup_product_id = $5,
                 updated_at              = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, upfront!, upfrontPrice!.id, product.id]
          )
        } else if (productType === 'monthly') {
          await query(
            `UPDATE public.pricing_plans
             SET name                     = $2,
                 monthly                  = $3,
                 stripe_monthly_price_id  = $4,
                 stripe_monthly_product_id = $5,
                 updated_at               = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, monthly!, monthlyPrice!.id, product.id]
          )
        } else {
          // mixed — update both sides
          await query(
            `UPDATE public.pricing_plans
             SET name                      = $2,
                 upfront                   = $3,
                 monthly                   = $4,
                 stripe_upfront_price_id   = $5,
                 stripe_monthly_price_id   = $6,
                 stripe_setup_product_id   = $7,
                 stripe_monthly_product_id = $8,
                 updated_at                = now()
             WHERE id = $1`,
            [
              existingRecord.id,
              product.name,
              upfront!,
              monthly!,
              upfrontPrice!.id,
              monthlyPrice!.id,
              product.id,
              product.id,
            ]
          )
        }

        await syncApiKeys(existingRecord.plan_key, monthlyPrice?.id, upfrontPrice?.id)
        results.push({
          plan_key: existingRecord.plan_key,
          name: product.name,
          action: 'updated',
          type: productType,
          upfront: upfront ?? existingRecord.upfront,
          monthly: monthly ?? existingRecord.monthly,
          upfront_price_id: upfrontPrice?.id ?? existingRecord.stripe_upfront_price_id,
          monthly_price_id: monthlyPrice?.id ?? existingRecord.stripe_monthly_price_id,
        })
      } else {
        // New product — generate a unique plan_key
        let planKey: string =
          (product.metadata?.plan_key as string | undefined)?.trim() || slugify(product.name)

        if (usedPlanKeys.has(planKey)) {
          let counter = 2
          while (usedPlanKeys.has(`${planKey}_${counter}`)) counter++
          planKey = `${planKey}_${counter}`
        }
        usedPlanKeys.add(planKey)

        const pages = product.metadata?.pages
          ? parseInt(product.metadata.pages as string, 10) || 1
          : 1
        let features: string[] = []
        if (product.metadata?.features) {
          try {
            features = JSON.parse(product.metadata.features as string) as string[]
          } catch { /* ignore */ }
        }
        if (features.length === 0 && product.description) {
          features = product.description
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        }

        sortCounter++

        const setupProductId =
          productType === 'setup' || productType === 'mixed' ? product.id : null
        const monthlyProductId =
          productType === 'monthly' || productType === 'mixed' ? product.id : null

        await query(
          `INSERT INTO public.pricing_plans
             (plan_key, name, upfront, monthly, pages, features,
              stripe_setup_product_id, stripe_monthly_product_id,
              stripe_monthly_price_id, stripe_upfront_price_id,
              visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, true, $11)
           ON CONFLICT (plan_key) DO UPDATE SET
             name                      = EXCLUDED.name,
             upfront                   = EXCLUDED.upfront,
             monthly                   = EXCLUDED.monthly,
             stripe_setup_product_id   = COALESCE(EXCLUDED.stripe_setup_product_id,   pricing_plans.stripe_setup_product_id),
             stripe_monthly_product_id = COALESCE(EXCLUDED.stripe_monthly_product_id, pricing_plans.stripe_monthly_product_id),
             stripe_monthly_price_id   = COALESCE(EXCLUDED.stripe_monthly_price_id,   pricing_plans.stripe_monthly_price_id),
             stripe_upfront_price_id   = COALESCE(EXCLUDED.stripe_upfront_price_id,   pricing_plans.stripe_upfront_price_id),
             updated_at                = now()`,
          [
            planKey,
            product.name,
            upfront ?? 0,
            monthly ?? 0,
            pages,
            JSON.stringify(features),
            setupProductId,
            monthlyProductId,
            monthlyPrice?.id ?? null,
            upfrontPrice?.id ?? null,
            sortCounter,
          ]
        )

        await syncApiKeys(planKey, monthlyPrice?.id, upfrontPrice?.id)
        results.push({
          plan_key: planKey,
          name: product.name,
          action: 'inserted',
          type: productType,
          upfront: upfront ?? 0,
          monthly: monthly ?? 0,
          upfront_price_id: upfrontPrice?.id ?? null,
          monthly_price_id: monthlyPrice?.id ?? null,
        })
      }
    }

    // 4 — Detect orphaned DB plans (no linked product still active in Stripe)
    const orphaned = existing
      .filter((row) => {
        const hasSetup = row.stripe_setup_product_id
          ? syncedProductIds.has(row.stripe_setup_product_id)
          : false
        const hasMonthly = row.stripe_monthly_product_id
          ? syncedProductIds.has(row.stripe_monthly_product_id)
          : false
        const isLinked = !!(row.stripe_setup_product_id || row.stripe_monthly_product_id)
        // Report plans that have a product link but neither product was seen in the sync
        return isLinked && !hasSetup && !hasMonthly
      })
      .map((row) => ({
        plan_key: row.plan_key,
        stripe_setup_product_id: row.stripe_setup_product_id,
        stripe_monthly_product_id: row.stripe_monthly_product_id,
      }))

    return NextResponse.json({
      synced: results.length,
      results,
      skipped,
      orphaned,
    })
  } catch (err) {
    console.error('[pricing/sync] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Sync failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Keep api_keys in sync so the existing Stripe checkout flow stays current.
async function syncApiKeys(
  planKey: string,
  monthlyPriceId: string | undefined | null,
  upfrontPriceId: string | undefined | null
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
