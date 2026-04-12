import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    const checkoutUrl = await createCheckoutSession({
      projectId: project.id,
      clientToken: project.clientToken,
      plan: project.plan,
      businessName: project.businessName,
      email: project.email,
    })

    return NextResponse.json({ success: true, checkoutUrl })
  } catch (error) {
    console.error('[subscribe] Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}
