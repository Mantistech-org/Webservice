'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVATION_ITEMS = [
  { label: 'Automated Ads',           status: 'Active'                 },
  { label: 'Customer Outreach',       status: 'Sent to 1,247 contacts' },
  { label: 'Google Business Profile', status: 'Updated'                },
  { label: 'Missed Call Auto-Reply',  status: 'Active'                 },
  { label: 'Website Banner',          status: 'Live'                   },
]

// ── Sub-components ─────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="9" height="7" viewBox="0 0 7 5" fill="none">
      <polyline
        points="0.5,2.5 2.5,4.5 6.5,0.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DashboardAnimation() {
  const [activated,   setActivated]   = useState(false)
  const [checked,     setChecked]     = useState<number[]>([])
  const [bookedCount, setBookedCount] = useState(0)
  const [showBanner,  setShowBanner]  = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function add(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }

  function reset() {
    setActivated(false)
    setChecked([])
    setBookedCount(0)
    setShowBanner(false)
  }

  function run() {
    clear()
    reset()

    // ── Activation fires ───────────────────────────────────────────────────
    add(() => setActivated(true),        5420)

    // ── Five items check off in rapid succession ───────────────────────────
    add(() => setChecked([0]),           5620)
    add(() => setChecked([0,1]),         5970)
    add(() => setChecked([0,1,2]),       6310)
    add(() => setChecked([0,1,2,3]),     6650)
    add(() => setChecked([0,1,2,3,4]),   6990)

    // ── Jobs booked counter increments ─────────────────────────────────────
    add(() => setBookedCount(1),         8000)
    add(() => setBookedCount(3),         8600)
    add(() => setBookedCount(5),         9200)
    add(() => setBookedCount(7),         9800)

    // ── Success banner ─────────────────────────────────────────────────────
    add(() => setShowBanner(true),       11550)

    // ── Loop ───────────────────────────────────────────────────────────────
    add(() => run(),                     14800)
  }

  useEffect(() => {
    run()
    return clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section style={{ backgroundColor: '#0b0b0b', padding: '16px' }}>
      <div style={{ width: '100%' }}>

        {/* ── Animation window ─────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '16 / 7.5',
          fontFamily: "'Inter', Arial, sans-serif",
          userSelect: 'none',
          backgroundColor: '#0f0f0f',
        }}>

          {/* Vignette — fades bottom into CTA bar */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 24, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.88) 100%)',
          }} />

          {/* Main content */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            padding: '12px 14px 0',
            paddingBottom: '27%',
          }}>

            {/* ── Hero row: activation card + map ──────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 }}>

              {/* Left: weather activation card */}
              <div style={{
                width: '31%',
                flexShrink: 0,
                backgroundColor: '#162118',
                border: `1px solid ${activated ? 'rgba(0,255,136,0.45)' : 'rgba(0,255,136,0.2)'}`,
                borderRadius: 10,
                padding: '13px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
                transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
                boxShadow: activated
                  ? '0 0 0 1px rgba(0,255,136,0.1), 0 4px 24px rgba(0,0,0,0.55)'
                  : '0 4px 24px rgba(0,0,0,0.45)',
                overflow: 'hidden',
              }}>

                {/* Header */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: '#00ff88',
                      boxShadow: activated ? '0 0 9px rgba(0,255,136,0.9)' : '0 0 4px rgba(0,255,136,0.4)',
                      transition: 'box-shadow 0.5s ease',
                      animation: !activated ? 'mt-dot-pulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#00ff88',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                      Weather Event Active
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    Cold Snap Detected
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['28F Tonight', 'Forecast: 3 days'].map(pill => (
                      <div key={pill} style={{
                        fontSize: 9, color: '#9ec8a8',
                        backgroundColor: 'rgba(0,255,136,0.07)',
                        border: '1px solid rgba(0,255,136,0.15)',
                        borderRadius: 4, padding: '2px 7px',
                      }}>
                        {pill}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activate Now button */}
                <div style={{
                  flexShrink: 0,
                  backgroundColor: activated ? '#00b857' : '#00ff88',
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '8px 0',
                  borderRadius: 6,
                  letterSpacing: '0.07em',
                  cursor: 'default',
                  transition: 'background-color 0.3s ease',
                  animation: !activated ? 'mt-activate-pulse 1.8s ease-in-out infinite' : 'none',
                }}>
                  {activated ? 'Activated' : 'Activate Now'}
                </div>

                {/* Tool rows */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', minHeight: 0 }}>
                  {ACTIVATION_ITEMS.map((item, i) => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: checked.includes(i) ? '#00b857' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.3s ease',
                      }}>
                        {checked.includes(i) && <Check />}
                      </div>
                      <span style={{
                        fontSize: 11, flex: 1, lineHeight: 1.2,
                        color: checked.includes(i) ? '#b8e8c8' : '#5a7a62',
                        transition: 'color 0.3s ease',
                      }}>
                        {item.label}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 600,
                        color: checked.includes(i) ? '#00b857' : 'transparent',
                        transition: 'color 0.3s ease',
                        whiteSpace: 'nowrap',
                      }}>
                        {checked.includes(i) ? item.status : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Completion message */}
                <div style={{
                  flexShrink: 0,
                  fontSize: 10, color: '#00b857', fontWeight: 500,
                  textAlign: 'center',
                  borderTop: '1px solid rgba(0,255,136,0.12)',
                  paddingTop: 7,
                  opacity: showBanner ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}>
                  {bookedCount} jobs booked &middot; System running
                </div>
              </div>

              {/* Right: SVG map simulation */}
              <div style={{
                flex: 1,
                backgroundColor: '#1e1e1e',
                borderRadius: 10,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 420 260"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Subtle grid lines */}
                  <line x1="0"   y1="65"  x2="420" y2="65"  stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <line x1="0"   y1="130" x2="420" y2="130" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <line x1="0"   y1="195" x2="420" y2="195" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <line x1="105" y1="0"   x2="105" y2="260" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <line x1="210" y1="0"   x2="210" y2="260" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
                  <line x1="315" y1="0"   x2="315" y2="260" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />

                  {/* Service area circle */}
                  <circle cx="210" cy="130" r="105" fill="#111111" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />

                  {/* Subtle road lines inside */}
                  <line x1="140" y1="98"  x2="280" y2="98"  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="130" y1="130" x2="290" y2="130" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="140" y1="162" x2="280" y2="162" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="178" y1="55"  x2="178" y2="205" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="210" y1="35"  x2="210" y2="225" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="242" y1="55"  x2="242" y2="205" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                  {/* Cluster badge markers */}
                  {[
                    { cx: 163, cy: 90,  n: 9 },
                    { cx: 255, cy: 108, n: 5 },
                    { cx: 182, cy: 158, n: 4 },
                    { cx: 238, cy: 162, n: 3 },
                  ].map(({ cx, cy, n }) => (
                    <g key={n}>
                      <circle cx={cx} cy={cy} r="15" fill="#ef4444" opacity="0.92" />
                      <text
                        x={cx} y={cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="11"
                        fontWeight="700"
                        fill="white"
                        fontFamily="Arial, sans-serif"
                      >
                        {n}
                      </text>
                    </g>
                  ))}

                  {/* Center location dot */}
                  <circle cx="210" cy="130" r="4.5" fill="rgba(0,255,136,0.75)" />
                  <circle cx="210" cy="130" r="9"   fill="none" stroke="rgba(0,255,136,0.28)" strokeWidth="1.5" />
                </svg>

                {/* Map label */}
                <div style={{
                  position: 'absolute', top: 10, left: 12,
                  fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  Service Area
                </div>

                {/* Live / Standby badge */}
                <div style={{
                  position: 'absolute', top: 10, right: 12,
                  display: 'flex', alignItems: 'center', gap: 5,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  borderRadius: 4, padding: '3px 8px',
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: activated ? '#00ff88' : '#555',
                    transition: 'background-color 0.5s ease',
                    boxShadow: activated ? '0 0 5px rgba(0,255,136,0.7)' : 'none',
                  }} />
                  <span style={{
                    fontSize: 9, letterSpacing: '0.1em',
                    color: activated ? 'rgba(0,255,136,0.8)' : 'rgba(255,255,255,0.4)',
                    transition: 'color 0.5s ease',
                  }}>
                    {activated ? 'LIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Stats bar ────────────────────────────────────────────────── */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
              marginTop: 10, flexShrink: 0,
            }}>
              {[
                { label: 'Jobs Booked',           val: bookedCount > 0 ? String(bookedCount) : '0', hot: bookedCount > 0 },
                { label: 'Missed Calls Recovered', val: activated ? '24' : '0',                      hot: activated },
                { label: 'New Reviews',            val: '3',                                          hot: false },
                { label: 'Platform Revenue',       val: activated ? '$14,200' : '$12,800',            hot: activated },
              ].map(s => (
                <div key={s.label} style={{
                  backgroundColor: '#fff', border: '1px solid #e6e6e4',
                  borderRadius: 6, padding: '8px 11px',
                }}>
                  <div style={{ fontSize: 9, color: '#999', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 17, fontWeight: 700,
                    color: s.hot ? '#00b857' : '#1a1a1a',
                    transition: 'color 0.45s ease',
                  }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CTA overlay bar ─────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            zIndex: 30,
            background: 'rgba(0,0,0,0.78)',
            padding: '14px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <Link
              href="/demo"
              className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
            >
              See It With Your Business Name
            </Link>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: '#9e9e9e',
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              This is what it looks like when the system activates.
            </p>
          </div>

        </div>
        {/* ── End animation window ─────────────────────────────────────────── */}

      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes mt-activate-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0,255,136,0), 0 2px 8px rgba(0,255,136,0.15);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(0,255,136,0.2), 0 2px 16px rgba(0,255,136,0.5);
          }
        }
        @keyframes mt-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </section>
  )
}
