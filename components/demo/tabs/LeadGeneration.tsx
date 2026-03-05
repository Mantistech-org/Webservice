'use client'

import { useState } from 'react'

interface Props { sessionId: string }

interface Lead {
  businessName: string
  location: string
  industry: string
  email: string
  outreachSubject: string
  outreachBody: string
}

interface LeadResult { leads: Lead[] }

export default function LeadGeneration({ sessionId }: Props) {
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [clientDescription, setClientDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LeadResult | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [sent, setSent] = useState<Set<number>>(new Set())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setExpanded(null)
    try {
      const res = await fetch('/api/demo/lead-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, industry, location, clientDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as LeadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const copyEmail = (i: number, lead: Lead) => {
    navigator.clipboard.writeText(`Subject: ${lead.outreachSubject}\n\n${lead.outreachBody}`)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  const sendEmail = (i: number) => {
    setSent((prev) => new Set([...prev, i]))
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Lead Finder</p>
          <h2 className="font-heading text-2xl text-primary">Generate Targeted Leads</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Target Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Restaurants, Dental Practices, Law Firms..."
                  required
                  className="form-input"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Austin, TX or Greater Chicago Area"
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Ideal Client Description</label>
              <textarea
                value={clientDescription}
                onChange={(e) => setClientDescription(e.target.value)}
                placeholder="Small to mid-size businesses with 5 to 50 employees, established for at least 2 years, looking to grow their online presence..."
                required
                rows={3}
                className="form-input resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Finding leads...' : 'Generate 10 Leads with Outreach Emails'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Researching leads and writing personalized emails...
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Results</p>
              <h3 className="font-heading text-xl text-primary">{result.leads.length} Leads Found</h3>
            </div>
            <span className="font-mono text-xs text-dim">{industry} in {location}</span>
          </div>

          <div className="space-y-3">
            {result.leads.map((lead, i) => (
              <div key={i} className="bg-card border border-border rounded overflow-hidden">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 border border-accent/20 flex items-center justify-center font-mono text-xs text-accent shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-heading text-lg text-primary leading-tight">{lead.businessName}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                          <span className="font-mono text-xs text-muted">{lead.location}</span>
                          <span className="font-mono text-xs text-teal">{lead.industry}</span>
                          <span className="font-mono text-xs text-dim">{lead.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="font-mono text-xs border border-border text-muted px-3 py-1.5 rounded hover:border-accent hover:text-accent transition-all"
                    >
                      {expanded === i ? 'Hide Email' : 'View Email'}
                    </button>
                    {sent.has(i) ? (
                      <span className="font-mono text-xs text-accent border border-accent/30 bg-accent/5 px-3 py-1.5 rounded">Sent</span>
                    ) : (
                      <button
                        onClick={() => sendEmail(i)}
                        className="font-mono text-xs bg-accent text-black px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
                      >
                        Send
                      </button>
                    )}
                  </div>
                </div>

                {expanded === i && (
                  <div className="border-t border-border bg-bg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-mono text-xs text-muted tracking-widest uppercase block mb-1">Subject</span>
                        <span className="font-mono text-sm text-primary">{lead.outreachSubject}</span>
                      </div>
                      <button
                        onClick={() => copyEmail(i, lead)}
                        className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider shrink-0 ml-4"
                      >
                        {copied === i ? 'Copied' : 'Copy Email'}
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <span className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Body</span>
                      <p className="text-sm text-teal leading-relaxed whitespace-pre-line">{lead.outreachBody}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version connects directly to your outreach platform and sends emails automatically on schedule.
      </p>
    </div>
  )
}
