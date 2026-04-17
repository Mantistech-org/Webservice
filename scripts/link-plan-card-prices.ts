/**
 * link-plan-card-prices.ts
 * One-time script: reads the Stripe Price IDs for Platform Only and Platform Plus
 * from the Supabase api_keys table (via direct pg), confirms each amount from Stripe,
 * then writes monthly_price_id + monthly_amount to the matching plan_cards rows.
 *
 * Run: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/link-plan-card-prices.ts
 */

import { Pool } from 'pg'
import Stripe from 'stripe'

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!SUPABASE_DB_URL) {
  console.error('ERROR: SUPABASE_DB_URL is not set.')
  process.exit(1)
}
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set.')
  process.exit(1)
}

const pool = new Pool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

const PLANS = [
  {
    planName: 'Mantis Tech Platform Only',
    service: 'stripe_price_platform_monthly',
  },
  {
    planName: 'Mantis Tech Platform Plus',
    service: 'stripe_price_platform-plus_monthly',
  },
]

async function main() {
  console.log('=== link-plan-card-prices ===\n')

  for (const plan of PLANS) {
    console.log(`--- ${plan.planName} ---`)

    // 1. Read Price ID from api_keys
    const keyRows = await pool.query(
      `SELECT key_value FROM public.api_keys WHERE scope = 'admin' AND service = $1`,
      [plan.service]
    )
    if (keyRows.rowCount === 0 || !keyRows.rows[0].key_value) {
      console.log(`  SKIP: no api_keys row found for service "${plan.service}"`)
      continue
    }
    const priceId: string = keyRows.rows[0].key_value
    console.log(`  Price ID from api_keys: ${priceId}`)

    // 2. Confirm amount from Stripe
    let confirmedAmount: number
    try {
      const price = await stripe.prices.retrieve(priceId)
      if (price.unit_amount == null || price.unit_amount <= 0) {
        console.log(`  SKIP: Stripe returned invalid unit_amount (${price.unit_amount})`)
        continue
      }
      confirmedAmount = price.unit_amount / 100
      console.log(`  Stripe confirmed: $${confirmedAmount.toFixed(2)}/month`)
    } catch (err) {
      console.log(`  SKIP: Stripe error — ${err instanceof Error ? err.message : String(err)}`)
      continue
    }

    // 3. Find the plan_cards row
    const cardRows = await pool.query(
      `SELECT id, plan_name, monthly_price_id, monthly_amount FROM public.plan_cards WHERE plan_name = $1`,
      [plan.planName]
    )
    if (cardRows.rowCount === 0) {
      console.log(`  SKIP: no plan_cards row found with plan_name = "${plan.planName}"`)
      continue
    }
    const card = cardRows.rows[0]
    console.log(`  Found plan_cards row: ${card.id}`)

    // 4. Update
    await pool.query(
      `UPDATE public.plan_cards
       SET monthly_price_id = $2, monthly_amount = $3, updated_at = now()
       WHERE id = $1`,
      [card.id, priceId, confirmedAmount]
    )
    console.log(`  Updated: monthly_price_id = ${priceId}, monthly_amount = ${confirmedAmount}`)
    console.log()
  }

  // Final state
  console.log('=== Final plan_cards state ===')
  const final = await pool.query(
    `SELECT plan_name, monthly_price_id, monthly_amount, setup_price_id, setup_amount, visible
     FROM public.plan_cards ORDER BY sort_order`
  )
  for (const row of final.rows) {
    console.log(`  ${row.plan_name}`)
    console.log(`    monthly: $${row.monthly_amount ?? 'null'} — ${row.monthly_price_id ?? 'not linked'}`)
    console.log(`    setup:   $${row.setup_amount ?? 'null'} — ${row.setup_price_id ?? 'not linked'}`)
    console.log(`    visible: ${row.visible}`)
  }

  await pool.end()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  pool.end()
  process.exit(1)
})
