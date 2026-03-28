import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { invalidateApiKeyCache } from '@/lib/api-keys'
import Stripe from 'stripe'

// One-time prices at or below this threshold are treated as Stripe placeholders and ignored.
// $1.00 = 100 cents. Any price > $1 is treated as a real setup fee.
const PLACEHOLDER_THRESHOLD_CENTS = 100

// Product names containing any of these keywords (case-insensitive) are classified as 'plan'.
// Everything else is classified as 'addon'.
const PLAN_NAME_KEYWORDS = ['starter', 'growth', 'pro', 'basic', 'standard', 'premium', 'enterprise']

// Classify a Stripe product as 'plan' or 'addon'.
// Precedence: metadata.type → name keywords → default 'addon'.
function classifyProduct(product: Stripe.Product): 'plan' | 'addon' {
  const metaType = (product.metadata?.type as string | undefined)?.toLowerCase().trim()
  if (metaType === 'plan') return 'plan'
  if (metaType === 'addon' || metaType === 'add-on' || metaType === 'add_on') return 'addon'

  const name = product.name.toLowerCase()
  if (PLAN_NAME_KEYWORDS.some((kw) => name.includes(kw))) return 'plan'

  return 'addon'
}

type ExistingPlan = {
  id: string
  plan_key: string
  stripe_setup_product_id: string | null
  stripe_monthly_product_id: string | null
  stripe_upfront_price_id: string | null
  stripe_monthly_price_id: string | null
  upfront: number
  monthly: number
  product_type: 'plan' | 'addon'
  visible: boolean
  pages: number
  features: string[]
  sort_order: number
}

