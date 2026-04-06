'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { DemoView } from './Sidebar'

// WEATHER STATE — set to coldSnap or heatWave to switch between states
const WEATHER_STATE: 'coldSnap' | 'heatWave' = 'coldSnap'

interface TopBarProps {
  businessName?: string
  onToggleSidebar: () => void
  onNavigate?: (page: DemoView) => void
  darkMode?: boolean
  onToggleDark?: () => void
}

function ColdSnapIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Cloud body */}
      <path
        d="M12.5 7a3 3 0 00-5.74-1.2A2 2 0 104 11h8.5a2 2 0 000-4z"
        fill="#93C5FD"
      />
      {/* Rain drops — animated via CSS classes */}
      <line
        className="rain-drop rain-1"
        x1="5.5" y1="12" x2="4.5" y2="14"
        stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round"
      />
      <line
        className="rain-drop rain-2"
        x1="8" y1="12" x2="7" y2="14"
        stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round"
      />
      <line
        className="rain-drop rain-3"
        x1="10.5" y1="12" x2="9.5" y2="14"
        stroke="#93C5FD" strokeWidth="1.3" strokeLinecap="round"
      />
    </svg>
  )
}

function HeatWaveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Sun circle */}
      <circle cx="8" cy="8" r="2.8" fill="#FDBA74" />
      {/* Radiating rays — animated via CSS class */}
      <g className="sun-rays">
        <line x1="8" y1="1" x2="8" y2="3" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="8" y1="13" x2="8" y2="15" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="1" y1="8" x2="3" y2="8" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="13" y1="8" x2="15" y2="8" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12.95" y1="3.05" x2="11.54" y2="4.46" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="4.46" y1="11.54" x2="3.05" y2="12.95" stroke="#FDBA74" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  )
}

const WEATHER_CONFIGS = {
  coldSnap: {
    pillBg: 'rgba(30,58,138,0.55)',
    pillBorder: '1px solid rgba(59,130,246,0.4)',
    dotColor: '#3B82F6',
    dotAnimation: 'demo-pulse-blue',
    textColor: '#93C5FD',
    label: 'Cold Snap Detected: 28F tonight',
    icon: <ColdSnapIcon />,
  },
  heatWave: {
    pillBg: 'rgba(120,53,15,0.55)',
    pillBorder: '1px solid rgba(249,115,22,0.4)',
    dotColor: '#F97316',
    dotAnimation: 'demo-pulse-orange',
    textColor: '#FDBA74',
    label: 'Heat Wave Detected',
    icon: <HeatWaveIcon />,
  },
}

export default function TopBar({ businessName, onToggleSidebar, onNavigate }: TopBarProps) {
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

  const initials = businessName
    ? businessName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MT'

  const weather = WEATHER_CONFIGS[WEATHER_STATE]

  return (
    <>
      <style>{`
        @keyframes demo-pulse-green {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0,255,136,0.5); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 5px rgba(0,255,136,0); }
        }
        @keyframes demo-pulse-blue {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59,130,246,0.55); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 5px rgba(59,130,246,0); }
        }
        @keyframes demo-pulse-orange {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(249,115,22,0.55); }
          50%       { opacity: 0.75; box-shadow: 0 0 0 5px rgba(249,115,22,0); }
        }
        .dot-green  { animation: demo-pulse-green  2.2s ease-in-out infinite; }
        .dot-blue   { animation: demo-pulse-blue   2.2s ease-in-out infinite; }
        .dot-orange { animation: demo-pulse-orange 2.2s ease-in-out infinite; }

        /* Rain drop falling animation — staggered per drop */
        @keyframes rain-fall {
          0%   { transform: translateY(0px);  opacity: 1; }
          75%  { transform: translateY(3px);  opacity: 0; }
          100% { transform: translateY(0px);  opacity: 0; }
        }
        .rain-drop { animation: rain-fall 1.5s ease-in infinite; }
        .rain-1    { animation-delay: 0s; }
        .rain-2    { animation-delay: 0.35s; }
        .rain-3    { animation-delay: 0.7s; }

        /* Sun ray shimmer — subtle pulse on the rays group */
        @keyframes sun-shimmer {
          0%, 100% { opacity: 1;    transform: scale(1);    }
          50%       { opacity: 0.55; transform: scale(1.18); }
        }
        .sun-rays {
          animation: sun-shimmer 2s ease-in-out infinite;
          transform-origin: 8px 8px;
        }
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

        {/* Left: logo mark + business name */}
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

        {/* Center: weather alert pill */}
        <div className="flex-1 flex justify-center pointer-events-none">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: weather.pillBg,
              border: weather.pillBorder,
            }}
          >
            {/* Animated weather icon */}
            {weather.icon}
            {/* Pulsing dot */}
            <span
              className={`dot-${WEATHER_STATE === 'coldSnap' ? 'blue' : 'orange'} shrink-0`}
              style={{
                display: 'inline-block',
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: weather.dotColor,
              }}
            />
            <span
              className="font-mono text-xs"
              style={{ color: weather.textColor, whiteSpace: 'nowrap' }}
            >
              {weather.label}
            </span>
          </div>
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
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#00ff88', color: '#000000' }}
              aria-label="Account menu"
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 top-11 w-48 rounded-lg shadow-xl py-1 z-50"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d8d8d8',
                }}
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
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                    style={{ color: '#1a1a1a' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid #e8e8e8', margin: '4px 0' }} />
                <Link
                  href="/"
                  className="block px-4 py-2.5 font-mono text-xs"
                  style={{ color: '#1a1a1a' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#f0f0f0')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
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
