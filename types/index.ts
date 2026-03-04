export type ProjectStatus =
  | 'admin_review'
  | 'client_review'
  | 'changes_requested'
  | 'active'

export type Plan = 'starter' | 'growth' | 'pro'

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

  // Generated website
  generatedHtml: string

  // Admin
  adminNotes: string

  // Payment
  stripeSessionId?: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string

  // Uploaded files (relative paths under /uploads)
  uploadedFiles: string[]
}

export interface Addon {
  id: string
  label: string
  price: number
}

export const ADDONS: Addon[] = [
  { id: 'online-booking', label: 'Online Booking', price: 49 },
  { id: 'ai-ads', label: 'AI Ad Generation', price: 79 },
  { id: 'social-automation', label: 'Social Media Automation', price: 69 },
  { id: 'ecommerce', label: 'E-Commerce', price: 99 },
  { id: 'seo', label: 'SEO Optimization', price: 59 },
  { id: 'ai-chatbot', label: 'AI Chatbot', price: 49 },
  { id: 'analytics', label: 'Monthly Analytics', price: 39 },
  { id: 'review-management', label: 'AI Review Management', price: 49 },
  { id: 'email-marketing', label: 'Email Marketing', price: 29 },
  { id: 'loyalty-program', label: 'Customer Loyalty Program', price: 39 },
]

export const PLANS = {
  starter: { name: 'Starter', upfront: 100, monthly: 50 },
  growth: { name: 'Growth', upfront: 200, monthly: 100 },
  pro: { name: 'Pro', upfront: 300, monthly: 150 },
} as const

export const BASE_MONTHLY = 50
