'use client'

import { useState } from 'react'

interface Props { sessionId: string }

interface EmailItem {
  subject: string
  preview: string
  body: string
  delayLabel: string
}

interface ECommerceResult {
  abandonedCart: { emails: EmailItem[] }
  postPurchase: { emails: EmailItem[] }
  restockAlert: { emails: EmailItem[] }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return <button onClick={copy} className="font-mono text-xs text-muted hover:text-accent transition-colors tracking-wider">{copied ? 'Copied' : 'Copy'}</button>
}

function EmailCard({ email, index, color }: { email: EmailItem; index: number; color: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-bg border border-border rounded overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-7 h-7 rounded shrink-0 flex items-center justify-center font-mono text-xs font-bold text-black`} style={{ backgroundColor: color }}>
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs text-muted mb-0.5">{email.delayLabel}</div>
            <div className="font-mono text-sm text-primary leading-tight">{email.subject}</div>
            <div className="font-mono text-xs text-dim mt-0.5 truncate">{email.preview}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CopyButton text={`Subject: ${email.subject}\n\n${email.body}`} />
          <button onClick={() => setOpen(!open)} className="font-mono text-xs text-muted hover:text-accent transition-colors">
            {open ? 'Hide' : 'View'}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border px-4 py-4 bg-card">
          <p className="text-sm text-teal leading-relaxed whitespace-pre-line">{email.body}</p>
        </div>
      )}
    </div>
  )
}

function FlowDiagram({ labels, color }: { labels: string[]; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-4">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="bg-bg border border-border rounded px-3 py-2">
            <div className="font-mono text-xs text-muted mb-0.5">Email {i + 1}</div>
            <div className="font-mono text-xs text-primary">{label}</div>
          </div>
          {i < labels.length - 1 && (
            <div className="font-mono text-xs shrink-0" style={{ color }}>&#8594;</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ECommerceAutomation({ sessionId }: Props) {
  const [storeName, setStoreName] = useState('')
  const [productTypes, setProductTypes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ECommerceResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/demo/ecommerce-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, storeName, productTypes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data.result as ECommerceResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const sequences = result
    ? [
        {
          key: 'abandonedCart' as const,
          label: 'Abandoned Cart Recovery',
          description: 'Triggers when a shopper leaves without completing checkout',
          color: '#f97316',
        },
        {
          key: 'postPurchase' as const,
          label: 'Post-Purchase Follow-up',
          description: 'Triggers immediately after a confirmed order',
          color: '#3b82f6',
        },
        {
          key: 'restockAlert' as const,
          label: 'Restock Alert',
          description: 'Triggers when a previously out-of-stock item is available',
          color: '#00ff88',
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">E-Commerce Platform</p>
          <h2 className="font-heading text-2xl text-primary">Generate Email Sequences</h2>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Store Name</label>
                <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Summit Supply Co." required className="form-input" />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Product Types</label>
                <input type="text" value={productTypes} onChange={(e) => setProductTypes(e.target.value)} placeholder="Outdoor gear, hiking equipment, apparel" required className="form-input" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Building sequences...' : 'Generate Email Sequences'}
            </button>
          </form>

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-muted font-mono text-sm">
              <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Writing your automated email sequences...
            </div>
          )}
          {error && <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded p-4 font-mono text-sm text-red-400">{error}</div>}
        </div>
      </div>

      {result && sequences.map(({ key, label, description, color }) => (
        <div key={key} className="bg-card border border-border rounded">
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color }}>{label}</p>
                <h3 className="font-heading text-xl text-primary">{result[key].emails.length} Emails</h3>
                <p className="font-mono text-xs text-dim mt-1">{description}</p>
              </div>
              <div className="font-mono text-xs text-dim text-right">
                <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ backgroundColor: color }} />
                Active
              </div>
            </div>
            <FlowDiagram labels={result[key].emails.map((e) => e.delayLabel)} color={color} />
          </div>
          <div className="p-6 space-y-3">
            {result[key].emails.map((email, i) => (
              <EmailCard key={i} email={email} index={i} color={color} />
            ))}
          </div>
        </div>
      ))}

      <p className="font-mono text-xs text-dim text-center">
        This demo is powered by real AI tools. The full version connects directly to your Shopify, WooCommerce, or custom store and triggers emails automatically.
      </p>
    </div>
  )
}
