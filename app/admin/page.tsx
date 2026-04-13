'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProjectStatus, Plan, PLANS } from '@/types'

interface DemoLeadEvent {
  event: string
  detail: string | null
  at: string
}

interface DemoLead {
  id: string
  email: string
  business_name: string | null
  business_type: string | null
  engaged: boolean
  events: DemoLeadEvent[]
  created_at: string
}

interface DemoSession {
  id: string
  createdAt: string
  lastActiveAt: string
  tabsUsed: string[]
  submissions: Record<string, number>
}

interface ProjectSummary {
  id: string
  businessName: string
  ownerName: string
  email: string
  plan: Plan
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  addons: string[]
  clientToken: string
  referredBy?: string
  referralRewardGranted?: boolean
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  admin_review: 'Awaiting Review',
  client_review: 'Client Review',
  changes_requested: 'Changes Requested',
  active: 'Active',
  generating: 'Generating',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  admin_review:      'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30 bg-yellow-700/5 dark:bg-yellow-400/5',
  client_review:     'text-blue-700   dark:text-blue-400   border-blue-700/30   dark:border-blue-400/30   bg-blue-700/5   dark:bg-blue-400/5',
  changes_requested: 'text-red-700    dark:text-red-400    border-red-700/30    dark:border-red-400/30    bg-red-700/5    dark:bg-red-400/5',
  active:            'text-emerald-700 dark:text-accent    border-emerald-700/30 dark:border-accent/30    bg-emerald-700/5 dark:bg-accent/5',
  generating:        'text-purple-700 dark:text-purple-400 border-purple-700/30 dark:border-purple-400/30 bg-purple-700/5 dark:bg-purple-400/5',
}

const HVAC_TYPES = ['Residential HVAC', 'Commercial HVAC', 'Both Residential and Commercial']

interface AddClientForm {
  businessName: string; ownerName: string; email: string; phone: string
  businessType: string; location: string; plan: Plan; businessDescription: string
}

