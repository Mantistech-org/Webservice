'use client'

import { useState, useEffect } from 'react'

type BlogPost = {
  id: string
  title: string
  slug: string
  meta_description: string | null
  content: string | null
  status: string
  created_at: string
  published_at: string | null
}

export default function BlogTab() {
  const [posts, setPosts]         = useState<BlogPost[]>([])
  const [loading, setLoading]     = useState(true)
  const [keyword, setKeyword]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData]   = useState<Partial<BlogPost>>({})
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/seo/blog')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setError('Failed to load blog posts.'))
      .finally(() => setLoading(false))
  }, [])

  async function generate() {
    setGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/seo/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed.')
      setPosts((prev) => [data.post, ...prev])
      setKeyword('')
      setSuccess(`Draft created: "${data.post.title}"`)
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
      const res = await fetch(`/api/admin/seo/blog/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load.')
      setEditData(data.post)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post.')
      setEditingId(null)
    }
  }

  async function saveEdit(id: string) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/seo/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed.')
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data.post } : p)))
      setEditingId(null)
      setSuccess(
        data.post.status === 'published'
          ? `Published: /blog/${data.post.slug}`
          : 'Changes saved.'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    try {
      const res = await fetch(`/api/admin/seo/blog/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Update failed.')
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...data.post } : p)))
      setSuccess(newStatus === 'published' ? `Published: /blog/${post.slug}` : 'Moved to draft.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div>
      {/* Generate form */}
      <div className="border border-border rounded-lg bg-card p-5 mb-6">
        <h2 className="font-heading text-lg text-primary mb-4">Generate Blog Post</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-sm">
            <label className="font-mono text-xs text-muted block mb-1">
              Target Keyword <span className="text-dim">(optional)</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. small business websites Little Rock"
              className="w-full bg-bg border border-border text-primary text-sm font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="font-mono text-xs bg-accent text-black px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Post'}
          </button>
        </div>
        <p className="font-mono text-xs text-muted mt-3">
          Leave keyword blank to auto-select a relevant topic. Posts are saved as drafts at{' '}
          <span className="text-primary">/blog/[slug]</span>. The weekly cron also generates a draft every Monday.
        </p>
      </div>

      {error   && <p className="font-mono text-xs text-red-500 mb-4">{error}</p>}
      {success && <p className="font-mono text-xs text-emerald-600 dark:text-emerald-400 mb-4">{success}</p>}

      {loading && <p className="font-mono text-sm text-muted animate-pulse">Loading...</p>}

      {/* Edit panel */}
      {editingId && (
        <div className="border border-accent/30 rounded-lg bg-card p-5 mb-6">
          <h3 className="font-heading text-base text-primary mb-4">Editing Post</h3>
          <div className="space-y-3">
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Title</label>
              <input
                type="text"
                value={editData.title ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                className="w-full bg-bg border border-border text-primary text-sm font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Slug</label>
              <input
                type="text"
                value={editData.slug ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, slug: e.target.value }))}
                className="w-full bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted block mb-1">
                Meta Description <span className="text-dim">(140-160 chars)</span>
              </label>
              <input
                type="text"
                value={editData.meta_description ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, meta_description: e.target.value }))}
                className="w-full bg-bg border border-border text-primary text-xs font-mono rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="font-mono text-xs text-muted block mb-1">Content (HTML)</label>
              <textarea
                value={editData.content ?? ''}
                onChange={(e) => setEditData((d) => ({ ...d, content: e.target.value }))}
                rows={16}
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

      {/* Posts list */}
      {!loading && posts.length === 0 && (
        <p className="font-mono text-sm text-muted">No blog posts yet. Generate one above.</p>
      )}

      {posts.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-muted font-medium">Title</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Status</th>
                <th className="text-left px-4 py-3 text-muted font-medium">Created</th>
                <th className="text-right px-4 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr key={post.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-bg/50'}`}>
                  <td className="px-4 py-3">
                    <div className="text-primary font-medium leading-snug">{post.title}</div>
                    {post.status === 'published' ? (
                      <a
                        href={`${baseUrl}/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-xs"
                      >
                        /blog/{post.slug}
                      </a>
                    ) : (
                      <span className="text-muted text-xs">/blog/{post.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full ${
                      post.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => loadEdit(post.id)}
                        className="border border-border text-muted px-3 py-1 rounded hover:text-primary hover:border-border-light transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(post)}
                        className={`border px-3 py-1 rounded transition-all ${
                          post.status === 'published'
                            ? 'border-border text-muted hover:text-primary hover:border-border-light'
                            : 'border-accent/40 text-emerald-700 dark:text-accent hover:border-accent'
                        }`}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
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
