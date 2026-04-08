/**
 * link-plan-cards.js
 *
 * Fetches all active Stripe products + prices, fuzzy-matches them to
 * plan_cards rows in Supabase, then saves the confirmed price IDs and
 * amounts. Read-only against Stripe. Writes only to plan_cards in Supabase.
 *
 * Usage (set env vars first, then run):
 *   node scripts/link-plan-cards.js
 */

const path = require('path')

// ── Resolve packages from project root node_modules ──────────────────────────
const resolve = (pkg) => require(require.resolve(pkg, { paths: [path.join(__dirname, '..')] }))
const Stripe   = resolve('stripe')
const { Pool } = resolve('pg')

// ── Credentials ───────────────────────────────────────────────────────────────
const STRIPE_KEY  = process.env.STRIPE_SECRET_KEY
const DB_URL      = process.env.SUPABASE_DB_URL

if (!STRIPE_KEY) { console.error('ERROR: STRIPE_SECRET_KEY is not set.'); process.exit(1) }
if (!DB_URL)     { console.error('ERROR: SUPABASE_DB_URL is not set.');    process.exit(1) }

// ── Helpers ───────────────────────────────────────────────────────────────────
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-06-20' })
const pool   = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })

// Paginate any Stripe list endpoint
async function listAll(fetcher) {
  const items = []
  let startingAfter
  while (true) {
    const page = await fetcher(startingAfter)
    items.push(...page.data)
    if (!page.has_more || page.data.length === 0) break
    startingAfter = page.data[page.data.length - 1].id
  }
  return items
}

