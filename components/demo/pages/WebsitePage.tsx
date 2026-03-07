'use client'

import { useState } from 'react'

export default function WebsitePage({ darkMode }: { darkMode?: boolean }) {
  const [request, setRequest] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!request.trim()) return
    setSubmitted(true)
    setRequest('')
    setTimeout(() => setSubmitted(false), 4000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl text-[#1a1a1a]">My Website</h1>
        <p className="font-mono text-xs text-[#888888] mt-0.5">Manage your website and request updates</p>
      </div>

      {/* Preview */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded overflow-hidden">
        <div className="px-5 py-4 border-b border-[#d0d0d0] flex items-center justify-between">
          <div className="font-mono text-xs text-[#888888] tracking-widest uppercase">Site Preview</div>
          <a
            href="https://mantistech.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-[#888888] hover:text-[#1a1a1a] underline transition-colors"
          >
            Full screen
          </a>
        </div>
        <div className="bg-[#f0f0f0] h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="font-mono text-xs text-[#aaaaaa] mb-2">
              Your live website preview will appear here.
            </div>
            <div className="font-mono text-xs text-[#cccccc]">mantistech.io/your-business</div>
          </div>
        </div>
      </div>

      {/* Request Changes */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Request Changes</div>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={4}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="Describe the change you would like made to your website..."
            className="form-input resize-none w-full text-sm mb-3"
          />
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!request.trim()}
              className="font-mono text-xs bg-[#1a1a1a] text-white px-5 py-2.5 rounded tracking-wider hover:bg-[#333333] transition-colors disabled:opacity-40"
            >
              Submit Request
            </button>
            {submitted && (
              <span className="font-mono text-xs text-[#00aa55]">Request submitted. We will be in touch within 24 hours.</span>
            )}
          </div>
        </form>
      </div>

      {/* Site Settings */}
      <div className="bg-[#e8e8e8] border border-[#d0d0d0] rounded p-5">
        <div className="font-mono text-xs text-[#888888] tracking-widest uppercase mb-4">Site Settings</div>
        <div className="space-y-3">
          {[
            { label: 'Domain', value: 'mantistech.io/your-business' },
            { label: 'SSL', value: 'Active' },
            { label: 'Hosting', value: 'Managed by Mantis Tech' },
            { label: 'Last Updated', value: 'March 2, 2026' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#d0d0d0] last:border-0">
              <span className="font-mono text-xs text-[#888888]">{row.label}</span>
              <span className="font-mono text-xs text-[#1a1a1a]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
