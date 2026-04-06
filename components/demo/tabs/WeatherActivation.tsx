'use client'

import { useState, useEffect } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ITEMS = [
  {
    label: 'Automated Ads',
    activatedStatus: 'Active',
    desc: 'Campaign running in your service area.',
  },
  {
    label: 'Customer Outreach',
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
    desc: 'Responding to all missed calls instantly.',
  },
  {
    label: 'Website Banner',
    activatedStatus: 'Live',
    desc: 'Showing emergency availability message.',
  },
]

const ACTIVATION_HISTORY = [
  { date: 'Jan 14, 2026', event: 'Cold Snap', jobs: 9,  revenue: '$6,300' },
  { date: 'Aug 7, 2025',  event: 'Heat Wave', jobs: 14, revenue: '$9,800' },
  { date: 'Jun 19, 2025', event: 'Heat Wave', jobs: 11, revenue: '$7,700' },
]

const IMPACT_STATS = [
  { value: '9 Jobs Captured',          label: 'Jobs from this activation' },
  { value: '$6,300 Revenue Generated', label: 'Estimated revenue captured' },
  { value: '1,247 Contacts Reached',   label: 'Outreach recipients'       },
]

const FORECAST_DAYS = [
  { day: 'TODAY', date: 'Apr 6',  high: 34, low: 28, condition: 'Cold Snap',      icon: 'snowflake', activate: true  },
  { day: 'TUE',   date: 'Apr 7',  high: 31, low: 22, condition: 'Freeze Warning', icon: 'snowflake', activate: true  },
  { day: 'WED',   date: 'Apr 8',  high: 38, low: 26, condition: 'Cold Snap',      icon: 'snowflake', activate: true  },
  { day: 'THU',   date: 'Apr 9',  high: 45, low: 33, condition: 'Overcast',       icon: 'cloud',     activate: false },
  { day: 'FRI',   date: 'Apr 10', high: 52, low: 38, condition: 'Clearing',       icon: 'cloud',     activate: false },
  { day: 'SAT',   date: 'Apr 11', high: 61, low: 44, condition: 'Clear',          icon: 'sun',       activate: false },
  { day: 'SUN',   date: 'Apr 12', high: 65, low: 47, condition: 'Clear',          icon: 'sun',       activate: false },
]

const DAY_DETAILS: Record<string, Array<{ label: string; value: string }>> = {
  TODAY: [{ label: "Tonight's Low", value: '28F' }, { label: 'Wind Speed', value: '19 MPH' }, { label: 'Humidity', value: '87%' }],
  TUE:   [{ label: "Tonight's Low", value: '22F' }, { label: 'Wind Speed', value: '19 MPH' }, { label: 'Humidity', value: '87%' }],
  WED:   [{ label: "Tonight's Low", value: '26F' }, { label: 'Wind Speed', value: '14 MPH' }, { label: 'Humidity', value: '79%' }],
  THU:   [{ label: 'High',          value: '45F' }, { label: 'Wind Speed', value: '12 MPH' }, { label: 'Humidity', value: '64%' }],
  FRI:   [{ label: 'High',          value: '52F' }, { label: 'Wind Speed', value: '8 MPH'  }, { label: 'Humidity', value: '55%' }],
  SAT:   [{ label: 'High',          value: '61F' }, { label: 'Wind Speed', value: '6 MPH'  }, { label: 'Humidity', value: '48%' }],
  SUN:   [{ label: 'High',          value: '65F' }, { label: 'Wind Speed', value: '5 MPH'  }, { label: 'Humidity', value: '45%' }],
}

function SnowflakeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2"    x2="12" y2="22"   />
      <line x1="2"  y1="12"   x2="22" y2="12"   />
      <line x1="4.93"  y1="4.93"  x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93"  x2="4.93"  y2="19.07" />
      <circle cx="12" cy="12" r="1.5" fill="#6b7280" stroke="none" />
      <circle cx="12" cy="5"  r="1"   fill="#6b7280" stroke="none" />
      <circle cx="12" cy="19" r="1"   fill="#6b7280" stroke="none" />
      <circle cx="5"  cy="12" r="1"   fill="#6b7280" stroke="none" />
      <circle cx="19" cy="12" r="1"   fill="#6b7280" stroke="none" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"    x2="12" y2="3"    />
      <line x1="12" y1="21"   x2="12" y2="23"   />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function WeatherIcon({ type }: { type: string }) {
  if (type === 'snowflake') return <SnowflakeIcon />
  if (type === 'cloud')     return <CloudIcon />
  return <SunIcon />
}

