'use client'

import { useState, useEffect } from 'react'

type SeoMeta = {
  id: string
  page_path: string
  page_label: string
  meta_title: string | null
  meta_description: string | null
  og_title: string | null
  og_description: string | null
  status: string
}

const SITE_PAGES = [
  { path: '/',        label: 'Homepage' },
  { path: '/intake',  label: 'Get Started' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/terms',   label: 'Terms of Service' },
]

export default function MetaTagsTab() {
  const [records, setRecords]     = useState<SeoMeta[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState<string | null>(null) // page_path being generated
  const [editing, setEditing]     = useState<string | null>(null)   // id being edited
  const [draft, setDraft]         = useState<Partial<SeoMeta>>({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/seo/meta')
      .then((r) => r.json())
      .then((d) => setRecords(d.meta ?? []))
      .catch(() => setError('Failed to load meta tags.'))
      .finally(() => setLoading(false))
  }, [])

  function getRecord(path: string): SeoMeta | undefined {
    return records.find((r) => r.page_path === path)
  }

  async function generate(path: string, label: string) {
    setGenerating(path)
    setError(null)
    try {
      const res = await fetch('/api/admin/seo/meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_path: path, page_label: label }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      setRecords((prev) => {
        const idx = prev.findIndex((r) => r.page_path === path)
        return idx >= 0
          ? prev.map((r) => (r.page_path === path ? data.meta : r))
          : [...prev, data.meta]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(null)
    }
  }

  function startEdit(record: SeoMeta) {
    setEditing(record.id)
    setDraft({
      meta_title:       record.meta_title ?? '',
      meta_description: record.meta_description ?? '',
      og_title:         record.og_title ?? '',
      og_description:   record.og_description ?? '',
      status:           record.status,
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/meta/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed.')
      setRecords((prev) => prev.map((r) => (r.id === id ? data.meta : r)))
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="font-mono text-sm text-muted animate-pulse">Loading meta tags...</p>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs text-muted">
          Generate and apply SEO meta tags for each page. Tags are saved as draft until you mark them published.
        </p>
        <button
          onClick={() => {
            const ungenerated = SITE_PAGES.filter((p) => !getRecord(p.path))
            ungenerated.forEach((p) => generate(p.path, p.label))
          }}
          className="font-mono text-xs bg-accent text-black px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Generate All
        </button>
      </div>

      {error && (
        <p className="font-mono text-xs text-red-500 mb-4">{error}</p>
      )}

      <div className="space-y-4">
        {SITE_PAGES.map((page) => {
          const record = getRecord(page.path)
          const isGenerating = generating === page.path
          const isEditing = editing === record?.id

          return (
            <div key={page.path} className="border border-border rounded-lg bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span className="font-mono text-sm text-primary font-medium">{page.label}</span>
                  <span className="font-mono text-xs text-muted ml-2">{page.path}</span>
                  {record && (
                    <span className={`ml-3 font-mono text-xs px-2 py-0.5 rounded-full ${
                      record.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {record.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {record && !isEditing && (
                    <button
                      onClick={() => startEdit(record)}
                      className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:text-primary hover:border-border-light transition-all"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => generate(page.path, page.label)}
                    disabled={isGenerating}
                    className="font-mono text-xs border border-border px-3 py-1.5 rounded text-muted hover:text-primary hover:border-border-light transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : record ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
              </div>

              {record && !isEditing && (
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-muted">Title:</span>{' '}
                    <span className="text-primary">{record.meta_title ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted">Description:</span>{' '}
                    <span className="text-primary">{record.meta_description ?? '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted">OG Title:</span>{' '}
                    <span className="text-primary">{record.og_title ?? '—'}</span>
                  </div>
                </div>
              )}

              {isEditing && record && (
                <div className="space-y-3 mt-3">
                  {(
                    [
                      { key: 'meta_title',       label: 'Meta Title',       hint: '50-60 chars' },
                      { key: 'meta_description',  label: 'Meta Description', hint: '140-160 chars' },
                      { key: 'og_title',          label: 'OG Title',         hint: '55-70 chars' },
                      { key: 'og_description',    label: 'OG Description',   hint: '100-150 chars' },
                    ] as Array<{ key: keyof typeof draft; label: string; hint: string }>
                  ).map(({ key, label, hint }) => (
                    <div key={key}>
                      <label className="font-mono text-xs text-muted block mb-1">
                        {label} <span className="text-dim">({hint})</span>
                      </label>
                      <input
                        type="text"
                        value={(draft[key] as string) ?? ''}
                        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                        className="w-full bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="font-mono text-xs text-muted block mb-1">Status</label>
                    <select
                      value={draft.status ?? 'draft'}
                      onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                      className="bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(record.id)}
                      disabled={saving}
                      className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:text-primary transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
