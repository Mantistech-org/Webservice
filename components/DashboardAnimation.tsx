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

const BOOKING_SLOTS = [
  { time: '7:00 AM',  name: 'James Perkins'   },
  { time: '8:30 AM',  name: 'Michelle Carter' },
  { time: '10:00 AM', name: 'Ray Dominguez'   },
  { time: '11:30 AM', name: 'Donna Howell'    },
  { time: '1:00 PM',  name: 'Brian Stokes'    },
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
  const [alertIn,      setAlertIn]      = useState(false)
  const [alertPulse,   setAlertPulse]   = useState(false)
  const [cursorOn,     setCursorOn]     = useState(false)
  const [cursorX,      setCursorX]      = useState(28)
  const [cursorY,      setCursorY]      = useState(68)
  const [cursorMs,     setCursorMs]     = useState(800)
  const [activated,    setActivated]    = useState(false)
  const [checked,      setChecked]      = useState<number[]>([])
  const [showBookings, setShowBookings] = useState(false)
  const [filledSlots,  setFilledSlots]  = useState<number[]>([])
  const [bookedCount,  setBookedCount]  = useState(0)
  const [showBanner,   setShowBanner]   = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clear() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  function add(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms))
  }

  function reset() {
    setAlertIn(false)
    setAlertPulse(false)
    setCursorOn(false)
    setCursorX(28)
    setCursorY(68)
    setCursorMs(800)
    setActivated(false)
    setChecked([])
    setShowBookings(false)
    setFilledSlots([])
    setBookedCount(0)
    setShowBanner(false)
  }

  function run() {
    clear()
    reset()

    // ── Act 1: alert slides in ─────────────────────────────────────────────
    add(() => setAlertIn(true),    700)
    add(() => setAlertPulse(true), 2100)

    // ── Cursor appears, moves to Activate Now in the alert card ───────────
    add(() => { setCursorOn(true); setCursorMs(0) }, 3700)
    add(() => { setCursorMs(750); setCursorX(54); setCursorY(47) }, 3850)
    add(() => { setCursorMs(550); setCursorX(82); setCursorY(28) }, 4650)
    add(() => { setCursorMs(160); setCursorX(82.5); setCursorY(28.3) }, 5230)

    // ── Act 2: activation fires ────────────────────────────────────────────
    add(() => setActivated(true), 5420)

    // Five items check off in rapid succession
    add(() => setChecked([0]),           5620)
    add(() => setChecked([0,1]),         5970)
    add(() => setChecked([0,1,2]),       6310)
    add(() => setChecked([0,1,2,3]),     6650)
    add(() => setChecked([0,1,2,3,4]),   6990)

    // Cursor fades, alert slides back out
    add(() => setCursorOn(false), 7350)
    add(() => setAlertIn(false),  7800)

    // ── Act 3: bookings schedule fills slot by slot ────────────────────────
    add(() => setShowBookings(true), 8000)

    const slotBase = 8300
    const slotGap  = 400
    for (let i = 0; i < BOOKING_SLOTS.length; i++) {
      const idx = i
      add(() => {
        setFilledSlots(prev => [...prev, idx])
        setBookedCount(idx + 1)
      }, slotBase + idx * slotGap)
    }

    // Return to map view, success banner
    add(() => setShowBookings(false), 11100)
    add(() => setShowBanner(true),    11550)

    // ── Loop ───────────────────────────────────────────────────────────────
    add(() => run(), 14800)
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
          aspectRatio: '16 / 6.6',
          fontFamily: "'Inter', Arial, sans-serif",
          userSelect: 'none',
          backgroundColor: '#0f0f0f',
        }}>

          {/* Vignette — fades bottom into CTA bar */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 24, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 52%, rgba(0,0,0,0.88) 100%)',
          }} />

          {/* ── Main content ──────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            padding: '11px 13px',
            paddingBottom: '34%',
          }}>

            {/* Hero row: activation card + right panel */}
            <div style={{ flex: 1, display: 'flex', gap: 11, overflow: 'hidden', minHeight: 0 }}>

              {/* LEFT: weather activation card */}
              <div style={{
                width: '31%',
                flexShrink: 0,
                backgroundColor: '#162118',
                border: `1px solid ${activated ? 'rgba(0,255,136,0.45)' : 'rgba(0,255,136,0.2)'}`,
                borderRadius: 8,
                padding: '11px 12px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                transition: 'border-color 0.5s ease',
              }}>

                {/* Header */}
                <div style={{ flexShrink: 0, marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: '#00ff88',
                      boxShadow: activated ? '0 0 8px rgba(0,255,136,0.9)' : '0 0 3px rgba(0,255,136,0.4)',
                      transition: 'box-shadow 0.5s ease',
                      animation: !activated ? 'mt-dot-pulse 2s ease-in-out infinite' : 'none',
                    }} />
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: '#00ff88',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    }}>
                      Weather Event Active
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 5 }}>
                    Cold Snap Detected
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['28F Tonight', 'Forecast: 3 days'].map(pill => (
                      <div key={pill} style={{
                        fontSize: 8, color: '#9ec8a8',
                        backgroundColor: 'rgba(0,255,136,0.07)',
                        border: '1px solid rgba(0,255,136,0.15)',
                        borderRadius: 3, padding: '2px 6px',
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
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: 'center',
                  padding: '7px 0',
                  borderRadius: 5,
                  letterSpacing: '0.06em',
                  cursor: 'default',
                  marginBottom: 8,
                  transition: 'background-color 0.3s ease',
                  animation: !activated ? 'mt-activate-pulse 1.8s ease-in-out infinite' : 'none',
                }}>
                  {activated ? 'Activated' : 'Activate Now'}
                </div>

                {/* Tool rows */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', overflow: 'hidden', minHeight: 0 }}>
                  {ACTIVATION_ITEMS.map((item, i) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: checked.includes(i) ? '#00b857' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.3s ease',
                      }}>
                        {checked.includes(i) && <Check />}
                      </div>
                      <span style={{
                        fontSize: 10, flex: 1, lineHeight: 1.2,
                        color: checked.includes(i) ? '#b8e8c8' : '#5a7a62',
                        transition: 'color 0.3s ease',
                      }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: SVG map / bookings panel */}
              <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>

                {/* SVG Map — fades out during bookings */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: '#1e1e1e',
                  opacity: showBookings ? 0 : 1,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: showBookings ? 'none' : 'auto',
                }}>
                  <svg width="100%" height="100%" viewBox="0 0 420 220" preserveAspectRatio="xMidYMid slice">
                    {/* Grid lines */}
                    <line x1="0"   y1="55"  x2="420" y2="55"  stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0"   y1="110" x2="420" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0"   y1="165" x2="420" y2="165" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="105" y1="0"   x2="105" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="210" y1="0"   x2="210" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="315" y1="0"   x2="315" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    {/* Service area circle */}
                    <circle cx="210" cy="110" r="90" fill="#111111" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
                    {/* Inner road lines */}
                    <line x1="148" y1="85"  x2="272" y2="85"  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="135" y1="110" x2="285" y2="110" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="148" y1="135" x2="272" y2="135" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="180" y1="45"  x2="180" y2="175" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="210" y1="30"  x2="210" y2="190" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="240" y1="45"  x2="240" y2="175" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    {/* Cluster badge markers */}
                    <circle cx="170" cy="82"  r="13" fill="#ef4444" opacity="0.92" />
                    <text x="170" y="82"  textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">9</text>
                    <circle cx="250" cy="98"  r="13" fill="#ef4444" opacity="0.92" />
                    <text x="250" y="98"  textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">5</text>
                    <circle cx="188" cy="140" r="13" fill="#ef4444" opacity="0.92" />
                    <text x="188" y="140" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">4</text>
                    <circle cx="234" cy="143" r="13" fill="#ef4444" opacity="0.92" />
                    <text x="234" y="143" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="700" fill="white" fontFamily="Arial,sans-serif">3</text>
                    {/* Center location dot */}
                    <circle cx="210" cy="110" r="4"   fill="rgba(0,255,136,0.7)" />
                    <circle cx="210" cy="110" r="8.5" fill="none" stroke="rgba(0,255,136,0.25)" strokeWidth="1.5" />
                  </svg>

                  {/* Map corner labels */}
                  <div style={{
                    position: 'absolute', top: 8, left: 10,
                    fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.09em', textTransform: 'uppercase',
                  }}>
                    Service Area
                  </div>
                  <div style={{
                    position: 'absolute', top: 8, right: 10,
                    display: 'flex', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 3, padding: '2px 6px',
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      backgroundColor: activated ? '#00ff88' : '#555',
                      transition: 'background-color 0.5s ease',
                      boxShadow: activated ? '0 0 5px rgba(0,255,136,0.7)' : 'none',
                    }} />
                    <span style={{
                      fontSize: 8, letterSpacing: '0.09em',
                      color: activated ? 'rgba(0,255,136,0.8)' : 'rgba(255,255,255,0.35)',
                      transition: 'color 0.5s ease',
                    }}>
                      {activated ? 'LIVE' : 'STANDBY'}
                    </span>
                  </div>

                  {/* Success banner — overlays bottom of map after loop completes */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
                    backgroundColor: 'rgba(0,15,8,0.88)',
                    borderTop: '1px solid rgba(0,255,136,0.18)',
                    padding: '6px 12px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: showBanner ? 1 : 0,
                    transform: showBanner ? 'translateY(0)' : 'translateY(5px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00b857', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#d0e8d8', fontWeight: 500 }}>
                      Platform running. {bookedCount} jobs booked. You did not touch your phone.
                    </span>
                  </div>
                </div>

                {/* Bookings view — cross-fades in during Act 3 */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundColor: '#f7f7f5',
                  opacity: showBookings ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: showBookings ? 'auto' : 'none',
                  padding: '10px 13px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 8, flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Today&apos;s Schedule</span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      backgroundColor: 'rgba(0,184,87,0.08)',
                      border: '1px solid rgba(0,184,87,0.22)',
                      borderRadius: 5, padding: '3px 11px',
                    }}>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#00b857', lineHeight: 1 }}>{bookedCount}</span>
                      <span style={{ fontSize: 12, color: '#666' }}>booked</span>
                    </div>
                  </div>

                  {/* Booking slots */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'hidden' }}>
                    {BOOKING_SLOTS.map((slot, i) => {
                      const filled = filledSlots.includes(i)
                      return (
                        <div key={slot.time} style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', gap: 10,
                          backgroundColor: filled ? '#fff' : '#f0f0ee',
                          border: `1px solid ${filled ? '#e0e0de' : '#eaeae8'}`,
                          borderRadius: 5, padding: '0 12px',
                          opacity: filled ? 1 : 0.4,
                          transition: 'opacity 0.45s ease, background-color 0.45s ease, border-color 0.45s ease',
                        }}>
                          <span style={{ fontSize: 11, color: '#888', width: 58, flexShrink: 0 }}>{slot.time}</span>
                          <div style={{
                            width: 2, height: 18, borderRadius: 1, flexShrink: 0,
                            backgroundColor: filled ? '#00b857' : '#d4d4d2',
                            transition: 'background-color 0.45s ease',
                          }} />
                          <span style={{
                            fontSize: 12, flex: 1,
                            fontWeight: filled ? 500 : 400,
                            color: filled ? '#111' : '#bbb',
                            transition: 'color 0.45s ease',
                          }}>
                            {filled ? slot.name : 'Available'}
                          </span>
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: filled ? '#00b857' : 'transparent',
                            transition: 'color 0.45s ease',
                          }}>
                            Confirmed
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7,
              marginTop: 8, flexShrink: 0,
            }}>
              {[
                { label: 'Jobs Booked',            val: bookedCount > 0 ? String(bookedCount) : '0', hot: bookedCount > 0 },
                { label: 'Missed Calls Recovered',  val: activated ? '24' : '0',                      hot: activated },
                { label: 'New Reviews',             val: '3',                                          hot: false },
                { label: 'Platform Revenue',        val: activated ? '$14,200' : '$12,800',            hot: activated },
              ].map(s => (
                <div key={s.label} style={{
                  backgroundColor: '#fff', border: '1px solid #e6e6e4',
                  borderRadius: 5, padding: '6px 9px',
                }}>
                  <div style={{ fontSize: 8, color: '#999', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: s.hot ? '#00b857' : '#1a1a1a',
                    transition: 'color 0.45s ease',
                  }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Weather alert notification — slides in from right ─────────── */}
          <div style={{
            position: 'absolute', top: '9%', zIndex: 10,
            right: alertIn ? '2%' : '-44%',
            width: '30%',
            backgroundColor: '#162118',
            border: `1px solid ${alertPulse ? 'rgba(0,255,136,0.55)' : 'rgba(0,255,136,0.22)'}`,
            borderRadius: 10, padding: '14px 18px',
            transition: [
              'right 0.65s cubic-bezier(0.34,1.38,0.64,1)',
              'border-color 0.55s ease',
              'box-shadow 0.55s ease',
            ].join(', '),
            boxShadow: alertPulse
              ? '0 0 0 4px rgba(0,255,136,0.13), 0 10px 32px rgba(0,0,0,0.55)'
              : '0 10px 32px rgba(0,0,0,0.45)',
          }}>
            {/* Alert header */}
            <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                backgroundColor: '#00ff88',
                boxShadow: alertPulse ? '0 0 9px rgba(0,255,136,0.75)' : 'none',
                transition: 'box-shadow 0.55s ease',
              }} />
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: '#00ff88',
                  letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 5,
                }}>
                  Cold snap detected
                </div>
                <div style={{ fontSize: 13, color: '#c8c8c8', lineHeight: 1.5 }}>
                  28&deg;F forecast for tonight in your service area. Activation ready.
                </div>
              </div>
            </div>

            {/* Activate Now button — cursor clicks here */}
            <div style={{
              backgroundColor: activated ? '#00b857' : '#00ff88',
              color: '#000',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
              padding: '10px 0',
              borderRadius: 5,
              letterSpacing: '0.05em',
              cursor: 'default',
              transition: 'background-color 0.25s ease',
              animation: alertPulse && !activated ? 'mt-activate-pulse 1.8s ease-in-out infinite' : 'none',
            }}>
              {activated ? 'Activating...' : 'Activate Now'}
            </div>
          </div>

          {/* ── Cursor ───────────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', zIndex: 38, pointerEvents: 'none',
            left: `${cursorX}%`,
            top: `${cursorY}%`,
            opacity: cursorOn ? 1 : 0,
            transition: [
              'opacity 0.3s ease',
              `left ${cursorMs}ms cubic-bezier(0.25,0.46,0.45,0.94)`,
              `top ${cursorMs}ms cubic-bezier(0.25,0.46,0.45,0.94)`,
            ].join(', '),
          }}>
            <svg width="28" height="36" viewBox="0 0 18 23" fill="none">
              <path
                d="M1 1L1 18.5L6 13.5L9 21L11.5 20L8.5 12.5L15 12.5Z"
                fill="white"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="1"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
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