// Very simple fuzzy score: how many words from `needle` appear in `haystack`
// normalised to lowercase. Longer overlap = higher score.
function fuzzyScore(needle, haystack) {
  const n = needle.toLowerCase()
  const h = haystack.toLowerCase()
  // Exact match is best
  if (n === h) return 1000
  // Count shared words
  const nWords = n.replace(/[()]/g, '').split(/\s+/)
  const hWords = h.replace(/[()]/g, '').split(/\s+/)
  const shared = nWords.filter((w) => hWords.includes(w)).length
  // Penalise length difference
  return shared * 10 - Math.abs(nWords.length - hWords.length)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Stripe → plan_cards linker ===\n')

  // 1 — Load plan cards from Supabase
  const { rows: cards } = await pool.query(
    'SELECT * FROM public.plan_cards ORDER BY sort_order ASC'
  )
  console.log(`Loaded ${cards.length} plan cards from Supabase:`)
  for (const c of cards) console.log(`  [${c.id.slice(0,8)}]  "${c.plan_name}"`)

  // 2 — Fetch all active Stripe products
  console.log('\nFetching active Stripe products...')
  const products = await listAll((after) =>
    stripe.products.list({ active: true, limit: 100, ...(after ? { starting_after: after } : {}) })
  )
  console.log(`Found ${products.length} active products in Stripe:`)
  for (const p of products) console.log(`  [${p.id}]  "${p.name}"`)

  // 3 — Fetch prices for every product
  console.log('\nFetching prices for each product...')
  const productPrices = {}
  for (const product of products) {
    const prices = await listAll((after) =>
      stripe.prices.list({
        product: product.id, active: true, limit: 100,
        ...(after ? { starting_after: after } : {}),
      })
    )
    productPrices[product.id] = prices.filter((p) => p.currency === 'usd')
  }

  // 4 — Match each plan card to the best-scoring Stripe product
  console.log('\n=== Matching plan cards to Stripe products ===\n')
  const linked   = []
  const skipped  = []

  for (const card of cards) {
    // Score every Stripe product against this card name
    const scored = products.map((p) => ({
      product: p,
      score: fuzzyScore(card.plan_name, p.name),
    })).sort((a, b) => b.score - a.score)

    const best = scored[0]

    // Require at least one shared word
    if (!best || best.score <= 0) {
      skipped.push({ card, reason: 'No Stripe product scored above 0.' })
      console.log(`  NO MATCH  "${card.plan_name}"`)
      continue
    }

    const product = best.product
    const prices  = productPrices[product.id] || []

    console.log(`  MATCHED  "${card.plan_name}"`)
    console.log(`       -->  "${product.name}"  [${product.id}]  (score ${best.score})`)

    // Identify prices
    const oneTimePrices = prices
      .filter((p) => p.type === 'one_time' && (p.unit_amount ?? 0) > 100)
      .sort((a, b) => b.created - a.created)

    const monthlyPrices = prices
      .filter((p) => p.type === 'recurring' && p.recurring?.interval === 'month')
      .sort((a, b) => b.created - a.created)

    // Prefer default_price within each set
    const defaultId = typeof product.default_price === 'string'
      ? product.default_price
      : product.default_price?.id ?? null

    const pickPrice = (list) => {
      if (list.length === 0) return null
      const def = defaultId ? list.find((p) => p.id === defaultId) : null
      return def || list[0]
    }

    const setupPrice   = pickPrice(oneTimePrices)
    const monthlyPrice = pickPrice(monthlyPrices)

    if (setupPrice) {
      const amt = setupPrice.unit_amount / 100
      console.log(`           setup:   ${setupPrice.id}  $${amt}`)
    } else {
      console.log(`           setup:   (none — no one-time USD price > $1)`)
    }

    if (monthlyPrice) {
      const amt = monthlyPrice.unit_amount / 100
      console.log(`           monthly: ${monthlyPrice.id}  $${amt}/month`)
    } else {
      console.log(`           monthly: (none — no recurring monthly USD price)`)
    }

    if (!setupPrice && !monthlyPrice) {
      skipped.push({ card, reason: `Matched "${product.name}" but found no usable prices.` })
      continue
    }

    // 5 — Write to Supabase
    const updates = []
    const values  = [card.id]
    let   idx     = 2

    if (setupPrice) {
      updates.push(`setup_price_id = $${idx++}, setup_amount = $${idx++}`)
      values.push(setupPrice.id, setupPrice.unit_amount / 100)
    }
    if (monthlyPrice) {
      updates.push(`monthly_price_id = $${idx++}, monthly_amount = $${idx++}`)
      values.push(monthlyPrice.id, monthlyPrice.unit_amount / 100)
    }
    updates.push('updated_at = now()')

    await pool.query(
      `UPDATE public.plan_cards SET ${updates.join(', ')} WHERE id = $1`,
      values
    )

    linked.push({
      plan_name:        card.plan_name,
      stripe_product:   product.name,
      setup_price_id:   setupPrice?.id   ?? null,
      setup_amount:     setupPrice   ? setupPrice.unit_amount   / 100 : null,
      monthly_price_id: monthlyPrice?.id ?? null,
      monthly_amount:   monthlyPrice ? monthlyPrice.unit_amount / 100 : null,
    })
  }

  // 6 — Final report
  console.log('\n=== Final Report ===\n')

  if (linked.length > 0) {
    console.log('LINKED:')
    for (const r of linked) {
      console.log(`  "${r.plan_name}"  <--  "${r.stripe_product}"`)
      if (r.setup_price_id)   console.log(`      setup:   ${r.setup_price_id}   $${r.setup_amount}`)
      if (r.monthly_price_id) console.log(`      monthly: ${r.monthly_price_id}   $${r.monthly_amount}/month`)
    }
  }

  if (skipped.length > 0) {
    console.log('\nSKIPPED:')
    for (const s of skipped) {
      console.log(`  "${s.card.plan_name}" — ${s.reason}`)
    }
  }

  console.log(`\nDone. ${linked.length} card(s) updated, ${skipped.length} skipped.\n`)
  await pool.end()
}

main().catch((err) => {
  console.error('Fatal error:', err.message)
  pool.end()
  process.exit(1)
})
