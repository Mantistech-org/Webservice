import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { readProjects } from '@/lib/db'
import { readDemoSessions } from '@/lib/demo-db'
import { stripe } from '@/lib/stripe'

function monthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function countInRange(dates: string[], start: Date, end: Date): number {
  return dates.filter((d) => {
    const t = new Date(d).getTime()
    return t >= start.getTime() && t <= end.getTime()
  }).length
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thisMonth = monthRange(0)
  const lastMonth = monthRange(-1)

  // ── Projects / intake ──────────────────────────────────────────────────────
  const projects = await readProjects()
  const createdDates = projects.map((p) => p.createdAt)

  const intakeThisMonth = countInRange(createdDates, thisMonth.start, thisMonth.end)
  const intakeLastMonth = countInRange(createdDates, lastMonth.start, lastMonth.end)

  // ── Active clients ─────────────────────────────────────────────────────────
  const activeProjects = projects.filter((p) => p.status === 'active')
  const activeThisMonth = activeProjects.filter((p) => {
    const t = new Date(p.updatedAt).getTime()
    return t >= thisMonth.start.getTime() && t <= thisMonth.end.getTime()
  }).length
  const activeLastMonth = activeProjects.filter((p) => {
    const t = new Date(p.updatedAt).getTime()
    return t >= lastMonth.start.getTime() && t <= lastMonth.end.getTime()
  }).length

  // ── Stripe MRR ─────────────────────────────────────────────────────────────
  let mrrCents = 0
  let stripeMrrLastMonth = 0
  let stripeError: string | null = null

  try {
    // Fetch all active subscriptions (paginate if needed)
    const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
    for (const sub of subs.data) {
      for (const item of sub.items.data) {
        const price = item.price
        if (!price.unit_amount) continue
        // Normalize to monthly
        const interval = price.recurring?.interval
        const count = price.recurring?.interval_count ?? 1
        let monthly = price.unit_amount * (item.quantity ?? 1)
        if (interval === 'year') monthly = Math.round(monthly / 12)
        else if (interval === 'week') monthly = Math.round(monthly * 4.33)
        else if (interval === 'day') monthly = Math.round(monthly * 30)
        else monthly = Math.round(monthly / count) // handle interval_count > 1
        mrrCents += monthly
      }
    }
    stripeMrrLastMonth = mrrCents // We don't have historical MRR from Stripe easily, use same for now
  } catch {
    stripeError = 'Stripe not configured or unreachable'
  }

  const mrrDollars = Math.round(mrrCents / 100)

  // ── Demo sessions ──────────────────────────────────────────────────────────
  const demoSessions = readDemoSessions()
  const demoCreatedDates = demoSessions.map((s) => s.createdAt)
  const demoThisMonth = countInRange(demoCreatedDates, thisMonth.start, thisMonth.end)
  const demoLastMonth = countInRange(demoCreatedDates, lastMonth.start, lastMonth.end)

  // ── Leads (upsell clicks across all projects as proxy) ────────────────────
  // Real lead data would come from a separate leads table.
  // For now we expose the count of projects that have upsell clicks as "lead signals".
  const projectsWithLeadActivity = projects.filter(
    (p) => (p.upsellClicks?.length ?? 0) > 0
  )
  const leadsThisMonth = countInRange(
    projectsWithLeadActivity.map((p) => p.updatedAt),
    thisMonth.start,
    thisMonth.end
  )
  const leadsLastMonth = countInRange(
    projectsWithLeadActivity.map((p) => p.updatedAt),
    lastMonth.start,
    lastMonth.end
  )

  return NextResponse.json({
    intake: { thisMonth: intakeThisMonth, lastMonth: intakeLastMonth },
    active: { total: activeProjects.length, thisMonth: activeThisMonth, lastMonth: activeLastMonth },
    mrr: { dollars: mrrDollars, stripeError },
    demo: { thisMonth: demoThisMonth, lastMonth: demoLastMonth, total: demoSessions.length },
    leads: { thisMonth: leadsThisMonth, lastMonth: leadsLastMonth },
    totals: { projects: projects.length },
  })
}
