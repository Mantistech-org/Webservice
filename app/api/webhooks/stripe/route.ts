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
      id: string
      metadata?: {
        projectId?: string
        clientToken?: string
        businessName?: string
        plan?: string
        type?: string
        addonId?: string
        addonLabel?: string
      }
      customer?: string
      subscription?: string
    }

    const { projectId, type, addonId } = session.metadata ?? {}

    if (!projectId) {
      console.error('No projectId in session metadata')
      return NextResponse.json({ received: true })
    }

    const project = await getProject(projectId)
    if (!project) {
      console.error(`Project ${projectId} not found`)
      return NextResponse.json({ received: true })
    }

    if (type === 'addon' && addonId) {
      // Add the addon subscription to the project
      const currentAddons = project.stripeAddonSubscriptions ?? []
      const addonUpdates: Partial<typeof project> = {
        stripeAddonSubscriptions: [...currentAddons, addonId],
        addons: project.addons.includes(addonId) ? project.addons : [...project.addons, addonId],
      }
      // Also activate if not already active
      if (project.status !== 'active') {
        addonUpdates.status = 'active'
        if (typeof session.customer === 'string') addonUpdates.stripeCustomerId = session.customer
      }
      const updatedProject = await updateProject(projectId, addonUpdates)
      if (updatedProject) {
        console.log(`Project ${projectId} addon ${addonId} activated`)
      }
    } else if (type === 'upgrade') {
      // Plan upgrade
      const newPlan = session.metadata?.plan as string | undefined
      const updatedProject = await updateProject(projectId, {
        status: 'active',
        plan: newPlan as 'starter' | 'mid' | 'pro' ?? project.plan,
        stripeSessionId: session.id,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
      })
      if (updatedProject) {
        sendConfirmationEmail({
          businessName: updatedProject.businessName,
          ownerName: updatedProject.ownerName,
          email: updatedProject.email,
          plan: updatedProject.plan,
          clientToken: updatedProject.clientToken,
        }).catch((err) => console.error('Failed to send upgrade confirmation emails:', err))
      }
    } else {
      // Initial plan payment — only activate if not already active to prevent duplicate emails
      if (project.status !== 'active') {
        const updatedProject = await updateProject(projectId, {
          status: 'active',
          stripeSessionId: session.id,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
          stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
        })
        if (updatedProject) {
          sendConfirmationEmail({
            businessName: updatedProject.businessName,
            ownerName: updatedProject.ownerName,
            email: updatedProject.email,
            plan: updatedProject.plan,
            clientToken: updatedProject.clientToken,
          }).catch((err) => console.error('Failed to send confirmation emails:', err))
        }
      } else {
        // Already active — still update stripeCustomerId/sessionId if missing
        await updateProject(projectId, {
          stripeSessionId: session.id,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
