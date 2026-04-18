'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import AdminNav from '@/components/admin/AdminNav'

// Pages under /admin that should never show the admin chrome (login flows)
const PUBLIC_PREFIXES = ['/admin/reset-password']

// ── Database status indicator ──────────────────────────────────────────────

type DbHealth = 'unknown' | 'ok' | 'warning' | 'offline'

function useDbHealth(authed: boolean | null) {
  const [health, setHealth] = useState<DbHealth>('unknown')
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(async () => {
    if (!authed) return
    try {
      const res = await fetch('/api/admin/db-health')
      if (res.status === 401) return // not authed yet — skip silently
      const data = await res.json()
      if (data.ok) {
        setHealth(data.warning ? 'warning' : 'ok')
        setError(data.warning ?? null)
      } else {
        setHealth('offline')
        setError(data.error ?? 'Database unreachable')
      }
    } catch {
      setHealth('offline')
      setError('Could not reach the database health endpoint')
    }
  }, [authed])

  useEffect(() => {
    if (!authed) return
    check()
    // Re-check every 60 s so a recovered Supabase project auto-clears the banner
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [authed, check])

  return { health, error }
}

/** Small coloured dot shown in the header */
function DbStatusDot({ health }: { health: DbHealth }) {
  if (health === 'unknown') return null

  const colours: Record<DbHealth, string> = {
    unknown: '',
    ok: 'bg-emerald-400',
    warning: 'bg-amber-400',
    offline: 'bg-red-500 animate-pulse',
  }

  const label: Record<DbHealth, string> = {
    unknown: '',
    ok: 'Database connected',
    warning: 'Database connected (warning)',
    offline: 'Database offline',
  }

  return (
    <div className="flex items-center gap-1.5" title={label[health]}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${colours[health]}`} />
      {health === 'offline' && (
        <span className="font-mono text-xs text-red-300">DB Offline</span>
      )}
      {health === 'warning' && (
        <span className="font-mono text-xs text-amber-300">DB Warning</span>
      )}
    </div>
  )
}

/** Full-width banner shown below the header when the DB is unreachable */
function DbOfflineBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-600 dark:bg-red-700 px-6 py-2.5 flex items-center gap-3 shrink-0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white shrink-0">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="font-mono text-xs text-white">
        <span className="font-semibold">Database connection failed</span>
        {' — '}
        {message || 'Check your Supabase project status at supabase.com/dashboard'}
      </p>
    </div>
  )
}

/** Amber banner for non-fatal warnings (e.g. api_keys table not yet created) */
function DbWarningBanner({ message }: { message: string }) {
  return (
    <div className="bg-amber-500/90 dark:bg-amber-600/80 px-6 py-2 flex items-center gap-3 shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white shrink-0">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="font-mono text-xs text-white">{message}</p>
    </div>
  )
}

// ── Layout ─────────────────────────────────────────────────────────────────

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
      setAuthed(false)
      return
    }
    checkAuth()
  }, [isPublic, checkAuth, pathname])

  const { health: dbHealth, error: dbError } = useDbHealth(authed)

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    router.push('/admin')
  }

  // ── Initial load: show spinner until we know auth state ─────────────────
  if (authed === null && !isPublic) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Checking session...</div>
      </div>
    )
  }

  // ── Not authenticated (or public page): render children fullscreen ───────
  if (!authed || isPublic) {
    return <>{children}</>
  }

  // ── Authenticated: render persistent admin chrome ────────────────────────
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Shared header */}
      <header className="bg-[#0d6b3c] h-[73px] px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl tracking-widest text-white">MANTIS TECH</span>
          <span className="font-mono text-xs text-white/55 ml-2">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <DbStatusDot health={dbHealth} />
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

      {/* DB status banners — shown directly below the header */}
      {dbHealth === 'offline' && dbError && <DbOfflineBanner message={dbError} />}
      {dbHealth === 'warning' && dbError && <DbWarningBanner message={dbError} />}

      {/* Body: AdminNav sidebar + page content */}
      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-white/10 bg-[#555555] dark:bg-[#303030]">
          <AdminNav />
        </aside>
        <main className="flex-1 min-w-0 flex flex-col [&>*]:!pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}
