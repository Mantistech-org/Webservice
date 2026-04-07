'use client'

import { useState, useEffect } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ITEMS = [
  { label: 'Automated Ads',          activatedStatus: 'Active',                 desc: 'Campaign running in your service area.'     },
  { label: 'Customer Outreach',       activatedStatus: 'Sent to 1,247 contacts', desc: 'Sent to 1,247 contacts at 11:47 PM.'        },
  { label: 'Google Business Profile', activatedStatus: 'Updated',                desc: 'Emergency availability post published.'     },
  { label: 'Missed Call Auto-Reply',  activatedStatus: 'Active',                 desc: 'Responding to all missed calls instantly.'  },
  { label: 'Website Banner',          activatedStatus: 'Live',                   desc: 'Showing emergency availability message.'    },
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

// ── Icon components ──────────────────────────────────────────────────────────

function SnowflakeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function CloudIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  )
}

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function WeatherIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type === 'snowflake') return <SnowflakeIcon size={size} />
  if (type === 'cloud')     return <CloudIcon size={size} />
  return <SunIcon size={size} />
}

// ── Forecast cards ────────────────────────────────────────────────────────────

function ForecastCard({ day }: { day: typeof FORECAST_DAYS[number] }) {
  const details = DAY_DETAILS[day.day]
  return (
    <div style={{
      backgroundColor: day.activate ? 'rgba(0,194,124,0.04)' : '#ffffff',
      borderRadius: 12, padding: 16, textAlign: 'center',
      border: '1px solid rgba(0,0,0,0.06)',
      borderLeft: day.activate ? '3px solid #00C27C' : '1px solid rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', marginBottom: 1, fontWeight: 600 }}>{day.day}</div>
      <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8 }}>{day.date}</div>
      <div style={{ marginBottom: 8 }}><WeatherIcon type={day.icon} size={24} /></div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 3 }}>{day.high}F / {day.low}F</div>
      <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 6 }}>{day.condition}</div>
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6, textAlign: 'left', width: '100%' }}>
        {details.map((stat) => (
          <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: '#4b5563' }}>{stat.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{stat.value}</span>
          </div>
        ))}
      </div>
      {day.activate && (
        <div style={{ fontSize: 11, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 999, padding: '2px 6px', whiteSpace: 'nowrap', marginTop: 6 }}>
          Activation Recommended
        </div>
      )}
    </div>
  )
}

// ── Shared panel UI helpers ───────────────────────────────────────────────────

const panelLabel: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
  color: '#9ca3af', fontWeight: 600, marginBottom: 10,
}

function PillGroup({ options, value, onChange }: {
  options: { label: string; value: string | number }[]
  value: string | number
  onChange: (v: string | number) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 6, border: 'none',
            cursor: 'pointer',
            backgroundColor: value === opt.value ? '#00C27C' : 'rgba(255,255,255,0.08)',
            color: value === opt.value ? '#ffffff' : '#9ca3af',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SmsBubble({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
      <div style={{
        backgroundColor: '#00C27C',
        borderRadius: '12px 12px 2px 12px',
        padding: '10px 14px',
        maxWidth: '90%',
      }}>
        <p style={{ fontSize: 13, color: '#ffffff', margin: 0, lineHeight: 1.5 }}>{message}</p>
      </div>
    </div>
  )
}

// ── Accordion panel components ────────────────────────────────────────────────

function AutomatedAdsPanel() {
  const [platforms, setPlatforms] = useState({ google: true, facebook: true, instagram: false })
  const [duration, setDuration]   = useState<number>(3)
  const [budget, setBudget]       = useState('$25')

  const togglePlatform = (key: keyof typeof platforms) =>
    setPlatforms(prev => ({ ...prev, [key]: !prev[key] }))

  const CheckBox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <div style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        backgroundColor: checked ? '#00C27C' : 'transparent',
        border: checked ? 'none' : '1.5px solid #4b5563',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, color: '#ffffff' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={panelLabel}>Ad Preview</div>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Emergency HVAC Service Available Now</div>
        <div style={{ fontSize: 12, color: '#00C27C', marginBottom: 6 }}>mantistech.org/hvac-service</div>
        <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Cold snap hitting tonight. Our techs are standing by for emergency heating repairs. Call now or book online.</div>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div style={panelLabel}>Post To</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CheckBox label="Google Search" checked={platforms.google}    onChange={() => togglePlatform('google')} />
            <CheckBox label="Facebook"      checked={platforms.facebook}  onChange={() => togglePlatform('facebook')} />
            <CheckBox label="Instagram"     checked={platforms.instagram} onChange={() => togglePlatform('instagram')} />
          </div>
        </div>
        <div>
          <div style={panelLabel}>Duration</div>
          <PillGroup
            options={[{ label: '1 Day', value: 1 }, { label: '2 Days', value: 2 }, { label: '3 Days', value: 3 }, { label: '5 Days', value: 5 }]}
            value={duration}
            onChange={(v) => setDuration(v as number)}
          />
        </div>
      </div>

      <div>
        <div style={panelLabel}>Daily Budget</div>
        <input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '7px 12px', fontSize: 14, textAlign: 'right', width: 100,
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

function CustomerOutreachPanel({ businessName }: { businessName: string }) {
  const [timing, setTiming] = useState<'now' | 'schedule'>('now')
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={panelLabel}>Message Preview</div>
      <SmsBubble message={`Hi, this is ${businessName} with Mantis Tech. A cold snap is hitting your area tonight with temps dropping to 28F. If your heating system needs attention, we have emergency availability. Reply STOP to opt out.`} />
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 14 }}>161 characters</div>
      <div style={panelLabel}>Send Timing</div>
      <PillGroup
        options={[{ label: 'Send Now', value: 'now' }, { label: 'Schedule 6 AM', value: 'schedule' }]}
        value={timing}
        onChange={(v) => setTiming(v as 'now' | 'schedule')}
      />
    </div>
  )
}

