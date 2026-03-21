'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
  updated_at: string
}

export default function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body: '' })
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  // AI generation state
  const [aiContext, setAiContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  // Preview state
  const [showPreview, setShowPreview] = useState(false)

  // Test send state
  const [showTestSend, setShowTestSend] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/leads/templates')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load templates.')
      setTemplates(data.templates ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  const selectTemplate = (t: EmailTemplate) => {
    setSelected(t)
    setForm({ name: t.name, subject: t.subject, body: t.body })
    setIsNew(false)
    setError('')
    setSaveMsg('')
    setShowAiPanel(false)
  }

  const startNew = () => {
    setSelected(null)
    setForm({ name: '', subject: '', body: '' })
    setIsNew(true)
    setError('')
    setSaveMsg('')
    setShowAiPanel(false)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setError('Name, subject, and body are all required.')
      return
    }
    setSaving(true)
    setError('')
    setSaveMsg('')

    try {
      if (isNew) {
        const res = await fetch('/api/admin/leads/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Save failed.')
        setTemplates((prev) => [data.template, ...prev])
        setSelected(data.template)
        setIsNew(false)
        setSaveMsg('Template created.')
      } else if (selected) {
        const res = await fetch(`/api/admin/leads/templates/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Save failed.')
        setTemplates((prev) => prev.map((t) => (t.id === selected.id ? data.template : t)))
        setSelected(data.template)
        setSaveMsg('Template saved.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected || !confirm(`Delete template "${selected.name}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/leads/templates/${selected.id}`, { method: 'DELETE' })
      setTemplates((prev) => prev.filter((t) => t.id !== selected.id))
      setSelected(null)
      setForm({ name: '', subject: '', body: '' })
      setIsNew(false)
    } catch {
      setError('Delete failed.')
    } finally {
      setDeleting(false)
    }
  }

  const handleGenerate = async () => {
    if (!aiContext.trim()) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/leads/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: aiContext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      setForm((prev) => ({
        ...prev,
        subject: data.subject || prev.subject,
        body: data.body || prev.body,
      }))
      setShowAiPanel(false)
      setAiContext('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail.trim()) return
    setTestSending(true)
    setTestMsg(null)
    try {
      const res = await fetch('/api/admin/leads/templates/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, subject: form.subject, body: form.body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed.')
      setTestMsg({ ok: true, text: `Test email sent to ${testEmail}.` })
    } catch (err) {
      setTestMsg({ ok: false, text: err instanceof Error ? err.message : 'Send failed.' })
    } finally {
      setTestSending(false)
    }
  }

  const isEditing = isNew || !!selected

  const PREVIEW_NAME = 'Main Street Thrift'
  const PREVIEW_LOCATION = 'Austin, TX'

  function applyPreviewVars(text: string): string {
    return text
      .replace(/\[Name\]/g, PREVIEW_NAME)
      .replace(/\[Location\]/g, PREVIEW_LOCATION)
      .replace(/\{\{business_name\}\}/g, PREVIEW_NAME)
  }

  const previewSubject = applyPreviewVars(form.subject)
  const previewBody = applyPreviewVars(form.body)

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left: template list */}
      <div className="w-56 shrink-0 space-y-1">
        <button
          onClick={startNew}
          className="w-full font-mono text-xs px-3 py-2 rounded border border-dashed border-border text-muted hover:text-primary hover:border-accent transition-colors text-left"
        >
          + New template
        </button>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-card border border-border rounded animate-pulse" />
          ))
        ) : templates.length === 0 ? (
          <p className="font-mono text-xs text-muted px-1 pt-2">No templates yet.</p>
        ) : (
          templates.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              className={`w-full text-left font-mono text-xs px-3 py-2.5 rounded border transition-colors truncate ${
                selected?.id === t.id
                  ? 'bg-accent/10 text-emerald-700 dark:text-accent border-accent/20'
                  : 'border-border text-muted hover:text-primary hover:bg-bg'
              }`}
            >
              {t.name}
            </button>
          ))
        )}
      </div>

      {/* Right: editor */}
      <div className="flex-1 min-w-0">
        {!isEditing ? (
          <div className="h-full flex items-center justify-center text-muted font-mono text-sm">
            Select a template or create a new one.
          </div>
        ) : (
          <div className="bg-card border border-border rounded p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-primary">
                {isNew ? 'New Template' : 'Edit Template'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowPreview(true); setShowAiPanel(false) }}
                  disabled={!form.subject.trim() && !form.body.trim()}
                  className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Preview Email
                </button>
                <button
                  onClick={() => { setShowTestSend(true); setShowAiPanel(false); setTestMsg(null) }}
                  disabled={!form.subject.trim() && !form.body.trim()}
                  className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Send Test Email
                </button>
                <button
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary hover:border-accent transition-colors"
                >
                  {showAiPanel ? 'Hide AI' : 'Generate with AI'}
                </button>
              </div>
            </div>

            {/* AI panel */}
            {showAiPanel && (
              <div className="p-4 bg-bg border border-border rounded space-y-3">
                <div className="font-mono text-xs text-muted tracking-widest uppercase">
                  AI Email Generator
                </div>
                <p className="font-mono text-xs text-muted">
                  Describe the target audience for this email. The generated subject and body will replace the fields below.
                </p>
                <textarea
                  rows={4}
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="e.g. Local plumbing companies in Texas with no website. They likely rely on word of mouth and want more customers without managing a complex website themselves."
                  className="w-full bg-card border border-border text-primary rounded px-3 py-2 font-mono text-xs resize-none focus:outline-none focus:border-accent transition-colors"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !aiContext.trim()}
                    className="font-mono text-xs px-4 py-1.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="font-mono text-xs text-muted hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-700/5 dark:bg-red-400/5 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                Template Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cold Outreach - No Website"
                className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Quick question about your online presence"
                className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-xs text-muted tracking-widest uppercase">
                  Email Body
                </label>
                <span className="font-mono text-xs text-muted/60">
                  Variables: {'[Name]'} (business name), {'[Location]'} (city/location)
                </span>
              </div>
              <textarea
                rows={12}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your email body here..."
                className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm resize-none focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="font-mono text-xs px-5 py-2 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
              >
                {saving ? 'Saving...' : 'Save Template'}
              </button>
              {!isNew && selected && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="font-mono text-xs px-4 py-2 rounded border border-red-700/20 dark:border-red-400/20 text-red-700 dark:text-red-400 hover:bg-red-700/5 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
              {saveMsg && (
                <span className="font-mono text-xs text-emerald-700 dark:text-accent">{saveMsg}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test send modal */}
      {showTestSend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowTestSend(false)}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="font-mono text-xs text-muted tracking-widest uppercase">Send Test Email</div>
              <button
                onClick={() => setShowTestSend(false)}
                className="font-mono text-xs text-muted hover:text-primary transition-colors"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleTestSend} className="px-6 py-5 space-y-4">
              <p className="font-mono text-xs text-muted leading-relaxed">
                Sends the template to the address below with placeholder variables replaced by example values.
                The subject will be prefixed with [TEST].
              </p>
              <div>
                <label className="block font-mono text-xs text-muted tracking-widest uppercase mb-1.5">
                  Send To
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              {testMsg && (
                <div className={`font-mono text-xs px-3 py-2 rounded border ${
                  testMsg.ok
                    ? 'text-emerald-700 dark:text-accent border-emerald-700/20 dark:border-accent/20 bg-emerald-700/5 dark:bg-accent/5'
                    : 'text-red-700 dark:text-red-400 border-red-700/20 dark:border-red-400/20 bg-red-700/5 dark:bg-red-400/5'
                }`}>
                  {testMsg.text}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={testSending || !testEmail.trim()}
                  className="font-mono text-xs px-5 py-2 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
                >
                  {testSending ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTestSend(false)}
                  className="font-mono text-xs text-muted hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <div className="font-mono text-xs text-muted tracking-widest uppercase mb-0.5">
                  Email Preview
                </div>
                <div className="font-mono text-xs text-muted/60">
                  Variables replaced with example values
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="font-mono text-xs text-muted hover:text-primary transition-colors px-3 py-1.5 border border-border rounded"
              >
                Close
              </button>
            </div>

            {/* Subject */}
            <div className="px-6 py-4 border-b border-border">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-1.5">Subject</div>
              <div className="font-mono text-sm text-primary">
                {previewSubject || <span className="text-muted italic">No subject</span>}
              </div>
            </div>

            {/* Email body rendered as it will be sent */}
            <div className="p-6">
              <div className="font-mono text-xs text-muted tracking-widest uppercase mb-3">Body</div>
              <div className="rounded border border-border overflow-hidden bg-white">
                <div style={{ maxWidth: '560px', padding: '32px 24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif', fontSize: '15px', color: '#000000', lineHeight: '1.6' }}>
                  {previewBody
                    ? previewBody.split('\n').filter((line) => line.trim()).map((line, i) => (
                        <p key={i} style={{ margin: '0 0 16px 0' }}>{line}</p>
                      ))
                    : <p style={{ margin: 0, color: '#888', fontStyle: 'italic' }}>No body content.</p>
                  }
                  <p style={{ margin: '32px 0 0 0', fontSize: '13px', color: '#666666' }}>
                    Mantis Tech - Web Design &amp; Digital Marketing
                  </p>
                </div>
              </div>

              {/* Example values note */}
              <div className="mt-4 font-mono text-xs text-muted">
                Preview uses: [Name] = &quot;{PREVIEW_NAME}&quot;, [Location] = &quot;{PREVIEW_LOCATION}&quot;
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
