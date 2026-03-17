'use client'

import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminSettingsPage() {
  return (
    <div className="px-8 py-10 flex-1 min-w-0">
      <div className="mb-8">
        <h1 className="font-heading text-5xl text-primary mb-2">Settings</h1>
        <p className="font-mono text-sm text-muted">Admin configuration and preferences.</p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Theme */}
        <div className="bg-card border border-border rounded p-6">
          <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-3">Appearance</h3>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-primary">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded p-6">
          <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-3">Security</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-sm text-primary">Admin Password</div>
              <div className="font-mono text-xs text-muted mt-0.5">Update your admin dashboard password</div>
            </div>
            <Link
              href="/admin/reset-password"
              className="font-mono text-xs border border-border text-muted px-4 py-2 rounded hover:border-border-light hover:text-primary transition-all"
            >
              Change Password
            </Link>
          </div>
        </div>

        {/* Environment */}
        <div className="bg-card border border-border rounded p-6">
          <h3 className="font-mono text-xs text-emerald-700 dark:text-accent tracking-widest uppercase mb-3">Environment</h3>
          <div className="space-y-3">
            {[
              { key: 'STRIPE_SECRET_KEY', purpose: 'Payments and subscription MRR' },
              { key: 'SUPABASE_DB_URL', purpose: 'PostgreSQL database' },
              { key: 'ANTHROPIC_API_KEY', purpose: 'AI site generation' },
              { key: 'RESEND_API_KEY', purpose: 'Transactional email' },
            ].map((env) => (
              <div key={env.key} className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-primary">{env.key}</div>
                  <div className="font-mono text-xs text-muted">{env.purpose}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-muted mt-4">
            Set these in your environment or <span className="text-primary">.env.local</span> file.
          </p>
        </div>
      </div>
    </div>
  )
}
