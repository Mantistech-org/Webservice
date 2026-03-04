import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { createCheckoutSession } from '@/lib/stripe'

// This route is used as a redirect fallback if the client-side POST fails
export async function GET(req: NextRequest) {
  const clientToken = req.nextUrl.searchParams.get('token')
  if (!clientToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const project = getProjectByClientToken(clientToken)
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
    return NextResponse.redirect(checkoutUrl)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}
