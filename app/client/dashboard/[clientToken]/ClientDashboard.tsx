'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Demo addon tab components — imported as-is, not modified
import ReviewManagement from '@/components/demo/tabs/ReviewManagement'
import SocialMedia from '@/components/demo/tabs/SocialMedia'
import LeadGeneration from '@/components/demo/tabs/LeadGeneration'
import EmailMarketing from '@/components/demo/tabs/EmailMarketing'
import SEOOptimization from '@/components/demo/tabs/SEOOptimization'
import ECommerceAutomation from '@/components/demo/tabs/ECommerceAutomation'
import AdCreative from '@/components/demo/tabs/AdCreative'
import WebsiteChatbot from '@/components/demo/tabs/WebsiteChatbot'
import CalendarCore from '@/components/calendar/CalendarCore'
import type { DemoContact } from '@/components/demo/DemoPage'

import { PLANS, PLAN_INCLUDED_ADDONS, Plan, ChangeRequest, ClientNotification } from '@/types'
import type { DashboardConfig } from '@/lib/configure-dashboard'

// ── Types ──────────────────────────────────────────────────────────────────────

type ClientView =
  | 'dashboard' | 'website' | 'review' | 'social' | 'leads' | 'email'
  | 'seo' | 'ecommerce' | 'ecommerce-inventory' | 'ecommerce-automations'
  | 'ads' | 'chatbot' | 'calendar' | 'billing'

interface ProjectData {
  id: string
  businessName: string
  ownerName: string
  email: string
  plan: Plan
  status: string
  addons: string[]
  clientToken: string
  hasGeneratedHtml: boolean
  changeRequests: ChangeRequest[]
  notifications: ClientNotification[]
  upsellClicks: string[]
  stripeAddonSubscriptions: string[]
  convertedReferrals?: Array<{ businessName: string; date: string }>
  // Extended fields (available when API is updated)
  existingDomain?: string
  preferredDomain?: string
  updatedAt?: string
}

// ── Icons (replicated from demo Sidebar — not imported to avoid coupling) ──────

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  )
}
function EnvelopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}
function ChartLineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  )
}
function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}
function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Sidebar nav definition ─────────────────────────────────────────────────────

interface SidebarNavItem {
  id: ClientView
  label: string
  icon: React.ReactNode
  addonId?: string
  children?: { id: ClientView; label: string }[]
}

const ALL_SIDEBAR_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard',         icon: <HomeIcon /> },
  { id: 'website',   label: 'My Website',         icon: <GlobeIcon /> },
  { id: 'review',    label: 'Review Management',  icon: <StarIcon />,        addonId: 'review-management' },
  { id: 'social',    label: 'Social Media',       icon: <ShareIcon />,       addonId: 'social-media-automation' },
  { id: 'leads',     label: 'Lead Generation',    icon: <TargetIcon />,      addonId: 'lead-generation' },
  { id: 'email',     label: 'Email Marketing',    icon: <EnvelopeIcon />,    addonId: 'email-marketing' },
  { id: 'seo',       label: 'SEO',                icon: <ChartLineIcon />,   addonId: 'seo-optimization' },
  {
    id: 'ecommerce', label: 'E-Commerce',          icon: <BagIcon />,         addonId: 'ecommerce-automation',
    children: [
      { id: 'ecommerce-inventory',   label: 'Inventory' },
      { id: 'ecommerce-automations', label: 'Automated Emails' },
    ],
  },
  { id: 'chatbot',  label: 'Website Chatbot',      icon: <ChatIcon />,        addonId: 'website-chatbot' },
  { id: 'calendar', label: 'Calendar',             icon: <CalendarIcon /> },
  { id: 'billing',  label: 'Billing',              icon: <CardIcon /> },
]

// ── ClientTopBar ───────────────────────────────────────────────────────────────

interface ClientTopBarProps {
  businessName: string
  unreadCount: number
  onToggleSidebar: () => void
  onNavigate: (page: ClientView) => void
  darkMode: boolean
  onToggleDark: () => void
}

