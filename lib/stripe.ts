import Stripe from 'stripe'
import { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
  apiVersion: '2023-10-16',
})

const MONTHLY_PRICE_IDS: Record<Plan, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
  mid: process.env.STRIPE_PRICE_MID_MONTHLY ?? '',
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '',
}

const UPFRONT_PRICE_IDS: Record<Plan, string> = {
  starter: process.env.STRIPE_PRICE_STARTER_UPFRONT ?? '',
  mid: process.env.STRIPE_PRICE_MID_UPFRONT ?? '',
  pro: process.env.STRIPE_PRICE_PRO_UPFRONT ?? '',
}

const ADDON_PRICE_IDS: Record<string, string> = {
  'review-management': process.env.STRIPE_PRICE_ADDON_REVIEW_MANAGEMENT ?? '',
  'social-media-automation': process.env.STRIPE_PRICE_ADDON_SOCIAL_MEDIA ?? '',
  'lead-generation': process.env.STRIPE_PRICE_ADDON_LEAD_GENERATION ?? '',
  'seo-optimization': process.env.STRIPE_PRICE_ADDON_SEO_OPTIMIZATION ?? '',
  'ecommerce-automation': process.env.STRIPE_PRICE_ADDON_ECOMMERCE ?? '',
  'ad-creative-generation': process.env.STRIPE_PRICE_ADDON_AD_CREATIVE ?? '',
  'website-chatbot': process.env.STRIPE_PRICE_ADDON_CHATBOT ?? '',
  'email-marketing': process.env.STRIPE_PRICE_ADDON_EMAIL_MARKETING ?? '',
  'email-with-domain': process.env.STRIPE_PRICE_ADDON_EMAIL_DOMAIN ?? '',
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

  const monthlyPriceId = MONTHLY_PRICE_IDS[plan]
  if (!monthlyPriceId) {
    throw new Error(`No Stripe monthly price ID configured for plan: ${plan}`)
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  const upfrontPriceId = UPFRONT_PRICE_IDS[plan]
  if (upfrontPriceId) {
    lineItems.push({ price: upfrontPriceId, quantity: 1 })
  }

  lineItems.push({ price: monthlyPriceId, quantity: 1 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: lineItems,
    metadata: {
      projectId,
      clientToken,
      businessName,
      plan,
      type: 'plan',
    },
    success_url: `${BASE_URL}/client/dashboard/${clientToken}?payment=success`,
    cancel_url: `${BASE_URL}/client/review/${clientToken}?payment=cancelled`,
  })

  return session.url ?? ''
}

export async function createAddonCheckoutSession(params: {
  projectId: string
  clientToken: string
  addonId: string
  addonLabel: string
  email: string
}): Promise<string> {
  const { projectId, clientToken, addonId, addonLabel, email } = params

  const priceId = ADDON_PRICE_IDS[addonId]
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for addon: ${addonId}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      projectId,
      clientToken,
      addonId,
      addonLabel,
      type: 'addon',
    },
    success_url: `${BASE_URL}/client/dashboard/${clientToken}?addon=success`,
    cancel_url: `${BASE_URL}/client/dashboard/${clientToken}`,
  })

  return session.url ?? ''
}

export async function createPlanUpgradeCheckoutSession(params: {
  projectId: string
  clientToken: string
  newPlan: Plan
  businessName: string
  email: string
}): Promise<string> {
  const { projectId, clientToken, newPlan, businessName, email } = params

  const monthlyPriceId = MONTHLY_PRICE_IDS[newPlan]
  if (!monthlyPriceId) {
    throw new Error(`No Stripe monthly price ID configured for plan: ${newPlan}`)
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  const upfrontPriceId = UPFRONT_PRICE_IDS[newPlan]
  if (upfrontPriceId) {
    lineItems.push({ price: upfrontPriceId, quantity: 1 })
  }

  lineItems.push({ price: monthlyPriceId, quantity: 1 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: lineItems,
    metadata: {
      projectId,
      clientToken,
      businessName,
      plan: newPlan,
      type: 'upgrade',
    },
    success_url: `${BASE_URL}/client/dashboard/${clientToken}?upgrade=success`,
    cancel_url: `${BASE_URL}/client/dashboard/${clientToken}`,
  })

  return session.url ?? ''
}
