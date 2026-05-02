'use client'
// DEMO ONLY — Do not import or reference template components here.
// Template components live in components/template/ and must remain separate.

import { useState } from 'react'

export type DemoView =
  | 'dashboard'
  | 'weather'
  | 'bookings'
  | 'review'
  | 'seo'
  | 'sms'
  | 'email'
  | 'gbp'
  | 'missed-call'
  | 'crm'
  | 'proposals'
  | 'invoices'
  | 'performance'
  | 'integrations'
  | 'settings'
  | 'billing'

interface SidebarProps {
  expanded: boolean
  activePage: DemoView
  onNavigate: (page: DemoView) => void
  darkMode?: boolean
}

interface NavItem {
  id: DemoView
  label: string
  icon: React.ReactNode
  featured?: boolean
  children?: { id: DemoView; label: string }[]
}

function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}
function CloudIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
function MessageSquareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="16" rx="2" />
      <path d="M6 20l4-4h8" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polyline points="2,4 12,13 22,4"/>
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}
function ProposalsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',          icon: <HomeIcon /> },
  { id: 'weather',   label: 'Weather Activation', icon: <CloudIcon />, featured: true },
  { id: 'crm',       label: 'CRM',               icon: <UsersIcon /> },
  { id: 'proposals', label: 'Proposals',          icon: <ProposalsIcon /> },
  { id: 'bookings',  label: 'Bookings',           icon: <CalendarIcon /> },
  { id: 'review',    label: 'Reviews',            icon: <StarIcon /> },
  { id: 'seo',       label: 'SEO',                icon: <SearchIcon /> },
  { id: 'sms',          label: 'SMS',                icon: <MessageSquareIcon /> },
  { id: 'email',        label: 'Email Marketing',   icon: <MailIcon /> },
  { id: 'gbp',          label: 'Google Business',   icon: <MapPinIcon /> },
  { id: 'missed-call',  label: 'Missed Call Reply', icon: <PhoneIcon /> },
  { id: 'settings',     label: 'Settings',          icon: <GearIcon /> },
]

export default function Sidebar({ expanded, activePage, onNavigate }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside
      className="fixed top-14 left-0 bottom-0 overflow-y-auto overflow-x-hidden z-40 transition-all duration-200"
      style={{
        width: expanded ? 240 : 64,
        backgroundColor: '#303030',
        borderRight: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <nav className="py-4">
        {NAV_ITEMS.map((item) => {
          const hasChildren = !!item.children?.length
          const isActive =
            activePage === item.id ||
            (item.children?.some((c) => c.id === activePage) ?? false)
          const isOpen = openGroups.has(item.id)
          const isFeatured = !!item.featured

          // Determine button style
          let btnBg = 'transparent'
          let btnColor = '#ffffff'
          let leftBorder = '3px solid transparent'

          if (isActive) {
            btnBg = 'rgba(0,255,136,0.13)'
            btnColor = '#00ff88'
            leftBorder = '3px solid #00ff88'
          } else if (isFeatured) {
            btnBg = 'rgba(0,255,136,0.06)'
            btnColor = '#a7f3d0'
            leftBorder = '3px solid rgba(0,255,136,0.45)'
          }

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren && expanded) toggleGroup(item.id)
                  else onNavigate(item.id)
                }}
                title={!expanded ? item.label : undefined}
                className="w-full flex items-center gap-3 py-2.5 font-mono text-sm tracking-wide transition-colors duration-150"
                style={{
                  paddingLeft: expanded ? 16 : 22,
                  paddingRight: expanded ? 16 : 22,
                  backgroundColor: btnBg,
                  color: btnColor,
                  borderLeft: leftBorder,
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isFeatured) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
                    ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isFeatured) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
                  }
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                {expanded && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {hasChildren && <ChevronDown open={isOpen} />}
                  </>
                )}
              </button>

              {/* Children */}
              {hasChildren && expanded && isOpen && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  {item.children!.map((child) => (
                    <button
                      key={child.label}
                      onClick={() => onNavigate(child.id)}
                      className="w-full flex items-center pl-12 pr-4 py-2.5 font-mono text-sm transition-colors"
                      style={
                        activePage === child.id
                          ? { color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)' }
                          : { color: 'rgba(255,255,255,0.65)' }
                      }
                      onMouseEnter={(e) => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
                          ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'
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
