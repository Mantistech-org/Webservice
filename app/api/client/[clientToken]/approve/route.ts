import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status !== 'client_review') {
    return NextResponse.json({ error: 'Project is not ready for client approval' }, { status: 400 })
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
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}