function ClientTopBar({ businessName, unreadCount, onToggleSidebar, onNavigate, darkMode, onToggleDark }: ClientTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = businessName ? businessName[0].toUpperCase() : 'M'

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4 gap-4 border-b transition-colors"
        style={{
          backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5',
          borderColor: darkMode ? '#333333' : '#d8d8d8',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded transition-colors"
          style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
          <span
            className="font-mono font-bold text-sm tracking-widest"
            style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
          >
            MANTIS TECH
          </span>
        </Link>

        <div className="flex-1" />

        {/* Phone */}
        <a
          href="tel:+15016690488"
          className="font-mono text-xs tracking-wider transition-colors"
          style={{ color: darkMode ? '#888888' : '#555555' }}
        >
          (501) 669-0488
        </a>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded transition-colors"
          style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm text-[#1a1a1a] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#00ff88' }}
            aria-label="Account menu"
          >
            {initial}
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2"
                style={{ borderColor: darkMode ? '#1a1a1a' : '#f5f5f5' }}
              />
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-11 w-48 rounded shadow-lg py-1 z-50 border"
              style={{
                backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
                borderColor: darkMode ? '#333333' : '#d8d8d8',
              }}
            >
              <button
                onClick={() => { setDropdownOpen(false); onNavigate('billing') }}
                className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Billing and Plan
              </button>
              <button
                onClick={() => { setDropdownOpen(false); setShowSupport(true) }}
                className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Support
              </button>
              <div className="my-1" style={{ borderTop: `1px solid ${darkMode ? '#333333' : '#e8e8e8'}` }} />
              <Link
                href="/client/login"
                className="block px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
              >
                Sign Out
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Support modal */}
      {showSupport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div
            className="rounded border shadow-xl w-full max-w-sm p-6"
            style={{
              backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
              borderColor: darkMode ? '#333333' : '#d8d8d8',
            }}
          >
            <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-1">Support</div>
            <h2 className="font-heading text-xl mb-3" style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}>Get Help</h2>
            <p className="font-mono text-xs text-[#888888] mb-4 leading-relaxed">
              Our team is available Monday through Friday, 9am to 6pm CT. For urgent issues, email us directly.
            </p>
            <a
              href="mailto:support@mantistech.io"
              className="block w-full text-center font-mono text-xs px-4 py-2.5 rounded transition-colors mb-3"
              style={{
                backgroundColor: darkMode ? '#f0f0f0' : '#1a1a1a',
                color: darkMode ? '#1a1a1a' : '#ffffff',
              }}
            >
              Email support@mantistech.io
            </a>
            <button
              onClick={() => setShowSupport(false)}
              className="w-full font-mono text-xs border px-4 py-2.5 rounded transition-colors"
              style={{ borderColor: darkMode ? '#444444' : '#d0d0d0', color: '#888888' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ── ClientSidebar ─────────────────────────────────────────────────────────────

interface ClientSidebarProps {
  expanded: boolean
  activePage: ClientView
  onNavigate: (page: ClientView) => void
  activeAddonIds: string[]
  darkMode: boolean
}

function ClientSidebar({ expanded, activePage, onNavigate, activeAddonIds, darkMode }: ClientSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleItems = ALL_SIDEBAR_ITEMS.filter(
    (item) => !item.addonId || activeAddonIds.includes(item.addonId)
  )

  return (
    <aside
      className="fixed top-14 left-0 bottom-0 overflow-y-auto overflow-x-hidden z-40 transition-all duration-200 border-r"
      style={{
        width: expanded ? 240 : 64,
        backgroundColor: darkMode ? '#1a1a1a' : '#eeeeee',
        borderColor: darkMode ? '#333333' : '#d8d8d8',
      }}
    >
      <nav className="py-3">
        {visibleItems.map((item) => {
          const hasChildren = !!item.children?.length
          const isActive = activePage === item.id ||
            (item.children?.some((c) => c.id === activePage) ?? false)
          const isOpen = openGroups.has(item.id)

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => {
                  if (hasChildren && expanded) {
                    toggleGroup(item.id)
                  } else {
                    onNavigate(item.id)
                  }
                }}
                title={!expanded ? item.label : undefined}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors duration-150"
                style={isActive
                  ? { backgroundColor: darkMode ? 'rgba(0,255,136,0.10)' : 'rgba(0,255,136,0.15)', color: darkMode ? '#f0f0f0' : '#1a1a1a' }
                  : { color: darkMode ? '#aaaaaa' : '#555555' }
                }
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = darkMode ? '#2a2a2a' : '#e4e4e4'
                    ;(e.currentTarget as HTMLElement).style.color = darkMode ? '#f0f0f0' : '#1a1a1a'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = darkMode ? '#aaaaaa' : '#555555'
                  }
                }}
              >
                <span className={`shrink-0 ${isActive ? 'text-[#00aa55]' : ''}`}>
                  {item.icon}
                </span>
                {expanded && (
                  <>
                    <span className="font-mono text-xs tracking-wide flex-1 text-left truncate">
                      {item.label}
                    </span>
                    {hasChildren && <ChevronDown open={isOpen} />}
                  </>
                )}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r"
                    style={{ backgroundColor: '#00ff88' }}
                  />
                )}
              </button>

              {hasChildren && expanded && isOpen && (
                <div style={{ backgroundColor: darkMode ? '#141414' : '#e8e8e8' }}>
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onNavigate(child.id)}
                      className="w-full flex items-center pl-12 pr-4 py-2 font-mono text-xs transition-colors"
                      style={activePage === child.id
                        ? { color: darkMode ? '#f0f0f0' : '#1a1a1a', backgroundColor: darkMode ? '#222222' : '#dcdcdc' }
                        : { color: darkMode ? '#888888' : '#666666' }
                      }
                      onMouseEnter={e => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = darkMode ? '#2a2a2a' : '#e0e0e0'
                          ;(e.currentTarget as HTMLElement).style.color = darkMode ? '#f0f0f0' : '#1a1a1a'
                        }
                      }}
                      onMouseLeave={e => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = darkMode ? '#888888' : '#666666'
                        }
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}wk ago`
}

interface AnalyticsData {
  leadsThisMonth: number
  leadsLastMonth: number
  recentLeads: Array<{
    id: string
    name: string | null
    email: string | null
    phone: string | null
    created_at: string
  }>
  totalLeads: number
}

interface DashboardPageProps {
  project: ProjectData
  clientToken: string
  darkMode: boolean
  onMarkRead: () => void
  analytics: AnalyticsData | null
  dashConfig: DashboardConfig | null
  welcomeDismissed: boolean
  onDismissWelcome: () => void
}

function DashboardPage({ project, clientToken, darkMode, onMarkRead, analytics, dashConfig, welcomeDismissed, onDismissWelcome }: DashboardPageProps) {
  const bg          = darkMode ? '#1e1e1e' : '#e8e8e8'
  const borderC     = darkMode ? '#333333' : '#d0d0d0'
  const textPrimary = darkMode ? '#f0f0f0' : '#1a1a1a'
  const textMuted   = '#888888'
  const textDim     = darkMode ? '#666666' : '#aaaaaa'

  const unreadNotifications = project.notifications.filter(n => !n.read)

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const pendingRequests = project.changeRequests.filter(r => r.status === 'pending')
  const recentResolved  = project.changeRequests.filter(r =>
    r.status === 'resolved' && r.resolvedAt && new Date(r.resolvedAt).getTime() > thirtyDaysAgo
  )
  const visibleRequests = [...pendingRequests, ...recentResolved]

  const leadsThisMonth = analytics?.leadsThisMonth ?? 0
  const leadsLastMonth = analytics?.leadsLastMonth ?? 0
  const diff = leadsThisMonth - leadsLastMonth
  const leadsChangeStr = diff === 0
    ? 'same as last month'
    : `${diff > 0 ? '+' : ''}${diff} vs last month`
  const recentLeads = analytics?.recentLeads ?? []

  return (
    <div className="space-y-6">
      {/* Welcome message banner — shown once, dismissable */}
      {dashConfig?.welcomeMessage && !welcomeDismissed && (
        <div
          className="rounded border p-4 flex items-start justify-between gap-4"
          style={{
            backgroundColor: darkMode ? 'rgba(0,255,136,0.06)' : 'rgba(0,255,136,0.08)',
            borderColor: 'rgba(0,255,136,0.35)',
          }}
        >
          <p className="font-mono text-xs leading-relaxed flex-1" style={{ color: textPrimary }}>
            {dashConfig.welcomeMessage}
          </p>
          <button
            onClick={onDismissWelcome}
            className="shrink-0 font-mono text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#00ff88', color: '#1a1a1a' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unread notifications banner */}
      {unreadNotifications.length > 0 && (
        <div
          className="rounded border p-4 flex items-start justify-between gap-4"
          style={{
            backgroundColor: darkMode ? 'rgba(0,200,100,0.07)' : 'rgba(0,200,100,0.06)',
            borderColor: 'rgba(0,200,100,0.3)',
          }}
        >
          <div className="space-y-2 flex-1 min-w-0">
            {[...unreadNotifications].reverse().slice(0, 3).map((n) => (
              <div key={n.id}>
                <p className="font-mono text-xs" style={{ color: textPrimary }}>{n.message}</p>
                <p className="font-mono text-xs mt-0.5" style={{ color: textDim }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            {unreadNotifications.length > 3 && (
              <p className="font-mono text-xs" style={{ color: textMuted }}>
                +{unreadNotifications.length - 3} more
              </p>
            )}
          </div>
          <button
            onClick={onMarkRead}
            className="shrink-0 font-mono text-xs px-3 py-1.5 rounded transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#00ff88', color: '#1a1a1a' }}
          >
            Mark read
          </button>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl" style={{ color: textPrimary }}>
          {project.businessName} — Dashboard
        </h1>
        <p className="font-mono text-xs mt-0.5" style={{ color: textMuted }}>
          Welcome back, {project.ownerName}. Last 30 days overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
          <div className="font-mono text-xs tracking-wider uppercase mb-2" style={{ color: textMuted }}>
            Leads Captured
          </div>
          <div className="font-heading text-3xl leading-none mb-1" style={{ color: textPrimary }}>
            {leadsThisMonth}
          </div>
          <div className="font-mono text-xs" style={{ color: diff < 0 ? '#cc4444' : '#00aa55' }}>
            {leadsChangeStr}
          </div>
        </div>
        {[
          'Website Visitors',
          'Reviews This Month',
          'Email Open Rate',
          'Avg SEO Position',
          'Ad Impressions',
        ].map((label) => (
          <div key={label} className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
            <div className="font-mono text-xs tracking-wider uppercase mb-2" style={{ color: textMuted }}>
              {label}
            </div>
            <div className="font-heading text-3xl leading-none mb-1" style={{ color: textPrimary }}>--</div>
            <div className="font-mono text-xs" style={{ color: textDim }}>Coming soon</div>
          </div>
        ))}
      </div>

      {/* Automation Settings — pre-populated from AI config */}
      {dashConfig && (dashConfig.missedCallReply || dashConfig.reviewRequestSms || (dashConfig.smsTemplates?.length > 0)) && (
        <div className="space-y-4">
          <div className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
            Automation Settings
          </div>

          {/* Missed Call Auto-Reply */}
          {dashConfig.missedCallReply && (
            <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
              <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: textMuted }}>
                Missed Call Auto-Reply
              </div>
              <p className="font-mono text-xs mb-3" style={{ color: darkMode ? '#888888' : '#666666' }}>
                This SMS is sent automatically when a customer calls and no one answers.
              </p>
              <div
                className="rounded p-3 font-mono text-xs leading-relaxed"
                style={{
                  backgroundColor: darkMode ? '#252525' : '#f5f5f5',
                  borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
                  border: '1px solid',
                  color: textPrimary,
                }}
              >
                {dashConfig.missedCallReply}
              </div>
              <p className="font-mono text-xs mt-2" style={{ color: textDim }}>
                {dashConfig.missedCallReply.length}/160 characters
              </p>
            </div>
          )}

          {/* Review Request SMS */}
          {dashConfig.reviewRequestSms && (
            <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
              <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: textMuted }}>
                Review Request SMS
              </div>
              <p className="font-mono text-xs mb-3" style={{ color: darkMode ? '#888888' : '#666666' }}>
                Sent to customers after a completed job to request a Google review.
              </p>
              <div
                className="rounded p-3 font-mono text-xs leading-relaxed"
                style={{
                  backgroundColor: darkMode ? '#252525' : '#f5f5f5',
                  border: '1px solid',
                  borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
                  color: textPrimary,
                }}
              >
                {dashConfig.reviewRequestSms}
              </div>
              <p className="font-mono text-xs mt-2" style={{ color: textDim }}>
                {dashConfig.reviewRequestSms.length}/160 characters
              </p>
            </div>
          )}

          {/* Weather Event SMS Templates */}
          {dashConfig.smsTemplates?.length > 0 && (
            <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
              <div className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: textMuted }}>
                Weather Event SMS Templates
              </div>
              <p className="font-mono text-xs mb-4" style={{ color: darkMode ? '#888888' : '#666666' }}>
                SMS blasts triggered by local weather events. Sent to your customer list automatically.
              </p>
              <div className="space-y-3">
                {(['Cold Snap', 'Heat Wave', 'Seasonal Promotion'] as const).map((label, i) => (
                  dashConfig.smsTemplates[i] ? (
                    <div key={label}>
                      <div className="font-mono text-xs mb-1.5" style={{ color: textMuted }}>{label}</div>
                      <div
                        className="rounded p-3 font-mono text-xs leading-relaxed"
                        style={{
                          backgroundColor: darkMode ? '#252525' : '#f5f5f5',
                          border: '1px solid',
                          borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
                          color: textPrimary,
                        }}
                      >
                        {dashConfig.smsTemplates[i]}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Website Traffic Chart */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Website Traffic
        </div>
        <div style={{ height: 100, position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff88" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,88 L400,88" stroke="#00ff88" strokeWidth="1.5" fill="none" strokeOpacity="0.25" />
            <path d="M0,88 L400,88 L400,100 L0,100 Z" fill="url(#trafficGrad)" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs" style={{ color: textDim }}>No traffic data yet</span>
          </div>
        </div>
        <div className="flex justify-between mt-2">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map((m) => (
            <span key={m} className="font-mono text-xs" style={{ color: textDim }}>{m}</span>
          ))}
        </div>
      </div>

      {/* Change requests (pending + recently resolved) */}
      {visibleRequests.length > 0 && (
        <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
          <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
            Change Requests
          </div>
          <div className="space-y-3">
            {visibleRequests.map((req) => (
              <div key={req.id} className="rounded border p-3 space-y-1" style={{ borderColor: borderC }}>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs px-2 py-0.5 rounded-full border"
                    style={req.status === 'resolved'
                      ? { color: '#00aa55', borderColor: 'rgba(0,170,85,0.35)' }
                      : { color: '#cc9900', borderColor: 'rgba(204,153,0,0.35)' }
                    }
                  >
                    {req.status === 'resolved' ? 'Resolved' : 'Pending'}
                  </span>
                  <span className="font-mono text-xs" style={{ color: textDim }}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-mono text-xs" style={{ color: textPrimary }}>{req.message}</p>
                {req.adminResponse && (
                  <div className="rounded p-2 mt-1" style={{ backgroundColor: darkMode ? '#2a2a2a' : '#f0f0f0' }}>
                    <span className="font-mono text-xs text-[#00aa55]">Team response: </span>
                    <span className="font-mono text-xs" style={{ color: textPrimary }}>{req.adminResponse}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leads */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Recent Leads
        </div>
        {recentLeads.length > 0 ? (
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs truncate" style={{ color: textPrimary }}>
                    {lead.name || 'Unknown'}
                  </div>
                  <div className="font-mono text-xs truncate mt-0.5" style={{ color: textDim }}>
                    {lead.email || 'No email'}
                  </div>
                </div>
                <span className="font-mono text-xs shrink-0" style={{ color: textDim }}>
                  {timeAgo(lead.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-xs" style={{ color: textDim }}>
            No leads yet. Your first lead will appear here.
          </p>
        )}
      </div>

      {/* Top Pages */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Top Pages
        </div>
        <p className="font-mono text-xs" style={{ color: textDim }}>
          Page analytics will appear here once traffic data is available.
        </p>
      </div>

      {/* Recent Reviews */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Recent Reviews
        </div>
        <p className="font-mono text-xs" style={{ color: textDim }}>
          No reviews yet. Customer reviews will appear here.
        </p>
      </div>

      {/* Recent Campaigns */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Recent Campaigns
        </div>
        <p className="font-mono text-xs" style={{ color: textDim }}>
          No campaigns yet. Your email and ad campaigns will appear here.
        </p>
      </div>

      {/* Live Site Preview */}
      <div className="rounded overflow-hidden border" style={{ borderColor: borderC }}>
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: bg, borderColor: borderC }}
        >
          <div className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
            Live Site Preview
          </div>
          <span className="font-mono text-xs text-[#00aa55]">Active</span>
        </div>
        <div style={{ height: 240, backgroundColor: darkMode ? '#141414' : '#f0f0f0' }}>
          <iframe
            src={`/api/preview/${clientToken}`}
            className="w-full h-full"
            title={`${project.businessName} preview`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

// ── Website Page ───────────────────────────────────────────────────────────────

interface ClientWebsitePageProps {
  project: ProjectData
  clientToken: string
  darkMode: boolean
  onChangeSubmit: () => void
}

function ClientWebsitePage({ project, clientToken, darkMode, onChangeSubmit }: ClientWebsitePageProps) {
  const [request, setRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return
    setSubmitting(true)
    setSubmitStatus('idle')
    try {
      const res = await fetch(`/api/client/${clientToken}/change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: request }),
      })
      if (res.ok) {
        setSubmitStatus('success')
        setRequest('')
        onChangeSubmit()
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  const bg      = darkMode ? '#1e1e1e' : '#e8e8e8'
  const borderC = darkMode ? '#333333' : '#d0d0d0'
  const textPrimary = darkMode ? '#f0f0f0' : '#1a1a1a'
  const textMuted   = '#888888'

  const domain = project.existingDomain || project.preferredDomain || 'Managed by Mantis Tech'
  const lastUpdated = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Not available'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl" style={{ color: textPrimary }}>My Website</h1>
        <p className="font-mono text-xs mt-0.5" style={{ color: textMuted }}>
          Manage your website and request updates
        </p>
      </div>

      {/* Preview */}
      <div className="rounded overflow-hidden border" style={{ borderColor: borderC }}>
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ backgroundColor: bg, borderColor: borderC }}
        >
          <div className="font-mono text-xs tracking-widest uppercase" style={{ color: textMuted }}>
            Site Preview
          </div>
          <a
            href={`/api/preview/${clientToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs underline transition-opacity hover:opacity-70"
            style={{ color: textMuted }}
          >
            Full screen
          </a>
        </div>
        <div style={{ height: 320, backgroundColor: darkMode ? '#141414' : '#f0f0f0' }}>
          <iframe
            src={`/api/preview/${clientToken}`}
            className="w-full h-full"
            title={`${project.businessName} website`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Request Changes */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Request Changes
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={4}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Describe the change you would like made to your website..."
            className="resize-none w-full font-mono text-sm rounded px-3 py-2.5 mb-3 focus:outline-none border"
            style={{
              backgroundColor: darkMode ? '#252525' : '#f5f5f5',
              borderColor: darkMode ? '#3a3a3a' : '#d0d0d0',
              color: textPrimary,
            }}
          />
          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={submitting || !request.trim()}
              className="font-mono text-xs px-5 py-2.5 rounded tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: textPrimary, color: darkMode ? '#1a1a1a' : '#ffffff' }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            {submitStatus === 'success' && (
              <span className="font-mono text-xs text-[#00aa55]">
                Request submitted. We will be in touch within 24 hours.
              </span>
            )}
            {submitStatus === 'error' && (
              <span className="font-mono text-xs text-red-500">
                Failed to submit. Please try again.
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Site Settings */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Site Settings
        </div>
        <div className="space-y-0">
          {[
            { label: 'Domain',       value: domain },
            { label: 'SSL',          value: 'Active' },
            { label: 'Hosting',      value: 'Managed by Mantis Tech' },
            { label: 'Last Updated', value: lastUpdated },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
              style={{ borderColor: borderC }}
            >
              <span className="font-mono text-xs" style={{ color: textMuted }}>{row.label}</span>
              <span className="font-mono text-xs" style={{ color: textPrimary }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Billing Page ───────────────────────────────────────────────────────────────

interface ClientBillingPageProps {
  project: ProjectData
  clientToken: string
  darkMode: boolean
}

function ClientBillingPage({ project, clientToken, darkMode }: ClientBillingPageProps) {
  const [openingPortal, setOpeningPortal] = useState(false)
  const [portalError, setPortalError] = useState('')

  const plan = PLANS[project.plan]

  const handleManageBilling = async () => {
    setOpeningPortal(true)
    setPortalError('')
    try {
      const res = await fetch(`/api/client/${clientToken}/billing-portal`, { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError(data.error || 'Unable to open billing portal.')
      }
    } catch {
      setPortalError('Unable to open billing portal.')
    } finally {
      setOpeningPortal(false)
    }
  }

  const bg      = darkMode ? '#1e1e1e' : '#e8e8e8'
  const borderC = darkMode ? '#333333' : '#d0d0d0'
  const textPrimary = darkMode ? '#f0f0f0' : '#1a1a1a'
  const textMuted   = '#888888'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl" style={{ color: textPrimary }}>Billing</h1>
        <p className="font-mono text-xs mt-0.5" style={{ color: textMuted }}>
          Manage your subscription and invoices
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Current Plan
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-heading text-2xl mb-1" style={{ color: textPrimary }}>
              {plan.name} Plan
            </div>
            <div className="font-mono text-xs" style={{ color: textMuted }}>
              ${plan.monthly}/month
            </div>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={openingPortal}
            className="shrink-0 font-mono text-xs px-4 py-2 rounded border transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: textPrimary, color: textPrimary }}
          >
            {openingPortal ? 'Loading...' : 'Manage Billing'}
          </button>
        </div>
        {portalError && (
          <p className="font-mono text-xs text-red-500 mt-3">{portalError}</p>
        )}
      </div>

      {/* Invoice History */}
      <div className="rounded border p-5" style={{ backgroundColor: bg, borderColor: borderC }}>
        <div className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: textMuted }}>
          Invoice History
        </div>
        <button
          onClick={handleManageBilling}
          disabled={openingPortal}
          className="font-mono text-xs underline transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: textMuted }}
        >
          View full billing history
        </button>
      </div>
    </div>
  )
}

// ── Main ClientDashboard ───────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { clientToken } = useParams<{ clientToken: string }>()
  const searchParams = useSearchParams()
  const adminPreview = searchParams.get('admin_preview') === 'true'

  const [project, setProject]         = useState<ProjectData | null>(null)
  const [analytics, setAnalytics]     = useState<AnalyticsData | null>(null)
  const [dashConfig, setDashConfig]   = useState<DashboardConfig | null>(null)
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(`welcome-dismissed-${clientToken}`) === 'true' } catch { return false }
  })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [activePage, setActivePage] = useState<ClientView>('dashboard')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('client-dark-mode') === 'true' } catch { return false }
  })
  const [sessionId, setSessionId] = useState('')
  const [contacts, setContacts] = useState<DemoContact[]>([])
  const mountedPages = useRef<Set<ClientView>>(new Set())

  useEffect(() => {
    try { localStorage.setItem('client-dark-mode', String(darkMode)) } catch {}
  }, [darkMode])

  useEffect(() => {
    const stored = sessionStorage.getItem('client-session-id')
    if (stored) {
      setSessionId(stored)
    } else {
      const id = crypto.randomUUID()
      sessionStorage.setItem('client-session-id', id)
      setSessionId(id)
    }
  }, [])

  const fetchProject = async () => {
    try {
      const projectRes = await fetch(`/api/client/${clientToken}/project`)
      const projectData = await projectRes.json()
      if (projectData.error) {
        setError(projectData.error)
      } else {
        setProject(projectData.project)
      }
    } catch {
      setError('Failed to load your dashboard.')
    } finally {
      setLoading(false)
    }

    // Analytics is non-critical — a missing table or any error must not crash the dashboard
    try {
      const analyticsRes = await fetch(`/api/client/${clientToken}/analytics`)
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        if (!analyticsData.error) setAnalytics(analyticsData)
      }
    } catch {
      // silently ignore — dashboard shows 0 leads
    }

    // Dashboard config is non-critical
    try {
      const configRes = await fetch(`/api/client/${clientToken}/config`)
      if (configRes.ok) {
        const configData = await configRes.json() as { config: DashboardConfig | null }
        if (configData.config) setDashConfig(configData.config)
      }
    } catch {
      // silently ignore — automation settings will not appear
    }
  }

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientToken])

  const handleDismissWelcome = () => {
    try { localStorage.setItem(`welcome-dismissed-${clientToken}`, 'true') } catch {}
    setWelcomeDismissed(true)
  }

  const handleMarkRead = async () => {
    try {
      await fetch(`/api/client/${clientToken}/mark-read`, { method: 'POST' })
      setProject(prev =>
        prev ? { ...prev, notifications: prev.notifications.map(n => ({ ...n, read: true })) } : prev
      )
    } catch { /* non-fatal */ }
  }

  const handleImportFromLeads = (leads: { businessName: string; email: string }[]) => {
    const incoming: DemoContact[] = leads.map(l => ({ name: l.businessName, email: l.email, source: 'leads' as const }))
    setContacts(prev => {
      const existing = new Set(prev.map(c => c.email))
      return [...prev, ...incoming.filter(c => !existing.has(c.email))]
    })
    setActivePage('email')
  }

  const handleAddContacts = (newContacts: DemoContact[]) => {
    setContacts(prev => {
      const existing = new Set(prev.map(c => c.email))
      return [...prev, ...newContacts.filter(c => !existing.has(c.email))]
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="font-mono text-sm text-[#888888] animate-pulse">Loading your dashboard...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#f5f5f5' }}>
        <p className="font-mono text-sm text-red-500">{error || 'Dashboard unavailable.'}</p>
      </div>
    )
  }

  if (!adminPreview && project.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#080c10' }}>
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span className="font-mono font-bold text-sm tracking-widest text-white">MANTIS TECH</span>
          </div>
          <h1 className="font-mono text-2xl text-white mb-3">Dashboard Not Yet Active</h1>
          <p className="font-mono text-sm text-[#888888] leading-relaxed mb-6">
            Your dashboard will be available once your project goes live. Our team will notify you by email when everything is ready.
          </p>
          <a
            href="tel:+15016690488"
            className="font-mono text-sm text-[#00ff88] hover:underline"
          >
            (501) 669-0488
          </a>
        </div>
      </div>
    )
  }

  // All addon IDs the client currently has access to
  const activeAddonIds = [
    ...PLAN_INCLUDED_ADDONS[project.plan],
    ...project.addons,
    ...project.stripeAddonSubscriptions,
  ]

  const unreadCount  = project.notifications.filter(n => !n.read).length
  const sidebarWidth = sidebarExpanded ? 240 : 64

  // Lazy-mount: track which pages have been rendered so they persist state
  mountedPages.current.add(activePage)

  const renderPage = (page: ClientView) => {
    switch (page) {
      case 'dashboard':
        return (
          <DashboardPage
            project={project}
            clientToken={clientToken}
            darkMode={darkMode}
            onMarkRead={handleMarkRead}
            analytics={analytics}
            dashConfig={dashConfig}
            welcomeDismissed={welcomeDismissed}
            onDismissWelcome={handleDismissWelcome}
          />
        )
      case 'website':
        return (
          <ClientWebsitePage
            project={project}
            clientToken={clientToken}
            darkMode={darkMode}
            onChangeSubmit={fetchProject}
          />
        )
      case 'billing':
        return (
          <ClientBillingPage
            project={project}
            clientToken={clientToken}
            darkMode={darkMode}
          />
        )
      case 'calendar':
        return <CalendarCore mode="live" clientToken={clientToken} businessName={project.businessName} darkMode={darkMode} />
      case 'review':
        return <ReviewManagement sessionId={sessionId} darkMode={darkMode} />
      case 'social':
        return <SocialMedia sessionId={sessionId} darkMode={darkMode} />
      case 'leads':
        return <LeadGeneration sessionId={sessionId} onImportContacts={handleImportFromLeads} darkMode={darkMode} />
      case 'email':
        return <EmailMarketing sessionId={sessionId} contacts={contacts} onAddContacts={handleAddContacts} darkMode={darkMode} />
      case 'seo':
        return <SEOOptimization sessionId={sessionId} darkMode={darkMode} />
      case 'ecommerce':
        return <ECommerceAutomation sessionId={sessionId} darkMode={darkMode} />
      case 'ecommerce-inventory':
        return <ECommerceAutomation sessionId={sessionId} initialSubTab="inventory" darkMode={darkMode} />
      case 'ecommerce-automations':
        return <ECommerceAutomation sessionId={sessionId} initialSubTab="automations" darkMode={darkMode} />
      case 'ads':
        return <AdCreative sessionId={sessionId} darkMode={darkMode} />
      case 'chatbot':
        return <WebsiteChatbot sessionId={sessionId} darkMode={darkMode} />
      default:
        return null
    }
  }

  return (
    <div className={darkMode ? 'demo-page demo-dark' : 'demo-page'} style={{ minHeight: '100vh' }}>
      <ClientTopBar
        businessName={project.businessName}
        unreadCount={unreadCount}
        onToggleSidebar={() => setSidebarExpanded(v => !v)}
        onNavigate={setActivePage}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(v => !v)}
      />
      <ClientSidebar
        expanded={sidebarExpanded}
        activePage={activePage}
        onNavigate={setActivePage}
        activeAddonIds={activeAddonIds}
        darkMode={darkMode}
      />

      <main
        className="transition-all duration-200"
        style={{
          marginTop: 56,
          marginLeft: sidebarWidth,
          minHeight: 'calc(100vh - 56px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8">
          {Array.from(mountedPages.current).map((page) => (
            <div key={page} style={{ display: page === activePage ? 'block' : 'none' }}>
              {renderPage(page)}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