function ForecastCard({ day }: { day: typeof FORECAST_DAYS[number] }) {
  const details = DAY_DETAILS[day.day]
  return (
    <div
      style={{
        backgroundColor: day.activate ? 'rgba(0,194,124,0.04)' : '#ffffff',
        borderRadius: 12,
        padding: 12,
        textAlign: 'center',
        border: '1px solid rgba(0,0,0,0.06)',
        borderLeft: day.activate ? '3px solid #00C27C' : '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Day label */}
      <div style={{
        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: '#6b7280', marginBottom: 1, fontWeight: 600,
      }}>
        {day.day}
      </div>

      {/* Date */}
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
        {day.date}
      </div>

      {/* Weather icon */}
      <div style={{ marginBottom: 8 }}>
        <WeatherIcon type={day.icon} />
      </div>

      {/* High / Low */}
      <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 3 }}>
        {day.high}F / {day.low}F
      </div>

      {/* Condition label */}
      <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
        {day.condition}
      </div>

      {/* Detail stats */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        paddingTop: 6,
        textAlign: 'left',
        width: '100%',
      }}>
        {details.map((stat) => (
          <div
            key={stat.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 3,
            }}
          >
            <span style={{ fontSize: 11, color: '#6b7280' }}>{stat.label}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Activation Recommended pill */}
      {day.activate && (
        <div style={{
          fontSize: 10, color: '#00C27C', fontWeight: 600,
          backgroundColor: 'rgba(0,194,124,0.12)',
          borderRadius: 999, padding: '2px 6px',
          whiteSpace: 'nowrap',
          marginTop: 6,
        }}>
          Activation Recommended
        </div>
      )}
    </div>
  )
}

export default function WeatherActivation({ }: Props) {
  const [activated,    setActivated]    = useState(false)
  const [activating,   setActivating]   = useState(false)
  const [checkedCount, setCheckedCount] = useState(0)
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null)
  const [sequenceDone, setSequenceDone] = useState(false)

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

  const subline = sequenceDone
    ? 'Activation triggered at 11:47 PM.'
    : 'Your platform is ready to activate. All 5 tools are standing by.'

  return (
    <div>

      {/* Two-column layout: left = header + panel, right = forecast + history */}
      <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: 24, alignItems: 'stretch' }}>

        {/* Left column — header + activation panel */}
        <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column' }}>

          {/* Page header */}
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 6 }}>
              Weather Activation System
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Automated campaign deployment triggered by real-time weather events.
            </p>
          </div>

          {/* Activation panel — flex: 1 so it fills remaining left column height */}
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 12,
            borderTop: '3px solid #00C27C',
            overflow: 'hidden',
            flex: 1,
          }}>
            <div style={{ padding: '24px 24px 8px 24px' }}>

              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', width: 9, height: 9,
                  borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00C27C' }}>
                  Active Weather Event
                </span>
              </div>

              {/* Headline */}
              <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 8, lineHeight: 1.4 }}>
                Cold snap detected. 28F forecast tonight in your service area.
              </div>

              {/* Subline */}
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                {subline}
              </p>

              {/* Activate Now button */}
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
            <div style={{ padding: '16px 24px 8px 24px' }}>
              {ITEMS.map((item, i) => {
                const isChecked   = checkedCount > i
                const isAnimating = animatingIdx === i

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      paddingTop: 14, paddingBottom: 14,
                      borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    }}
                  >
                    {/* Circle / checkmark */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: isChecked ? '#00b857' : 'transparent',
                      border: isChecked ? 'none' : '2px solid #4b5563',
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                          color: isChecked ? '#00aa55' : '#6b7280',
                        }}>
                          {isChecked ? item.activatedStatus : 'Ready'}
                        </span>
                      </div>
                      {isChecked && (
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Impact pills — only shown after full 3000ms sequence completes */}
            {sequenceDone && (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                padding: '16px 24px 24px 24px',
              }}>
                {IMPACT_STATS.map((stat) => (
                  <div
                    key={stat.value}
                    style={{
                      backgroundColor: 'rgba(0,194,124,0.08)',
                      border: '1px solid rgba(0,194,124,0.3)',
                      borderRadius: 12,
                      padding: '14px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#00C27C', lineHeight: 1.3 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom padding when pills not shown */}
            {!sequenceDone && <div style={{ height: 24 }} />}
          </div>
        </div>

        {/* Right column — forecast grid + history panel fills remaining height */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* 7-Day Forecast label */}
          <div style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#6b7280', marginBottom: 16,
          }}>
            7-Day Forecast
          </div>

          {/* Single 7-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 16 }}>
            {FORECAST_DAYS.map((day) => (
              <ForecastCard key={day.day} day={day} />
            ))}
          </div>

          {/* Activation history — flex: 1 fills remaining right column height */}
          <div style={{
            flex: 1,
            backgroundColor: '#f9fafb',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px 0 24px' }}>
              <div style={{
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: '#6b7280', marginBottom: 16,
              }}>
                Activation History
              </div>
            </div>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Date', 'Event Type', 'Jobs Captured', 'Revenue Estimated'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', paddingTop: 0, paddingBottom: 12, paddingRight: 24,
                          fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: '#9ca3af', fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACTIVATION_HISTORY.map((row, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: i < ACTIVATION_HISTORY.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                    >
                      <td style={{ fontSize: 14, color: '#444444', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.date}</td>
                      <td style={{ fontSize: 14, color: '#444444', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.event}</td>
                      <td style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.jobs}</td>
                      <td style={{ fontSize: 14, fontWeight: 600, color: '#00aa55', paddingTop: 14, paddingBottom: 14 }}>{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
