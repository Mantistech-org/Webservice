'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Request failed.')
      }
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Reset failed.')
      }
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-heading text-2xl tracking-widest text-primary">MANTIS TECH</span>
        </div>
        <div className="bg-card border border-border rounded p-8">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-2">Admin</div>

          {step === 'request' && (
            <>
              <h1 className="font-heading text-3xl text-primary mb-2">Reset Password</h1>
              <p className="font-mono text-xs text-muted mb-6">Enter the admin email address to receive a reset link.</p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Admin Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-input" placeholder="admin@mantistech.io" />
                </div>
                {error && <p className="font-mono text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="text-center">
                  <Link href="/admin" className="font-mono text-xs text-dim hover:text-muted transition-colors">Back to login</Link>
                </div>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h1 className="font-heading text-3xl text-primary mb-2">Enter New Password</h1>
              <p className="font-mono text-xs text-muted mb-6">Paste the reset token from your email and set a new password.</p>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Reset Token</label>
                  <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required className="form-input" placeholder="Paste token from email" />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="form-input" placeholder="Minimum 8 characters" />
                </div>
                {error && <p className="font-mono text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all disabled:opacity-60">
                  {loading ? 'Resetting...' : 'Set New Password'}
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <>
              <h1 className="font-heading text-3xl text-primary mb-4">Password Updated</h1>
              <p className="font-mono text-xs text-muted mb-6">Your password has been reset successfully.</p>
              <Link href="/admin" className="block w-full text-center bg-accent text-black font-mono text-sm py-3 rounded tracking-wider hover:bg-white transition-all">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
