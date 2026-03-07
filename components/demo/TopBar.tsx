'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { DemoView } from './Sidebar'

interface TopBarProps {
  onToggleSidebar: () => void
  onNavigate?: (page: DemoView) => void
  darkMode?: boolean
  onToggleDark?: () => void
}

export default function TopBar({ onToggleSidebar, onNavigate, darkMode, onToggleDark }: TopBarProps) {
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

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded transition-colors"
          style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            /* Sun icon — click to go light */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon icon — click to go dark */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Avatar + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm text-[#1a1a1a] hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#00ff88' }}
            aria-label="Account menu"
          >
            D
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
                onClick={() => { setDropdownOpen(false) }}
                className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Account Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  onNavigate?.('billing')
                }}
                className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Billing and Plan
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  setShowSupport(true)
                }}
                className="w-full text-left px-4 py-2.5 font-mono text-xs transition-colors"
                style={{ color: darkMode ? '#f0f0f0' : '#1a1a1a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f0f0f0')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Support
              </button>
              <div className="my-1" style={{ borderTop: `1px solid ${darkMode ? '#333333' : '#e8e8e8'}` }} />
              <Link
                href="/"
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
