'use client'

import { useState, useEffect } from 'react'

interface DashboardProps {
  businessName?: string
  onNavigateToWeather?: () => void
}

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVATION_ITEMS = [
  { label: 'Google Ads'              },
  { label: 'Customer SMS Blast'      },
  { label: 'Google Business Profile' },
  { label: 'Missed Call Auto-Reply'  },
  { label: 'Website Banner'          },
]

const ACTIVITY_FEED = [
  { text: 'Cold snap activation fired automatically',   time: '11:47 PM' },
  { text: 'SMS blast sent to 1,247 contacts',           time: '11:47 PM' },
  { text: 'Google Ads campaign activated',              time: '11:48 PM' },
  { text: 'Missed call auto-reply enabled',             time: '11:48 PM' },
  { text: '3 new Google reviews received',              time: '8:22 AM'  },
  { text: 'Booking confirmed — Ray Dominguez, 10:00 AM', time: '7:45 AM' },
]

const SCHEDULE = [
  { time: '7:00 AM',  name: 'James Perkins'   },
  { time: '8:30 AM',  name: 'Michelle Carter' },
  { time: '10:00 AM', name: 'Ray Dominguez'   },
  { time: '11:30 AM', name: 'Donna Howell'    },
  { time: '1:00 PM',  name: 'Brian Stokes'    },
]

