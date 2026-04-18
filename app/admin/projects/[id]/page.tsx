'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Project, ProjectStatus, PLANS, ADDONS, ADDONS as ALL_ADDONS } from '@/types'
import type { DashboardConfig } from '@/lib/configure-dashboard'

const STATUS_LABELS: Record<ProjectStatus, string> = {
  admin_review: 'Awaiting Review',
  client_review: 'Client Review',
  changes_requested: 'Changes Requested',
  active: 'Active',
  generating: 'Generating',
}

// High-contrast status colors for both light and dark mode
const STATUS_COLORS: Record<ProjectStatus, string> = {
  admin_review:       'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30 bg-yellow-700/5 dark:bg-yellow-400/5',
  client_review:      'text-blue-700   dark:text-blue-400   border-blue-700/30   dark:border-blue-400/30   bg-blue-700/5   dark:bg-blue-400/5',
  changes_requested:  'text-red-700    dark:text-red-400    border-red-700/30    dark:border-red-400/30    bg-red-700/5    dark:bg-red-400/5',
  active:             'text-emerald-700 dark:text-accent    border-emerald-700/30 dark:border-accent/30    bg-emerald-700/5 dark:bg-accent/5',
  generating:         'text-purple-700 dark:text-purple-400 border-purple-700/30 dark:border-purple-400/30 bg-purple-700/5 dark:bg-purple-400/5',
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

  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')
  const [editedHtml, setEditedHtml] = useState('')
  const [iframeSrc, setIframeSrc] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [regenNotes, setRegenNotes] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [regenMsg, setRegenMsg] = useState('')

  const [respondingToId, setRespondingToId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [sendingResponse, setSendingResponse] = useState(false)

  const [notifMessage, setNotifMessage] = useState('')
  const [sendingNotif, setSendingNotif] = useState(false)
  const [notifMsg, setNotifMsg] = useState('')
  const [pricingAddonId, setPricingAddonId] = useState<string | null>(null)
  const [addonPrice, setAddonPrice] = useState('')
  const [settingPrice, setSettingPrice] = useState(false)
  const [priceMsg, setPriceMsg] = useState('')
  const [grantingReferral, setGrantingReferral] = useState(false)
  const [referralMsg, setReferralMsg] = useState('')
  const [copiedId, setCopiedId] = useState(false)
  const [activating, setActivating] = useState(false)
  const [activateMsg, setActivateMsg] = useState('')
  const [discountCouponId, setDiscountCouponId] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountMsg, setDiscountMsg] = useState('')

  // ── Dashboard Config tab ──────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'website' | 'config'>('website')
  const [dashConfig, setDashConfig] = useState<DashboardConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [cfgEdits, setCfgEdits] = useState({
    missedCallReply:        '',
    reviewRequestSms:       '',
    reviewRequestEmail:     '',
    gbpPostTemplates:       ['', '', ''] as [string, string, string],
    smsTemplates:           ['', '', ''] as [string, string, string],
    emailTemplates:         ['', '', ''] as [string, string, string],
    serviceAreaDescription: '',
    welcomeMessage:         '',
  })
  const [savingCfgField, setSavingCfgField] = useState<string | null>(null)
  const [regenField, setRegenField]         = useState<string | null>(null)
  const [configMsg, setConfigMsg]           = useState<{ field: string; text: string; ok: boolean } | null>(null)
  const [sendingToClient, setSendingToClient]   = useState(false)
  const [sendToClientMsg, setSendToClientMsg]   = useState('')

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`)
      if (res.status === 401) { router.push('/admin'); return }
      if (!res.ok) { setError('Project not found.'); return }
      const data = await res.json()
      setProject(data.project)
      setEditedHtml(data.project.generatedHtml ?? '')
      setIframeSrc(`/api/preview/${data.project.adminToken}`)
    } catch {
      setError('Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchProject() }, [fetchProject])

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const res = await fetch(`/api/admin/projects/${id}/config`)
      if (res.ok) {
        const data = await res.json()
        if (data.config) {
          setDashConfig(data.config as DashboardConfig)
          initCfgEdits(data.config as DashboardConfig)
        }
      }
    } finally {
      setConfigLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (mainTab === 'config' && !dashConfig && !configLoading) {
      void fetchConfig()
    }
  }, [mainTab, dashConfig, configLoading, fetchConfig])

  // Poll every 3s while status is 'generating'; stop automatically when it changes
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (project?.status === 'generating') {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(fetchProject, 3000)
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [project?.status, fetchProject])

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

  const handleRespondToChange = async (changeRequestId: string) => {
    setSendingResponse(true)
    const res = await fetch(`/api/admin/projects/${id}/respond-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeRequestId, response: responseText }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject(data.project)
      setRespondingToId(null)
      setResponseText('')
    }
    setSendingResponse(false)
  }

  const handleSendNotification = async () => {
    if (!notifMessage.trim()) return
    setSendingNotif(true)
    const res = await fetch(`/api/admin/projects/${id}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: notifMessage }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject((p) => p ? { ...p, notifications: [...(p.notifications ?? []), data.notification] } : p)
      setNotifMessage('')
      setNotifMsg('Notification sent to client.')
    } else {
      setNotifMsg('Failed to send notification.')
    }
    setSendingNotif(false)
  }

  const handleSetAddonPrice = async (addonId: string) => {
    const price = parseFloat(addonPrice)
    if (isNaN(price) || price <= 0) return
    setSettingPrice(true)
    const res = await fetch(`/api/admin/projects/${id}/price-custom-addon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonId, monthlyPrice: price }),
    })
    if (res.ok) {
      const data = await res.json()
      setProject(data.project)
      setPricingAddonId(null)
      setAddonPrice('')
      setPriceMsg('Price set and client notified.')
    } else {
      setPriceMsg('Failed to set price.')
    }
    setSettingPrice(false)
  }

  const handleActivate = async () => {
    setActivating(true)
    setActivateMsg('')
    const res = await fetch(`/api/admin/projects/${id}/activate`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setProject((p) => p ? { ...p, status: data.project.status } : p)
      setActivateMsg('Project activated successfully.')
    } else {
      setActivateMsg('Failed to activate project.')
    }
    setActivating(false)
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(project?.id ?? '')
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleGrantReferral = async () => {
    setGrantingReferral(true)
    const res = await fetch(`/api/admin/projects/${id}/grant-referral`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setProject(data.project)
      setReferralMsg('Free month granted and referrer notified.')
    } else {
      setReferralMsg('Failed to grant reward.')
    }
    setGrantingReferral(false)
  }

  const handleSaveHtml = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedHtml: editedHtml }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed.')
      }
      const data = await res.json()
      setProject(data.project)
      setSaveMsg('Changes saved.')
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handlePreviewChanges = () => {
    setIframeSrc(`data:text/html;charset=utf-8,${encodeURIComponent(editedHtml)}`)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setRegenMsg('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, overrideNotes: regenNotes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Regeneration failed.')
      }
      // Server accepted the job (202) — close modal and fetch immediately so
      // status updates to 'generating', which triggers the polling useEffect
      setShowRegenModal(false)
      setRegenNotes('')
      await fetchProject()
    } catch (err) {
      setRegenMsg(err instanceof Error ? err.message : 'Regeneration failed.')
    } finally {
      setRegenerating(false)
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountCouponId.trim()) return
    setApplyingDiscount(true)
    setDiscountMsg('')
    try {
      const res = await fetch(`/api/admin/projects/${id}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_id: discountCouponId.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setDiscountMsg('Discount applied to client account.')
        setDiscountCouponId('')
      } else {
        setDiscountMsg(data.error ?? 'Failed to apply discount.')
      }
    } catch {
      setDiscountMsg('Network error.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  // ── Dashboard Config helpers ──────────────────────────────────────────────

  function padThree(arr: string[]): [string, string, string] {
    return ([...arr, '', '', ''].slice(0, 3)) as [string, string, string]
  }

  function initCfgEdits(cfg: DashboardConfig) {
    setCfgEdits({
      missedCallReply:        cfg.missedCallReply,
      reviewRequestSms:       cfg.reviewRequestSms,
      reviewRequestEmail:     cfg.reviewRequestEmail,
      gbpPostTemplates:       padThree(cfg.gbpPostTemplates),
      smsTemplates:           padThree(cfg.smsTemplates),
      emailTemplates:         padThree(cfg.emailTemplates),
      serviceAreaDescription: cfg.serviceAreaDescription,
      welcomeMessage:         cfg.welcomeMessage,
    })
  }

  async function handleSaveCfgField(fieldName: string) {
    setSavingCfgField(fieldName)
    setConfigMsg(null)
    try {
      const value = cfgEdits[fieldName as keyof typeof cfgEdits]
      const res = await fetch(`/api/admin/projects/${id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { [fieldName]: value } }),
      })
      const data = await res.json()
      if (res.ok && data.config) {
        setDashConfig(data.config as DashboardConfig)
        setConfigMsg({ field: fieldName, text: 'Saved.', ok: true })
      } else {
        setConfigMsg({ field: fieldName, text: (data as { error?: string }).error ?? 'Save failed.', ok: false })
      }
    } catch {
      setConfigMsg({ field: fieldName, text: 'Network error.', ok: false })
    } finally {
      setSavingCfgField(null)
    }
  }

  async function handleRegenCfgField(fieldName: string) {
    setRegenField(fieldName)
    setConfigMsg(null)
    try {
      const res = await fetch(`/api/admin/projects/${id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerateField: fieldName }),
      })
      const data = await res.json()
      if (res.ok && data.config) {
        setDashConfig(data.config as DashboardConfig)
        initCfgEdits(data.config as DashboardConfig)
        setConfigMsg({ field: fieldName, text: 'Regenerated.', ok: true })
      } else {
        setConfigMsg({ field: fieldName, text: (data as { error?: string }).error ?? 'Regeneration failed.', ok: false })
      }
    } catch {
      setConfigMsg({ field: fieldName, text: 'Network error.', ok: false })
    } finally {
      setRegenField(null)
    }
  }

  async function handleRegenAllCfg() {
    setRegenField('all')
    setConfigMsg(null)
    try {
      const res = await fetch(`/api/admin/projects/${id}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate: true }),
      })
      const data = await res.json()
      if (res.ok && data.config) {
        setDashConfig(data.config as DashboardConfig)
        initCfgEdits(data.config as DashboardConfig)
        setConfigMsg({ field: 'all', text: 'All fields regenerated.', ok: true })
      } else {
        setConfigMsg({ field: 'all', text: (data as { error?: string }).error ?? 'Regeneration failed.', ok: false })
      }
    } catch {
      setConfigMsg({ field: 'all', text: 'Network error.', ok: false })
    } finally {
      setRegenField(null)
    }
  }

  async function handleSendToClient() {
    if (!project) return
    setSendingToClient(true)
    setSendToClientMsg('')
    const endpoint = project.plan === 'platform-plus' ? 'approve' : 'activate'
    try {
      const res = await fetch(`/api/admin/projects/${id}/${endpoint}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setProject((p) => p ? { ...p, status: (data as { project: Project }).project.status } : p)
        setSendToClientMsg(
          project.plan === 'platform-plus'
            ? 'Sent to client for review. Status set to Client Review.'
            : 'Project activated. Client can access their dashboard.'
        )
      } else {
        setSendToClientMsg('Failed to send to client.')
      }
    } catch {
      setSendToClientMsg('Network error.')
    } finally {
      setSendingToClient(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-mono text-sm text-muted animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
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
    <div className="flex-1 min-w-0">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <Link href="/admin" className="font-mono text-xs text-muted hover:text-primary transition-colors">
          &larr; Clients
        </Link>
        <span className="text-border">/</span>
        <span className="font-heading text-sm text-primary truncate max-w-xs">{project.businessName}</span>
        <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status]}`}>
          {STATUS_LABELS[project.status]}
        </span>
        <span className="font-mono text-xs text-dim ml-auto hidden sm:block">ID: {project.id}</span>
      </div>

      {/* Main tab bar */}
      <div className="border-b border-border px-6">
        <div className="flex gap-1">
          {(['website', 'config'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMainTab(t)}
              className={`font-mono text-xs tracking-widest uppercase px-5 py-2.5 border-b-2 transition-colors ${
                mainTab === t
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-primary'
              }`}
            >
              {t === 'website' ? 'Website' : 'Dashboard Config'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {mainTab === 'website' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* Preview / Edit tabs */}
          <div className="xl:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-3xl text-primary">Website</h2>
              <div className="flex items-center gap-1 bg-card border border-border rounded p-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`font-mono text-xs px-4 py-1.5 rounded transition-all ${activeTab === 'preview' ? 'bg-accent text-black' : 'text-muted hover:text-primary'}`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`font-mono text-xs px-4 py-1.5 rounded transition-all ${activeTab === 'edit' ? 'bg-accent text-black' : 'text-muted hover:text-primary'}`}
                >
                  Edit HTML
                </button>
              </div>
            </div>

            {activeTab === 'preview' && (
              <>
                <div className="flex items-center justify-between">
                  <a
                    href={`/api/preview/${project.adminToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider"
                  >
                    Open in new tab &rarr;
                  </a>
                  <button
                    onClick={() => { setShowRegenModal(true); setRegenMsg('') }}
                    disabled={regenerating || project.status === 'generating'}
                    className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:border-accent hover:text-accent transition-all disabled:opacity-60"
                  >
                    {project.status === 'generating' ? 'Generating…' : 'Regenerate Site'}
                  </button>
                </div>
                <div className="bg-card border border-border rounded overflow-hidden" style={{ height: '70vh' }}>
                  <iframe
                    src={iframeSrc}
                    className="w-full h-full"
                    title={`Preview: ${project.businessName}`}
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </>
            )}

            {activeTab === 'edit' && (
              <>
                <textarea
                  value={editedHtml}
                  onChange={(e) => setEditedHtml(e.target.value)}
                  className="form-input font-mono text-xs w-full resize-y"
                  style={{ minHeight: '600px' }}
                  spellCheck={false}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveHtml}
                    disabled={saving || regenerating}
                    className="flex-1 bg-accent text-black font-mono text-sm py-2.5 px-6 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handlePreviewChanges}
                    disabled={saving || regenerating}
                    className="flex-1 border border-border text-muted font-mono text-sm py-2.5 px-6 rounded tracking-wider hover:border-accent hover:text-accent transition-all disabled:opacity-60"
                  >
                    Preview Changes
                  </button>
                </div>
                {saveMsg && (
                  <p className={`font-mono text-xs ${saveMsg === 'Changes saved.' ? 'text-accent' : 'text-red-400'}`}>
                    {saveMsg}
                  </p>
                )}
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {project.status === 'admin_review' || project.status === 'changes_requested' ? (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={approving || regenerating}
                    className="flex-1 bg-accent text-black font-mono text-sm py-3 px-6 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60 glow-accent"
                  >
                    {approving ? 'Approving...' : 'Approve and Send to Client'}
                  </button>
                  {!showChangesInput ? (
                    <button
                      onClick={() => setShowChangesInput(true)}
                      disabled={regenerating}
                      className="flex-1 border border-border text-muted font-mono text-sm py-3 px-6 rounded tracking-wider hover:border-orange-400/50 hover:text-orange-400 transition-all disabled:opacity-60"
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
                <div className="flex-1 text-center font-mono text-sm text-blue-700 dark:text-blue-400 py-3 border border-blue-700/20 dark:border-blue-400/20 rounded bg-blue-700/5 dark:bg-blue-400/5">
                  Waiting for client approval
                </div>
              ) : project.status === 'active' ? (
                <div className="flex-1 text-center font-mono text-sm text-emerald-700 dark:text-accent py-3 border border-emerald-700/20 dark:border-accent/20 rounded bg-emerald-700/5 dark:bg-accent/5">
                  Project is active and payment received
                </div>
              ) : project.status === 'generating' ? (
                <div className="flex-1 text-center font-mono text-sm text-purple-700 dark:text-purple-400 py-3 border border-purple-700/20 dark:border-purple-400/20 rounded bg-purple-700/5 dark:bg-purple-400/5 animate-pulse">
                  Generating site — checking for updates every 3s&hellip;
                </div>
              ) : null}
            </div>

            <a
              href={`/client/dashboard/${project.clientToken}?admin_preview=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-border text-muted font-mono text-sm py-3 px-6 rounded tracking-wider hover:border-accent hover:text-accent transition-all"
            >
              View Client Dashboard
            </a>

            {project.status !== 'active' && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="w-full border border-accent/40 text-accent font-mono text-sm py-3 px-6 rounded tracking-wider hover:bg-accent/5 transition-all disabled:opacity-60"
                >
                  {activating ? 'Activating...' : 'Activate Project'}
                </button>
                {activateMsg && (
                  <p className={`font-mono text-xs ${activateMsg.includes('successfully') ? 'text-accent' : 'text-red-400'}`}>
                    {activateMsg}
                  </p>
                )}
              </div>
            )}

            {actionMsg && (
              <div className="font-mono text-xs text-emerald-700 dark:text-accent bg-emerald-700/5 dark:bg-accent/5 border border-emerald-700/20 dark:border-accent/20 rounded px-4 py-3">
                {actionMsg}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client info */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-3">Client Information</h3>
              <div className="flex items-start gap-2 mb-4 pb-4 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">Project ID</div>
                  <div className="font-mono text-xs text-primary break-all">{project.id}</div>
                </div>
                <button
                  onClick={handleCopyId}
                  className="font-mono text-xs text-muted hover:text-accent transition-colors shrink-0 px-2 py-1 border border-border rounded hover:border-accent"
                >
                  {copiedId ? 'Copied' : 'Copy'}
                </button>
              </div>
              <dl className="space-y-3">
                {[
                  ['Business', project.businessName],
                  ['Owner', project.ownerName],
                  ['Email', project.email],
                  ['Phone', project.phone || 'Not provided'],
                  ['Type', project.businessType],
                  ['Location', project.location],
                  ['Website', project.currentWebsite || 'None'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">{label}</dt>
                    <dd className="text-sm text-primary break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Domain — action required, shown prominently */}
            {project.domainStatus && (
              <div className={`border rounded p-6 ${
                project.domainStatus === 'new'
                  ? 'bg-yellow-950/20 border-yellow-400/40'
                  : 'bg-blue-950/20 border-blue-400/40'
              }`}>
                <h3 className={`font-mono text-xs tracking-widest uppercase mb-4 flex items-center gap-2 ${
                  project.domainStatus === 'new' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Domain
                  <span className={`ml-auto font-mono text-xs border px-2 py-0.5 rounded-full ${
                    project.domainStatus === 'new'
                      ? 'text-yellow-400 border-yellow-400/40'
                      : 'text-blue-400 border-blue-400/40'
                  }`}>
                    {project.domainStatus === 'new' ? 'Register New Domain' : 'Transfer / Point Existing'}
                  </span>
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">Status</dt>
                    <dd className="text-sm text-primary font-medium">
                      {project.domainStatus === 'existing' ? 'Client has an existing domain' : 'Client needs a new domain registered'}
                    </dd>
                  </div>
                  {project.domainStatus === 'existing' && project.existingDomain && (
                    <div>
                      <dt className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">Their Domain</dt>
                      <dd className="text-sm text-primary font-mono">{project.existingDomain}</dd>
                    </div>
                  )}
                  {project.domainStatus === 'new' && project.preferredDomain && (
                    <div>
                      <dt className="font-mono text-xs text-muted uppercase tracking-wider mb-0.5">Preferred Domain</dt>
                      <dd className="text-sm text-primary font-mono">{project.preferredDomain}</dd>
                    </div>
                  )}
                  {project.wantsProfessionalEmail && (
                    <div className="flex items-center gap-2 pt-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="font-mono text-xs text-accent">Professional email address requested</span>
                    </div>
                  )}
                </dl>
                <div className={`mt-4 text-xs font-mono leading-relaxed p-3 rounded border ${
                  project.domainStatus === 'new'
                    ? 'text-primary bg-yellow-400/5 border-yellow-400/20'
                    : 'text-primary bg-blue-400/5 border-blue-400/20'
                }`}>
                  {project.domainStatus === 'new'
                    ? 'Action needed: Check availability and register this domain before building the site. If unavailable reach out to client with alternatives.'
                    : 'Action needed: Point this domain to the new hosting after the site is built. No action from client required.'}
                </div>
              </div>
            )}

            {/* Plan and Add-ons */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Plan and Add-ons</h3>
              <div className="mb-4">
                <div className="font-mono text-xs text-muted uppercase mb-1">Plan</div>
                <div className="font-heading text-2xl text-primary capitalize">
                  {plan?.name ?? project.plan}
                  <span className="font-mono text-sm text-muted ml-2 font-normal">
                    {plan ? `$${plan.upfront} upfront / $${plan.monthly}/mo` : ''}
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

            {/* Business Description */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Business Description</h3>
              <p className="text-sm text-teal leading-relaxed">{project.businessDescription}</p>
              {project.specificFeatures && (
                <>
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mt-4 mb-1">Specific Features</div>
                  <p className="text-sm text-teal">{project.specificFeatures}</p>
                </>
              )}
              {project.additionalNotes && (
                <>
                  <div className="font-mono text-xs text-muted uppercase tracking-wider mt-4 mb-1">Additional Notes</div>
                  <p className="text-sm text-teal">{project.additionalNotes}</p>
                </>
              )}
            </div>

            {/* Uploaded files */}
            {project.uploadedFiles?.length > 0 && (
              <div className="bg-card border border-border rounded p-6">
                <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Uploaded Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {project.uploadedFiles.map((file, i) => (
                    <a key={i} href={file} target="_blank" rel="noopener noreferrer"
                      className="aspect-square block rounded overflow-hidden border border-border hover:border-accent transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={file} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Change Requests */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">
                Change Requests {(project.changeRequests?.length ?? 0) > 0 && `(${project.changeRequests!.length})`}
              </h3>
              {project.changeRequests && project.changeRequests.length > 0 ? (
                <div className="space-y-4">
                  {project.changeRequests.map((req) => (
                    <div key={req.id} className="border border-border rounded p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-xs border px-2 py-0.5 rounded-full ${req.status === 'resolved' ? 'text-emerald-700 dark:text-accent border-emerald-700/30 dark:border-accent/30' : 'text-yellow-700 dark:text-yellow-400 border-yellow-700/30 dark:border-yellow-400/30'}`}>
                          {req.status === 'resolved' ? 'Resolved' : 'Pending'}
                        </span>
                        <span className="font-mono text-xs text-dim">{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-teal">{req.message}</p>
                      {req.adminResponse && (
                        <div className="bg-bg border border-border rounded p-3">
                          <div className="font-mono text-xs text-emerald-700 dark:text-accent mb-1">Your Response</div>
                          <p className="text-sm text-primary">{req.adminResponse}</p>
                        </div>
                      )}
                      {req.status === 'pending' && (
                        <>
                          {respondingToId === req.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your response..."
                                rows={3}
                                className="form-input resize-none text-xs w-full"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRespondToChange(req.id)}
                                  disabled={sendingResponse || !responseText.trim()}
                                  className="flex-1 font-mono text-xs bg-accent text-black py-2 rounded hover:bg-white transition-all disabled:opacity-60"
                                >
                                  {sendingResponse ? 'Sending...' : 'Send and Resolve'}
                                </button>
                                <button
                                  onClick={() => { setRespondingToId(null); setResponseText('') }}
                                  className="font-mono text-xs text-muted px-3 py-2 border border-border rounded hover:border-border-light transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRespondingToId(req.id)}
                              className="font-mono text-xs text-accent border border-accent/30 px-3 py-1.5 rounded hover:bg-accent/5 transition-all"
                            >
                              Respond
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dim font-mono">No change requests yet.</p>
              )}
            </div>

            {/* Upsell Activity */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Upsell Activity</h3>
              {project.upsellClicks && project.upsellClicks.length > 0 ? (
                <div className="space-y-1.5">
                  {project.upsellClicks.map((click, i) => {
                    const [type, value] = click.split(':')
                    const addonLabel = type === 'addon'
                      ? ALL_ADDONS.find((a) => a.id === value)?.label ?? value
                      : null
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${type === 'upgrade' ? 'bg-blue-400/10 text-blue-400' : 'bg-accent/10 text-accent'}`}>
                          {type}
                        </span>
                        <span className="text-teal">{addonLabel ?? value}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-dim font-mono">No upsell activity yet.</p>
              )}
            </div>

            {/* Custom Add-On Requests */}
            {project.customAddons && project.customAddons.length > 0 && (
              <div className="bg-orange-950/20 border border-orange-400/30 rounded p-6">
                <h3 className="font-mono text-xs text-orange-400 tracking-widest uppercase mb-4">
                  Custom Add-On Requests
                </h3>
                {priceMsg && <p className="font-mono text-xs text-accent mb-3">{priceMsg}</p>}
                <div className="space-y-4">
                  {project.customAddons.map((addon) => (
                    <div key={addon.id} className="border border-orange-400/20 rounded p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-primary font-medium">{addon.name}</span>
                        <span className={`font-mono text-xs border px-2 py-0.5 rounded-full shrink-0 ${
                          addon.status === 'accepted' ? 'text-accent border-accent/30' :
                          addon.status === 'declined' ? 'text-red-400 border-red-400/30' :
                          addon.status === 'priced' ? 'text-blue-400 border-blue-400/30' :
                          'text-orange-400 border-orange-400/30'
                        }`}>
                          {addon.status === 'pending' ? 'Needs Pricing' :
                           addon.status === 'priced' ? 'Awaiting Client' :
                           addon.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{addon.description}</p>
                      <div className="font-mono text-xs text-dim">Client budget: {addon.budget}</div>
                      {addon.monthlyPrice && (
                        <div className="font-mono text-xs text-accent">Quoted: ${addon.monthlyPrice}/mo</div>
                      )}
                      {addon.status === 'pending' && (
                        pricingAddonId === addon.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="number"
                              min="1"
                              value={addonPrice}
                              onChange={(e) => setAddonPrice(e.target.value)}
                              placeholder="$/mo"
                              className="form-input text-xs w-24"
                            />
                            <button
                              onClick={() => handleSetAddonPrice(addon.id)}
                              disabled={settingPrice || !addonPrice}
                              className="font-mono text-xs bg-accent text-black px-3 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                              {settingPrice ? 'Saving...' : 'Set Price'}
                            </button>
                            <button
                              onClick={() => { setPricingAddonId(null); setAddonPrice('') }}
                              className="font-mono text-xs text-muted hover:text-primary transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPricingAddonId(addon.id)}
                            className="font-mono text-xs border border-orange-400/50 text-orange-400 px-3 py-1.5 rounded hover:bg-orange-400/10 transition-all"
                          >
                            Set Price
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referral */}
            {project.referredBy && (
              <div className="bg-card border border-border rounded p-6">
                <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Referral</h3>
                {referralMsg && <p className="font-mono text-xs text-emerald-700 dark:text-accent mb-3">{referralMsg}</p>}
                <div className="font-mono text-xs text-muted mb-3">
                  Referred by client: <span className="text-teal break-all">{project.referredBy.slice(0, 16)}...</span>
                </div>
                {project.referralRewardGranted ? (
                  <span className="font-mono text-xs text-emerald-700 dark:text-accent border border-emerald-700/30 dark:border-accent/30 px-2 py-1 rounded">
                    Free month granted
                  </span>
                ) : (
                  <button
                    onClick={handleGrantReferral}
                    disabled={grantingReferral}
                    className="font-mono text-xs bg-accent text-black px-4 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {grantingReferral ? 'Processing...' : 'Grant Free Month'}
                  </button>
                )}
              </div>
            )}

            {/* Apply Discount */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Apply Discount</h3>
              <p className="font-mono text-xs text-muted mb-3">
                Enter a Stripe Coupon ID to apply a discount to this client&apos;s subscription.
                Coupon IDs are listed in the{' '}
                <a href="/admin/pricing" className="text-accent hover:underline">Pricing Manager</a>.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={discountCouponId}
                  onChange={(e) => setDiscountCouponId(e.target.value)}
                  placeholder="Stripe Coupon ID (e.g. XwYz1234)"
                  className="form-input text-xs w-full font-mono"
                />
                <button
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCouponId.trim()}
                  className="w-full font-mono text-xs bg-accent text-black py-2.5 rounded hover:bg-white transition-all disabled:opacity-60"
                >
                  {applyingDiscount ? 'Applying...' : 'Apply Discount'}
                </button>
                {discountMsg && (
                  <p className={`font-mono text-xs ${discountMsg.startsWith('Discount applied') ? 'text-emerald-700 dark:text-accent' : 'text-red-400'}`}>
                    {discountMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Send Notification */}
            <div className="bg-card border border-border rounded p-6">
              <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-4">Send Notification</h3>
              <div className="space-y-3">
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Type a message to send to the client dashboard..."
                  rows={3}
                  className="form-input resize-none text-xs w-full"
                />
                <button
                  onClick={handleSendNotification}
                  disabled={sendingNotif || !notifMessage.trim()}
                  className="w-full font-mono text-xs bg-accent text-black py-2.5 rounded hover:bg-white transition-all disabled:opacity-60"
                >
                  {sendingNotif ? 'Sending...' : 'Send to Client'}
                </button>
                {notifMsg && (
                  <p className="font-mono text-xs text-emerald-700 dark:text-accent">{notifMsg}</p>
                )}
              </div>
            </div>

            {/* Admin notes */}
            {project.adminNotes && (
              <div className="bg-orange-950/20 border border-orange-400/20 rounded p-6">
                <h3 className="font-mono text-xs text-orange-400 tracking-widest uppercase mb-3">Admin Notes</h3>
                <p className="text-sm text-primary leading-relaxed">{project.adminNotes}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="font-mono text-xs text-dim space-y-1">
              <div>Created: {new Date(project.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
        )}

        {/* ── Dashboard Config tab ──────────────────────────────────────────── */}
        {mainTab === 'config' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
              <div>
                <h2 className="font-heading text-2xl text-primary">Dashboard Config</h2>
                <p className="font-mono text-xs text-muted mt-1">
                  AI-generated automations and content pre-loaded into this client&apos;s platform.
                </p>
              </div>
              <button
                onClick={handleRegenAllCfg}
                disabled={regenField !== null}
                className="font-mono text-xs border border-border px-4 py-2 rounded text-muted hover:border-accent hover:text-accent transition-all disabled:opacity-60 flex items-center gap-2 shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={regenField === 'all' ? 'animate-spin' : ''}>
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                {regenField === 'all' ? 'Regenerating...' : 'Regenerate All'}
              </button>
            </div>

            {configMsg?.field === 'all' && (
              <p className={`font-mono text-xs mb-6 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>
                {configMsg.text}
              </p>
            )}

            {configLoading ? (
              <p className="font-mono text-xs text-muted animate-pulse">Loading config...</p>
            ) : !dashConfig ? (
              <div className="bg-card border border-border rounded p-8 text-center">
                <p className="font-mono text-xs text-muted mb-2">No dashboard configuration generated yet.</p>
                <p className="font-mono text-xs text-dim mb-6">
                  Config is generated automatically when a client submits the intake form. You can also generate it manually.
                </p>
                <button
                  onClick={handleRegenAllCfg}
                  disabled={regenField !== null}
                  className="font-mono text-xs bg-accent text-black px-5 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {regenField === 'all' ? 'Generating...' : 'Generate Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* ── Single textarea fields ──────────────────────────────────── */}

                {/* Missed Call Auto-Reply */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Missed Call Auto-Reply</h3>
                    <button onClick={() => handleRegenCfgField('missedCallReply')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'missedCallReply' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-3">Auto-reply SMS when a call is missed. Max 160 characters.</p>
                  <textarea rows={3} value={cfgEdits.missedCallReply}
                    onChange={(e) => setCfgEdits((p) => ({ ...p, missedCallReply: e.target.value }))}
                    className="form-input w-full resize-y text-sm mb-3" />
                  {configMsg?.field === 'missedCallReply' && (
                    <p className={`font-mono text-xs mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('missedCallReply')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {savingCfgField === 'missedCallReply' ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Review Request SMS */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Review Request SMS</h3>
                    <button onClick={() => handleRegenCfgField('reviewRequestSms')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'reviewRequestSms' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-3">Sent to customers after a completed job asking for a Google review.</p>
                  <textarea rows={3} value={cfgEdits.reviewRequestSms}
                    onChange={(e) => setCfgEdits((p) => ({ ...p, reviewRequestSms: e.target.value }))}
                    className="form-input w-full resize-y text-sm mb-3" />
                  {configMsg?.field === 'reviewRequestSms' && (
                    <p className={`font-mono text-xs mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('reviewRequestSms')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {savingCfgField === 'reviewRequestSms' ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Review Request Email */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Review Request Email</h3>
                    <button onClick={() => handleRegenCfgField('reviewRequestEmail')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'reviewRequestEmail' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-3">Email version of the review request. First line is the subject.</p>
                  <textarea rows={10} value={cfgEdits.reviewRequestEmail}
                    onChange={(e) => setCfgEdits((p) => ({ ...p, reviewRequestEmail: e.target.value }))}
                    className="form-input w-full resize-y text-sm mb-3" />
                  {configMsg?.field === 'reviewRequestEmail' && (
                    <p className={`font-mono text-xs mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('reviewRequestEmail')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {savingCfgField === 'reviewRequestEmail' ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* ── GBP Post Templates ────────────────────────────────────── */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Google Business Profile Posts</h3>
                    <button onClick={() => handleRegenCfgField('gbpPostTemplates')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'gbpPostTemplates' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-4">3 weather-triggered GBP post templates. Max 300 characters each.</p>
                  <div className="space-y-4">
                    {(['Cold Snap Alert', 'Heat Wave Alert', 'Seasonal Transition'] as const).map((label, i) => (
                      <div key={i}>
                        <div className="font-mono text-xs text-muted mb-1">{label}</div>
                        <textarea rows={3} value={cfgEdits.gbpPostTemplates[i]}
                          onChange={(e) => {
                            const arr = [...cfgEdits.gbpPostTemplates] as [string, string, string]
                            arr[i] = e.target.value
                            setCfgEdits((p) => ({ ...p, gbpPostTemplates: arr }))
                          }}
                          className="form-input w-full resize-y text-sm" />
                      </div>
                    ))}
                  </div>
                  {configMsg?.field === 'gbpPostTemplates' && (
                    <p className={`font-mono text-xs mt-3 mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('gbpPostTemplates')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60 mt-4">
                    {savingCfgField === 'gbpPostTemplates' ? 'Saving...' : 'Save All'}
                  </button>
                </div>

                {/* ── SMS Blast Templates ───────────────────────────────────── */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">SMS Blast Templates</h3>
                    <button onClick={() => handleRegenCfgField('smsTemplates')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'smsTemplates' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-4">3 SMS blast templates for weather event campaigns. Max 160 characters each.</p>
                  <div className="space-y-4">
                    {(['Cold Snap Campaign', 'Heat Wave Campaign', 'Seasonal Promotion'] as const).map((label, i) => (
                      <div key={i}>
                        <div className="font-mono text-xs text-muted mb-1">{label}</div>
                        <textarea rows={3} value={cfgEdits.smsTemplates[i]}
                          onChange={(e) => {
                            const arr = [...cfgEdits.smsTemplates] as [string, string, string]
                            arr[i] = e.target.value
                            setCfgEdits((p) => ({ ...p, smsTemplates: arr }))
                          }}
                          className="form-input w-full resize-y text-sm" />
                      </div>
                    ))}
                  </div>
                  {configMsg?.field === 'smsTemplates' && (
                    <p className={`font-mono text-xs mt-3 mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('smsTemplates')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60 mt-4">
                    {savingCfgField === 'smsTemplates' ? 'Saving...' : 'Save All'}
                  </button>
                </div>

                {/* ── Email Campaign Templates ──────────────────────────────── */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Email Campaign Templates</h3>
                    <button onClick={() => handleRegenCfgField('emailTemplates')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'emailTemplates' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-4">3 weather-triggered email campaign templates. First line of each is the subject.</p>
                  <div className="space-y-4">
                    {(['Cold Snap Email', 'Heat Wave Email', 'Seasonal Maintenance Email'] as const).map((label, i) => (
                      <div key={i}>
                        <div className="font-mono text-xs text-muted mb-1">{label}</div>
                        <textarea rows={10} value={cfgEdits.emailTemplates[i]}
                          onChange={(e) => {
                            const arr = [...cfgEdits.emailTemplates] as [string, string, string]
                            arr[i] = e.target.value
                            setCfgEdits((p) => ({ ...p, emailTemplates: arr }))
                          }}
                          className="form-input w-full resize-y text-sm" />
                      </div>
                    ))}
                  </div>
                  {configMsg?.field === 'emailTemplates' && (
                    <p className={`font-mono text-xs mt-3 mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('emailTemplates')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60 mt-4">
                    {savingCfgField === 'emailTemplates' ? 'Saving...' : 'Save All'}
                  </button>
                </div>

                {/* Service Area Description */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Service Area Description</h3>
                    <button onClick={() => handleRegenCfgField('serviceAreaDescription')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'serviceAreaDescription' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-3">Displayed on the client&apos;s platform to describe their coverage area.</p>
                  <textarea rows={3} value={cfgEdits.serviceAreaDescription}
                    onChange={(e) => setCfgEdits((p) => ({ ...p, serviceAreaDescription: e.target.value }))}
                    className="form-input w-full resize-y text-sm mb-3" />
                  {configMsg?.field === 'serviceAreaDescription' && (
                    <p className={`font-mono text-xs mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('serviceAreaDescription')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {savingCfgField === 'serviceAreaDescription' ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* Welcome Message */}
                <div className="bg-card border border-border rounded p-6">
                  <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                    <h3 className="font-mono text-xs text-accent tracking-widest uppercase">Welcome Message</h3>
                    <button onClick={() => handleRegenCfgField('welcomeMessage')} disabled={regenField !== null}
                      className="font-mono text-xs text-muted hover:text-accent transition-colors disabled:opacity-50">
                      {regenField === 'welcomeMessage' ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-dim mb-3">Shown on the client dashboard on first login.</p>
                  <textarea rows={4} value={cfgEdits.welcomeMessage}
                    onChange={(e) => setCfgEdits((p) => ({ ...p, welcomeMessage: e.target.value }))}
                    className="form-input w-full resize-y text-sm mb-3" />
                  {configMsg?.field === 'welcomeMessage' && (
                    <p className={`font-mono text-xs mb-2 ${configMsg.ok ? 'text-accent' : 'text-red-400'}`}>{configMsg.text}</p>
                  )}
                  <button onClick={() => handleSaveCfgField('welcomeMessage')} disabled={savingCfgField !== null}
                    className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-60">
                    {savingCfgField === 'welcomeMessage' ? 'Saving...' : 'Save'}
                  </button>
                </div>

                {/* ── Send to Client ────────────────────────────────────────── */}
                <div className="bg-card border border-accent/30 rounded p-6">
                  <h3 className="font-mono text-xs text-accent tracking-widest uppercase mb-2">Send to Client</h3>
                  <p className="font-mono text-xs text-muted mb-5">
                    {project.plan === 'platform-plus'
                      ? 'Sets status to Client Review and sends the client a link to review and approve their website.'
                      : 'Activates the account and sends the client access to their Platform Only dashboard.'}
                  </p>
                  {project.status === 'active' ? (
                    <div className="font-mono text-xs text-accent border border-accent/30 rounded px-4 py-2.5 text-center">
                      Project is already active.
                    </div>
                  ) : project.status === 'client_review' ? (
                    <div className="font-mono text-xs text-blue-400 border border-blue-400/30 rounded px-4 py-2.5 text-center">
                      Already sent to client for review.
                    </div>
                  ) : (
                    <button
                      onClick={handleSendToClient}
                      disabled={sendingToClient}
                      className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 glow-accent"
                    >
                      {sendingToClient
                        ? 'Sending...'
                        : project.plan === 'platform-plus'
                          ? 'Send for Client Review'
                          : 'Activate and Send Dashboard Access'}
                    </button>
                  )}
                  {sendToClientMsg && (
                    <p className={`font-mono text-xs mt-3 ${sendToClientMsg.includes('Failed') || sendToClientMsg.includes('error') ? 'text-red-400' : 'text-accent'}`}>
                      {sendToClientMsg}
                    </p>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </div>

      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
          <div className="bg-card border border-border rounded p-8 w-full max-w-md">
            <h2 className="font-heading text-2xl text-primary mb-2">Regenerate Site</h2>
            <p className="font-mono text-xs text-muted mb-6">
              The site will be rebuilt using the original intake data. Add any additional instructions below.
            </p>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">
                  Additional instructions (optional)
                </label>
                <textarea
                  value={regenNotes}
                  onChange={(e) => setRegenNotes(e.target.value)}
                  placeholder="e.g. Use a dark color scheme, add a gallery section..."
                  rows={4}
                  className="form-input resize-none text-xs w-full"
                  disabled={regenerating}
                />
              </div>
              {regenMsg && <p className="font-mono text-xs text-red-400">{regenMsg}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex-1 bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60"
                >
                  {regenerating ? 'Generating...' : 'Regenerate'}
                </button>
                <button
                  onClick={() => { setShowRegenModal(false); setRegenNotes(''); setRegenMsg('') }}
                  disabled={regenerating}
                  className="flex-1 border border-border text-muted font-mono text-sm py-3 rounded tracking-wider hover:border-border-light transition-all disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
