'use client'

import { useState } from 'react'

export type DemoView =
  | 'dashboard'
  | 'website'
  | 'review'
  | 'social'
  | 'leads'
  | 'email'
  | 'seo'
  | 'ecommerce'
  | 'ecommerce-inventory'
  | 'ecommerce-automations'
  | 'ads'
  | 'chatbot'
  | 'calendar'
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
  children?: { id: DemoView; label: string }[]
}

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
function ChartIcon() {
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

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',  label: 'Dashboard',         icon: <HomeIcon /> },
  { id: 'website',    label: 'My Website',         icon: <GlobeIcon /> },
  { id: 'review',     label: 'Review Management',  icon: <StarIcon /> },
  { id: 'social',     label: 'Social Media',       icon: <ShareIcon /> },
  { id: 'leads',      label: 'Lead Generation',    icon: <TargetIcon /> },
  { id: 'email',      label: 'Email Marketing',    icon: <EnvelopeIcon /> },
  { id: 'seo',        label: 'SEO',                icon: <ChartIcon /> },
  {
    id: 'ecommerce', label: 'E-Commerce', icon: <BagIcon />,
    children: [
      { id: 'ecommerce-inventory',   label: 'Inventory' },
      { id: 'ecommerce-automations', label: 'Automated Emails' },
    ],
  },
  { id: 'ads',      label: 'Ad Creative',    icon: <ImageIcon /> },
  { id: 'chatbot',  label: 'Website Chatbot', icon: <ChatIcon /> },
  { id: 'calendar', label: 'Calendar',        icon: <CalendarIcon /> },
  { id: 'billing',  label: 'Billing',         icon: <CardIcon /> },
]

export default function Sidebar({ expanded, activePage, onNavigate, darkMode }: SidebarProps) {
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
      className="fixed top-14 left-0 bottom-0 overflow-y-auto overflow-x-hidden z-40 transition-all duration-200 border-r"
      style={{
        width: expanded ? 240 : 64,
        backgroundColor: darkMode ? '#303030' : '#555555',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <nav className="py-3">
        {NAV_ITEMS.map((item) => {
          const hasChildren = !!item.children?.length
          // Active if this item is the current page, or if a child of this item is the current page
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded font-mono text-sm tracking-wide transition-colors duration-150"
                style={isActive
                  ? { backgroundColor: 'rgba(0,255,136,0.15)', color: '#00ff88' }
                  : { color: '#ffffff' }
                }
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
                    ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                  }
                }}
              >
                <span className={`shrink-0 ${isActive ? 'text-[#00ff88]' : ''}`}>
                  {item.icon}
                </span>
                {expanded && (
                  <>
                    <span className="flex-1 text-left truncate">
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

              {/* Children */}
              {hasChildren && expanded && isOpen && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                  {item.children!.map((child) => (
                    <button
                      key={child.label}
                      onClick={() => onNavigate(child.id)}
                      className="w-full flex items-center pl-12 pr-4 py-2.5 font-mono text-sm transition-colors"
                      style={activePage === child.id
                        ? { color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)' }
                        : { color: '#ffffff' }
                      }
                      onMouseEnter={e => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'
                          ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
                        }
                      }}
                      onMouseLeave={e => {
                        if (activePage !== child.id) {
                          (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
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
