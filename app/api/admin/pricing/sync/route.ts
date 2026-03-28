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
  stripe_setup_product_id: string | null
  stripe_monthly_product_id: string | null
  sort_order: number
}

type SyncResult = {
  plan_key: string
  name: string
  action: 'updated' | 'inserted'
  type: 'setup' | 'monthly' | 'mixed'
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
// Fetches all active Stripe products, classifies them as setup (one-time) or monthly (recurring),
// then upserts into pricing_plans using stripe_setup_product_id / stripe_monthly_product_id.
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
      stripe.products.list({ active: true, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
    )

    if (products.length === 0) {
      return NextResponse.json({ synced: 0, results: [], message: 'No active products found in Stripe.' })
    }

    // 2 — Load existing DB records so we can preserve admin-customized fields
    const existing = await query<ExistingPlan>(
      `SELECT id, plan_key, visible, pages, features,
              stripe_setup_product_id, stripe_monthly_product_id, sort_order
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
    let sortCounter = existing.length

    // 3 — Process each product
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

      const monthlyPrices = usdPrices
        .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month')
        .sort((a, b) => b.created - a.created)

      const oneTimePrices = usdPrices
        .filter((p) => p.type === 'one_time')
        .sort((a, b) => b.created - a.created)

      const hasMonthly = monthlyPrices.length > 0
      const hasOneTime = oneTimePrices.length > 0

      // Skip products with no recognisable USD prices
      if (!hasMonthly && !hasOneTime) {
        console.log(`[pricing/sync] Skipping "${product.name}" (${product.id}) — no USD prices found`)
        continue
      }

      const monthlyPrice = monthlyPrices[0] ?? null
      const upfrontPrice = oneTimePrices[0] ?? null
      const monthly = monthlyPrice ? Math.round((monthlyPrice.unit_amount ?? 0) / 100) : 0
      const upfront = upfrontPrice ? Math.round((upfrontPrice.unit_amount ?? 0) / 100) : 0

      // Classify: mixed = has both price types; setup = one-time only; monthly = recurring only
      const productType: 'setup' | 'monthly' | 'mixed' =
        hasOneTime && hasMonthly ? 'mixed' : hasOneTime ? 'setup' : 'monthly'

      // Find existing plan by the relevant product ID column
      const existingRecord =
        existingBySetupId.get(product.id) ?? existingByMonthlyId.get(product.id)

      if (existingRecord) {
        // Build update based on product type
        const setupFields =
          productType === 'setup' || productType === 'mixed'
            ? { stripe_setup_product_id: product.id, upfront, stripe_upfront_price_id: upfrontPrice?.id ?? null }
            : {}

        const monthlyFields =
          productType === 'monthly' || productType === 'mixed'
            ? { stripe_monthly_product_id: product.id, monthly, stripe_monthly_price_id: monthlyPrice?.id ?? null }
            : {}

        await query(
          `UPDATE public.pricing_plans
           SET name                       = $2,
               upfront                    = $3,
               monthly                    = $4,
               stripe_upfront_price_id    = $5,
               stripe_monthly_price_id    = $6,
               stripe_setup_product_id    = COALESCE($7, stripe_setup_product_id),
               stripe_monthly_product_id  = COALESCE($8, stripe_monthly_product_id),
               updated_at                 = now()
           WHERE id = $1`,
          [
            existingRecord.id,
            product.name,
            (setupFields as { upfront?: number }).upfront ?? existingRecord.pages,
            (monthlyFields as { monthly?: number }).monthly ?? 0,
            (setupFields as { stripe_upfront_price_id?: string | null }).stripe_upfront_price_id ?? null,
            (monthlyFields as { stripe_monthly_price_id?: string | null }).stripe_monthly_price_id ?? null,
            (setupFields as { stripe_setup_product_id?: string }).stripe_setup_product_id ?? null,
            (monthlyFields as { stripe_monthly_product_id?: string }).stripe_monthly_product_id ?? null,
          ]
        )

        await syncApiKeys(existingRecord.plan_key, monthlyPrice?.id, upfrontPrice?.id)
        results.push({ plan_key: existingRecord.plan_key, name: product.name, action: 'updated', type: productType })
      } else {
        // New product — generate a unique plan_key
        let planKey: string = (product.metadata?.plan_key as string | undefined)?.trim() || slugify(product.name)

        if (usedPlanKeys.has(planKey)) {
          let counter = 2
          while (usedPlanKeys.has(`${planKey}_${counter}`)) counter++
          planKey = `${planKey}_${counter}`
        }
        usedPlanKeys.add(planKey)

        const pages = product.metadata?.pages ? parseInt(product.metadata.pages as string, 10) || 1 : 1
        let features: string[] = []
        if (product.metadata?.features) {
          try { features = JSON.parse(product.metadata.features as string) as string[] } catch { /* ignore */ }
        }
        if (features.length === 0 && product.description) {
          features = product.description
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        }

        sortCounter++

        // Set the correct product ID column based on price type
        const setupProductId = productType === 'setup' || productType === 'mixed' ? product.id : null
        const monthlyProductId = productType === 'monthly' || productType === 'mixed' ? product.id : null

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
             stripe_setup_product_id   = EXCLUDED.stripe_setup_product_id,
             stripe_monthly_product_id = EXCLUDED.stripe_monthly_product_id,
             stripe_monthly_price_id   = EXCLUDED.stripe_monthly_price_id,
             stripe_upfront_price_id   = EXCLUDED.stripe_upfront_price_id,
             updated_at                = now()`,
          [
            planKey,
            product.name,
            upfront,
            monthly,
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
        results.push({ plan_key: planKey, name: product.name, action: 'inserted', type: productType })
      }
    }

    return NextResponse.json({ synced: results.length, results })
  } catch (err) {
    console.error('[pricing/sync] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Sync failed.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Keep api_keys in sync so the existing Stripe checkout flow stays current.
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
