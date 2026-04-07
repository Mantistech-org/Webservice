'use client'

import { useState } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const ITEMS = [
  { label: 'Automated Ads',          activatedStatus: 'Active'                 },
  { label: 'Customer Outreach',       activatedStatus: 'Sent to 1,247 contacts' },
  { label: 'Google Business Profile', activatedStatus: 'Updated'                },
  { label: 'Missed Call Auto-Reply',  activatedStatus: 'Active'                 },
  { label: 'Website Banner',          activatedStatus: 'Live'                   },
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

// ── Icon components ───────────────────────────────────────────────────────────

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

// ── Forecast card ─────────────────────────────────────────────────────────────

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
      <div style={{ fontSize: 16, fontWeight: 600, color: '#0a0a0a', marginBottom: 3 }}>{day.high}F / {day.low}F</div>
      <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 6 }}>{day.condition}</div>
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6, textAlign: 'left', width: '100%' }}>
        {details.map((stat) => (
          <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: '#4b5563' }}>{stat.label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#0a0a0a' }}>{stat.value}</span>
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

// ── Tool card preview components ──────────────────────────────────────────────

function AutomatedAdsPreview({ adDuration, setAdDuration }: { adDuration: number; setAdDuration: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', marginBottom: 3 }}>Emergency HVAC Service Available Now</div>
        <div style={{ fontSize: 11, color: '#00C27C', marginBottom: 4 }}>mantistech.org/hvac-service</div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>Cold snap hitting tonight. Techs standing by for emergency heating repairs.</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[{ v: 1, label: '1 Day' }, { v: 2, label: '2 Days' }, { v: 3, label: '3 Days' }, { v: 5, label: '5 Days' }].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setAdDuration(v)}
            style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
              backgroundColor: adDuration === v ? '#00C27C' : 'rgba(0,0,0,0.06)',
              color: adDuration === v ? '#ffffff' : '#6b7280',
              fontWeight: adDuration === v ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CustomerOutreachPreview({ businessName }: { businessName: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ backgroundColor: '#00C27C', color: '#ffffff', fontSize: 11, borderRadius: 10, padding: 10, maxWidth: '90%', lineHeight: 1.4 }}>
          Hi, this is {businessName}. Cold snap hitting tonight, temps dropping to 28F. We have emergency availability. Reply STOP to opt out.
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>161 characters</div>
    </div>
  )
}

function GBPPreview() {
  return (
    <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', marginBottom: 4 }}>Your HVAC Business</div>
      <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4, marginBottom: 8 }}>
        Cold snap warning: Temps dropping to 28F. Emergency heating availability, call now or book online.
      </div>
      <div style={{ display: 'inline-flex', fontSize: 10, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 4, padding: '3px 8px' }}>
        Emergency Hours
      </div>
    </div>
  )
}

function MissedCallPreview() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
      <div style={{ backgroundColor: '#00C27C', color: '#ffffff', fontSize: 11, borderRadius: 10, padding: 10, maxWidth: '90%', lineHeight: 1.4 }}>
        Hi, you reached [Business Name]. We missed your call but we are on it. Emergency heating availability tonight. Book here: mantistech.org/book
      </div>
    </div>
  )
}

