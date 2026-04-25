'use client'

// Template version — no mock contacts or campaigns. Shows empty state for new clients.

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 8,
  padding: 24,
}

export default function SMSTextMarketing({ sessionId: _sessionId }: { sessionId: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={CARD}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
          Campaigns
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
          No campaigns yet. Your SMS campaigns will appear here once your Twilio account is connected.
        </div>
      </div>
      <div style={CARD}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
          Contacts
        </div>
        <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
          No contacts yet. Import your customer list to get started.
        </div>
      </div>
    </div>
  )
}
