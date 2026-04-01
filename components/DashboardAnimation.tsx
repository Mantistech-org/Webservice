'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVATION_ITEMS = [
  { label: 'Google Ads',              status: 'Active'  },
  { label: 'Customer SMS Blast',      status: 'Sent'    },
  { label: 'Google Business Profile', status: 'Updated' },
  { label: 'Missed Call Auto-Reply',  status: 'Active'  },
  { label: 'Website Banner',          status: 'Live'    },
]

const BOOKING_SLOTS = [
  { time: '7:00 AM',  name: 'James Perkins'   },
  { time: '8:30 AM',  name: 'Michelle Carter' },
  { time: '10:00 AM', name: 'Ray Dominguez'   },
  { time: '11:30 AM', name: 'Donna Howell'    },
  { time: '1:00 PM',  name: 'Brian Stokes'    },
  { time: '2:30 PM',  name: 'Linda Park'      },
  { time: '4:00 PM',  name: 'Frank Nguyen'    },
]

const OVERLAY_LINES = [
  '',
  'A cold snap hits your market tonight.',
  'Your platform sees it first.',
  'Everything activates automatically.',
  'You wake up to a full schedule.',
]

// ── Sidebar nav item ───────────────────────────────────────────────────────────

function SidebarItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div style={{
      padding: '6px 12px',
      fontSize: 9,
      fontWeight: active ? 600 : 400,
      color: active ? '#00ff88' : '#5a5a5a',
      backgroundColor: active ? 'rgba(0,255,136,0.07)' : 'transparent',
      borderLeft: `2px solid ${active ? '#00ff88' : 'transparent'}`,
      transition: 'all 0.3s ease',
    }}>
      {label}
    </div>
  )
}

