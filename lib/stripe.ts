import Stripe from 'stripe'
import { Plan } from '@/types'
import { getApiKey } from '@/lib/api-keys'

// Module-level stripe instance for synchronous uses (e.g. webhook signature verification).
// Always initialized from the Railway environment variable so it is available immediately.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
  apiVersion: '2023-10-16',
})

// Async stripe client that prefers the Supabase-stored key over the env var.
// Used for all API calls (checkout sessions, billing portal, etc.).
let _stripeClient: Stripe | null = null
export async function getStripe(): Promise<Stripe> {
  if (!_stripeClient) {
    const key = await getApiKey('stripe_secret')
    _stripeClient = new Stripe(key || 'placeholder', { apiVersion: '2023-10-16' })
  }
  return _stripeClient
}

const ADDON_SERVICE_MAP: Record<string, string> = {
  'review-management':       'stripe_price_addon_review_management',
  'social-media-automation': 'stripe_price_addon_social_media',
  'lead-generation':         'stripe_price_addon_lead_generation',
  'seo-optimization':        'stripe_price_addon_seo_optimization',
  'ecommerce-automation':    'stripe_price_addon_ecommerce',
  'ad-creative-generation':  'stripe_price_addon_ad_creative',
  'website-chatbot':         'stripe_price_addon_chatbot',
  'email-marketing':         'stripe_price_addon_email_marketing',
  'email-with-domain':       'stripe_price_addon_email_domain',
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
  const s = await getStripe()

  const monthlyPriceId = await getApiKey(`stripe_price_${plan}_monthly`)
  if (!monthlyPriceId) {
    throw new Error(`No Stripe monthly price ID configured for plan: ${plan}`)
  }

  const upfrontPriceId = await getApiKey(`stripe_price_${plan}_upfront`)
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  if (upfrontPriceId) lineItems.push({ price: upfrontPriceId, quantity: 1 })
  lineItems.push({ price: monthlyPriceId, quantity: 1 })

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: lineItems,
    metadata: { projectId, clientToken, businessName, plan, type: 'plan' },
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
  const s = await getStripe()

  const priceService = ADDON_SERVICE_MAP[addonId]
  const priceId = priceService ? await getApiKey(priceService) : ''
  if (!priceId) {
    throw new Error(`No Stripe price ID configured for addon: ${addonId}`)
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { projectId, clientToken, addonId, addonLabel, type: 'addon' },
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
  const s = await getStripe()

  const monthlyPriceId = await getApiKey(`stripe_price_${newPlan}_monthly`)
  if (!monthlyPriceId) {
    throw new Error(`No Stripe monthly price ID configured for plan: ${newPlan}`)
  }

  const upfrontPriceId = await getApiKey(`stripe_price_${newPlan}_upfront`)
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  if (upfrontPriceId) lineItems.push({ price: upfrontPriceId, quantity: 1 })
  lineItems.push({ price: monthlyPriceId, quantity: 1 })

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: lineItems,
    metadata: { projectId, clientToken, businessName, plan: newPlan, type: 'upgrade' },
    success_url: `${BASE_URL}/client/dashboard/${clientToken}?upgrade=success`,
    cancel_url: `${BASE_URL}/client/dashboard/${clientToken}`,
  })

  return session.url ?? ''
}
