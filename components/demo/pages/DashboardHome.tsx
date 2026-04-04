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
  { text: 'Cold snap activation fired automatically',    time: '11:47 PM' },
  { text: 'SMS blast sent to 1,247 contacts',            time: '11:47 PM' },
  { text: 'Google Ads campaign activated',               time: '11:48 PM' },
  { text: 'Missed call auto-reply enabled',              time: '11:48 PM' },
  { text: '3 new Google reviews received',               time: '8:22 AM'  },
  { text: 'Booking confirmed — Ray Dominguez, 10:00 AM', time: '7:45 AM'  },
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

// ── Map data ──────────────────────────────────────────────────────────────────

// 11 job dots scattered within the service area (center ~265, 195, radius ~130)
const JOB_DOTS = [
  { cx: 208, cy: 162, delay: 0    },
  { cx: 244, cy: 132, delay: 0.5  },
  { cx: 282, cy: 148, delay: 1.2  },
  { cx: 320, cy: 144, delay: 0.3  },
  { cx: 298, cy: 182, delay: 1.8  },
  { cx: 226, cy: 198, delay: 0.7  },
  { cx: 263, cy: 220, delay: 2.1  },
  { cx: 304, cy: 210, delay: 1.0  },
  { cx: 336, cy: 174, delay: 2.5  },
  { cx: 270, cy: 250, delay: 0.4  },
  { cx: 233, cy: 238, delay: 1.6  },
]

// Snowflakes scattered across the full map (x, y, half-size r)
const SNOWFLAKES = [
  { x:  78, y:  46, r: 5 },
  { x: 152, y: 298, r: 6 },
  { x: 350, y:  80, r: 4 },
  { x: 453, y: 158, r: 7 },
  { x: 504, y: 300, r: 5 },
  { x:  96, y: 198, r: 8 },
  { x: 384, y: 346, r: 4 },
  { x: 520, y:  50, r: 6 },
  { x: 278, y: 366, r: 5 },
  { x: 450, y: 248, r: 4 },
  { x: 176, y:  62, r: 5 },
  { x: 560, y: 188, r: 6 },
]

// ── SVG helpers ───────────────────────────────────────────────────────────────

function Snowflake({ x, y, r }: { x: number; y: number; r: number }) {
  // Three lines at 0 / 60 / 120 degrees form a six-armed asterisk
  return (
    <>
      {[0, 60, 120].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const dx = r * Math.sin(rad)
        const dy = r * Math.cos(rad)
        return (
          <line
            key={deg}
            x1={x - dx} y1={y - dy}
            x2={x + dx} y2={y + dy}
            stroke="white" strokeWidth="1.3" opacity="0.45"
            strokeLinecap="round"
          />
        )
      })}
    </>
  )
}

