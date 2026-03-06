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
  customAddons?: CustomAddon[]
  referredBy?: string
  referralRewardGranted?: boolean
}

export interface CustomAddon {
  id: string
  name: string
  description: string
  budget: string
  status: 'pending' | 'priced' | 'accepted' | 'declined'
  monthlyPrice?: number
  createdAt: string
  respondedAt?: string
}

export interface Addon {
  id: string
  label: string
  price: number
  description: string
}

export const ADDONS: Addon[] = [
  { id: 'review-management', label: 'Review Management', price: 19, description: 'Most customers check reviews before choosing a business. We automatically filter your best reviews and post them to Google, building your reputation on autopilot while keeping negative feedback private until you can address it.' },
  { id: 'social-media-automation', label: 'Social Media Automation', price: 24, description: 'Staying active on social media is a full time job. Upload a photo and we handle the rest, turning it into a polished ad and posting it across all your platforms automatically.' },
  { id: 'lead-generation', label: 'Automated Lead Generation and Outreach', price: 30, description: 'Finding new customers takes time you do not have. We identify businesses that match your ideal client profile and send personalized outreach emails automatically, filling your pipeline without lifting a finger.' },
  { id: 'seo-optimization', label: 'SEO Optimization', price: 25, description: 'If customers cannot find you on Google, they are finding your competitors instead. We continuously optimize your site so you rank higher in local search results and stay there.' },
  { id: 'ecommerce-automation', label: 'E-Commerce Automation', price: 34, description: 'Running an online store manually is exhausting. We automate inventory updates, order fulfillment and customer email follow-ups so your store runs itself around the clock.' },
  { id: 'ad-creative-generation', label: 'Ad Creative Generation', price: 19, description: 'Great ads start with great visuals. Upload your photos and we turn them into professional ad creatives ready to run on Facebook, Instagram and Google.' },
  { id: 'website-chatbot', label: 'Website Chatbot', price: 15, description: 'Most visitors leave without contacting you. Our chatbot engages them instantly, answers common questions and captures their information so you never miss a lead, even at 2am.' },
  { id: 'email-marketing', label: 'Automated Email Marketing', price: 15, description: 'Your existing customers are your best source of revenue. We build and send automated email campaigns that keep your business top of mind and bring customers back without you writing a single email.' },
  { id: 'email-with-domain', label: 'Email with Domain', price: 12, description: 'A professional email address at your own domain builds trust instantly. We set it up and manage it so you always look established and credible.' },
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
      'Custom website',
      'Hosting and domain',
      'Monthly performance report',
      'Booking calendar integration',
    ],
  },
  mid: {
    name: 'Mid',
    upfront: 150,
    monthly: 70,
    pages: 6,
    features: [
      'Everything in Starter',
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
      'Everything in Mid',
      'E-Commerce Automation',
      'Automated Lead Generation and Outreach',
      'Website Chatbot',
      'Automated Email Marketing',
    ],
  },
} as const
