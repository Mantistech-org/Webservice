export type ProjectStatus =
  | 'admin_review'
  | 'client_review'
  | 'changes_requested'
  | 'active'
  | 'generating'

export type Plan = 'platform' | 'platform-plus'

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
  specificFeatures: string
  additionalNotes: string
  addons: string[]
  plan: Plan

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

export const ADDONS: Addon[] = []

export const PLAN_INCLUDED_ADDONS: Record<Plan, string[]> = {
  'platform': [],
  'platform-plus': [],
}

export const PLAN_PAGE_LIMITS: Record<Plan, number> = {
  'platform': 0,
  'platform-plus': 0,
}

export const PLANS = {
  'platform': {
    name: 'Platform Only',
    upfront: 0,
    monthly: 199,
    pages: 0,
    features: [
      'Weather Activation System',
      'Booking Calendar',
      'Review Management',
      'SMS and Text Marketing',
      'Automated Email Marketing',
      'Missed Call Auto-Reply',
      'Google Business Profile Management',
      'Monthly Performance Report',
      'AI Content Assistant',
    ],
  },
  'platform-plus': {
    name: 'Platform Plus Website',
    upfront: 0,
    monthly: 299,
    pages: 0,
    features: [
      'Everything in Platform Only',
      'CRM',
      'AI Voice Agent',
      'SEO Optimization',
      'Custom HVAC Website (48-hour build)',
      'Fast, mobile-optimized, built to rank',
      'Connected to every platform tool from day one',
      'Unlimited content updates',
      'Invoicing System',
      'Proposal Generator',
    ],
  },
} as const
