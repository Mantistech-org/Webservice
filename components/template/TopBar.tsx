'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { DemoView } from '@/components/demo/Sidebar'

const SERVICE_AREA = 'Little Rock, AR'

interface TopBarProps {
  businessName?: string
  onToggleSidebar: () => void
  onNavigate?: (page: DemoView) => void
}

interface WeatherTrigger {
  active: boolean
  type: 'cold_snap' | 'heat_wave' | null
  severity: 'moderate' | 'severe' | null
  reason: string | null
}

interface ForecastDay {
  lowF: number
  highF: number
}

interface WeatherData {
  trigger: WeatherTrigger
  forecast?: ForecastDay[]
}

export default function TopBar({ businessName, onToggleSidebar, onNavigate }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
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

  useEffect(() => {
    fetch(`/api/weather?location=${encodeURIComponent(SERVICE_AREA)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setWeather(data) })
      .catch(() => {})
  }, [])

  const initials = businessName
    ? businessName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MT'

  const renderWeatherPill = () => {
    if (!weather) return null

    const { trigger, forecast } = weather

    if (!trigger.active) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 999,
          backgroundColor: 'rgba(107,114,128,0.15)',
          border: '1px solid rgba(107,114,128,0.2)',
        }}>
          <span style={{
            display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
            backgroundColor: '#6b7280', flexShrink: 0,
          }} />
          <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
            Monitoring {SERVICE_AREA}
          </span>
        </div>
      )
    }

    const isColdSnap = trigger.type === 'cold_snap'
    const todayLow = forecast?.[0]?.lowF
    const todayHigh = forecast?.[0]?.highF
    const tempPart = isColdSnap
      ? (todayLow !== undefined ? `: ${todayLow}F tonight` : '')
      : (todayHigh !== undefined ? `: ${todayHigh}F today` : '')
    const label = isColdSnap
      ? `Cold Snap Detected${tempPart}`
      : `Heat Wave Detected${tempPart}`

    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 14px', borderRadius: 999,
        backgroundColor: 'rgba(0,194,124,0.12)',
        border: '1px solid rgba(0,194,124,0.35)',
      }}>
        <span
          className="dot-teal"
          style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            backgroundColor: '#00C27C', flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: '#00C27C', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,255,136,0.5); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 5px rgba(0,255,136,0); }
        }
        @keyframes pulse-teal {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,194,124,0.5); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 5px rgba(0,194,124,0); }
        }
        .dot-green { animation: pulse-green 2.2s ease-in-out infinite; }
        .dot-teal  { animation: pulse-teal  2.2s ease-in-out infinite; }
      `}</style>

      <header
        className="fixed top-0 left-0 right-0 h-14 z-50 flex items-center px-4 gap-4"
        style={{
          backgroundColor: '#303030',
          borderBottom: '1px solid rgba(0,0,0,0.25)',
        }}
      >
        {/* Hamburger */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded transition-colors shrink-0"
          style={{ color: '#ffffff' }}
          aria-label="Toggle sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Left: logo + business name */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: '#00ff88' }}
          />
          <span
            className="font-mono text-xs tracking-widest uppercase"
            style={{ color: '#00ff88' }}
          >
            Mantis
          </span>
          {businessName && (
            <>
              <span
                className="font-mono text-sm"
                style={{ color: 'rgba(255,255,255,0.25)', margin: '0 2px' }}
              >
                /
              </span>
              <span
                className="font-mono text-sm font-medium"
                style={{ color: '#ffffff' }}
              >
                {businessName}
              </span>
            </>
          )}
        </div>

        {/* Center: dynamic weather pill */}
        <div className="flex-1 flex justify-center pointer-events-none">
          {renderWeatherPill()}
        </div>

        {/* Right: Platform Active + avatar */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="dot-green shrink-0"
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#00ff88',
              }}
            />
            <span className="font-mono text-xs" style={{ color: '#00ff88' }}>
              Platform Active
            </span>
          </div>

          {/* Avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00ff88', color: '#000000' }}
              aria-label="Account menu"
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-11 w-48 rounded-lg shadow-xl py-1 z-50"
                style={{ backgroundColor: '#ffffff', border: '1px solid #d8d8d8' }}
              >
                {[
                  { label: 'Account Settings', action: () => setDropdownOpen(false) },
                  {
                    label: 'Billing and Plan',
                    action: () => { setDropdownOpen(false); onNavigate?.('billing') },
                  },
                  {
                    label: 'Support',
                    action: () => { setDropdownOpen(false); setShowSupport(true) },
                  },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                    style={{ color: '#1a1a1a' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #e8e8e8', margin: '4px 0' }} />
                <Link
                  href="/"
                  className="block px-4 py-2.5 font-mono text-xs"
                  style={{ color: '#1a1a1a' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '#f0f0f0')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Support modal */}
      {showSupport && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div
            className="rounded-xl w-full max-w-sm p-6 shadow-2xl"
            style={{ backgroundColor: '#ffffff', border: '1px solid #d8d8d8' }}
          >
            <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-1">
              Support
            </div>
            <h2 className="font-heading text-xl text-[#1a1a1a] mb-3">Get Help</h2>
            <p className="font-mono text-xs text-[#555555] mb-5 leading-relaxed">
              Our team is available Monday through Friday, 9am to 6pm CT. For urgent
              issues, email us directly.
            </p>
            <a
              href="mailto:support@mantistech.io"
              className="block w-full text-center font-mono text-xs px-4 py-2.5 rounded-lg transition-opacity hover:opacity-80 mb-3"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              Email support@mantistech.io
            </a>
            <button
              onClick={() => setShowSupport(false)}
              className="w-full font-mono text-xs px-4 py-2.5 rounded-lg transition-colors"
              style={{ border: '1px solid #d8d8d8', color: '#555555' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
