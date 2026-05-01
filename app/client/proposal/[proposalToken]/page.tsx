'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface GeneratedContent {
  summary: string
  scope_of_work: string
  parts_list: string
  labor_hours: number
  labor_rate: number
  labor_total: number
  parts_total: number
  grand_total: number
  timeline: string
  warranty: string
  closing: string
}

interface Proposal {
  id: string
  proposal_token: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  service_address: string | null
  service_type: string | null
  complaint: string | null
  findings: string | null
  recommended_work: string | null
  parts_cost: number
  labor_hours: number
  labor_rate: number
  notes: string | null
  valid_until: string | null
  generated_content: GeneratedContent | null
  status: string
  created_at: string
}

function fmt(n: number) {
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function ProposalPage() {
  const { proposalToken } = useParams<{ proposalToken: string }>()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    fetch(`/api/client/proposal/${proposalToken}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return }
        setProposal(data.proposal)
        if (data.proposal.status === 'accepted') setAccepted(true)
        if (data.proposal.status === 'declined') setDeclined(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [proposalToken])

  async function handleAccept() {
    if (!proposal || accepting) return
    setAccepting(true)
    try {
      const res = await fetch(`/api/client/proposal/${proposalToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' }),
      })
      if (res.ok) setAccepted(true)
    } finally {
      setAccepting(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: 700,
    margin: '0 auto',
    padding: '40px 24px 80px',
    fontFamily: 'Georgia, serif',
    color: '#1a1a1a',
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: 28,
    padding: '20px 24px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 4,
  }

  const valueStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.6,
    color: '#111',
  }

  if (loading) {
    return (
      <div style={{ ...containerStyle, paddingTop: 80, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
        Loading proposal...
      </div>
    )
  }

  if (notFound || !proposal) {
    return (
      <div style={{ ...containerStyle, paddingTop: 80, textAlign: 'center' }}>
        <p style={{ fontSize: 18, color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>
          This proposal could not be found or may have expired.
        </p>
      </div>
    )
  }

  const gc = proposal.generated_content
  const laborTotal = proposal.labor_hours * proposal.labor_rate
  const grandTotal = gc ? gc.grand_total : (proposal.parts_cost + laborTotal)

  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh' }}>
      <div style={containerStyle}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontFamily: 'system-ui, sans-serif', color: '#9ca3af', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Service Proposal
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, fontFamily: 'system-ui, sans-serif', margin: 0 }}>
            {proposal.service_type || 'HVAC Service'}
          </h1>
          {proposal.valid_until && (
            <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'system-ui, sans-serif', marginTop: 6 }}>
              Valid until {new Date(proposal.valid_until).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Status banner */}
        {(accepted || declined) && (
          <div style={{
            marginBottom: 24,
            padding: '14px 20px',
            borderRadius: 8,
            background: accepted ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${accepted ? '#86efac' : '#fca5a5'}`,
            color: accepted ? '#166534' : '#991b1b',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            textAlign: 'center',
          }}>
            {accepted ? 'You have accepted this proposal. We will be in touch shortly.' : 'This proposal has been declined.'}
          </div>
        )}

        {/* Customer & job info */}
        <div style={sectionStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <div>
              <p style={labelStyle}>Customer</p>
              <p style={valueStyle}>{proposal.customer_name}</p>
            </div>
            {proposal.service_address && (
              <div>
                <p style={labelStyle}>Service Address</p>
                <p style={valueStyle}>{proposal.service_address}</p>
              </div>
            )}
            {proposal.customer_phone && (
              <div>
                <p style={labelStyle}>Phone</p>
                <p style={valueStyle}>{proposal.customer_phone}</p>
              </div>
            )}
            {proposal.customer_email && (
              <div>
                <p style={labelStyle}>Email</p>
                <p style={valueStyle}>{proposal.customer_email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Generated content */}
        {gc ? (
          <>
            <div style={sectionStyle}>
              <p style={labelStyle}>Summary</p>
              <p style={{ ...valueStyle, marginTop: 4 }}>{gc.summary}</p>
            </div>

            <div style={sectionStyle}>
              <p style={labelStyle}>Scope of Work</p>
              <p style={{ ...valueStyle, marginTop: 4 }}>{gc.scope_of_work}</p>
            </div>

            {gc.parts_list && gc.parts_list !== 'N/A' && (
              <div style={sectionStyle}>
                <p style={labelStyle}>Parts & Materials</p>
                <p style={{ ...valueStyle, marginTop: 4 }}>{gc.parts_list}</p>
              </div>
            )}

            <div style={sectionStyle}>
              <p style={{ ...labelStyle, marginBottom: 12 }}>Pricing</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui, sans-serif', color: '#374151' }}>
                  <span>Labor ({gc.labor_hours}h @ {fmt(gc.labor_rate)}/hr)</span>
                  <span>{fmt(gc.labor_total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui, sans-serif', color: '#374151' }}>
                  <span>Parts & Materials</span>
                  <span>{fmt(gc.parts_total)}</span>
                </div>
                <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#111' }}>
                  <span>Total</span>
                  <span>{fmt(gc.grand_total)}</span>
                </div>
              </div>
            </div>

            <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <div>
                <p style={labelStyle}>Timeline</p>
                <p style={{ ...valueStyle, marginTop: 4 }}>{gc.timeline}</p>
              </div>
              <div>
                <p style={labelStyle}>Warranty</p>
                <p style={{ ...valueStyle, marginTop: 4 }}>{gc.warranty}</p>
              </div>
            </div>

            <div style={sectionStyle}>
              <p style={valueStyle}>{gc.closing}</p>
            </div>
          </>
        ) : (
          <>
            {/* Fallback: show raw fields if no generated content */}
            {proposal.complaint && (
              <div style={sectionStyle}>
                <p style={labelStyle}>Customer Complaint</p>
                <p style={{ ...valueStyle, marginTop: 4 }}>{proposal.complaint}</p>
              </div>
            )}
            {proposal.recommended_work && (
              <div style={sectionStyle}>
                <p style={labelStyle}>Recommended Work</p>
                <p style={{ ...valueStyle, marginTop: 4 }}>{proposal.recommended_work}</p>
              </div>
            )}
            <div style={sectionStyle}>
              <p style={{ ...labelStyle, marginBottom: 12 }}>Pricing</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui, sans-serif', color: '#374151' }}>
                  <span>Labor ({proposal.labor_hours}h @ {fmt(proposal.labor_rate)}/hr)</span>
                  <span>{fmt(laborTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui, sans-serif', color: '#374151' }}>
                  <span>Parts & Materials</span>
                  <span>{fmt(proposal.parts_cost)}</span>
                </div>
                <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontFamily: 'system-ui, sans-serif', fontWeight: 700, color: '#111' }}>
                  <span>Total</span>
                  <span>{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {proposal.notes && (
          <div style={sectionStyle}>
            <p style={labelStyle}>Additional Notes</p>
            <p style={{ ...valueStyle, marginTop: 4 }}>{proposal.notes}</p>
          </div>
        )}

        {/* Accept button */}
        {!accepted && !declined && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={handleAccept}
              disabled={accepting}
              style={{
                padding: '14px 48px',
                fontSize: 16,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 600,
                background: accepting ? '#9ca3af' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: accepting ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              {accepting ? 'Accepting...' : 'Accept Proposal'}
            </button>
            <p style={{ marginTop: 10, fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>
              By clicking Accept, you authorize the work described above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