function WebsiteBannerPreview() {
  return (
    <div style={{
      backgroundColor: 'rgba(0,194,124,0.1)',
      border: '1px solid rgba(0,194,124,0.3)',
      borderRadius: 8, padding: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      flex: 1,
    }}>
      <span style={{ fontSize: 11, color: '#0a0a0a', flex: 1, lineHeight: 1.4 }}>
        Cold snap alert: Emergency heating service available now.
      </span>
      <div style={{ fontSize: 10, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap' }}>
        Book Now
      </div>
    </div>
  )
}

// ── Checkmark SVG ─────────────────────────────────────────────────────────────

function CheckmarkSvg({ size = 10, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 10 8" fill="none">
      <path d="M1 4L3.5 6.5L9 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeatherActivation({ businessName = 'Your Business' }: Props) {
  const [checkedItems,    setCheckedItems]    = useState<Set<number>>(new Set())
  const [animatingIdx,    setAnimatingIdx]    = useState<number | null>(null)
  const [sequenceRunning, setSequenceRunning] = useState(false)
  const [includedTools,   setIncludedTools]   = useState<Set<number>>(new Set([0, 1, 2, 3, 4]))
  const [adDuration,      setAdDuration]      = useState(3)

  const allDone = includedTools.size > 0 && [...includedTools].every(i => checkedItems.has(i))

  const toggleInclude = (i: number) =>
    setIncludedTools(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const runSequence = () => {
    if (sequenceRunning) return
    setSequenceRunning(true)
    const toActivate = [0, 1, 2, 3, 4].filter(i => includedTools.has(i))
    toActivate.forEach((toolIdx, position) => {
      setTimeout(() => {
        setAnimatingIdx(toolIdx)
        setTimeout(() => {
          setCheckedItems(prev => new Set(prev).add(toolIdx))
          setAnimatingIdx(null)
        }, 200)
      }, position * 600)
    })
    const duration = toActivate.length > 0 ? (toActivate.length - 1) * 600 + 400 : 200
    setTimeout(() => setSequenceRunning(false), duration)
  }

  const todayDetails = DAY_DETAILS['TODAY']
  const remainingDays = FORECAST_DAYS.slice(1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Section 1: Weather context bar ── */}
      <div style={{
        backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0 }} />
            <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00C27C', fontWeight: 600 }}>
              Active Weather Event
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
            Cold snap detected. 28F forecast tonight in your service area.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {['28F Tonight', '3 Day Event', '87% Humidity'].map(pill => (
            <div key={pill} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#ffffff', fontSize: 13, borderRadius: 6, padding: '8px 12px', whiteSpace: 'nowrap' }}>
              {pill}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Five tool cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {ITEMS.map((item, i) => {
          const isChecked   = checkedItems.has(i)
          const isAnimating = animatingIdx === i
          const isIncluded  = includedTools.has(i)

          return (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                border: isAnimating ? '2px solid #00C27C' : '1px solid rgba(0,0,0,0.08)',
                padding: 16,
                display: 'flex', flexDirection: 'column', gap: 12,
                position: 'relative',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Green checkmark badge — shown after activation */}
              {isChecked && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: '#00b857',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckmarkSvg size={10} color="white" />
                </div>
              )}

              {/* Tool name */}
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a', paddingRight: isChecked ? 24 : 0 }}>
                {item.label}
              </div>

              {/* Status pill */}
              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: '#00C27C', backgroundColor: 'rgba(0,194,124,0.1)', borderRadius: 4, padding: '4px 8px' }}>
                {isChecked ? item.activatedStatus : 'Ready'}
              </div>

              {/* Preview content */}
              {i === 0 && <AutomatedAdsPreview adDuration={adDuration} setAdDuration={setAdDuration} />}
              {i === 1 && <CustomerOutreachPreview businessName={businessName} />}
              {i === 2 && <GBPPreview />}
              {i === 3 && <MissedCallPreview />}
              {i === 4 && <WebsiteBannerPreview />}

              {/* Include in activation toggle */}
              <div
                onClick={() => toggleInclude(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 'auto' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                  backgroundColor: isIncluded ? '#00C27C' : 'transparent',
                  border: isIncluded ? 'none' : '1.5px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isIncluded && <CheckmarkSvg size={10} color="white" />}
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Include in activation</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Section 3: Activate All Tools button ── */}
      {!allDone && (
        <button
          onClick={runSequence}
          disabled={sequenceRunning}
          style={{
            width: '100%',
            backgroundColor: '#00C27C', color: '#ffffff',
            fontWeight: 600, fontSize: 14, padding: 16,
            borderRadius: 12, border: 'none',
            cursor: sequenceRunning ? 'default' : 'pointer',
            opacity: sequenceRunning ? 0.75 : 1,
          }}
        >
          {sequenceRunning ? 'Activating...' : 'Activate All Tools'}
        </button>
      )}

      {/* ── Section 4: Impact stats — shown only after all included tools confirm ── */}
      {allDone && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {IMPACT_STATS.map((stat) => (
            <div key={stat.value} style={{ backgroundColor: 'rgba(0,194,124,0.08)', border: '1px solid rgba(0,194,124,0.3)', borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#00C27C', lineHeight: 1.3 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section 5: Forecast cards ── */}
      <div>
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
            <div style={{ fontSize: 22, fontWeight: 600, color: '#0a0a0a', marginBottom: 4 }}>34F / 28F</div>
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
                <span style={{ fontSize: 14, fontWeight: 500, color: '#0a0a0a' }}>{stat.value}</span>
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

      {/* ── Section 6: Activation History ── */}
      <div>
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

    </div>
  )
}
