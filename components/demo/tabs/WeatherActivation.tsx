'use client'

import { useState, useEffect } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ITEMS = [
  {
    label: 'Google Ads',
    activatedStatus: 'Active',
    desc: 'Campaign running — targeting your service area.',
  },
  {
    label: 'Customer SMS Blast',
    activatedStatus: 'Sent to 1,247 contacts',
    desc: 'Sent to 1,247 contacts at 11:47 PM.',
  },
  {
    label: 'Google Business Profile',
    activatedStatus: 'Updated',
    desc: 'Emergency availability post published.',
  },
  {
    label: 'Missed Call Auto-Reply',
    activatedStatus: 'Active',
    desc: 'Active — responding to all missed calls instantly.',
  },
  {
    label: 'Website Banner',
    activatedStatus: 'Live',
    desc: 'Live — showing emergency availability message.',
  },
]

const ACTIVATION_HISTORY = [
  { date: 'Jan 14, 2026', event: 'Cold Snap', jobs: 9,  revenue: '$6,300' },
  { date: 'Aug 7, 2025',  event: 'Heat Wave', jobs: 14, revenue: '$9,800' },
  { date: 'Jun 19, 2025', event: 'Heat Wave', jobs: 11, revenue: '$7,700' },
]

export default function WeatherActivation({ businessName }: Props) {
  const [activated,     setActivated]     = useState(false)
  const [activating,    setActivating]    = useState(false)
  const [checkedCount,  setCheckedCount]  = useState(0)
  const [animatingIdx,  setAnimatingIdx]  = useState<number | null>(null)
  const [sequenceDone,  setSequenceDone]  = useState(false)

  const runSequence = () => {
    setActivated(true)
    setActivating(true)
    const DELAYS = [0, 600, 1200, 1800, 2400]
    DELAYS.forEach((delay, i) => {
      setTimeout(() => {
        setAnimatingIdx(i)
        setTimeout(() => {
          setCheckedCount(i + 1)
          setAnimatingIdx(null)
        }, 200)
      }, delay)
    })
    setTimeout(() => {
      setActivating(false)
      setSequenceDone(true)
    }, 3000)
  }

  // Auto-activate when arriving from the dashboard via ?autoactivate=true
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoactivate') === 'true') {
      const t = setTimeout(runSequence, 500)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleActivate = () => {
    if (activating || activated) return
    runSequence()
  }

  // Derive header label state
  const labelText  = (!activated) ? 'Weather Event Detected' : 'Active Weather Event'
  const labelColor = (!activated) ? '#F59E0B' : '#00aa55'
  const subline    = (!activated || !sequenceDone)
    ? 'Your platform is ready to activate. All 5 tools are standing by.'
    : 'Activation triggered at 11:47 PM.'
  const cardBg     = activated ? '#f0fff8' : '#fffbeb'
  const cardBorder = activated ? '#b2f0d4' : '#fde68a'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold mb-1" style={{ color: '#1a1a1a' }}>
          Weather Activation System
        </h1>
        <p style={{ fontSize: 14, color: '#555555' }}>
          Automated campaign deployment triggered by real-time weather events.
        </p>
      </div>

      {/* Section 1 — Current activation status */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <div className="px-7 pt-7 pb-2">

          {/* Label */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{
              display: 'inline-block', width: 9, height: 9,
              borderRadius: '50%', backgroundColor: labelColor, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor,
            }}>
              {labelText}
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-heading text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>
            Cold snap detected — 28F forecast tonight in your service area.
          </h2>

          {/* Subline */}
          <p style={{ fontSize: 14, color: '#555555' }}>
            {subline}
          </p>

          {/* Activate Now button — shown when not yet activated */}
          {!activated && (
            <button
              onClick={handleActivate}
              disabled={activating}
              style={{
                display: 'block', width: '100%', marginTop: 20,
                backgroundColor: '#00C27C', color: '#ffffff',
                fontWeight: 700, fontSize: 15, padding: '13px 0',
                borderRadius: 8, border: 'none',
                cursor: activating ? 'default' : 'pointer',
                opacity: activating ? 0.75 : 1,
              }}
            >
              {activating ? 'Activating...' : 'Activate Now'}
            </button>
          )}
        </div>

        {/* Tool rows */}
        <div className="px-7 pb-7 mt-6 space-y-0">
          {ITEMS.map((item, i) => {
            const isChecked   = checkedCount > i
            const isAnimating = animatingIdx === i

            return (
              <div
                key={i}
                className="flex items-start gap-4 py-4"
                style={{
                  borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {/* Circle / checkmark */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isChecked ? '#00b857' : 'transparent',
                  border: isChecked ? 'none' : '2px solid #d1d5db',
                  transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                }}>
                  {isChecked && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      color: isChecked ? '#00aa55' : '#9ca3af',
                    }}>
                      {isChecked ? item.activatedStatus : 'Ready'}
                    </span>
                  </div>
                  {isChecked && (
                    <p style={{ fontSize: 12, color: '#555555', marginTop: 2 }}>
                      {item.desc}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2 — Activation history */}
      <div className="rounded-xl" style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}>
        <div className="px-6 pt-6 pb-4">
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888888', marginBottom: 20 }}>
            Activation History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #d0d0d0' }}>
                  {['Date', 'Event Type', 'Jobs Captured', 'Revenue Estimated'].map((h) => (
                    <th key={h} className="text-left pb-3"
                      style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888888', paddingRight: 24, fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ACTIVATION_HISTORY.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < ACTIVATION_HISTORY.length - 1 ? '1px solid #d0d0d0' : 'none' }}>
                    <td className="py-4" style={{ fontSize: 14, color: '#444444', paddingRight: 24 }}>{row.date}</td>
                    <td className="py-4" style={{ fontSize: 14, color: '#444444', paddingRight: 24 }}>{row.event}</td>
                    <td className="py-4" style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', paddingRight: 24 }}>{row.jobs}</td>
                    <td className="py-4" style={{ fontSize: 14, fontWeight: 600, color: '#00aa55' }}>{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3 — Service area monitoring */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888888', marginBottom: 20 }}>
          Service Area Monitoring
        </div>
        <div className="space-y-4">
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888888', marginBottom: 4 }}>Monitoring</div>
            <div style={{ fontSize: 14, color: '#1a1a1a' }}>
              {businessName ? `${businessName} service area` : 'Your service area'}
            </div>
          </div>
          <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888888', marginBottom: 4 }}>Next Forecast Check</div>
            <div style={{ fontSize: 14, color: '#1a1a1a' }}>In 47 minutes</div>
          </div>
          <div style={{ borderTop: '1px solid #d0d0d0', paddingTop: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888888', marginBottom: 4 }}>Weather Threshold</div>
            <div style={{ fontSize: 14, color: '#444444', lineHeight: 1.6 }}>
              Sudden temperature events — hard freezes, heat waves, rapid drops of 20F or more within 48 hours.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