function GBPPanel() {
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={panelLabel}>Post Preview</div>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>Your HVAC Business</div>
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 10px 0', lineHeight: 1.5 }}>
          Cold snap warning: Temps dropping to 28F tonight. We have emergency heating availability. Call us now or book online for same-day service. Stay warm.
        </p>
        <div style={{ display: 'inline-flex', fontSize: 11, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.15)', borderRadius: 999, padding: '3px 10px' }}>
          Emergency Hours
        </div>
      </div>
    </div>
  )
}

function MissedCallPanel() {
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={panelLabel}>Auto-Reply Preview</div>
      <SmsBubble message="Hi, you reached [Business Name]. We just missed your call but we are on it. We have emergency heating availability tonight. Click here to book: mantistech.org/book" />
      <div style={{ marginTop: 14 }}>
        <div style={panelLabel}>Status</div>
        <PillGroup
          options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
          value={status}
          onChange={(v) => setStatus(v as 'active' | 'inactive')}
        />
      </div>
    </div>
  )
}

function WebsiteBannerPanel() {
  const [visibility, setVisibility] = useState<'visible' | 'hidden'>('visible')
  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 12 }}>
      <div style={panelLabel}>Banner Preview</div>
      <div style={{
        backgroundColor: 'rgba(0,194,124,0.15)',
        border: '1px solid rgba(0,194,124,0.3)',
        borderRadius: 8, padding: 12, marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <span style={{ fontSize: 13, color: '#ffffff', flex: 1, lineHeight: 1.5 }}>
          Cold snap alert: Emergency heating service available now. Call or book online.
        </span>
        <button style={{ backgroundColor: '#00C27C', color: '#ffffff', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Book Now
        </button>
      </div>
      <div style={panelLabel}>Show Banner</div>
      <PillGroup
        options={[{ label: 'Visible', value: 'visible' }, { label: 'Hidden', value: 'hidden' }]}
        value={visibility}
        onChange={(v) => setVisibility(v as 'visible' | 'hidden')}
      />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeatherActivation({ businessName = 'Your Business' }: Props) {
  const [activated,     setActivated]     = useState(false)
  const [activating,    setActivating]    = useState(false)
  const [checkedCount,  setCheckedCount]  = useState(0)
  const [animatingIdx,  setAnimatingIdx]  = useState<number | null>(null)
  const [sequenceDone,  setSequenceDone]  = useState(false)
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set())

  const collapsePanel = (i: number) =>
    setExpandedTools(prev => { const next = new Set(prev); next.delete(i); return next })

  const runSequence = () => {
    setActivated(true)
    setActivating(true)
    const DELAYS = [0, 600, 1200, 1800, 2400]
    DELAYS.forEach((delay, i) => {
      setTimeout(() => {
        setAnimatingIdx(i)
        collapsePanel(i)
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

  const toggleTool = (i: number) =>
    setExpandedTools(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const subline = sequenceDone
    ? 'Activation triggered at 11:47 PM.'
    : 'Your platform is ready to activate. All 5 tools are standing by.'

  const todayDetails = DAY_DETAILS['TODAY']
  const remainingDays = FORECAST_DAYS.slice(1)

  return (
    <div>

      {/* ── TOP SECTION: two columns, both size to content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Left column — activation panel only, stretches to match right column height */}
        <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>

          <div style={{ marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: 0, marginBottom: 6 }}>
              Weather Activation System
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Automated campaign deployment triggered by real-time weather events.
            </p>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', borderRadius: 12, borderTop: '3px solid #00C27C', overflow: 'hidden', flex: 1 }}>
            <div style={{ padding: '24px 24px 8px 24px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0 }} />
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00C27C' }}>
                  Active Weather Event
                </span>
              </div>

              <div style={{ fontSize: 18, fontWeight: 600, color: '#ffffff', marginBottom: 8, lineHeight: 1.4 }}>
                Cold snap detected. 28F forecast tonight in your service area.
              </div>

              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>{subline}</p>

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
            <div style={{ padding: '8px 24px 24px 24px' }}>
              {ITEMS.map((item, i) => {
                const isChecked   = checkedCount > i
                const isAnimating = animatingIdx === i
                const isOpen      = expandedTools.has(i)

                return (
                  <div key={i} style={{ borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                    {/* Row */}
                    <div
                      onClick={() => { if (!activated) toggleTool(i) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        paddingTop: 14, paddingBottom: 14,
                        cursor: activated ? 'default' : 'pointer',
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
                            <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>

                      {/* Label + status */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isChecked ? '#00aa55' : '#6b7280' }}>
                              {isChecked ? item.activatedStatus : 'Ready'}
                            </span>
                            {/* Chevron — only in unactivated state */}
                            {!activated && (
                              <svg
                                width="12" height="12" viewBox="0 0 12 12" fill="none"
                                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease', flexShrink: 0 }}
                              >
                                <path d="M2 4L6 8L10 4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                        {isChecked && (
                          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, marginBottom: 0 }}>{item.desc}</p>
                        )}
                      </div>
                    </div>

                    {/* Accordion panel — unactivated state only */}
                    {!activated && (
                      <div style={{ overflow: 'hidden', maxHeight: isOpen ? '600px' : '0', transition: 'max-height 250ms ease', marginBottom: isOpen ? 12 : 0 }}>
                        {i === 0 && <AutomatedAdsPanel />}
                        {i === 1 && <CustomerOutreachPanel businessName={businessName} />}
                        {i === 2 && <GBPPanel />}
                        {i === 3 && <MissedCallPanel />}
                        {i === 4 && <WebsiteBannerPanel />}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right column — forecast cards only, sizes to content */}
        <div style={{ alignSelf: 'start' }}>

          {/* TODAY hero card */}
          <div style={{
            backgroundColor: 'rgba(0,194,124,0.04)',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.06)',
            borderLeft: '3px solid #00C27C',
            display: 'flex',
            overflow: 'hidden',
            marginBottom: 8,
          }}>
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600, marginBottom: 2 }}>TODAY</div>
              <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 14 }}>Apr 6</div>
              <div style={{ marginBottom: 12 }}><WeatherIcon type="snowflake" size={36} /></div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#111827', marginBottom: 4 }}>34F / 28F</div>
              <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>Cold Snap</div>
              <div style={{ display: 'inline-flex', fontSize: 11, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 999, padding: '3px 10px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
                Activation Recommended
              </div>
            </div>

            <div style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {todayDetails.map((stat, i) => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: i < todayDetails.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#4b5563' }}>{stat.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TUE–SUN: two rows of three */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {remainingDays.map((day) => (
              <ForecastCard key={day.day} day={day} />
            ))}
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: full width, below both columns ── */}
      <div style={{ marginTop: 24 }}>

        {/* Activation History */}
        <div style={{ marginBottom: sequenceDone ? 24 : 0 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#374151', fontWeight: 600, marginBottom: 12 }}>
            Activation History
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Date', 'Event Type', 'Jobs Captured', 'Revenue Estimated'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', paddingTop: 16, paddingBottom: 12, paddingRight: 24, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACTIVATION_HISTORY.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < ACTIVATION_HISTORY.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                      <td style={{ fontSize: 14, color: '#374151', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.date}</td>
                      <td style={{ fontSize: 14, color: '#374151', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.event}</td>
                      <td style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', paddingRight: 24, paddingTop: 14, paddingBottom: 14 }}>{row.jobs}</td>
                      <td style={{ fontSize: 14, fontWeight: 600, color: '#00aa55', paddingTop: 14, paddingBottom: 14 }}>{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Impact pills — only shown after full 3000ms sequence completes */}
        {sequenceDone && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {IMPACT_STATS.map((stat) => (
              <div key={stat.value} style={{ backgroundColor: 'rgba(0,194,124,0.08)', border: '1px solid rgba(0,194,124,0.3)', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#00C27C', lineHeight: 1.3 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  )
}
