import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { invalidateApiKeyCache } from '@/lib/api-keys'
import Stripe from 'stripe'

// Minimum one-time price in cents to be treated as a real setup fee.
// Prices at or below this value (e.g. Stripe's $1 test placeholder) are ignored.
const MIN_SETUP_FEE_CENTS = 200  // $2.00

// Keywords in the product name that identify main subscription plans.
const PLAN_NAME_KEYWORDS = [
  'starter', 'growth', 'pro', 'basic', 'business', 'enterprise',
  'standard', 'premium', 'essential', 'ultimate', 'plus', 'advanced',
  'professional', ' plan', 'package', 'tier',
]

// Keywords in the product name that identify add-on services.
const ADDON_NAME_KEYWORDS = [
  'add-on', 'addon', 'generation', 'automation', 'management',
  'optimization', 'monitoring', 'analytics', 'support', 'module', 'extra',
]

// Classify a Stripe product as 'plan' or 'addon'.
// Order of precedence: metadata.type → metadata.category → name keywords → default 'plan'.
function classifyProduct(product: Stripe.Product): 'plan' | 'addon' {
  const metaType = (product.metadata?.type as string | undefined)?.toLowerCase().trim()
  const metaCategory = (product.metadata?.category as string | undefined)?.toLowerCase().trim()

  if (metaType === 'addon' || metaType === 'add-on' || metaType === 'add_on') return 'addon'
  if (metaCategory === 'addon' || metaCategory === 'add-on' || metaCategory === 'add_on') return 'addon'
  if (metaType === 'plan') return 'plan'
  if (metaCategory === 'plan') return 'plan'

  const name = product.name.toLowerCase()
  if (ADDON_NAME_KEYWORDS.some((kw) => name.includes(kw))) return 'addon'
  if (PLAN_NAME_KEYWORDS.some((kw) => name.includes(kw))) return 'plan'

  // Default: treat as a plan so nothing is silently hidden
  return 'plan'
}

type ExistingPlan = {
  id: string
  plan_key: string
  visible: boolean
  pages: number
  features: string[]
  upfront: number
  monthly: number
  product_type: 'plan' | 'addon'
  stripe_setup_product_id: string | null
  stripe_monthly_product_id: string | null
  stripe_upfront_price_id: string | null
  stripe_monthly_price_id: string | null
  sort_order: number
}

