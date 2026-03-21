'use client'

import { useState } from 'react'

interface SearchResult {
  place_id: string
  business_name: string
  address: string
  phone: string
  website: string
  email: string | null
  rating: number | null
  rating_count: number
  already_saved: boolean
}

interface SearchTabProps {
  onLeadsSaved: () => void
}

const FIELD_CLS = 'w-full bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-accent transition-colors'
const LABEL_CLS = 'block font-mono text-xs text-muted tracking-widest uppercase mb-1.5'

export default function SearchTab({ onLeadsSaved }: SearchTabProps) {
  const [form, setForm] = useState({
    query: '',
    location: '',
    keyword: '',
    radius: '25000',
    minRating: '',
    maxRating: '',
    hasWebsite: 'any',
    hasEmail: 'any',
    hasPhone: 'any',
    maxResults: '20',
  })
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchedMeta, setSearchedMeta] = useState<{ location: string; category: string } | null>(null)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const applyPreset = (preset: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...preset }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setError('')
    setSaveMsg('')
    setResults([])
    setSelected(new Set())

    try {
      const res = await fetch('/api/admin/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: form.query,
          location: form.location,
          keyword: form.keyword,
          radius: Number(form.radius),
          minRating: form.minRating ? Number(form.minRating) : undefined,
          maxRating: form.maxRating ? Number(form.maxRating) : undefined,
          hasWebsite: form.hasWebsite,
          hasEmail: form.hasEmail,
          hasPhone: form.hasPhone,
          maxResults: Number(form.maxResults),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Search failed.')
      setResults(data.results ?? [])
      setSearchedMeta({ location: data.location_searched, category: data.category })
      // Pre-select all unsaved results
      const unsaved = (data.results ?? [])
        .filter((r: SearchResult) => !r.already_saved)
        .map((r: SearchResult) => r.place_id)
      setSelected(new Set(unsaved))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setSearching(false)
    }
  }

  const toggleSelect = (placeId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(placeId)) next.delete(placeId)
      else next.add(placeId)
      return next
    })
  }

  const toggleAll = () => {
    const saveable = results.filter((r) => !r.already_saved)
    if (selected.size === saveable.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(saveable.map((r) => r.place_id)))
    }
  }

  const handleSave = async () => {
    const toSave = results.filter((r) => selected.has(r.place_id))
    if (toSave.length === 0) return

    setSaving(true)
    setSaveMsg('')
    setError('')

    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: toSave,
          category: searchedMeta?.category,
          location_searched: searchedMeta?.location,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed.')
      setSaveMsg(`${data.saved} lead${data.saved !== 1 ? 's' : ''} saved${data.skipped > 0 ? `, ${data.skipped} already existed` : ''}.`)
      setResults((prev) =>
        prev.map((r) => (selected.has(r.place_id) ? { ...r, already_saved: true } : r))
      )
      setSelected(new Set())
      onLeadsSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const saveable = results.filter((r) => !r.already_saved)

  return (
    <div className="space-y-6">
      {/* Search form */}
      <div className="bg-card border border-border rounded p-6">
        <h2 className="font-heading text-xl text-primary mb-5">Search Google Places</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>
                Business Category / Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. plumbers, restaurants, dentists"
                value={form.query}
                onChange={(e) => setForm({ ...form, query: e.target.value })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>
                Location <span className="text-muted font-normal normal-case tracking-normal">(optional — leave blank for national)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Austin, TX or Chicago"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Keyword (optional)</label>
              <input
                type="text"
                placeholder="e.g. family-owned, emergency"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Radius</label>
              <select
                value={form.radius}
                onChange={(e) => setForm({ ...form, radius: e.target.value })}
                className={FIELD_CLS}
              >
                <option value="5000">5 km</option>
                <option value="10000">10 km</option>
                <option value="25000">25 km</option>
                <option value="50000">50 km</option>
                <option value="100000">100 km</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Min Rating</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="e.g. 3.5"
                value={form.minRating}
                onChange={(e) => setForm({ ...form, minRating: e.target.value })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Max Rating</label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                placeholder="e.g. 4.5"
                value={form.maxRating}
                onChange={(e) => setForm({ ...form, maxRating: e.target.value })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Has Website</label>
              <select
                value={form.hasWebsite}
                onChange={(e) => setForm({ ...form, hasWebsite: e.target.value })}
                className={FIELD_CLS}
              >
                <option value="any">Any</option>
                <option value="no">No website</option>
                <option value="yes">Has existing website</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Has Phone</label>
              <select
                value={form.hasPhone}
                onChange={(e) => setForm({ ...form, hasPhone: e.target.value })}
                className={FIELD_CLS}
              >
                <option value="any">Any</option>
                <option value="yes">Has Phone</option>
                <option value="no">No Phone</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Has Email</label>
              <select
                value={form.hasEmail}
                onChange={(e) => setForm({ ...form, hasEmail: e.target.value })}
                className={FIELD_CLS}
              >
                <option value="any">Any</option>
                <option value="yes">Has Email</option>
                <option value="no">No Email</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Max Results</label>
              <select
                value={form.maxResults}
                onChange={(e) => setForm({ ...form, maxResults: e.target.value })}
                className={FIELD_CLS}
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>

          {/* Quick filter presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-mono text-xs text-muted tracking-widest uppercase">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset({ hasWebsite: 'no', hasEmail: 'yes', hasPhone: 'any' })}
              className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary hover:border-accent transition-colors"
            >
              No Website + Has Email
            </button>
            <button
              type="button"
              onClick={() => applyPreset({ hasWebsite: 'no', hasPhone: 'yes', hasEmail: 'any' })}
              className="font-mono text-xs px-3 py-1.5 border border-border rounded text-muted hover:text-primary hover:border-accent transition-colors"
            >
              No Website + Has Phone
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-700/5 dark:bg-red-400/5 border border-red-700/20 dark:border-red-400/20 rounded font-mono text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={searching}
            className="font-mono text-xs px-6 py-2.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wider"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-mono text-xs text-muted tracking-widest uppercase">
              {results.length} result{results.length !== 1 ? 's' : ''}
              {saveable.length > 0 && (
                <span className="ml-2 text-primary">
                  &mdash; {selected.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveMsg && (
                <span className="font-mono text-xs text-emerald-700 dark:text-accent">{saveMsg}</span>
              )}
              {saveable.length > 0 && (
                <button
                  onClick={handleSave}
                  disabled={saving || selected.size === 0}
                  className="font-mono text-xs px-4 py-1.5 rounded bg-accent text-black hover:opacity-90 transition-opacity disabled:opacity-40 tracking-wider"
                >
                  {saving ? 'Saving...' : `Save Selected (${selected.size})`}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={saveable.length > 0 && selected.size === saveable.length}
                      onChange={toggleAll}
                      className="accent-emerald-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Business</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Address</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Website</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-muted tracking-widest uppercase">Rating</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.place_id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      r.already_saved
                        ? 'opacity-40'
                        : selected.has(r.place_id)
                        ? 'bg-accent/5'
                        : 'hover:bg-bg'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {r.already_saved ? (
                        <span className="text-muted">Saved</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={selected.has(r.place_id)}
                          onChange={() => toggleSelect(r.place_id)}
                          className="accent-emerald-600"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-primary font-medium">{r.business_name}</td>
                    <td className="px-4 py-3 text-muted max-w-[200px] truncate">{r.address || '—'}</td>
                    <td className="px-4 py-3 text-muted">{r.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {r.website ? (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 dark:text-accent underline truncate max-w-[150px] block"
                        >
                          {r.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{r.email || '—'}</td>
                    <td className="px-4 py-3 text-muted">
                      {r.rating !== null ? (
                        <span>
                          {r.rating} <span className="text-primary/40">({r.rating_count})</span>
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!searching && results.length === 0 && searchedMeta && (
        <div className="text-center py-10 font-mono text-sm text-muted">
          No results found. Try adjusting your filters or search area.
        </div>
      )}
    </div>
  )
}
