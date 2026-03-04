'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Project, ProjectStatus, PLANS, ADDONS } from '@/types'

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

export default function AdminProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState(false)
  const [requestingChanges, setRequestingChanges] = useState(false)
  const [changesNotes, setChangesNotes] = useState('')
  const [showChangesInput, setShowChangesInput] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`)
      if (res.status === 401) {
        router.push('/admin')
        return
      }
      if (!res.ok) {
        setError('Project not found.')
        return
      }
      const data = await res.json()
      setProject(data.project)
    } catch {
      setError('Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleApprove = async () => {
    setApproving(true)
    const res = await fetch(`/api/admin/projects/${id}/approve`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setProject((p) => p ? { ...p, status: data.project.status } : p)
      setActionMsg('Project approved. Client notification sent.')
    } else {
      setActionMsg('Failed to approve project.')
    }
    setApproving(false)
  }

  const handleRequestChanges = async () => {
    setRequestingChanges(true)
    const res = await fetch(`/api/admin/projects/${id}/request-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: changesNotes }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject((p) => p ? { ...p, status: data.project.status, adminNotes: changesNotes } : p)
      setActionMsg('Changes requested. Client has been notified.')
      setShowChangesInput(false)
    } else {
      setActionMsg('Failed to request changes.')
    }
    setRequestingChanges(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-sm text-red-400 mb-4">{error || 'Project not found.'}</p>
          <Link href="/admin" className="font-mono text-xs text-muted hover:text-accent transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const plan = PLANS[project.plan]
  const activeAddons = ADDONS.filter((a) => project.addons.includes(a.id))

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="font-mono text-xs text-muted hover:text-accent transition-colors">
            &larr; Dashboard
          </Link>
          <span className="text-border">/</span>
          <span className="font-heading text-lg text-white truncate max-w-xs">{project.businessName}</span>
          <span
            className={`font-mono text-xs border px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status]}`}
          >
            {STATUS_LABELS[project.status]}
          </span>
        </div>
        <div className="font-mono text-xs text-dim hidden sm:block">
          ID: {project.id}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Preview iframe — takes 2 columns */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-3xl text-white">Website Preview</h2>
              <a
                href={`/api/preview/${project.adminToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider"
              >
                Open in new tab &rarr;
              </a>
            </div>
            <div className="bg-card border border-border rounded overflow-hidden" style={{ height: '70vh' }}>
              <iframe
                src={`/api/preview/${project.adminToken}`}
                className="w-full h-full"
                title={`Preview: ${project.businessName}`}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {project.status === 'admin_review' || project.status === 'changes_requested' ? (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1 bg-accent text-bg font-mono text-sm py-3 px-6 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60 glow-accent"
                  >
                    {approving ? 'Approving...' : 'Approve and Send to Client'}
                  </button>
                  {!showChangesInput ? (
                    <button
                      onClick={() => setShowChangesInput(true)}
                      className="flex-1 border border-border text-muted font-mono text-sm py-3 px-6 rounded tracking-wider hover:border-orange-400/50 hover:text-orange-400 transition-all"
                    >
                      Request Changes
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        value={changesNotes}
                        onChange={(e) => setChangesNotes(e.target.value)}
                        placeholder="Describe the changes needed..."
                        rows={3}
                        className="form-input resize-none text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleRequestChanges}
                          disabled={requestingChanges}
                          className="flex-1 border border-orange-400/50 text-orange-400 font-mono text-xs py-2 px-4 rounded hover:bg-orange-400/5 transition-all disabled:opacity-60"
                        >
                          {requestingChanges ? 'Sending...' : 'Send to Client'}
                        </button>
                        <button
                          onClick={() => { setShowChangesInput(false); setChangesNotes('') }}
                          className="font-mono text-xs text-muted px-4 py-2 rounded border border-border hover:border-border-light transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : project.status === 'client_review' ? (
                <div className="flex-1 text-center font-mono text-sm text-blue-400 py-3 border border-blue-400/20 rounded bg-blue-400/5">
                  Waiting for client approval
                </div>
              ) : project.status === 'active' ? (
                <div className="flex-1 text-center font-mono text-sm text-accent py-3 border border-accent/20 rounded bg-accent/5">
                  Project is active and payment received
                </div>
              ) : null}
            </div>

            {actionMsg && (
              <div className="font-mono text-xs text-accent bg-accent/5 border border-accent/20 rounded px-4 py-3">
                {actionMsg}
              </div>
            )}
          </div>

          {/* Project details sidebar */}
          <div className="space-y-6">
            {/* Client info */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                Client Information
              </h3>
              <dl className="space-y-3">
                {[
                  ['Business', project.businessName],
                  ['Owner', project.ownerName],
                  ['Email', project.email],
                  ['Phone', project.phone || 'Not provided'],
                  ['Type', project.businessType],
                  ['Location', project.location],
                  ['Website', project.currentWebsite || 'None'],
                  ['Timeline', project.timeline],
                  ['Style', project.stylePreference],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">
                      {label}
                    </dt>
                    <dd className="text-sm text-white break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Plan and Add-ons */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                Plan and Add-ons
              </h3>
              <div className="mb-4">
                <div className="font-mono text-xs text-muted uppercase mb-1">Plan</div>
                <div className="font-heading text-2xl text-white capitalize">
                  {plan.name}
                  <span className="font-mono text-sm text-muted ml-2 font-normal">
                    ${plan.upfront} upfront / ${plan.monthly}/mo
                  </span>
                </div>
              </div>
              {activeAddons.length > 0 ? (
                <div>
                  <div className="font-mono text-xs text-muted uppercase mb-2">Add-ons</div>
                  <div className="space-y-1.5">
                    {activeAddons.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-teal">{a.label}</span>
                        <span className="font-mono text-xs text-muted">+${a.price}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-dim font-mono">No add-ons selected.</p>
              )}
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                Business Description
              </h3>
              <p className="text-sm text-teal leading-relaxed">{project.businessDescription}</p>

              {project.primaryGoal && (
                <>
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mt-4 mb-1">
                    Primary Goal
                  </div>
                  <p className="text-sm text-teal">{project.primaryGoal}</p>
                </>
              )}

              {project.specificFeatures && (
                <>
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mt-4 mb-1">
                    Specific Features
                  </div>
                  <p className="text-sm text-teal">{project.specificFeatures}</p>
                </>
              )}

              {project.additionalNotes && (
                <>
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mt-4 mb-1">
                    Additional Notes
                  </div>
                  <p className="text-sm text-teal">{project.additionalNotes}</p>
                </>
              )}
            </div>

            {/* Uploaded files */}
            {project.uploadedFiles?.length > 0 && (
              <div className="bg-card border border-border rounded p-6">
                <h3 className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
                  Uploaded Photos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {project.uploadedFiles.map((file, i) => (
                    <a
                      key={i}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square block rounded overflow-hidden border border-border hover:border-accent transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={file}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin notes */}
            {project.adminNotes && (
              <div className="bg-orange-950/20 border border-orange-400/20 rounded p-6">
                <h3 className="font-mono text-xs text-orange-400 tracking-widest uppercase mb-3">
                  Admin Notes
                </h3>
                <p className="text-sm text-orange-300 leading-relaxed">{project.adminNotes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="font-mono text-xs text-dim space-y-1">
              <div>Created: {new Date(project.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