// 30-day jobs per day — day 24 (index 23) is the cold snap spike
const JOB_BARS = [
  2, 1, 3, 2, 1, 3, 2, 2, 1, 3,
  2, 3, 1, 2, 2, 3, 1, 2, 3, 2,
  1, 2, 3, 11, 2, 3, 1, 2, 3, 2,
]

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart() {
  const W = 800
  const H = 180
  const pL = 44, pR = 20, pT = 32, pB = 28
  const cW = W - pL - pR
  const cH = H - pT - pB
  const max = Math.max(...JOB_BARS)
  const slotW = cW / JOB_BARS.length
  const barW = Math.max(Math.floor(slotW * 0.72), 4)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Y-axis label */}
      <text
        fontSize="9"
        fill="#888888"
        textAnchor="middle"
        transform={`translate(11,${pT + cH / 2}) rotate(-90)`}
      >
        Jobs
      </text>

      {/* Grid lines + Y tick labels */}
      {[0, 0.33, 0.66, 1].map((t) => {
        const y = pT + cH * (1 - t)
        return (
          <g key={t}>
            <line
              x1={pL} y1={y} x2={W - pR} y2={y}
              stroke="#d0d0d0" strokeWidth="1"
            />
            <text
              x={pL - 6} y={y + 3.5}
              textAnchor="end" fontSize="9" fill="#888888"
            >
              {Math.round(t * max)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {JOB_BARS.map((val, i) => {
        const isSpike = i === 23
        const barH = Math.max((val / max) * cH, 2)
        const x = pL + i * slotW + (slotW - barW) / 2
        const y = pT + cH - barH
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              fill={isSpike ? '#22c55e' : '#86efac'}
              rx="2"
            />
            {isSpike && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="8"
                fill="#16a34a"
                fontWeight="700"
              >
                Cold snap *
              </text>
            )}
          </g>
        )
      })}

      {/* X-axis label */}
      <text
        x={pL + cW / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize="9"
        fill="#888888"
      >
        Last 30 Days
      </text>
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardHome({ businessName, onNavigateToWeather }: DashboardProps) {
  const [toastShown, setToastShown] = useState(false)
  const [toastExiting, setToastExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setToastShown(true), 1000)
    return () => clearTimeout(t)
  }, [])

  const handleDismiss = () => {
    setToastExiting(true)
    setTimeout(() => setToastShown(false), 400)
  }

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 10px 3px rgba(0,255,136,0.45); }
          50% { box-shadow: 0 0 24px 10px rgba(0,255,136,0.12); }
        }
        @keyframes toastIn {
          from { transform: translateY(80px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes toastOut {
          from { transform: translateY(0);   opacity: 1; }
          to   { transform: translateY(80px); opacity: 0; }
        }
      `}</style>

      {/* Toast notification — fixed, bottom-right, outside normal flow */}
      {toastShown && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 320,
            zIndex: 50,
            backgroundColor: '#1e1e1e',
            borderRadius: 8,
            boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
            padding: 16,
            animation: toastExiting
              ? 'toastOut 0.4s ease forwards'
              : 'toastIn 0.4s ease forwards',
          }}
        >
          {/* Top row: dot + label + close */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span
              style={{
                display: 'inline-block',
                width: 7, height: 7,
                borderRadius: '50%',
                backgroundColor: '#00ff88',
                flexShrink: 0,
                animation: 'dotPulse 2s ease-in-out infinite',
                marginRight: 7,
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 9,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#00ff88',
                flex: 1,
              }}
            >
              Weather Event Active
            </span>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666666',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 0 0 8px',
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>

          {/* Heading */}
          <div
            style={{
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1rem',
              marginBottom: 6,
            }}
          >
            Cold Snap Detected
          </div>

          {/* Subtext */}
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              color: '#888888',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            28F forecast tonight in your service area. Your platform is ready to activate.
          </p>

          {/* Activate Now button */}
          <button
            onClick={onNavigateToWeather}
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: '#00ff88',
              color: '#000000',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              padding: '9px 0',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              animation: 'glowPulse 2s ease-in-out infinite',
              marginBottom: 8,
            }}
          >
            Activate Now
          </button>

          {/* 5 tools label */}
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              color: '#555555',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            5 tools will activate simultaneously
          </p>

          {/* Divider */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              marginBottom: 8,
            }}
          />

          {/* Pending items */}
          <div>
            {ACTIVATION_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  paddingTop: 5,
                  paddingBottom: 5,
                  borderBottom:
                    i < ACTIVATION_ITEMS.length - 1
                      ? '1px solid rgba(255,255,255,0.05)'
                      : 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 11, height: 11,
                    borderRadius: '50%',
                    border: '1.5px solid #444444',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    color: '#555555',
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards — three equal columns, full width */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Jobs Booked This Week',
            value: '11',
            sub: '3 booked during last night\'s activation',
            subGreen: true,
            star: false,
          },
          {
            label: 'Calls Auto-Replied',
            value: '24',
            sub: 'Last 30 days',
            subGreen: false,
            star: false,
          },
          {
            label: 'Google Rating',
            value: '4.9',
            sub: '47 reviews',
            subGreen: false,
            star: true,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              padding: 24,
            }}
          >
            <div
              className="font-mono uppercase mb-3"
              style={{ color: '#6B7280', fontSize: '0.7rem', letterSpacing: '0.1em' }}
            >
              {card.label}
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="font-heading"
                style={{ fontSize: '2.625rem', lineHeight: 1, color: '#1a1a1a', fontWeight: 700 }}
              >
                {card.value}
              </span>
              {card.star && (
                <svg
                  width="22" height="22" viewBox="0 0 24 24"
                  fill="#facc15" stroke="#facc15" strokeWidth="1"
                  style={{ marginBottom: 4 }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: '0.8rem',
                color: card.subGreen ? '#00aa55' : '#888888',
                ...(card.subGreen
                  ? { borderLeft: '2px solid #00cc66', paddingLeft: 8 }
                  : {}),
              }}
            >
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: '55fr 45fr', gap: 16 }}>

        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#888888' }}
          >
            Recent Activity
          </div>
          {ACTIVITY_FEED.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{
                borderBottom:
                  i < ACTIVITY_FEED.length - 1 ? '1px solid #E5E7EB' : 'none',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  style={{
                    width: 7, height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#00cc66',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  className="font-mono text-xs truncate"
                  style={{ color: '#444444' }}
                >
                  {item.text}
                </span>
              </div>
              <span
                className="font-mono text-xs shrink-0 ml-4"
                style={{ color: '#999999' }}
              >
                {item.time}
              </span>
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div
            className="font-mono text-xs uppercase tracking-widest mb-5"
            style={{ color: '#888888' }}
          >
            Today&apos;s Schedule
          </div>
          {SCHEDULE.map((slot, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid #E5E7EB' }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="font-mono text-xs shrink-0"
                  style={{ color: '#999999', width: 64 }}
                >
                  {slot.time}
                </span>
                <span
                  style={{
                    width: 3, height: 22,
                    backgroundColor: '#00cc66',
                    borderRadius: 2,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  className="font-mono text-sm"
                  style={{ color: '#1a1a1a' }}
                >
                  {slot.name}
                </span>
              </div>
              <span
                className="font-mono text-xs font-semibold"
                style={{ color: '#00aa55' }}
              >
                Confirmed
              </span>
            </div>
          ))}
          <div
            className="pt-4"
            style={{ borderTop: '1px solid #E5E7EB', marginTop: 4 }}
          >
            <span className="font-mono text-xs" style={{ color: '#00aa55' }}>
              2 more slots available today
            </span>
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}
      >
        <div
          className="font-mono text-xs uppercase tracking-widest mb-5"
          style={{ color: '#888888' }}
        >
          Jobs Booked — Last 30 Days
        </div>
        <BarChart />
      </div>

    </div>
  )
}
