'use client'

import { useState } from 'react'

export type DemoView =
  | 'dashboard'
  | 'weather'
  | 'bookings'
  | 'review'
  | 'seo'
  | 'sms'
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
function CloudIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
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
function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}
function MessageSquareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="16" rx="2" />
      <path d="M6 20l4-4h8" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
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
  { id: 'dashboard', label: 'Dashboard',          icon: <HomeIcon /> },
  { id: 'weather',   label: 'Weather Activation', icon: <CloudIcon /> },
  { id: 'bookings',  label: 'Bookings',           icon: <CalendarIcon /> },
  { id: 'review',    label: 'Reviews',            icon: <StarIcon /> },
  { id: 'seo',       label: 'SEO',                icon: <ChartIcon /> },
  { id: 'sms',       label: 'SMS',                icon: <MessageSquareIcon /> },
  { id: 'settings',  label: 'Settings',           icon: <GearIcon /> },
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
        backgroundColor: '#303030',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <nav className="py-3">
        {NAV_ITEMS.map((item) => {
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
