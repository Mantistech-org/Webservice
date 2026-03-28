import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

// POST /api/admin/projects/[id]/discount
// Applies a Stripe coupon to a specific client's customer or subscription.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { coupon_id } = (await req.json()) as { coupon_id?: string }

  if (!coupon_id?.trim()) {
    return NextResponse.json({ error: 'coupon_id is required.' }, { status: 400 })
  }

  const project = await getProject(id)
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  if (!project.stripeCustomerId && !project.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'This client has no active Stripe subscription to discount.' },
      { status: 422 }
    )
  }

  try {
    const stripe = await getStripe()

    if (project.stripeCustomerId) {
      // Customer-level coupon applies to all current and future invoices
      await stripe.customers.update(project.stripeCustomerId, {
        coupon: coupon_id.trim(),
      })
    } else if (project.stripeSubscriptionId) {
      // Fall back to subscription-level if no customer ID stored
      await stripe.subscriptions.update(project.stripeSubscriptionId, {
        coupon: coupon_id.trim(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[projects/discount] POST failed:', err)
    const msg = err instanceof Error ? err.message : 'Failed to apply discount.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
