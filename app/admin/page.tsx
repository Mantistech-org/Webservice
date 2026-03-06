'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProjectStatus, Plan } from '@/types'

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
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  admin_review: 'Awaiting Review',
  client_review: 'Client Review',
  changes_requested: 'Changes Requested',
  active: 'Active',
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  admin_review: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  client_review: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  changes_requested: 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  active: 'text-accent border-accent/30 bg-accent/5',
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([])
  const [demoLoading, setDemoLoading] = useState(false)

  // Check auth on mount
  useEffect(() => {
    fetch('/api/admin/projects')
      .then((r) => {
        if (r.ok) {
          setAuthed(true)
          return r.json()
        } else {
          setAuthed(false)
          return null
        }
      })
      .then((data) => {
        if (data) {
          setProjects(data.projects)
          loadDemoSessions()
        }
      })
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      loadProjects()
      loadDemoSessions()
    } else {
      setLoginError('Incorrect password.')
    }
    setLoggingIn(false)
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
    setProjects([])
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Checking session...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-heading text-2xl tracking-widest text-white">MANTIS TECH</span>
          </div>
          <div className="bg-card border border-border rounded p-8">
            <div className="font-mono text-xs text-accent tracking-widest uppercase mb-2">Admin</div>
            <h1 className="font-heading text-3xl text-white mb-6">Dashboard Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  className="form-input"
                  placeholder="Enter admin password"
                />
              </div>
              {loginError && (
                <p className="font-mono text-xs text-red-400">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-accent text-bg font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60"
              >
                {loggingIn ? 'Authenticating...' : 'Enter Dashboard'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const filtered =
    statusFilter === 'all'
      ? projects
      : projects.filter((p) => p.status === statusFilter)

  const counts = {
    all: projects.length,
    admin_review: projects.filter((p) => p.status === 'admin_review').length,
    client_review: projects.filter((p) => p.status === 'client_review').length,
    changes_requested: projects.filter((p) => p.status === 'changes_requested').length,
    active: projects.filter((p) => p.status === 'active').length,
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-heading text-xl tracking-widest text-white">MANTIS TECH</span>
          <span className="font-mono text-xs text-muted ml-2">/ Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadProjects}
            className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:border-accent hover:text-accent transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-5xl text-white mb-2">Project Dashboard</h1>
          <p className="font-mono text-sm text-muted">
            {projects.length} total project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(
            [
              ['all', 'All', counts.all],
              ['admin_review', 'Awaiting Review', counts.admin_review],
              ['client_review', 'Client Review', counts.client_review],
              ['changes_requested', 'Changes Requested', counts.changes_requested],
              ['active', 'Active', counts.active],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as ProjectStatus | 'all')}
              className={`font-mono text-xs px-4 py-2 rounded border tracking-wider transition-all flex items-center gap-2 ${
                statusFilter === key
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-border text-muted hover:border-border-light'
              }`}
            >
              {label}
              <span className={`px-1.5 py-0.5 rounded text-xs ${statusFilter === key ? 'bg-accent/20' : 'bg-card'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Projects table */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 font-mono text-sm text-muted">
            No projects found.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projects/${project.id}`}
                className="group block bg-card border border-border rounded hover:border-accent/50 transition-all duration-200"
              >
                <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-heading text-xl text-white group-hover:text-accent transition-colors truncate">
                        {project.businessName}
                      </h3>
                      <span
                        className={`font-mono text-xs border px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[project.status]}`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-muted">
                      <span>{project.ownerName}</span>
                      <span className="text-dim">{project.email}</span>
                      <span className="capitalize text-teal">{project.plan} Plan</span>
                      {project.addons.length > 0 && (
                        <span>{project.addons.length} add-on{project.addons.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs text-muted">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="font-mono text-xs text-dim mt-0.5">
                      ID: {project.id.slice(0, 8)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Demo Visitors */}
        <div className="mt-16 pt-10 border-t border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-3xl text-white mb-1">Demo Visitors</h2>
              <p className="font-mono text-sm text-muted">
                {demoSessions.length} session{demoSessions.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
            <button
              onClick={loadDemoSessions}
              disabled={demoLoading}
              className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider"
            >
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
                  <div key={session.id} className="bg-card border border-border rounded p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-muted">Session {session.id.slice(0, 8)}</span>
                          <span className="font-mono text-xs text-accent border border-accent/30 bg-accent/5 px-2 py-0.5 rounded-full">
                            {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {session.tabsUsed.map((tab) => (
                            <span key={tab} className="font-mono text-xs bg-bg border border-border text-teal px-2 py-0.5 rounded">
                              {tab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="font-mono text-xs text-dim mt-0.5">
                          Last active {new Date(session.lastActiveAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