type SyncResult = {
  plan_key: string
  name: string
  product_id: string
  action: 'updated' | 'inserted'
  product_type: 'plan' | 'addon'
  classified_by: 'metadata' | 'name' | 'default'
  price_type: 'setup' | 'monthly' | 'mixed'
  upfront: number | null
  monthly: number | null
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

// Select the best price: prefer product.default_price, then most recently created.
function pickPrice(prices: Stripe.Price[], defaultPriceId: string | null): Stripe.Price | null {
  if (prices.length === 0) return null
  if (defaultPriceId) {
    const def = prices.find((p) => p.id === defaultPriceId)
    if (def) return def
  }
  return prices.sort((a, b) => b.created - a.created)[0]
}

// Convert Stripe unit_amount (cents) to dollars — exact, no rounding.
function centsToDollars(unitAmount: number | null): number {
  return unitAmount != null ? unitAmount / 100 : 0
}

// Describe how a product was classified (for the response report)
function classificationSource(product: Stripe.Product): 'metadata' | 'name' | 'default' {
  const metaType = (product.metadata?.type as string | undefined)?.toLowerCase().trim()
  const metaCategory = (product.metadata?.category as string | undefined)?.toLowerCase().trim()
  if (metaType || metaCategory) return 'metadata'
  const name = product.name.toLowerCase()
  if ([...PLAN_NAME_KEYWORDS, ...ADDON_NAME_KEYWORDS].some((kw) => name.includes(kw))) return 'name'
  return 'default'
}

// POST /api/admin/pricing/sync
// Fetches all active Stripe products, classifies them as 'plan' or 'addon' based on
// Stripe metadata (metadata.type / metadata.category) then name keywords, then default 'plan'.
// Ignores one-time prices ≤ $2 (likely Stripe test/placeholder prices).
// Preserves: visible, pages, features, plan_key, sort_order for existing records.
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
      stripe.products.list({
        active: true,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
    )

    if (products.length === 0) {
      return NextResponse.json({
        synced: 0, results: [], skipped: [], orphaned: [],
        message: 'No active products found in Stripe.',
      })
    }

    // 2 — Load existing DB records
    const existing = await query<ExistingPlan>(
      `SELECT id, plan_key, visible, pages, features,
              upfront, monthly, product_type,
              stripe_setup_product_id, stripe_monthly_product_id,
              stripe_upfront_price_id, stripe_monthly_price_id,
              sort_order
       FROM public.pricing_plans`
    )

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

      // Exclude one-time prices at or below the minimum threshold (Stripe test/placeholder prices)
      const oneTimePrices = usdPrices.filter(
        (p) => p.type === 'one_time' && (p.unit_amount ?? 0) > MIN_SETUP_FEE_CENTS
      )

      const hasMonthly = monthlyPrices.length > 0
      const hasOneTime = oneTimePrices.length > 0

      if (!hasMonthly && !hasOneTime) {
        const allOneTime = usdPrices.filter((p) => p.type === 'one_time')
        const reason = allOneTime.length > 0
          ? `all one-time prices are ≤ $${MIN_SETUP_FEE_CENTS / 100} (placeholder) and no recurring prices`
          : 'no active USD prices found'
        skipped.push({ id: product.id, name: product.name, reason })
        continue
      }

      const monthlyPrice = hasMonthly ? pickPrice(monthlyPrices, defaultPriceId) : null
      const upfrontPrice = hasOneTime ? pickPrice(oneTimePrices, defaultPriceId) : null

      const monthly = monthlyPrice ? centsToDollars(monthlyPrice.unit_amount) : null
      const upfront = upfrontPrice ? centsToDollars(upfrontPrice.unit_amount) : null

      const priceType: 'setup' | 'monthly' | 'mixed' =
        hasOneTime && hasMonthly ? 'mixed' : hasOneTime ? 'setup' : 'monthly'

      const productType = classifyProduct(product)
      const classifiedBy = classificationSource(product)

      syncedProductIds.add(product.id)

      const existingRecord =
        existingBySetupId.get(product.id) ?? existingByMonthlyId.get(product.id)

      if (existingRecord) {
        // Update only the fields this product type covers; preserve the other side from the DB.
        if (priceType === 'setup') {
          await query(
            `UPDATE public.pricing_plans
             SET name                    = $2,
                 upfront                 = $3,
                 stripe_upfront_price_id = $4,
                 stripe_setup_product_id = $5,
                 product_type            = $6,
                 updated_at              = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, upfront!, upfrontPrice!.id, product.id, productType]
          )
        } else if (priceType === 'monthly') {
          await query(
            `UPDATE public.pricing_plans
             SET name                      = $2,
                 monthly                   = $3,
                 stripe_monthly_price_id   = $4,
                 stripe_monthly_product_id = $5,
                 product_type              = $6,
                 updated_at                = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, monthly!, monthlyPrice!.id, product.id, productType]
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
                 product_type              = $9,
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
              productType,
            ]
          )
        }

        await syncApiKeys(existingRecord.plan_key, monthlyPrice?.id, upfrontPrice?.id)
        results.push({
          plan_key: existingRecord.plan_key,
          name: product.name,
          product_id: product.id,
          action: 'updated',
          product_type: productType,
          classified_by: classifiedBy,
          price_type: priceType,
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
          try { features = JSON.parse(product.metadata.features as string) as string[] } catch { /* ignore */ }
        }
        if (features.length === 0 && product.description) {
          features = product.description.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        }

        sortCounter++

        const setupProductId = priceType === 'setup' || priceType === 'mixed' ? product.id : null
        const monthlyProductId = priceType === 'monthly' || priceType === 'mixed' ? product.id : null

        await query(
          `INSERT INTO public.pricing_plans
             (plan_key, name, upfront, monthly, pages, features,
              stripe_setup_product_id, stripe_monthly_product_id,
              stripe_monthly_price_id, stripe_upfront_price_id,
              product_type, visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, true, $12)
           ON CONFLICT (plan_key) DO UPDATE SET
             name                      = EXCLUDED.name,
             upfront                   = EXCLUDED.upfront,
             monthly                   = EXCLUDED.monthly,
             stripe_setup_product_id   = COALESCE(EXCLUDED.stripe_setup_product_id,   pricing_plans.stripe_setup_product_id),
             stripe_monthly_product_id = COALESCE(EXCLUDED.stripe_monthly_product_id, pricing_plans.stripe_monthly_product_id),
             stripe_monthly_price_id   = COALESCE(EXCLUDED.stripe_monthly_price_id,   pricing_plans.stripe_monthly_price_id),
             stripe_upfront_price_id   = COALESCE(EXCLUDED.stripe_upfront_price_id,   pricing_plans.stripe_upfront_price_id),
             product_type              = EXCLUDED.product_type,
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
            productType,
            sortCounter,
          ]
        )

        await syncApiKeys(planKey, monthlyPrice?.id, upfrontPrice?.id)
        results.push({
          plan_key: planKey,
          name: product.name,
          product_id: product.id,
          action: 'inserted',
          product_type: productType,
          classified_by: classifiedBy,
          price_type: priceType,
          upfront: upfront ?? 0,
          monthly: monthly ?? 0,
          upfront_price_id: upfrontPrice?.id ?? null,
          monthly_price_id: monthlyPrice?.id ?? null,
        })
      }
    }

    // 4 — Detect orphaned DB plans (linked product no longer active in Stripe)
    const orphaned = existing
      .filter((row) => {
        const setupActive = row.stripe_setup_product_id
          ? syncedProductIds.has(row.stripe_setup_product_id)
          : false
        const monthlyActive = row.stripe_monthly_product_id
          ? syncedProductIds.has(row.stripe_monthly_product_id)
          : false
        const isLinked = !!(row.stripe_setup_product_id || row.stripe_monthly_product_id)
        return isLinked && !setupActive && !monthlyActive
      })
      .map((row) => ({
        plan_key: row.plan_key,
        stripe_setup_product_id: row.stripe_setup_product_id,
        stripe_monthly_product_id: row.stripe_monthly_product_id,
      }))

    return NextResponse.json({ synced: results.length, results, skipped, orphaned })
  } catch (err) {
    console.error('[pricing/sync] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Sync failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Keep api_keys in sync so the Stripe checkout flow stays current.
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

  await supabase.from('api_keys').upsert(rows, { onConflict: 'scope,service' })
}
