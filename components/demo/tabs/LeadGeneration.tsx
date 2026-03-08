'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  onImportContacts: (leads: { businessName: string; email: string }[]) => void
  darkMode?: boolean
}

interface Lead {
  businessName: string
  location: string
  industry: string
  email: string
  outreachSubject: string
  outreachBody: string
}

interface LeadResult { leads: Lead[] }

export default function LeadGeneration({ sessionId, onImportContacts, darkMode }: Props) {
  const [industry, setIndustry] = useState('')
  const [location, setLocation] = useState('')
  const [clientDescription, setClientDescription] = useState('')
  const [leadCount, setLeadCount] = useState(10)
  const [customLeadInput, setCustomLeadInput] = useState('10')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<LeadResult | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [sentAll, setSentAll] = useState(false)
  const [imported, setImported] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setExpanded(null)
    setSent(new Set())
    setSentAll(false)
    setImported(false)
    try {
      const cappedCount = Math.min(leadCount, 250)
      const res = await fetch('/api/demo/lead-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, industry, location, clientDescription, leadCount: cappedCount }),
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

  const sendOne = (i: number) => setSent((prev) => new Set([...prev, i]))

  const sendAll = () => {
    if (!result) return
    setSentAll(true)
    setSent(new Set(result.leads.map((_, i) => i)))
  }

  const handleImport = () => {
    if (!result) return
    onImportContacts(result.leads.map((l) => ({ businessName: l.businessName, email: l.email })))
    setImported(true)
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Lead Finder</p>
          <h2 className="font-heading text-2xl text-primary">Generate Targeted Leads</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Target Industry</label>
                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Restaurants, Dental Practices, Law Firms..." required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Location</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Austin, TX or Greater Chicago Area" required className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors" />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Ideal Client Description</label>
              <textarea value={clientDescription} onChange={(e) => setClientDescription(e.target.value)} placeholder="Small to mid-size businesses with 5 to 50 employees, established for at least 2 years, looking to grow their online presence..." required rows={3} className="w-full bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-4 py-3 font-mono text-sm placeholder:text-[#aaaaaa] focus:outline-none focus:border-[#888888] transition-colors resize-none" />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Number of Leads</label>
              <div className="flex items-center gap-2 flex-wrap">
                {[5, 10, 25, 50].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setLeadCount(n); setCustomLeadInput(String(n)) }}
                    className={`font-mono text-sm px-4 py-2 rounded border transition-all ${
                      leadCount === n && customLeadInput === String(n)
                        ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                        : 'border-[#d0d0d0] text-muted hover:border-[#b0b0b0] hover:text-primary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="250"
                  value={customLeadInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomLeadInput(val)
                    const num = parseInt(val)
                    if (!isNaN(num) && num >= 1 && num <= 250) {
                      setLeadCount(num)
                    }
                  }}
                  placeholder="Custom"
                  className="w-24 bg-[#efefef] border border-[#d0d0d0] text-[#1a1a1a] rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-[#888888] transition-colors"
                />
              </div>
              {leadCount > 100 && leadCount <= 250 && (
                <p className="font-mono text-xs text-muted mt-2">
                  Larger requests may take longer to generate. Results above 100 may have reduced accuracy.
                </p>
              )}
              {parseInt(customLeadInput) > 250 && (
                <p className="font-mono text-xs text-red-500 mt-2">
                  Maximum is 250 leads. Reliability decreases significantly beyond that limit.
                </p>
              )}
            </div>
            <div>
              <button type="submit" disabled={loading} className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-40" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                {loading ? 'Finding leads...' : `Generate ${Math.min(leadCount, 250)} Leads with Outreach Emails`}
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: darkMode ? '#f0f0f0 transparent transparent transparent' : '#1a1a1a transparent transparent transparent' }} />
              Researching leads and writing personalized emails...
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded p-4 font-mono text-sm text-red-300">{error}</div>
          )}
        </div>
      </div>

      {result && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#00aa55' }}>Results</p>
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
                      <div className="w-8 h-8 rounded bg-[#efefef] border border-[#d0d0d0] flex items-center justify-center font-mono text-xs shrink-0 mt-0.5" style={{ color: '#00aa55' }}>
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
                    <button onClick={() => setExpanded(expanded === i ? null : i)} className="font-mono text-xs border border-[#d0d0d0] text-muted px-3 py-1.5 rounded hover:border-[#b0b0b0] hover:text-primary transition-all">
                      {expanded === i ? 'Hide' : 'View Email'}
                    </button>
                    {sent.has(i) ? (
                      <span className="font-mono text-xs border border-[#d0d0d0] text-muted px-3 py-1.5 rounded">Sent</span>
                    ) : (
                      <button onClick={() => sendOne(i)} className="font-mono text-xs px-3 py-1.5 rounded hover:opacity-80 transition-opacity" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                        Send
                      </button>
                    )}
                  </div>
                </div>

                {expanded === i && (
                  <div className="border-t border-border bg-[#efefef] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-mono text-xs text-muted tracking-widest uppercase block mb-1">Subject</span>
                        <span className="font-mono text-sm text-primary">{lead.outreachSubject}</span>
                      </div>
                      <button onClick={() => copyEmail(i, lead)} className="font-mono text-xs text-muted hover:text-primary transition-colors tracking-wider shrink-0 ml-4">
                        {copied === i ? 'Copied' : 'Copy Email'}
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#d0d0d0]">
                      <span className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Body</span>
                      <p className="text-sm text-teal leading-relaxed whitespace-pre-line">{lead.outreachBody}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={sendAll}
              disabled={sentAll}
              className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity disabled:opacity-50 flex-1 sm:flex-none"
              style={{ backgroundColor: '#000000', color: '#f0f0f0' }}
            >
              {sentAll ? 'All Emails Sent' : `Send All ${result.leads.length} Outreach Emails`}
            </button>

            <button
              onClick={handleImport}
              disabled={imported}
              className="font-mono text-sm px-6 py-3 rounded tracking-wider border transition-all flex-1 sm:flex-none"
              style={imported
                ? { borderColor: darkMode ? '#444444' : '#d0d0d0', color: '#00aa55' }
                : { borderColor: darkMode ? '#555555' : '#b0b0b0', color: darkMode ? '#cccccc' : '#333333', backgroundColor: 'transparent' }
              }
            >
              {imported ? 'Imported to Email Marketing' : 'Import to Email Marketing'}
            </button>
          </div>
          {imported && (
            <p className="font-mono text-xs text-muted mt-2">
              Contacts added to your Email Marketing contact list. Switching to Email Marketing tab.
            </p>
          )}
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        The full version connects directly to your outreach platform and sends emails automatically on schedule.
      </p>
    </div>
  )
}