function CityMap() {
  const W = 600
  const H = 400
  // Service area
  const SAX = 265, SAY = 195, SAR = 132

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Base ── */}
        <rect width={W} height={H} fill="#eaeaea" />

        {/* ── Minor streets (horizontal) ── */}
        {[28, 72, 116, 160, 204, 248, 292, 336, 380].map((y) => (
          <line key={`mh${y}`} x1={0} y1={y} x2={W} y2={y}
            stroke="#d8d8d8" strokeWidth="0.8" />
        ))}
        {/* ── Minor streets (vertical) ── */}
        {[24, 70, 116, 162, 208, 254, 300, 346, 392, 438, 484, 530, 576].map((x) => (
          <line key={`mv${x}`} x1={x} y1={0} x2={x} y2={H}
            stroke="#d8d8d8" strokeWidth="0.8" />
        ))}

        {/* ── Arterial roads (horizontal) ── */}
        {[116, 292].map((y) => (
          <line key={`ah${y}`} x1={0} y1={y} x2={W} y2={y}
            stroke="#c6c6c6" strokeWidth="2.5" />
        ))}
        {/* ── Arterial roads (vertical) ── */}
        {[162, 392].map((x) => (
          <line key={`av${x}`} x1={x} y1={0} x2={x} y2={H}
            stroke="#c6c6c6" strokeWidth="2.5" />
        ))}

        {/* ── Highway — diagonal NW to SE ── */}
        <line x1={0} y1={55} x2={W} y2={310} stroke="#bbbbbb" strokeWidth="5" />
        <line x1={0} y1={55} x2={W} y2={310}
          stroke="#d4d4d4" strokeWidth="1.2" strokeDasharray="14 9" />

        {/* ── Secondary diagonal (SW corner) ── */}
        <line x1={0} y1={290} x2={220} y2={H} stroke="#c6c6c6" strokeWidth="2" />

        {/* ── Service area ── */}
        <circle
          cx={SAX} cy={SAY} r={SAR}
          fill="rgba(0,255,136,0.15)"
          stroke="rgba(0,255,136,0.60)"
          strokeWidth="2"
        />

        {/* ── Job activity dots with ripple ── */}
        {JOB_DOTS.map((dot, i) => (
          <g key={i}>
            {/* Ripple ring */}
            <circle
              cx={dot.cx} cy={dot.cy} r={6}
              fill="none"
              stroke="#00ff88"
              strokeWidth="1.5"
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `jobRipple 3s ease-out ${dot.delay}s infinite`,
              }}
            />
            {/* Core dot */}
            <circle cx={dot.cx} cy={dot.cy} r={4} fill="#00ff88" />
          </g>
        ))}

        {/* ── Weather overlay — cold tint ── */}
        <rect width={W} height={H} fill="rgba(59,130,246,0.12)" />

        {/* ── Snowflakes ── */}
        {SNOWFLAKES.map((s, i) => (
          <Snowflake key={i} x={s.x} y={s.y} r={s.r} />
        ))}
      </svg>

      {/* Top-left pill */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.62)',
        borderRadius: 20,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}>
        <span style={{
          display: 'inline-block',
          width: 6, height: 6,
          borderRadius: '50%',
          backgroundColor: '#00ff88',
          flexShrink: 0,
          animation: 'dotPulse 2s ease-in-out infinite',
        }} />
        <span style={{
          color: '#ffffff',
          fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
        }}>
          11 jobs captured in your service area
        </span>
      </div>

      {/* Bottom-right pill */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.62)',
        borderRadius: 20,
        padding: '6px 12px',
        pointerEvents: 'none',
      }}>
        <span style={{
          color: '#ffffff',
          fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
        }}>
          Cold snap active — 28F tonight
        </span>
      </div>
    </div>
  )
}

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
      <text
        fontSize="9" fill="#888888" textAnchor="middle"
        transform={`translate(11,${pT + cH / 2}) rotate(-90)`}
      >
        Jobs
      </text>
      {[0, 0.33, 0.66, 1].map((t) => {
        const y = pT + cH * (1 - t)
        return (
          <g key={t}>
            <line x1={pL} y1={y} x2={W - pR} y2={y} stroke="#e0e0e0" strokeWidth="1" />
            <text x={pL - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#888888">
              {Math.round(t * max)}
            </text>
          </g>
        )
      })}
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
                x={x + barW / 2} y={y - 6}
                textAnchor="middle" fontSize="8"
                fill="#16a34a" fontWeight="700"
              >
                Cold snap *
              </text>
            )}
          </g>
        )
      })}
      <text
        x={pL + cW / 2} y={H - 4}
        textAnchor="middle" fontSize="9" fill="#888888"
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
    // Negative margin bleeds to edge of parent's 24px padding, then re-applies it
    // so the #F8F8F8 background fills the entire content area.
    <div className="demo-dashboard" style={{ margin: -24, padding: 24, backgroundColor: '#F8F8F8', minHeight: '100%' }}>
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
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(80px); opacity: 0; }
        }
        @keyframes jobRipple {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4.5); opacity: 0; }
        }
      `}</style>

      {/* ── Toast notification — fixed bottom-right, outside layout flow ── */}
      {toastShown && (
        <div style={{
          position: 'fixed',
          bottom: 24, right: 24,
          width: 320,
          zIndex: 50,
          backgroundColor: '#1e1e1e',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
          padding: 16,
          animation: toastExiting
            ? 'toastOut 0.4s ease forwards'
            : 'toastIn 0.4s ease forwards',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{
              display: 'inline-block',
              width: 7, height: 7,
              borderRadius: '50%',
              backgroundColor: '#00ff88',
              flexShrink: 0,
              animation: 'dotPulse 2s ease-in-out infinite',
              marginRight: 7,
            }} />
            <span style={{
              fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#00ff88', flex: 1,
            }}>
              Weather Event Active
            </span>
            <button
              onClick={handleDismiss}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#666666', fontSize: 14, lineHeight: 1,
                padding: '0 0 0 8px', flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              &#x2715;
            </button>
          </div>
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
            Cold Snap Detected
          </div>
          <p style={{
            fontSize: '0.8rem',
            color: '#888888', lineHeight: 1.5, marginBottom: 12,
          }}>
            28F forecast tonight in your service area. Your platform is ready to activate.
          </p>
          <button
            onClick={onNavigateToWeather}
            style={{
              display: 'block', width: '100%',
              backgroundColor: '#00ff88', color: '#000000',
              fontWeight: 700,
              fontSize: '0.8rem', letterSpacing: '0.05em',
              padding: '9px 0', borderRadius: 6,
              border: 'none', cursor: 'pointer',
              animation: 'glowPulse 2s ease-in-out infinite',
              marginBottom: 8,
            }}
          >
            Activate Now
          </button>
          <p style={{
            fontSize: '0.7rem',
            color: '#555555', textAlign: 'center', marginBottom: 10,
          }}>
            5 tools will activate simultaneously
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }} />
          <div>
            {ACTIVATION_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                paddingTop: 5, paddingBottom: 5,
                borderBottom: i < ACTIVATION_ITEMS.length - 1
                  ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{
                  display: 'inline-block', width: 11, height: 11,
                  borderRadius: '50%', border: '1.5px solid #444444', flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.72rem', color: '#555555' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 1: Hero row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30fr 70fr',
        gap: 24,
        alignItems: 'stretch',
      }}>

        {/* Left: performance card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Label */}
          <div style={{
            fontSize: '0.68rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#9CA3AF',
            marginBottom: 12,
          }}>
            Platform Performance — This Month
          </div>

          {/* Hero number */}
          <div style={{
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1,
            color: '#1a1a1a',
            marginBottom: 10,
            letterSpacing: '-0.02em',
          }}>
            $14,200
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: '0.9rem',
            color: '#9CA3AF',
            lineHeight: 1.5,
            margin: 0,
          }}>
            11 jobs booked through your platform this month
          </p>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E5E7EB', margin: '24px 0' }} />

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Jobs Booked',             value: '11' },
              { label: 'Missed Calls Recovered',  value: '24' },
              { label: 'New Reviews This Month',  value: '3'  },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <span style={{
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#9CA3AF',
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#1a1a1a',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #E5E7EB', margin: '24px 0 16px' }} />

          {/* Green activation note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-block',
              width: 8, height: 8,
              borderRadius: '50%',
              backgroundColor: '#00cc66',
              flexShrink: 0,
              animation: 'dotPulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: '0.85rem',
              color: '#00aa55',
              lineHeight: 1.4,
            }}>
              3 booked during last night&apos;s cold snap activation
            </span>
          </div>

          {/* Outlined report button */}
          <button
            onClick={() => {}}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,204,102,0.10)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
            }}
            style={{
              display: 'block',
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px solid #00cc66',
              color: '#00aa55',
              fontSize: '0.85rem',
              padding: '10px 0',
              borderRadius: 6,
              cursor: 'pointer',
              textAlign: 'center',
              marginTop: 12,
            }}
          >
            View Monthly Performance Report
          </button>
        </div>

        {/* Right: map card */}
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          <CityMap />
        </div>
      </div>

      {/* ── Section 2: Activity + Schedule ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '55fr 45fr',
        gap: 24,
        marginTop: 24,
      }}>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
        }}>
          <div style={{
                        fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#9CA3AF',
            marginBottom: 20,
          }}>
            Recent Activity
          </div>
          {ACTIVITY_FEED.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: i < ACTIVITY_FEED.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span style={{
                  width: 7, height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#00cc66',
                  flexShrink: 0,
                  display: 'inline-block',
                }} />
                <span style={{
                                    fontSize: '0.78rem',
                  color: '#444444',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {item.text}
                </span>
              </div>
              <span style={{
                                fontSize: '0.75rem',
                color: '#999999',
                flexShrink: 0,
                marginLeft: 16,
              }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
        }}>
          <div style={{
                        fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#9CA3AF',
            marginBottom: 20,
          }}>
            Today&apos;s Schedule
          </div>
          {SCHEDULE.map((slot, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{
                                    fontSize: '0.75rem',
                  color: '#999999',
                  flexShrink: 0,
                  width: 62,
                }}>
                  {slot.time}
                </span>
                <span style={{
                  width: 3, height: 22,
                  backgroundColor: '#00cc66',
                  borderRadius: 2,
                  flexShrink: 0,
                  display: 'inline-block',
                }} />
                <span style={{
                                    fontSize: '0.85rem',
                  color: '#1a1a1a',
                }}>
                  {slot.name}
                </span>
              </div>
              <span style={{
                                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#00aa55',
              }}>
                Confirmed
              </span>
            </div>
          ))}
          <div style={{ paddingTop: 16, marginTop: 4, borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '0.78rem', color: '#00aa55' }}>
              2 more slots available today
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 3: Chart ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        borderRadius: 8,
        padding: 24,
        marginTop: 24,
      }}>
        <div style={{
                    fontSize: '0.68rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#9CA3AF',
          marginBottom: 20,
        }}>
          Jobs Booked — Last 30 Days
        </div>
        <BarChart />
      </div>

    </div>
  )
}
