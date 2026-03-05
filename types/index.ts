export type ProjectStatus =
  | 'admin_review'
  | 'client_review'
  | 'changes_requested'
  | 'active'

export type Plan = 'starter' | 'mid' | 'pro'

export interface ChangeRequest {
  id: string
  message: string
  createdAt: string
  adminResponse?: string
  resolvedAt?: string
  status: 'pending' | 'resolved'
}

export interface ClientNotification {
  id: string
  message: string
  createdAt: string
  read: boolean
}

export interface Project {
  id: string
  adminToken: string
  clientToken: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string

  // Form data
  businessName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  location: string
  currentWebsite: string
  businessDescription: string
  primaryGoal: string
  timeline: string
  stylePreference: string
  specificFeatures: string
  additionalNotes: string
  addons: string[]
  plan: Plan
  requestedPages?: number

  // Generated website
  generatedHtml: string

  // Admin
  adminNotes: string

  // Payment
  stripeSessionId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripeAddonSubscriptions?: string[]

  // Uploaded files
  uploadedFiles: string[]

  // Client engagement
  changeRequests?: ChangeRequest[]
  notifications?: ClientNotification[]
  upsellClicks?: string[]
}

export interface Addon {
  id: string
  label: string
  price: number
  description: string
}

export const ADDONS: Addon[] = [
  { id: 'review-management', label: 'Review Management', price: 19, description: 'Auto filters and posts 5 star reviews to Google.' },
  { id: 'social-media-automation', label: 'Social Media Automation', price: 24, description: 'Upload a photo and it posts to all your socials as an ad.' },
  { id: 'lead-generation', label: 'Automated Lead Generation and Outreach', price: 30, description: 'Finds businesses matching your criteria and sends emails automatically.' },
  { id: 'seo-optimization', label: 'SEO Optimization', price: 25, description: 'Keeps your site ranking without you touching it.' },
  { id: 'ecommerce-automation', label: 'E-Commerce Automation', price: 34, description: 'Handles inventory updates, order fulfillment and email marketing automatically.' },
  { id: 'ad-creative-generation', label: 'Ad Creative Generation', price: 19, description: 'Turns your photos into polished ads automatically.' },
  { id: 'website-chatbot', label: 'Website Chatbot', price: 15, description: 'Answers customer questions and captures leads 24/7.' },
  { id: 'email-marketing', label: 'Automated Email Marketing', price: 15, description: 'Scheduled campaigns that run without you.' },
  { id: 'email-with-domain', label: 'Email with Domain', price: 12, description: 'Professional email address at your business domain.' },
]

export const PLAN_INCLUDED_ADDONS: Record<Plan, string[]> = {
  starter: [],
  mid: ['review-management', 'social-media-automation', 'seo-optimization', 'ad-creative-generation'],
  pro: ['review-management', 'social-media-automation', 'lead-generation', 'seo-optimization', 'ecommerce-automation', 'ad-creative-generation', 'website-chatbot', 'email-marketing'],
}

export const PLAN_PAGE_LIMITS: Record<Plan, number> = {
  starter: 4,
  mid: 6,
  pro: 9,
}

export const PLANS = {
  starter: {
    name: 'Starter',
    upfront: 100,
    monthly: 40,
    pages: 4,
    features: [
      'Custom website up to 4 pages',
      'Hosting and domain',
      'Monthly performance report',
      'Automated booking calendar',
    ],
  },
  mid: {
    name: 'Mid',
    upfront: 150,
    monthly: 70,
    pages: 6,
    features: [
      'Custom website up to 6 pages',
      'Hosting and domain',
      'Monthly performance report',
      'Automated booking calendar',
      'Social Media Automation',
      'Review Management',
      'SEO Optimization',
      'Ad Creative Generation',
    ],
  },
  pro: {
    name: 'Pro',
    upfront: 250,
    monthly: 120,
    pages: 9,
    features: [
      'Custom website up to 9 pages',
      'Hosting and domain',
      'Monthly performance report',
      'Automated booking calendar',
      'Social Media Automation',
      'Review Management',
      'SEO Optimization',
      'Ad Creative Generation',
      'E-Commerce Automation',
      'Automated Lead Generation and Outreach',
      'Website Chatbot',
      'Automated Email Marketing',
    ],
  },
} as const
