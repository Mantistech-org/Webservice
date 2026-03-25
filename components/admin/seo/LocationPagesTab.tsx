'use client'

import { useState, useEffect } from 'react'

type LocationPage = {
  id: string
  city: string
  state: string
  slug: string
  meta_title: string | null
  meta_description: string | null
  headline: string | null
  content: string | null
  status: string
  created_at: string
  published_at: string | null
}

export default function LocationPagesTab() {
  const [pages, setPages]         = useState<LocationPage[]>([])
  const [loading, setLoading]     = useState(true)
  const [city, setCity]           = useState('')
  const [state, setState]         = useState('')
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData]   = useState<Partial<LocationPage>>({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/seo/locations')
      .then((r) => r.json())
      .then((d) => setPages(d.pages ?? []))
      .catch(() => setError('Failed to load location pages.'))
      .finally(() => setLoading(false))
  }, [])

  async function generate() {
    if (!city.trim() || !state.trim()) {
      setError('Enter a city and state.')
      return
    }
    setGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/seo/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state: state.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      setPages((prev) => {
        const idx = prev.findIndex((p) => p.id === data.page.id)
        return idx >= 0 ? prev.map((p) => (p.id === data.page.id ? data.page : p)) : [data.page, ...prev]
      })
      setCity('')
      setState('')
      setSuccess(`Draft created for ${data.page.city}, ${data.page.state}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  async function loadEdit(id: string) {
    setEditingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/locations/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load.')
      setEditData(data.page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page.')
      setEditingId(null)
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed.')
      setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.page } : p)))
      setEditingId(null)
      setSuccess(
        data.page.status === 'published'
          ? `Published: /${data.page.slug}`
          : 'Changes saved.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(page: LocationPage) {
    const newStatus = page.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/admin/seo/locations/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Update failed.')
      setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, ...data.page } : p)))
      setSuccess(newStatus === 'published' ? `Published: /locations/${page.slug}` : 'Moved to draft.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      {/* Generate form */}
      <div className="border border-border rounded-lg bg-card p-5 mb-6">
        <h2 className="font-heading text-lg text-primary mb-4">Generate Location Page</h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="font-mono text-xs text-muted block mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
              className="bg-bg border border-border text-primary text-sm font-mono rounded px-3 py-2 w-44 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="font-mono text-xs text-muted block mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="TX"
              className="bg-bg border border-border text-primary text-sm font-mono rounded px-3 py-2 w-24 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="font-mono text-xs bg-accent text-black px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Page'}
          </button>
        </div>
        <p className="font-mono text-xs text-muted mt-3">
          Pages are saved as drafts at <span className="text-primary">/locations/[city-state]</span>. Publish when ready.
        </p>
      </div>

      {error   && <p className="font-mono text-xs text-red-500 mb-4">{error}</p>}
      {success && <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 mb-4">{success}</p>}

      {loading && <p className="font-mono text-sm text-muted animate-pulse">Loading...</p>}

      {/* Edit panel */}
      {editingId && (
        <div className="border border-accent/30 rounded-lg bg-card p-5 mb-6">
          <h3 className="font-heading text-base text-primary mb-4">
            Editing: {editData.city}, {editData.state}
          </h3>
          <div className="space-y-3">
            {(
              [
                { key: 'meta_title',       label: 'Meta Title',       hint: '50-60 chars', multi: false },
                { key: 'meta_description', label: 'Meta Description', hint: '140-160 chars', multi: false },
                { key: 'headline',         label: 'H1 Headline',      hint: 'under 70 chars', multi: false },
              ] as Array<{ key: keyof LocationPage; label: string; hint: string; multi: boolean }>
            ).map(({ key, label, hint }) => (
              <div key={key}>
                <label className="font-mono text-xs text-muted block mb-1">
                  {label} <span className="text-dim">({hint})</span>
                </label>
                <input
                  type="text"
                  value={(editData[key] as string) ?? ''}
                  onChange={(e) => setEditData((d) => ({ ...d, [key]: e.target.value }))}
                  className="w-full bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
                />
              </div>
            ))}
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Page Content (HTML)</label>
              <textarea
                value={editData.content ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, content: e.target.value }))}
                rows={14}
                className="w-full bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent resize-y"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Status</label>
              <select
                value={editData.status ?? 'draft'}
                onChange={(e) => setEditData((d) => ({ ...d, status: e.target.value }))}
                className="bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => saveEdit(editingId)}
              disabled={saving}
              className="font-mono text-xs bg-accent text-black px-4 py-1.5 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="font-mono text-xs border border-border text-muted px-4 py-1.5 rounded hover:text-primary transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Pages list */}
      {!loading && pages.length === 0 && (
        <p className="font-mono text-sm text-muted">No location pages yet. Generate one above.</p>
      )}

      {pages.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-muted font-medium">Location</th>
                <th className="text-left px-4 py-3 text-muted font-medium">URL</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Created</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, i) => (
                <tr key={page.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-bg/50'}`}>
                  <td className="px-4 py-3 text-primary font-medium">
                    {page.city}, {page.state}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {page.status === 'published' ? (
                      <a
                        href={`${baseUrl}/locations/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        /locations/{page.slug}
                      </a>
                    ) : (
                      <span>/locations/{page.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      page.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(page.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => loadEdit(page.id)}
                        className="border border-border text-muted px-3 py-1 rounded hover:text-primary hover:border-border-light transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(page)}
                        className={`border px-3 py-1 rounded transition-all ${
                          page.status === 'published'
                            ? 'border-border text-muted hover:text-primary hover:border-border-light'
                            : 'border-accent/40 text-emerald-700 dark:text-accent hover:border-accent'
                        }`}
                      >
                        {page.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
