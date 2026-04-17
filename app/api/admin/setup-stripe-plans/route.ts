import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { getApiKey, invalidateApiKeyCache } from '@/lib/api-keys'

// POST /api/admin/setup-stripe-plans
// One-time route: creates Platform Only and Platform Plus products + prices in Stripe,
// saves the resulting price IDs to Supabase api_keys, then archives old Starter/Growth/Pro prices.
// AUTH TEMPORARILY REMOVED — restore immediately after calling once.
export async function POST() {
  if (!supabaseEnabled) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  try {
    const stripe = await getStripe()
    const log: string[] = []

    // ── 1. Create Stripe products and prices ───────────────────────────────────

    const NEW_PLANS = [
      {
        name: 'Mantis Tech Platform Only',
        service: 'stripe_price_platform_monthly',
        amountCents: 19900,
      },
      {
        name: 'Mantis Tech Platform Plus',
        service: 'stripe_price_platform-plus_monthly',
        amountCents: 29900,
      },
    ]

    const created: Record<string, string> = {}

    for (const plan of NEW_PLANS) {
      const product = await stripe.products.create({
        name: plan.name,
        metadata: { type: 'plan' },
      })
      log.push(`Created product: ${product.name} (${product.id})`)

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amountCents,
        currency: 'usd',
        recurring: { interval: 'month' },
      })
      log.push(`Created price: ${price.id} — $${(plan.amountCents / 100).toFixed(2)}/month`)

      created[plan.service] = price.id
    }

    // ── 2. Save price IDs to Supabase api_keys ─────────────────────────────────

    const rows = Object.entries(created).map(([service, key_value]) => ({
      scope: 'admin',
      service,
      key_value,
    }))

    const { error: upsertError } = await supabase
      .from('api_keys')
      .upsert(rows, { onConflict: 'scope,service' })

    if (upsertError) {
      return NextResponse.json(
        { error: `Failed to save price IDs: ${upsertError.message}`, log },
        { status: 500 }
      )
    }

    for (const service of Object.keys(created)) {
      invalidateApiKeyCache(service)
    }
    log.push(`Saved to Supabase: ${Object.keys(created).join(', ')}`)

    // ── 3. Archive old Starter / Growth / Pro prices ───────────────────────────

    const OLD_SERVICES = [
      'stripe_price_starter_monthly',
      'stripe_price_starter_upfront',
      'stripe_price_mid_monthly',
      'stripe_price_mid_upfront',
      'stripe_price_pro_monthly',
      'stripe_price_pro_upfront',
    ]

    for (const service of OLD_SERVICES) {
      const priceId = await getApiKey(service)
      if (!priceId) {
        log.push(`${service}: no price ID found, skipping`)
        continue
      }
      try {
        await stripe.prices.update(priceId, { active: false })
        log.push(`Archived ${service}: ${priceId}`)
      } catch (err) {
        log.push(
          `Failed to archive ${service} (${priceId}): ${err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    console.log('[setup-stripe-plans] Success:', created)
    return NextResponse.json({ ok: true, created, log })
  } catch (err) {
    console.error('[setup-stripe-plans] POST failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Setup failed.' },
      { status: 500 }
    )
  }
}
