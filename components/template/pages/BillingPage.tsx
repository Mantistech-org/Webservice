'use client'

// Template version — no fake invoices. Shows empty billing state for new clients.

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 8,
  padding: 24,
}

export default function BillingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={CARD}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
          Current Plan
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af' }}>
          No active subscription yet. Contact your account manager to get started.
        </div>
      </div>
      <div style={CARD}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
          Invoice History
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
          No invoices yet.
        </div>
      </div>
    </div>
  )
}