const DEFAULT_ADD_FORM: AddClientForm = {
  businessName: '', ownerName: '', email: '', phone: '', businessType: '',
  location: '', plan: 'platform', businessDescription: '',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [mfaPending, setMfaPending] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaErrorType, setMfaErrorType] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['attention', 'with_client', 'active_group', 'all']))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([])
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoLeads, setDemoLeads] = useState<DemoLead[]>([])
  const [demoLeadsLoading, setDemoLeadsLoading] = useState(false)
  const [demoLeadsTab, setDemoLeadsTab] = useState<'engaged' | 'all'>('engaged')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<AddClientForm>(DEFAULT_ADD_FORM)
  const [addingClient, setAddingClient] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetch('/api/admin/projects')
      .then((r) => {
        if (r.ok) { setAuthed(true); return r.json() }
        setAuthed(false); return null
      })
      .then((data) => { if (data) { setProjects(data.projects); loadDemoSessions(); loadDemoLeads() } })
      .catch(() => setAuthed(false))
  }, [])

  const loadProjects = () => {
    setLoading(true)
    fetch('/api/admin/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setLoading(false))
  }

  const loadDemoSessions = () => {
    setDemoLoading(true)
    fetch('/api/admin/demo-sessions')
      .then((r) => r.json())
      .then((data) => setDemoSessions(data.sessions ?? []))
      .finally(() => setDemoLoading(false))
  }

  const loadDemoLeads = () => {
    setDemoLeadsLoading(true)
    fetch('/api/admin/demo-leads')
      .then((r) => r.json())
      .then((data) => setDemoLeads(data.leads ?? []))
      .finally(() => setDemoLeadsLoading(false))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true); setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (res.ok && data.mfaRequired) {
      setMfaPending(true); setMfaCode(''); setMfaError(''); setMfaErrorType(''); setResent(false)
    } else if (res.ok) {
      setAuthed(true); loadProjects(); loadDemoSessions(); loadDemoLeads()
    } else {
      setLoginError(data.error ?? 'Incorrect password.')
    }
    setLoggingIn(false)
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true); setMfaError(''); setMfaErrorType('')
    const res = await fetch('/api/admin/verify-mfa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: mfaCode }),
    })
    const data = await res.json()
    if (res.ok) {
      // Full reload so AdminLayout re-checks the new session cookie and
      // immediately renders the green header and sidebar chrome.
      window.location.reload()
      return
    } else if (data.type === 'no_code') {
      setMfaPending(false); setMfaCode(''); setLoginError('Session expired. Please log in again.')
    } else {
      setMfaError(data.error ?? 'Verification failed.')
      setMfaErrorType(data.type ?? '')
      if (data.type !== 'expired') setMfaCode('')
    }
    setVerifying(false)
  }

  const handleResendMfa = async () => {
    setResending(true); setResent(false); setMfaError(''); setMfaErrorType('')
    const res = await fetch('/api/admin/resend-mfa', { method: 'POST' })
    if (res.ok) {
      setResent(true); setMfaCode('')
      setTimeout(() => setResent(false), 6000)
    } else {
      const data = await res.json().catch(() => ({}))
      setMfaError(data.error ?? 'Failed to resend code. Check your email configuration.')
      setMfaErrorType('send_error')
    }
    setResending(false)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingClient(true); setAddError('')
    try {
      const res = await fetch('/api/admin/add-client', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Failed to add client.') }
      setShowAddModal(false); setAddForm(DEFAULT_ADD_FORM); loadProjects()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setAddingClient(false)
    }
  }

  // ── Loading (the layout shows its own spinner, so return null here) ─────────
  if (authed === null) return null

  // ── Not authenticated: show login / MFA forms (fullscreen — layout passes through) ─
  if (!authed) {
    if (mfaPending) {
      const codeExpired = mfaErrorType === 'expired'
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-8 justify-center">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="font-heading text-2xl tracking-widest text-primary">MANTIS TECH</span>
            </div>
            <div className="bg-card border border-border rounded p-8">
              <div className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-2">Admin</div>
              <h1 className="font-heading text-3xl text-primary mb-2">Check Your Email</h1>
              <p className="font-mono text-xs text-muted mb-6">
                A 6-digit code was sent to your admin email address. Enter it below to complete login.
              </p>
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Verification Code</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6} value={mfaCode} autoFocus required
                    disabled={codeExpired}
                    onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '')); setMfaError(''); setMfaErrorType('') }}
                    className="form-input tracking-[0.5em] text-center text-lg disabled:opacity-50"
                    placeholder="000000"
                  />
                </div>
                {mfaError && !resent && (
                  <div className={`font-mono text-xs p-3 rounded border ${
                    codeExpired
                      ? 'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30 bg-yellow-700/5 dark:bg-yellow-400/5'
                      : 'text-red-700 dark:text-red-400 border-red-700/30 dark:border-red-400/30 bg-red-700/5 dark:bg-red-400/5'
                  }`}>{mfaError}</div>
                )}
                {resent && (
                  <div className="font-mono text-xs p-3 rounded border text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5">
                    A new code has been sent to your email.
                  </div>
                )}
                {!codeExpired && (
                  <button type="submit" disabled={verifying || mfaCode.length !== 6}
                    className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60">
                    {verifying ? 'Verifying...' : 'Verify and Log In'}
                  </button>
                )}
                <button type="button" onClick={handleResendMfa} disabled={resending}
                  className={`w-full font-mono text-sm py-3 rounded tracking-wider transition-all disabled:opacity-60 ${
                    codeExpired ? 'bg-accent text-black hover:bg-white' : 'border border-border text-muted hover:border-accent hover:text-primary'
                  }`}>
                  {resending ? 'Sending...' : codeExpired ? 'Send New Code' : 'Resend Code'}
                </button>
                <div className="text-center">
                  <button type="button"
                    onClick={() => { setMfaPending(false); setMfaCode(''); setMfaError(''); setMfaErrorType('') }}
                    className="font-mono text-xs text-muted hover:text-primary transition-colors">
                    Back to login
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-heading text-2xl tracking-widest text-primary">MANTIS TECH</span>
          </div>
          <div className="bg-card border border-border rounded p-8">
            <div className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-2">Admin</div>
            <h1 className="font-heading text-3xl text-primary mb-6">Dashboard Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  autoFocus required className="form-input" placeholder="Enter admin password" />
              </div>
              {loginError && <p className="font-mono text-xs text-red-700 dark:text-red-400">{loginError}</p>}
              <button type="submit" disabled={loggingIn}
                className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60">
                {loggingIn ? 'Authenticating...' : 'Enter Dashboard'}
              </button>
              <div className="text-center">
                <Link href="/admin/reset-password" className="font-mono text-xs text-muted hover:text-primary transition-colors">
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Authenticated: render dashboard content (layout provides header + sidebar) ─
  const activeProjects = projects.filter((p) => p.status === 'active')
  const estimatedMRR = activeProjects.reduce((sum, p) => sum + (PLANS[p.plan]?.monthly ?? 0), 0)
  const pendingCount = projects.filter((p) => p.status === 'admin_review').length

  const searchFiltered = projects.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.businessName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
  })

  const sidebarGroups = [
    { key: 'attention', label: 'Needs Attention', statuses: ['admin_review', 'changes_requested'] as ProjectStatus[] },
    { key: 'with_client', label: 'With Client', statuses: ['client_review'] as ProjectStatus[] },
    { key: 'active_group', label: 'Active', statuses: ['active'] as ProjectStatus[] },
    { key: 'all', label: 'All Clients', statuses: ['admin_review', 'client_review', 'changes_requested', 'active'] as ProjectStatus[] },
  ]

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  return (
    <>
      {/* Inner layout: project list sidebar + main content */}
      <div className="flex flex-1 items-start">
        {/* Project list sidebar */}
        <aside className="w-64 shrink-0 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto border-r border-border bg-card flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..." className="form-input text-xs w-full"
            />
          </div>

          {/* Project groups */}
          <div className="flex-1 overflow-y-auto">
            {sidebarGroups.map((group) => {
              const groupItems = searchFiltered.filter((p) => group.statuses.includes(p.status))
              const isCollapsed = collapsedGroups.has(group.key)
              return (
                <div key={group.key} className="border-b border-border last:border-0">
                  <button onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/8 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary/70 dark:text-white/50 tracking-widest uppercase">{group.label}</span>
                      <span className="font-mono text-xs bg-black/10 dark:bg-white/8 border border-black/10 dark:border-white/10 text-primary/70 dark:text-white/50 px-1.5 py-0.5 rounded">
                        {groupItems.length}
                      </span>
                    </div>
                    <svg className="w-3 h-3 text-primary/50 dark:text-white/35 transition-transform" style={{ transform: isCollapsed ? undefined : 'rotate(90deg)' }}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {!isCollapsed && (
                    <div className="pb-1">
                      {groupItems.length === 0 ? (
                        <div className="px-4 py-3 font-mono text-xs text-primary/50 dark:text-white/35">None</div>
                      ) : (
                        groupItems.map((p) => (
                          <Link key={p.id} href={`/admin/projects/${p.id}`}
                            onClick={() => setSelectedId(p.id)}
                            className={`block px-4 py-3 hover:bg-black/8 dark:hover:bg-white/5 transition-colors border-l-2 ${
                              selectedId === p.id ? 'border-accent bg-accent/10' : 'border-transparent'
                            }`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-mono text-xs text-primary dark:text-white/85 truncate">{p.businessName}</span>
                              <span className="font-mono text-xs border border-black/15 dark:border-white/15 text-primary/60 dark:text-white/50 px-1.5 py-0.5 rounded capitalize shrink-0">
                                {p.plan}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-primary/50 dark:text-white/40">
                              {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 px-8 py-10">
          {/* Page title + actions */}
          <div className="flex items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="font-heading text-5xl text-primary mb-2">Project Dashboard</h1>
              <p className="font-mono text-sm text-muted">
                {projects.length} total project{projects.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 shrink-0">
              <button onClick={() => setShowAddModal(true)}
                className="font-mono text-xs bg-accent text-black px-4 py-2 rounded hover:opacity-90 transition-opacity tracking-wider">
                Add Client
              </button>
              <button onClick={loadProjects} disabled={loading}
                className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
            <div className="bg-white dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#3f3f3f] rounded-lg p-5 shadow-sm dark:shadow-none">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Active Clients</div>
              <div className="font-heading text-4xl text-primary">{activeProjects.length}</div>
            </div>
            <div className="bg-white dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#3f3f3f] rounded-lg p-5 shadow-sm dark:shadow-none">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Estimated MRR</div>
              <div className="font-heading text-4xl text-emerald-700 dark:text-accent">${estimatedMRR}</div>
              <div className="font-mono text-xs text-muted mt-1">base plans only</div>
            </div>
            <div className="bg-white dark:bg-[#2a2a2a] border border-[#d0d0d0] dark:border-[#3f3f3f] rounded-lg p-5 shadow-sm dark:shadow-none">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-2">Pending Review</div>
              <div className="font-heading text-4xl text-yellow-700 dark:text-yellow-400">{pendingCount}</div>
            </div>
          </div>

          {/* Demo Visitors */}
          <div className="pt-10 border-t border-border mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-3xl text-primary mb-1">Demo Visitors</h2>
                <p className="font-mono text-sm text-muted">
                  {demoSessions.length} session{demoSessions.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <button onClick={loadDemoSessions} disabled={demoLoading}
                className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
                {demoLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {demoSessions.length === 0 ? (
              <div className="text-center py-12 font-mono text-sm text-muted">
                No demo sessions yet. Share /demo to start tracking visitors.
              </div>
            ) : (
              <div className="space-y-3">
                {demoSessions.map((session) => {
                  const totalSubmissions = Object.values(session.submissions).reduce((a, b) => a + b, 0)
                  return (
                    <div key={session.id} className="bg-card border border-border rounded-lg p-5 shadow-sm dark:shadow-none">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-xs text-muted">Session {session.id.slice(0, 8)}</span>
                            <span className="font-mono text-xs text-emerald-700 dark:text-accent border border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5 px-2 py-0.5 rounded-full">
                              {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {session.tabsUsed.map((tab) => (
                              <span key={tab} className="font-mono text-xs bg-bg border border-border text-teal px-2 py-0.5 rounded">
                                {tab.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                {session.submissions[tab] > 1 && (
                                  <span className="ml-1 text-muted">x{session.submissions[tab]}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-xs text-muted">
                            {new Date(session.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                          <div className="font-mono text-xs text-muted mt-0.5">
                            Last active {new Date(session.lastActiveAt).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Demo Leads */}
          <div className="pt-10 border-t border-border mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-3xl text-primary mb-1">Demo Leads</h2>
                <p className="font-mono text-sm text-muted">
                  {demoLeads.filter((l) => l.engaged).length} engaged &middot; {demoLeads.length} total
                </p>
              </div>
              <button onClick={loadDemoLeads} disabled={demoLeadsLoading}
                className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider">
                {demoLeadsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-border">
              {(['engaged', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDemoLeadsTab(tab)}
                  className={`font-mono text-xs tracking-wider px-4 py-2 -mb-px border-b-2 transition-colors ${
                    demoLeadsTab === tab
                      ? 'border-accent text-emerald-700 dark:text-accent'
                      : 'border-transparent text-muted hover:text-primary'
                  }`}
                >
                  {tab === 'engaged' ? 'Engaged Leads' : 'All Demo Leads'}
                </button>
              ))}
            </div>

            {(() => {
              const rows = demoLeadsTab === 'engaged'
                ? demoLeads.filter((l) => l.engaged)
                : demoLeads

              if (rows.length === 0) {
                return (
                  <div className="text-center py-12 font-mono text-sm text-muted">
                    {demoLeadsTab === 'engaged'
                      ? 'No engaged leads yet. Engaged leads clicked Activate Now in the demo.'
                      : 'No demo leads yet. Leads are captured when visitors submit the demo gate form.'}
                  </div>
                )
              }

              if (demoLeadsTab === 'engaged') {
                return (
                  <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          {['Email', 'Business Name', 'Date', 'Actions Taken'].map((h) => (
                            <th key={h} className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((lead, i) => (
                          <tr key={lead.id} className={i < rows.length - 1 ? 'border-b border-border' : ''}>
                            <td className="px-5 py-4 font-mono text-sm text-primary">{lead.email}</td>
                            <td className="px-5 py-4 font-mono text-sm text-muted">{lead.business_name ?? '—'}</td>
                            <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                              {new Date(lead.created_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {(lead.events ?? []).map((ev, j) => (
                                  <span key={j} className="font-mono text-xs bg-bg border border-border text-primary/70 dark:text-white/60 px-2 py-0.5 rounded">
                                    {ev.detail ? `${ev.event}: ${ev.detail}` : ev.event}
                                  </span>
                                ))}
                                {(lead.events ?? []).length === 0 && (
                                  <span className="font-mono text-xs text-muted">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }

              return (
                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        {['Email', 'Business Name', 'Business Type', 'Date'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left font-mono text-xs text-muted tracking-widest uppercase">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((lead, i) => (
                        <tr key={lead.id} className={i < rows.length - 1 ? 'border-b border-border' : ''}>
                          <td className="px-5 py-4 font-mono text-sm text-primary">
                            <div className="flex items-center gap-2">
                              {lead.email}
                              {lead.engaged && (
                                <span className="font-mono text-xs text-emerald-700 dark:text-accent border border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5 px-2 py-0.5 rounded-full">
                                  Engaged
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-sm text-muted">{lead.business_name ?? '—'}</td>
                          <td className="px-5 py-4 font-mono text-sm text-muted">{lead.business_type ?? '—'}</td>
                          <td className="px-5 py-4 font-mono text-xs text-muted whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>

          {/* Referrals */}
          <div className="pt-10 border-t border-border">
            <div className="mb-6">
              <h2 className="font-heading text-3xl text-primary mb-1">Referrals</h2>
              <p className="font-mono text-sm text-muted">Clients who referred new signups and reward status.</p>
            </div>
            {(() => {
              const referredProjects = projects.filter((p) => (p as any).referredBy)
              if (referredProjects.length === 0) {
                return (
                  <div className="text-center py-12 font-mono text-sm text-muted">
                    No referrals yet. Each client has a unique referral link on their dashboard.
                  </div>
                )
              }
              return (
                <div className="space-y-3">
                  {referredProjects.map((p) => {
                    const referrer = projects.find((r) => r.clientToken === (p as any).referredBy)
                    return (
                      <div key={p.id} className="bg-card border border-border rounded-lg p-5 shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-heading text-lg text-primary mb-1">{p.businessName}</div>
                          <div className="font-mono text-xs text-muted">
                            Referred by: <span className="text-teal">{referrer?.businessName ?? 'Unknown'}</span>
                          </div>
                          <div className="font-mono text-xs text-muted mt-0.5">
                            {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${
                            (p as any).referralRewardGranted
                              ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30 bg-emerald-700/5 dark:bg-accent/5'
                              : 'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30 bg-yellow-700/5 dark:bg-yellow-400/5'
                          }`}>
                            {(p as any).referralRewardGranted ? 'Reward Granted' : 'Reward Pending'}
                          </span>
                          <Link href={`/admin/projects/${p.id}`} className="font-mono text-xs text-muted hover:text-primary transition-colors">
                            View &rarr;
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading text-2xl text-primary">Add Client</h2>
              <button onClick={() => { setShowAddModal(false); setAddError(''); setAddForm(DEFAULT_ADD_FORM) }}
                className="font-mono text-xs text-muted hover:text-primary transition-colors">Close</button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Business Name *</label>
                  <input type="text" required value={addForm.businessName}
                    onChange={(e) => setAddForm(f => ({ ...f, businessName: e.target.value }))}
                    className="form-input" placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Owner Name *</label>
                  <input type="text" required value={addForm.ownerName}
                    onChange={(e) => setAddForm(f => ({ ...f, ownerName: e.target.value }))}
                    className="form-input" placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Email *</label>
                  <input type="email" required value={addForm.email}
                    onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))}
                    className="form-input" placeholder="jane@acmecorp.com" />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Phone</label>
                  <input type="tel" value={addForm.phone}
                    onChange={(e) => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    className="form-input" placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">HVAC Business Type *</label>
                  <select required value={addForm.businessType}
                    onChange={(e) => setAddForm(f => ({ ...f, businessType: e.target.value }))}
                    className="form-input">
                    <option value="">Select a type</option>
                    {HVAC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Location *</label>
                  <input type="text" required value={addForm.location}
                    onChange={(e) => setAddForm(f => ({ ...f, location: e.target.value }))}
                    className="form-input" placeholder="Austin, TX" />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Plan *</label>
                  <select required value={addForm.plan}
                    onChange={(e) => setAddForm(f => ({ ...f, plan: e.target.value as Plan }))}
                    className="form-input">
                    <option value="platform">Platform Only</option>
                    <option value="platform-plus">Platform Plus Website</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-2">Business Description *</label>
                <textarea required rows={3} value={addForm.businessDescription}
                  onChange={(e) => setAddForm(f => ({ ...f, businessDescription: e.target.value }))}
                  className="form-input resize-none w-full" placeholder="Tell us what the business does..." />
              </div>
              {addError && <p className="font-mono text-xs text-red-700 dark:text-red-400">{addError}</p>}
              <button type="submit" disabled={addingClient}
                className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60">
                {addingClient ? 'Creating...' : 'Create Client Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
