'use client'

import { useState } from 'react'

// ── Shared styles ─────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 8,
  padding: 20,
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#6b7280',
  fontWeight: 600,
  marginBottom: 6,
}

const DESCRIPTION: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
  marginBottom: 16,
  lineHeight: 1.5,
}

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  color: '#111827',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
}

// ── Save button with 2s confirmation ─────────────────────────────────────────

function SaveButton({ id }: { id: string }) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <button
      onClick={handleSave}
      onMouseEnter={(e) => {
        if (!saved) {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = '#00C27C'
          ;(e.currentTarget as HTMLElement).style.color = '#ffffff'
        }
      }}
      onMouseLeave={(e) => {
        if (!saved) {
          ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = '#00C27C'
        }
      }}
      style={{
        marginTop: 12,
        padding: '8px 20px',
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: saved ? '#00C27C' : 'transparent',
        color: saved ? '#ffffff' : '#00C27C',
        border: '1px solid #00C27C',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        fontFamily: 'inherit',
      }}
      data-id={id}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ label, description, children }: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div style={CARD}>
      <div style={SECTION_LABEL}>{label}</div>
      <div style={DESCRIPTION}>{description}</div>
      {children}
    </div>
  )
}

// ── Input row ─────────────────────────────────────────────────────────────────

function Field({ label, placeholder, type = 'text' }: {
  label: string
  placeholder: string
  type?: string
}) {
  const [value, setValue] = useState('')
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={INPUT}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Integrations() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Section 1 — Notification Email */}
      <Section
        label="Alert Email Address"
        description="Weather alerts and platform notifications will be sent to this address."
      >
        <Field label="Email Address" placeholder="owner@yourbusiness.com" type="email" />
        <SaveButton id="email" />
      </Section>

      {/* Section 2 — Google Business Profile */}
      <Section
        label="Google Business Profile"
        description="Connect your Google Business Profile to enable automated posts during weather events."
      >
        <Field label="Business Profile ID" placeholder="Your GBP ID" />
        <SaveButton id="gbp" />
      </Section>

      {/* Section 3 — SMS / Twilio */}
      <Section
        label="SMS / Text Marketing"
        description="Your Twilio credentials for sending SMS campaigns and missed call auto-replies."
      >
        <Field label="Twilio Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
        <Field label="Twilio Auth Token" placeholder="Your auth token" type="password" />
        <Field label="Twilio Phone Number" placeholder="+15551234567" />
        <SaveButton id="sms" />
      </Section>

      {/* Section 4 — Google Ads */}
      <Section
        label="Google Ads"
        description="Connect your Google Ads account to enable automated weather-triggered campaigns."
      >
        <Field label="Google Ads Customer ID" placeholder="123-456-7890" />
        <SaveButton id="google-ads" />
      </Section>

      {/* Section 5 — Stripe */}
      <Section
        label="Stripe"
        description="Your Stripe keys for processing invoices and payments."
      >
        <Field label="Publishable Key" placeholder="pk_live_..." />
        <Field label="Secret Key" placeholder="sk_live_..." type="password" />
        <SaveButton id="stripe" />
      </Section>

    </div>
  )
}
