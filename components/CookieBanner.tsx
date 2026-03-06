'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!mounted || !visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="font-mono text-xs text-[#c8c8c8] leading-relaxed">
          We use cookies to improve your experience. By continuing you agree to our{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-[#00ff88] transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDecline}
            className="font-mono text-xs text-[#c8c8c8] border border-[#3a3a3a] px-4 py-2 rounded hover:border-[#666] transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="font-mono text-xs text-black px-4 py-2 rounded font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00ff88' }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