// ── Checkmark SVG ──────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
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
  const [cursorX,      setCursorX]      = useState(22)
  const [cursorY,      setCursorY]      = useState(66)
  const [cursorMs,     setCursorMs]     = useState(800)
  const [activated,    setActivated]    = useState(false)
  const [checked,      setChecked]      = useState<number[]>([])
  const [showBookings, setShowBookings] = useState(false)
  const [filledSlots,  setFilledSlots]  = useState<number[]>([])
  const [bookedCount,  setBookedCount]  = useState(0)
  const [showBanner,   setShowBanner]   = useState(false)
  const [overlayIdx,   setOverlayIdx]   = useState(0)
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
    setCursorX(22)
    setCursorY(66)
    setCursorMs(800)
    setActivated(false)
    setChecked([])
    setShowBookings(false)
    setFilledSlots([])
    setBookedCount(0)
    setShowBanner(false)
    setOverlayIdx(0)
  }

  function run() {
    clear()
    reset()

    // ── Frame 1: alert slides in ───────────────────────────────────────────
    add(() => { setAlertIn(true);    setOverlayIdx(1) }, 700)
    add(() => { setAlertPulse(true); setOverlayIdx(2) }, 2100)
    add(() =>   setOverlayIdx(0),                        3900)

    // ── Frame 2: cursor appears, moves to activate button, clicks ──────────
    // Cursor materialises at lower-left of main content
    add(() => { setCursorOn(true); setCursorMs(0) }, 3700)

    // First leg — diagonal sweep toward upper-right (slow, natural)
    add(() => { setCursorMs(750); setCursorX(52); setCursorY(44) }, 3850)

    // Second leg — closing in on the button (medium speed)
    add(() => { setCursorMs(550); setCursorX(85); setCursorY(22) }, 4650)

    // Micro hover correction — tiny human wobble
    add(() => { setCursorMs(160); setCursorX(85.5); setCursorY(22.3) }, 5230)

    // Click — button activates, overlay 3
    add(() => { setActivated(true); setOverlayIdx(3) }, 5420)

    // Items check off in rapid succession
    add(() => setChecked([0]),             5620)
    add(() => setChecked([0,1]),           5970)
    add(() => setChecked([0,1,2]),         6310)
    add(() => setChecked([0,1,2,3]),       6650)
    add(() => setChecked([0,1,2,3,4]),     6990)

    // Cursor fades, overlay 3 fades
    add(() => setCursorOn(false),  7350)
    add(() => setOverlayIdx(0),    7500)

    // ── Frame 3: switch to bookings panel, slots fill one by one ──────────
    add(() => setShowBookings(true), 8000)

    const slotBase = 8300
    const slotGap  = 380
    for (let i = 0; i < BOOKING_SLOTS.length; i++) {
      const idx = i
      add(() => {
        setFilledSlots(prev => [...prev, idx])
        setBookedCount(idx + 1)
      }, slotBase + idx * slotGap)
    }

    // ── Frame 4: pull back to dashboard, success banner + overlay 4 ────────
    add(() => { setShowBookings(false); setOverlayIdx(4) }, 11100)
    add(() =>   setShowBanner(true),                        11550)
    add(() =>   setOverlayIdx(0),                           13300)

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
    <section style={{ backgroundColor: '#0b0b0b', padding: '72px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Animation window ─────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)',
          aspectRatio: '16 / 9',
          backgroundColor: '#141414',
          fontFamily: "'Inter', Arial, sans-serif",
          userSelect: 'none',
        }}>

          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 32, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.72) 100%)',
          }} />

          {/* Cinematic tint */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none',
            backgroundColor: 'rgba(0,6,3,0.16)',
          }} />

          {/* Text overlays */}
          {OVERLAY_LINES.map((line, n) => n > 0 && (
            <div key={n} style={{
              position: 'absolute', bottom: '8%', left: 0, right: 0, zIndex: 42,
              textAlign: 'center', pointerEvents: 'none',
              opacity: overlayIdx === n ? 1 : 0,
              transition: 'opacity 0.55s ease',
            }}>
              <span style={{
                fontSize: 'clamp(12px, 1.85vw, 17px)',
                color: '#ffffff',
                letterSpacing: '0.015em',
                textShadow: '0 1px 12px rgba(0,0,0,0.95)',
              }}>
                {line}
              </span>
            </div>
          ))}

          {/* ── Dashboard layout ──────────────────────────────────────────── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>

            {/* Sidebar */}
            <div style={{
              width: '16%',
              backgroundColor: '#1c1c1c',
              borderRight: '1px solid rgba(255,255,255,0.055)',
              display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {/* Logo */}
              <div style={{
                padding: '10px 12px 11px',
                borderBottom: '1px solid rgba(255,255,255,0.055)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#00ff88', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Mantis
                </span>
              </div>
              {/* Nav */}
              <div style={{ paddingTop: 8 }}>
                {['Dashboard','Weather','Bookings','Reviews','SEO','SMS','Settings'].map((item) => (
                  <SidebarItem
                    key={item}
                    label={item}
                    active={showBookings ? item === 'Bookings' : item === 'Dashboard'}
                  />
                ))}
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, backgroundColor: '#f7f7f5', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Top bar */}
              <div style={{
                backgroundColor: '#fff',
                borderBottom: '1px solid #e6e6e4',
                padding: '7px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#111', letterSpacing: '0.04em' }}>
                  {showBookings ? 'Bookings' : 'Dashboard'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: activated ? '#00b857' : '#c8c8c8',
                    transition: 'background-color 0.5s ease',
                    boxShadow: activated ? '0 0 5px rgba(0,184,87,0.6)' : 'none',
                  }} />
                  <span style={{ fontSize: 8, color: '#888' }}>
                    {activated ? 'Platform Active' : 'Standby'}
                  </span>
                </div>
              </div>

              {/* Content area — two overlapping views cross-fade */}
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

                {/* ── Dashboard view ──────────────────────────────────────── */}
                <div style={{
                  position: 'absolute', inset: 0,
                  padding: '10px 14px',
                  opacity: showBookings ? 0 : 1,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: showBookings ? 'none' : 'auto',
                  overflow: 'hidden',
                }}>
                  {/* Stats row */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8,
                  }}>
                    {[
                      { label: 'Jobs Booked',  val: bookedCount > 0 ? String(bookedCount) : '0', hot: bookedCount > 0 },
                      { label: 'Ads',          val: activated ? 'Active'  : 'Standby', hot: activated },
                      { label: 'SMS Sent',     val: activated ? '1,247'   : '0',       hot: activated },
                      { label: 'Missed Calls', val: '0', hot: false },
                    ].map(s => (
                      <div key={s.label} style={{
                        backgroundColor: '#fff', border: '1px solid #e6e6e4',
                        borderRadius: 4, padding: '7px 8px',
                      }}>
                        <div style={{ fontSize: 7, color: '#999', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          {s.label}
                        </div>
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: s.hot ? '#00b857' : '#1a1a1a',
                          transition: 'color 0.45s ease',
                        }}>
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Activation panel */}
                  <div style={{
                    backgroundColor: '#fff', border: '1px solid #e6e6e4',
                    borderRadius: 4, padding: '9px 10px', marginBottom: 8,
                  }}>
                    {/* Panel header with ACTIVATE button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#111' }}>Weather Activation</span>
                      <div style={{
                        backgroundColor: activated ? '#00b857' : '#00ff88',
                        color: '#000',
                        fontSize: 7, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 3,
                        letterSpacing: '0.07em',
                        transition: 'background-color 0.25s ease',
                        transform: activated ? 'scale(0.95)' : 'scale(1)',
                      }}>
                        {activated ? 'ACTIVATED' : 'ACTIVATE'}
                      </div>
                    </div>

                    {/* Item list */}
                    {ACTIVATION_ITEMS.map((item, i) => (
                      <div key={item.label} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        paddingBottom: i < ACTIVATION_ITEMS.length - 1 ? 4 : 0,
                        borderBottom: i < ACTIVATION_ITEMS.length - 1 ? '1px solid #f0f0ee' : 'none',
                        marginBottom: i < ACTIVATION_ITEMS.length - 1 ? 4 : 0,
                      }}>
                        {/* Circle / checkmark */}
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: checked.includes(i) ? '#00b857' : '#e6e6e4',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background-color 0.3s ease',
                        }}>
                          {checked.includes(i) && <Check />}
                        </div>
                        <span style={{ fontSize: 8, color: '#555', flex: 1 }}>{item.label}</span>
                        <span style={{
                          fontSize: 7, fontWeight: 600,
                          color: checked.includes(i) ? '#00b857' : '#d0d0d0',
                          transition: 'color 0.3s ease',
                        }}>
                          {checked.includes(i) ? item.status : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Success banner */}
                  <div style={{
                    backgroundColor: 'rgba(0,184,87,0.08)',
                    border: '1px solid rgba(0,184,87,0.28)',
                    borderRadius: 4, padding: '7px 10px',
                    display: 'flex', alignItems: 'center', gap: 7,
                    opacity: showBanner ? 1 : 0,
                    transform: showBanner ? 'translateY(0)' : 'translateY(5px)',
                    transition: 'opacity 0.45s ease, transform 0.45s ease',
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#00b857', flexShrink: 0 }} />
                    <span style={{ fontSize: 8, color: '#111', fontWeight: 500 }}>
                      Platform running. {bookedCount} jobs booked. You did not touch your phone.
                    </span>
                  </div>
                </div>

                {/* ── Bookings view ────────────────────────────────────────── */}
                <div style={{
                  position: 'absolute', inset: 0,
                  padding: '10px 14px',
                  opacity: showBookings ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  pointerEvents: showBookings ? 'auto' : 'none',
                  overflow: 'hidden',
                }}>
                  {/* Bookings header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#111' }}>Today&apos;s Schedule</span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      backgroundColor: 'rgba(0,184,87,0.08)',
                      border: '1px solid rgba(0,184,87,0.24)',
                      borderRadius: 4, padding: '3px 8px',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00b857', lineHeight: 1 }}>{bookedCount}</span>
                      <span style={{ fontSize: 8, color: '#666' }}>booked</span>
                    </div>
                  </div>

                  {/* Slot list */}
                  {BOOKING_SLOTS.map((slot, i) => {
                    const filled = filledSlots.includes(i)
                    return (
                      <div key={slot.time} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        backgroundColor: filled ? '#fff' : '#f2f2f0',
                        border: `1px solid ${filled ? '#e0e0de' : '#eaeae8'}`,
                        borderRadius: 3, padding: '5px 8px',
                        marginBottom: i < BOOKING_SLOTS.length - 1 ? 4 : 0,
                        opacity: filled ? 1 : 0.38,
                        transition: 'opacity 0.45s ease, background-color 0.45s ease, border-color 0.45s ease',
                      }}>
                        <span style={{ fontSize: 8, color: '#888', width: 38, flexShrink: 0 }}>{slot.time}</span>
                        <div style={{
                          width: 2, height: 14, borderRadius: 1, flexShrink: 0,
                          backgroundColor: filled ? '#00b857' : '#d4d4d2',
                          transition: 'background-color 0.45s ease',
                        }} />
                        <span style={{
                          fontSize: 8, flex: 1, fontWeight: filled ? 500 : 400,
                          color: filled ? '#111' : '#aaa',
                          transition: 'color 0.45s ease',
                        }}>
                          {filled ? slot.name : 'Available'}
                        </span>
                        <span style={{
                          fontSize: 7, fontWeight: 600,
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

          {/* ── Weather alert notification ─────────────────────────────────── */}
          <div style={{
            position: 'absolute', top: '11%', zIndex: 20,
            right: alertIn ? '2%' : '-42%',
            width: '31%',
            backgroundColor: '#162118',
            border: `1px solid ${alertPulse ? 'rgba(0,255,136,0.55)' : 'rgba(0,255,136,0.22)'}`,
            borderRadius: 7, padding: '10px 12px',
            transition: [
              'right 0.65s cubic-bezier(0.34,1.38,0.64,1)',
              'border-color 0.55s ease',
              'box-shadow 0.55s ease',
            ].join(', '),
            boxShadow: alertPulse
              ? '0 0 0 3px rgba(0,255,136,0.16), 0 8px 28px rgba(0,0,0,0.55)'
              : '0 8px 28px rgba(0,0,0,0.45)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                backgroundColor: '#00ff88',
                boxShadow: alertPulse ? '0 0 7px rgba(0,255,136,0.75)' : 'none',
                transition: 'box-shadow 0.55s ease',
              }} />
              <div>
                <div style={{
                  fontSize: 8, fontWeight: 700, color: '#00ff88',
                  letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4,
                }}>
                  Cold snap detected
                </div>
                <div style={{ fontSize: 9, color: '#c8c8c8', lineHeight: 1.55 }}>
                  28&deg;F forecast for tonight in your service area. Activation ready.
                </div>
              </div>
            </div>
          </div>

          {/* ── Cursor ────────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', zIndex: 28, pointerEvents: 'none',
            left: `${cursorX}%`,
            top: `${cursorY}%`,
            opacity: cursorOn ? 1 : 0,
            transition: [
              'opacity 0.3s ease',
              `left ${cursorMs}ms cubic-bezier(0.25,0.46,0.45,0.94)`,
              `top ${cursorMs}ms cubic-bezier(0.25,0.46,0.45,0.94)`,
            ].join(', '),
          }}>
            <svg width="18" height="23" viewBox="0 0 18 23" fill="none">
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

        </div>
        {/* ── End animation window ─────────────────────────────────────────── */}

        {/* Below-animation caption and CTA */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13, color: '#4e4e4e',
            marginBottom: 20, letterSpacing: '0.01em',
          }}>
            This is what it looks like when the system activates.
          </p>
          <Link
            href="/demo"
            className="inline-block font-mono text-sm bg-accent text-black px-8 py-4 rounded tracking-wider hover:opacity-90 transition-opacity"
          >
            See It With Your Business Name
          </Link>
        </div>

      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes mt-pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </section>
  )
}
