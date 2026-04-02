'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ACTIVATION_ITEMS = [
  { label: 'Google Ads',              status: 'Active'  },
  { label: 'Customer SMS Blast',      status: 'Sent'    },
  { label: 'Google Business Profile', status: 'Updated' },
  { label: 'Missed Call Auto-Reply',  status: 'Active'  },
  { label: 'Website Banner',          status: 'Live'    },
]

const RECENT_ACTIVATIONS = [
  { event: 'Cold Snap — 28°F', date: 'Mar 15, 2026', jobs: 9  },
  { event: 'Heat Wave — 98°F', date: 'Aug 3, 2025',  jobs: 14 },
]

export default function WeatherActivation({ businessName, darkMode }: Props) {
  const [activated, setActivated] = useState(false)

  const bg      = darkMode ? '#1a1a1a' : '#ffffff'
  const border  = darkMode ? '#333333' : '#e0e0e0'
  const text    = darkMode ? '#f0f0f0' : '#1a1a1a'
  const muted   = darkMode ? '#aaaaaa' : '#555555'
  const rowBg   = darkMode ? '#252525' : '#f8f8f8'
  const alertBg = darkMode ? '#162118' : '#f0fff8'

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl mb-1" style={{ color: text }}>
          Weather Activation System
        </h1>
        <p className="font-mono text-sm" style={{ color: muted }}>
          {businessName ? `${businessName} — ` : ''}Automated campaign deployment triggered by weather events.
        </p>
      </div>

      {/* Live Alert Card */}
      <div
        className="rounded-lg border p-6 mb-6"
        style={{ backgroundColor: alertBg, borderColor: activated ? '#00b857' : '#00ff88' }}
      >
        {/* Alert header */}
        <div className="flex items-start gap-3 mb-5">
          <div
            style={{
              width: 10, height: 10, borderRadius: '50%',
              backgroundColor: '#00ff88', marginTop: 5, flexShrink: 0,
            }}
          />
          <div>
            <div
              className="font-mono text-xs tracking-widest uppercase mb-1"
              style={{ color: '#00ff88' }}
            >
              Weather Alert
            </div>
            <div className="font-heading text-lg" style={{ color: text }}>
              Cold snap detected — 28° forecast tonight in your service area.
            </div>
          </div>
        </div>

        {/* Activate button */}
        <button
          onClick={() => setActivated(true)}
          disabled={activated}
          className="font-mono text-sm tracking-wider px-6 py-2.5 rounded mb-6 transition-all"
          style={{
            backgroundColor: activated ? '#00b857' : '#00ff88',
            color: '#000000',
            cursor: activated ? 'default' : 'pointer',
          }}
        >
          {activated ? '✓ Activated' : 'Activate Now'}
        </button>

        {/* Activation items */}
        <div>
          {ACTIVATION_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5"
              style={{
                borderBottom: i < ACTIVATION_ITEMS.length - 1 ? `1px solid ${border}` : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: activated ? '#00b857' : (darkMode ? '#444' : '#cccccc'),
                    transition: 'background-color 0.3s ease',
                  }}
                />
                <span className="font-mono text-sm" style={{ color: text }}>
                  {item.label}
                </span>
              </div>
              <span
                className="font-mono text-xs font-semibold tracking-wide"
                style={{
                  color: activated ? '#00b857' : muted,
                  transition: 'color 0.3s ease',
                }}
              >
                {activated ? item.status : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activations */}
      <div
        className="rounded-lg border p-6"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <h2 className="font-heading text-lg mb-4" style={{ color: text }}>
          Recent Activations
        </h2>
        <div className="space-y-3">
          {RECENT_ACTIVATIONS.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: rowBg }}
            >
              <div>
                <div
                  className="font-mono text-sm font-semibold mb-0.5"
                  style={{ color: text }}
                >
                  {item.event}
                </div>
                <div className="font-mono text-xs" style={{ color: muted }}>
                  {item.date}
                </div>
              </div>
              <div className="text-right">
                <div className="font-heading text-2xl" style={{ color: '#00ff88' }}>
                  {item.jobs}
                </div>
                <div className="font-mono text-xs" style={{ color: muted }}>
                  jobs captured
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
