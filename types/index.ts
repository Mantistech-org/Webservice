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

  // Domain
  domainStatus?: 'existing' | 'new'
  existingDomain?: string
  preferredDomain?: string
  wantsProfessionalEmail?: boolean

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
  { id: 'email-with-domain', label: 'Email with Domain', price: 12, description: 'A professional email address at your own domain builds trust instantly. We set it up and manage it so you always look established and credible.' },
  { id: 'review-management', label: 'Review Management', price: 19, description: 'Most customers check reviews before choosing a business. We automatically filter your best reviews and post them to Google, building your reputation on autopilot while keeping negative feedback private until you can address it.' },
  { id: 'social-media-automation', label: 'Social Media Automation', price: 24, description: 'Staying active on social media is a full time job. Upload a photo and we handle the rest, turning it into a polished ad and posting it across all your platforms automatically.' },
  { id: 'lead-generation', label: 'Automated Lead Generation and Outreach', price: 30, description: 'We find and compile targeted lists of potential customers that match your ideal client profile, including contact information and business details. Add Automated Email Marketing to enable full automated outreach to these lists.' },
  { id: 'seo-optimization', label: 'SEO Optimization', price: 25, description: 'If customers cannot find you on Google, they are finding your competitors instead. We continuously optimize your site so you rank higher in local search results and stay there.' },
  { id: 'ecommerce-automation', label: 'E-Commerce Automation', price: 34, description: 'Fully automates your inventory management including in-store inventory when linked to your point of sale system, plus order fulfillment, tracking updates, and customer notifications.' },
  { id: 'ad-creative-generation', label: 'Ad Creative Generation', price: 19, description: 'Fully automates creating and running ads across all major platforms including Facebook, Instagram, and Google. Upload a photo or product and ads are created, targeted, and published automatically.' },
  { id: 'website-chatbot', label: 'Website Chatbot', price: 15, description: 'Most visitors leave without contacting you. Our chatbot engages them instantly, answers common questions and captures their information so you never miss a lead, even at 2am.' },
  { id: 'email-marketing', label: 'Automated Email Marketing', price: 15, description: 'Sends automated email campaigns to your contact lists, including lead lists generated through the Automated Lead Generation service. When paired with Lead Generation, this enables fully automated prospecting and outreach.' },
]

export const PLAN_INCLUDED_ADDONS: Record<Plan, string[]> = {
  starter: [],
  mid: ['review-management', 'social-media-automation', 'seo-optimization', 'ad-creative-generation'],
  pro: ['review-management', 'social-media-automation', 'lead-generation', 'seo-optimization', 'ecommerce-automation', 'ad-creative-generation', 'website-chatbot', 'email-marketing', 'email-with-domain'],
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
      'Booking Calendar included free',
      'Custom website',
      'Hosting and domain',
      'Monthly performance report',
    ],
  },
  mid: {
    name: 'Growth',
    upfront: 150,
    monthly: 125,
    pages: 6,
    features: [
      'Booking Calendar included free',
      'Everything in Starter',
      'Social Media Automation',
      'Review Management',
      'SEO Optimization',
      'Ad Creative Generation',
    ],
  },
  pro: {
    name: 'Pro',
    upfront: 200,
    monthly: 250,
    pages: 9,
    features: [
      'Booking Calendar included free',
      'Everything in Growth',
      'E-Commerce Automation',
      'Automated Lead Generation',
      'Website Chatbot',
      'Automated Email Marketing',
    ],
  },
} as const
