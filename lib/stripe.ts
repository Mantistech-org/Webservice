import Stripe from 'stripe'
import { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16',
})

const PRICE_IDS: Record<Plan, string> = {
  starter: process.env.STRIPE_PRICE_STARTER ?? '',
  growth: process.env.STRIPE_PRICE_GROWTH ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function createCheckoutSession(params: {
  projectId: string
  clientToken: string
  plan: Plan
  businessName: string
  email: string
}): Promise<string> {
  const { projectId, clientToken, plan, businessName, email } = params

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for plan: ${plan}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      projectId,
      clientToken,
      businessName,
      plan,
    },
    success_url: `${BASE_URL}/client/review/${clientToken}?payment=success`,
    cancel_url: `${BASE_URL}/client/review/${clientToken}?payment=cancelled`,
  })

  return session.url ?? ''
}