type SyncResult = {
  plan_key: string
  name: string
  product_id: string
  action: 'inserted' | 'updated'
  product_type: 'plan' | 'addon'
  classified_by: 'metadata' | 'name' | 'default'
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

// Prefer default_price if present in the list, otherwise pick most recently created.
function pickPrice(prices: Stripe.Price[], defaultPriceId: string | null): Stripe.Price | null {
  if (prices.length === 0) return null
  if (defaultPriceId) {
    const def = prices.find((p) => p.id === defaultPriceId)
    if (def) return def
  }
  return [...prices].sort((a, b) => b.created - a.created)[0]
}

// Convert Stripe unit_amount (integer cents) to dollars — exact, no rounding.
function centsToDollars(unitAmount: number | null): number {
  return unitAmount != null ? unitAmount / 100 : 0
}

function classifiedBy(product: Stripe.Product): 'metadata' | 'name' | 'default' {
  const metaType = (product.metadata?.type as string | undefined)?.toLowerCase().trim()
  if (metaType) return 'metadata'
  const name = product.name.toLowerCase()
  if (PLAN_NAME_KEYWORDS.some((kw) => name.includes(kw))) return 'name'
  return 'default'
}

// POST /api/admin/pricing/sync
// Fetches all active Stripe products and upserts them into pricing_plans.
// Classification: metadata.type → name keywords → default 'addon'.
// One-time prices ≤ $1 are treated as Stripe placeholders and ignored.
// Preserves: visible, pages, features, sort_order for existing records.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    const stripe = await getStripe()

    // 1 — Fetch all active Stripe products
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

    // 2 — Load existing DB records for matching and orphan detection
    const existing = await query<ExistingPlan>(
      `SELECT id, plan_key, stripe_setup_product_id, stripe_monthly_product_id,
              stripe_upfront_price_id, stripe_monthly_price_id,
              upfront, monthly, product_type, visible, pages, features, sort_order
       FROM public.pricing_plans`
    )

    const bySetupId = new Map<string, ExistingPlan>()
    const byMonthlyId = new Map<string, ExistingPlan>()
    const usedPlanKeys = new Set<string>()
    for (const row of existing) {
      if (row.stripe_setup_product_id) bySetupId.set(row.stripe_setup_product_id, row)
      if (row.stripe_monthly_product_id) byMonthlyId.set(row.stripe_monthly_product_id, row)
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

      const allPrices = await listAll<Stripe.Price>((startingAfter) =>
        stripe.prices.list({
          product: product.id,
          active: true,
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
      )

      const usdPrices = allPrices.filter((p) => p.currency === 'usd')

      // Recurring monthly prices (any amount)
      const monthlyPrices = usdPrices.filter(
        (p) => p.type === 'recurring' && p.recurring?.interval === 'month'
      )

      // One-time prices strictly greater than the placeholder threshold
      const oneTimePrices = usdPrices.filter(
        (p) => p.type === 'one_time' && (p.unit_amount ?? 0) > PLACEHOLDER_THRESHOLD_CENTS
      )

      const hasMonthly = monthlyPrices.length > 0
      const hasOneTime = oneTimePrices.length > 0

      if (!hasMonthly && !hasOneTime) {
        const allOneTime = usdPrices.filter((p) => p.type === 'one_time')
        const reason = allOneTime.length > 0
          ? `all one-time prices are $${centsToDollars(Math.max(...allOneTime.map((p) => p.unit_amount ?? 0)))} or less (placeholder)`
          : 'no active USD prices'
        skipped.push({ id: product.id, name: product.name, reason })
        continue
      }

      const monthlyPrice = pickPrice(monthlyPrices, defaultPriceId)
      const upfrontPrice = pickPrice(oneTimePrices, defaultPriceId)
      const monthly = monthlyPrice ? centsToDollars(monthlyPrice.unit_amount) : 0
      const upfront = upfrontPrice ? centsToDollars(upfrontPrice.unit_amount) : 0

      const productType = classifyProduct(product)
      const source = classifiedBy(product)

      syncedProductIds.add(product.id)

      const existingRecord = bySetupId.get(product.id) ?? byMonthlyId.get(product.id)

      if (existingRecord) {
        // Determine which product role this Stripe product plays for the existing record
        const isSetupProduct = existingRecord.stripe_setup_product_id === product.id
        const isMonthlyProduct = existingRecord.stripe_monthly_product_id === product.id

        if (isSetupProduct && !isMonthlyProduct) {
          // This product only covers the setup side — update setup fields only
          await query(
            `UPDATE public.pricing_plans
             SET name                    = $2,
                 upfront                 = $3,
                 stripe_upfront_price_id = $4,
                 stripe_setup_product_id = $5,
                 product_type            = $6,
                 updated_at              = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, upfront || existingRecord.upfront, upfrontPrice?.id ?? existingRecord.stripe_upfront_price_id, product.id, productType]
          )
        } else if (isMonthlyProduct && !isSetupProduct) {
          // This product only covers the monthly side — update monthly fields only
          await query(
            `UPDATE public.pricing_plans
             SET name                      = $2,
                 monthly                   = $3,
                 stripe_monthly_price_id   = $4,
                 stripe_monthly_product_id = $5,
                 product_type              = $6,
                 updated_at                = now()
             WHERE id = $1`,
            [existingRecord.id, product.name, monthly || existingRecord.monthly, monthlyPrice?.id ?? existingRecord.stripe_monthly_price_id, product.id, productType]
          )
        } else {
          // Same product covers both sides (or is newly matched) — update all price fields
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
              upfront || existingRecord.upfront,
              monthly || existingRecord.monthly,
              upfrontPrice?.id ?? existingRecord.stripe_upfront_price_id,
              monthlyPrice?.id ?? existingRecord.stripe_monthly_price_id,
              hasOneTime ? product.id : existingRecord.stripe_setup_product_id,
              hasMonthly ? product.id : existingRecord.stripe_monthly_product_id,
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
          classified_by: source,
          upfront,
          monthly,
          upfront_price_id: upfrontPrice?.id ?? null,
          monthly_price_id: monthlyPrice?.id ?? null,
        })
      } else {
        // New product — generate unique plan_key and insert
        let planKey: string =
          (product.metadata?.plan_key as string | undefined)?.trim() || slugify(product.name)
        if (usedPlanKeys.has(planKey)) {
          let n = 2
          while (usedPlanKeys.has(`${planKey}_${n}`)) n++
          planKey = `${planKey}_${n}`
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

        await query(
          `INSERT INTO public.pricing_plans
             (plan_key, name, upfront, monthly, pages, features,
              stripe_setup_product_id, stripe_monthly_product_id,
              stripe_upfront_price_id, stripe_monthly_price_id,
              product_type, visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, true, $12)
           ON CONFLICT (plan_key) DO UPDATE SET
             name                      = EXCLUDED.name,
             upfront                   = EXCLUDED.upfront,
             monthly                   = EXCLUDED.monthly,
             stripe_setup_product_id   = COALESCE(EXCLUDED.stripe_setup_product_id,   pricing_plans.stripe_setup_product_id),
             stripe_monthly_product_id = COALESCE(EXCLUDED.stripe_monthly_product_id, pricing_plans.stripe_monthly_product_id),
             stripe_upfront_price_id   = COALESCE(EXCLUDED.stripe_upfront_price_id,   pricing_plans.stripe_upfront_price_id),
             stripe_monthly_price_id   = COALESCE(EXCLUDED.stripe_monthly_price_id,   pricing_plans.stripe_monthly_price_id),
             product_type              = EXCLUDED.product_type,
             updated_at                = now()`,
          [
            planKey,
            product.name,
            upfront,
            monthly,
            pages,
            JSON.stringify(features),
            hasOneTime ? product.id : null,
            hasMonthly ? product.id : null,
            upfrontPrice?.id ?? null,
            monthlyPrice?.id ?? null,
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
          classified_by: source,
          upfront,
          monthly,
          upfront_price_id: upfrontPrice?.id ?? null,
          monthly_price_id: monthlyPrice?.id ?? null,
        })
      }
    }

    // 4 — Detect orphaned DB records (linked product no longer active in Stripe)
    const orphaned = existing
      .filter((row) => {
        const isLinked = !!(row.stripe_setup_product_id || row.stripe_monthly_product_id)
        if (!isLinked) return false
        const setupOk = row.stripe_setup_product_id ? syncedProductIds.has(row.stripe_setup_product_id) : false
        const monthlyOk = row.stripe_monthly_product_id ? syncedProductIds.has(row.stripe_monthly_product_id) : false
        return !setupOk && !monthlyOk
      })
      .map((row) => ({
        plan_key: row.plan_key,
        stripe_setup_product_id: row.stripe_setup_product_id,
        stripe_monthly_product_id: row.stripe_monthly_product_id,
      }))

    return NextResponse.json({ synced: results.length, results, skipped, orphaned })
  } catch (err) {
    console.error('[pricing/sync] POST failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed.' },
      { status: 500 }
    )
  }
}

// Keep api_keys table in sync so the Stripe checkout flow has current price IDs.
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
