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

const WEATHER_STATS = [
  { value: '28F',    label: "Tonight's Low" },
  { value: '19 MPH', label: 'Wind Speed'    },
  { value: '87%',    label: 'Humidity'      },
  { value: '3 Days', label: 'Event Duration'},
]

const IMPACT_STATS = [
  { value: '9 Jobs Captured',       label: 'Jobs from this activation'    },
  { value: '$6,300 Revenue Generated', label: 'Estimated revenue captured' },
  { value: '1,247 Contacts Reached',  label: 'SMS blast recipients'        },
]

const FORECAST_DAYS = [
  { day: 'TODAY', high: 34, low: 28, condition: 'Cold Snap',      icon: 'snowflake', activate: true  },
  { day: 'TUE',   high: 31, low: 22, condition: 'Freeze Warning', icon: 'snowflake', activate: true  },
  { day: 'WED',   high: 38, low: 26, condition: 'Cold Snap',      icon: 'snowflake', activate: true  },
  { day: 'THU',   high: 45, low: 33, condition: 'Overcast',       icon: 'cloud',     activate: false },
  { day: 'FRI',   high: 52, low: 38, condition: 'Clearing',       icon: 'cloud',     activate: false },
  { day: 'SAT',   high: 61, low: 44, condition: 'Clear',          icon: 'sun',       activate: false },
  { day: 'SUN',   high: 65, low: 47, condition: 'Clear',          icon: 'sun',       activate: false },
]

const FORECAST_TABLE = [
  { date: 'Today',              forecast: 'Cold Snap 28F',      action: 'Activate All Tools',          actionType: 'green', jobs: '8–12 jobs' },
  { date: 'Tuesday',            forecast: 'Freeze Warning 22F', action: 'Activate All Tools',          actionType: 'green', jobs: '10–15 jobs' },
  { date: 'Wednesday',          forecast: 'Cold Snap 38F',      action: 'Activate Google Ads + SMS',   actionType: 'green', jobs: '5–8 jobs' },
  { date: 'Thursday',           forecast: 'Overcast 45F',       action: 'Monitor Only',                actionType: 'amber', jobs: '—' },
  { date: 'Friday – Sunday',    forecast: 'Clear',              action: 'No Action',                   actionType: 'grey',  jobs: '—' },
]

function SnowflakeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"   />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"  />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function WeatherIcon({ type }: { type: string }) {
  if (type === 'snowflake') return <SnowflakeIcon />
  if (type === 'cloud')     return <CloudIcon />
  return <SunIcon />
}

export default function WeatherActivation({ businessName }: Props) {
  const [activeTab,    setActiveTab]    = useState<'activation' | 'forecast'>('activation')
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

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['activation', 'forecast'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: activeTab === tab ? '#111827' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#6b7280',
              transition: 'background-color 0.15s ease, color 0.15s ease',
            }}
          >
            {tab === 'activation' ? 'Activation' : 'Forecast'}
          </button>
        ))}
      </div>

      {/* ── Activation tab ───────────────────────────────────────────────────── */}
      {activeTab === 'activation' && (
        <>
          {/* Weather stats bar */}
          <div style={{ backgroundColor: '#f0f0f0', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {WEATHER_STATS.map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    padding: 16,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: '#6b7280', marginTop: 6,
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active weather event card */}
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

          {/* Impact summary pills */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
          }}>
            {IMPACT_STATS.map((stat) => (
              <div
                key={stat.value}
                style={{
                  backgroundColor: 'rgba(0, 194, 124, 0.08)',
                  border: '1px solid #00C27C',
                  borderRadius: 10,
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00C27C', lineHeight: 1.2 }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: 12, color: '#6b7280', marginTop: 4,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Activation history */}
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

          {/* Service area monitoring */}
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
        </>
      )}

      {/* ── Forecast tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <>
          {/* 7-Day Forecast */}
          <div className="rounded-xl" style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}>
            <div className="px-6 pt-6 pb-6">
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888888', marginBottom: 20 }}>
                7-Day Forecast
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {FORECAST_DAYS.map((day) => (
                  <div
                    key={day.day}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 10,
                      padding: '14px 10px',
                      textAlign: 'center',
                      borderLeft: day.activate ? '3px solid #00C27C' : '3px solid transparent',
                    }}
                  >
                    <div style={{
                      fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: '#6b7280', marginBottom: 10, fontWeight: 600,
                    }}>
                      {day.day}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                      <WeatherIcon type={day.icon} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                      {day.high}F / {day.low}F
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: day.activate ? 4 : 0 }}>
                      {day.condition}
                    </div>
                    {day.activate && (
                      <div style={{ fontSize: 10, color: '#00C27C', fontWeight: 600, marginTop: 2 }}>
                        Activation Recommended
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activation Forecast table */}
          <div className="rounded-xl" style={{ backgroundColor: '#e8e8e8', border: '1px solid #d0d0d0' }}>
            <div className="px-6 pt-6 pb-4">
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888888', marginBottom: 20 }}>
                Activation Forecast
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #d0d0d0' }}>
                      {['Date', 'Forecast', 'Recommended Action', 'Estimated Jobs'].map((h) => (
                        <th key={h} className="text-left pb-3"
                          style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888888', paddingRight: 24, fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FORECAST_TABLE.map((row, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                        <td style={{ fontSize: 14, color: '#444444', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>
                          {row.date}
                        </td>
                        <td style={{ fontSize: 14, color: '#444444', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>
                          {row.forecast}
                        </td>
                        <td style={{ fontSize: 14, fontWeight: 600, paddingRight: 24, paddingTop: 14, paddingBottom: 14,
                          color: row.actionType === 'green' ? '#00C27C'
                               : row.actionType === 'amber' ? '#F59E0B'
                               : '#9ca3af',
                        }}>
                          {row.action}
                        </td>
                        <td style={{ fontSize: 14, color: '#444444', paddingTop: 14, paddingBottom: 14 }}>
                          {row.jobs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
