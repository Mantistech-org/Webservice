import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getProject, updateProject } from '@/lib/db'
import { sendConfirmationEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return new NextResponse('Missing stripe-signature header', { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return new NextResponse('Webhook signature verification failed', { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      metadata?: { projectId?: string; businessName?: string; plan?: string }
      customer?: string
      subscription?: string
    }

    const { projectId, businessName: _businessName, plan: _plan } = session.metadata ?? {}

    if (!projectId) {
      console.error('No projectId in session metadata')
      return NextResponse.json({ received: true })
    }

    const project = getProject(projectId)
    if (!project) {
      console.error(`Project ${projectId} not found`)
      return NextResponse.json({ received: true })
    }

    const updatedProject = updateProject(projectId, {
      status: 'active',
      stripeSessionId: (event.data.object as { id: string }).id,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
    })

    if (updatedProject) {
      sendConfirmationEmail({
        businessName: updatedProject.businessName,
        ownerName: updatedProject.ownerName,
        email: updatedProject.email,
        plan: updatedProject.plan,
      }).catch((err) => console.error('Failed to send confirmation emails:', err))
    }
  }

  return NextResponse.json({ received: true })
}
