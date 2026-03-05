'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface TopBarProps {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#f5f5f5] border-b border-[#d8d8d8] z-50 flex items-center px-4 gap-4">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded hover:bg-[#e0e0e0] transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
        <span className="font-mono font-bold text-sm tracking-widest text-[#1a1a1a]">MANTIS TECH</span>
      </Link>

      <div className="flex-1" />

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
          <div className="absolute right-0 top-11 w-48 bg-white border border-[#d8d8d8] rounded shadow-lg py-1 z-50">
            <button className="w-full text-left px-4 py-2.5 font-mono text-xs text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors">
              Account Settings
            </button>
            <button className="w-full text-left px-4 py-2.5 font-mono text-xs text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors">
              Billing and Plan
            </button>
            <button className="w-full text-left px-4 py-2.5 font-mono text-xs text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors">
              Support
            </button>
            <div className="border-t border-[#e8e8e8] my-1" />
            <Link
              href="/"
              className="block px-4 py-2.5 font-mono text-xs text-[#1a1a1a] hover:bg-[#f0f0f0] transition-colors"
            >
              Sign Out
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
