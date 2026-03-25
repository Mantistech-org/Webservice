'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import AdminNav from '@/components/admin/AdminNav'

// Pages under /admin that should never show the admin chrome (login flows)
const PUBLIC_PREFIXES = ['/admin/reset-password']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  const checkAuth = useCallback(() => {
    fetch('/api/admin/projects')
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    if (isPublic) {
      // Public pages don't need auth check — render as-is
      setAuthed(false)
      return
    }
    checkAuth()
  }, [isPublic, checkAuth])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    router.push('/admin')
  }

  // ── Initial load: show spinner until we know auth state ────────────────────
  if (authed === null && !isPublic) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Checking session...</div>
      </div>
    )
  }

  // ── Not authenticated (or public page): render children fullscreen ──────────
  // admin/page.tsx handles login/MFA forms itself in this state
  if (!authed || isPublic) {
    return <>{children}</>
  }

  // ── Authenticated: render persistent admin chrome ──────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Shared header */}
      <header className="bg-[#0d6b3c] h-[73px] px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl tracking-widest text-white">MANTIS TECH</span>
          <span className="font-mono text-xs text-white/55 ml-2">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="[&_button]:!text-white/70 [&_button:hover]:!text-white">
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="font-mono text-xs border border-white/30 text-white/80 px-4 py-1.5 rounded hover:border-white/60 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Body: AdminNav sidebar + page content */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-white/10 bg-[#252525] dark:bg-[#0f0f0f]">
          <AdminNav />
        </aside>
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}
