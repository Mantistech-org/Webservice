'use client'

import { useState, useEffect } from 'react'

interface Props {
  sessionId: string
  businessName?: string
  darkMode?: boolean
}

const SERVICE_AREA = 'Little Rock, AR'

const ITEMS = [
  { label: 'Automated Ads',          description: 'Google Search, Facebook, Instagram',  activatedStatus: 'Active'                 },
  { label: 'Customer Outreach',       description: '1,247 contacts ready',                 activatedStatus: 'Sent to 1,247 contacts' },
  { label: 'Google Business Profile', description: 'Post ready to publish',                activatedStatus: 'Updated'                },
  { label: 'Missed Call Auto-Reply',  description: 'Auto-response configured',             activatedStatus: 'Active'                 },
  { label: 'Website Banner',          description: 'Banner ready to go live',              activatedStatus: 'Live'                   },
]

const ACTIVATION_HISTORY: Array<{ date: string; event: string; jobs: number; revenue: string }> = []

// ── Monthly averages for south region (AR default) ────────────────────────────

type MonthKey = 'jan'|'feb'|'mar'|'apr'|'may'|'jun'|'jul'|'aug'|'sep'|'oct'|'nov'|'dec'

const SOUTH_MONTHLY: Record<MonthKey, { high: number; low: number }> = {
  jan: { high: 52, low: 32 }, feb: { high: 57, low: 36 },
  mar: { high: 65, low: 44 }, apr: { high: 74, low: 53 },
  may: { high: 81, low: 61 }, jun: { high: 88, low: 69 },
  jul: { high: 92, low: 73 }, aug: { high: 91, low: 72 },
  sep: { high: 85, low: 65 }, oct: { high: 74, low: 53 },
  nov: { high: 63, low: 42 }, dec: { high: 54, low: 34 },
}

const MONTH_KEYS: MonthKey[] = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function shouldActivate(highF: number, lowF: number): boolean {
  const avgs = SOUTH_MONTHLY[MONTH_KEYS[new Date().getMonth()] ?? 'jan']
  return lowF <= avgs.low - 15 || highF >= avgs.high + 10
}

// ── Weather API types ─────────────────────────────────────────────────────────

interface WeatherForecastDay {
  date: string
  dayLabel: string
  highF: number
  lowF: number
  condition: string
  precipChance: number
}

interface WeatherData {
  forecast: WeatherForecastDay[]
  trigger: {
    active: boolean
    type: 'cold_snap' | 'heat_wave' | null
    severity: 'moderate' | 'severe' | null
    reason: string | null
  }
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function shortLabel(dayLabel: string): string {
  if (dayLabel === 'Today') return 'TODAY'
  if (dayLabel === 'Tomorrow') return 'TMR'
  return dayLabel.slice(0, 3).toUpperCase()
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Icon components ────────────────────────────────────────────────────────────

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

function RainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="13" x2="16" y2="21" />
      <line x1="8"  y1="13" x2="8"  y2="21" />
      <line x1="12" y1="15" x2="12" y2="23" />
      <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
    </svg>
  )
}

function ThunderIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
      <polyline points="13 11 9 17 15 17 11 23" />
    </svg>
  )
}

function PartlyCloudyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      <circle cx="10" cy="10" r="3" />
      <path d="M20 15h-1.17A4 4 0 108 16.93V17h12a3 3 0 000-6z" />
    </svg>
  )
}

function SunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

function conditionToIconType(condition: string): string {
  const c = condition.toLowerCase()
  if (c.includes('thunder') || c.includes('storm') || c.includes('lightning')) return 'thunder'
  if (c.includes('snow') || c.includes('freez') || c.includes('sleet') || c.includes('ice') || c.includes('blizzard') || c.includes('flurr')) return 'snowflake'
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle') || c.includes('precip')) return 'rain'
  if (c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'cloud'
  if (c.includes('partly') || c.includes('mostly') || c.includes('scattered') || c.includes('cloudy')) return 'partly'
  return 'sun'
}

function WeatherIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type === 'snowflake') return <SnowflakeIcon size={size} />
  if (type === 'rain')      return <RainIcon size={size} />
  if (type === 'thunder')   return <ThunderIcon size={size} />
  if (type === 'cloud')     return <CloudIcon size={size} />
  if (type === 'partly')    return <PartlyCloudyIcon size={size} />
  return <SunIcon size={size} />
}

// ── Chevron SVG ────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width={14} height={14} viewBox="0 0 14 14" fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
    >
      <path d="M3 5l4 4 4-4" stroke="#6b7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

// ── Tool accordion panel content ───────────────────────────────────────────────

function AutomatedAdsPanel({ adDuration, setAdDuration, onConfirm }: { adDuration: number; setAdDuration: (v: number) => void; onConfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 3 }}>Emergency HVAC Service Available Now</div>
        <div style={{ fontSize: 11, color: '#00C27C', marginBottom: 4 }}>mantistech.org/hvac-service</div>
        <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>Cold snap hitting tonight. Techs standing by for emergency heating repairs. Call now or book online.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {[
          { label: 'Google Search', checked: true  },
          { label: 'Facebook',      checked: true  },
          { label: 'Instagram',     checked: false },
        ].map(({ label, checked }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              backgroundColor: checked ? '#00C27C' : 'transparent',
              border: checked ? 'none' : '1.5px solid #6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {checked && <CheckmarkSvg size={8} color="white" />}
            </div>
            <span style={{ fontSize: 12, color: '#ffffff' }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ v: 1, label: '1 Day' }, { v: 2, label: '2 Days' }, { v: 3, label: '3 Days' }, { v: 5, label: '5 Days' }].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setAdDuration(v)}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
              backgroundColor: adDuration === v ? '#00C27C' : 'rgba(255,255,255,0.1)',
              color: adDuration === v ? '#ffffff' : '#9ca3af',
              fontWeight: adDuration === v ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onConfirm} style={{ width: 'auto', alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Confirm Automated Ads
        </button>
      </div>
    </div>
  )
}

function CustomerOutreachPanel({ businessName, onConfirm }: { businessName: string; onConfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ backgroundColor: '#00C27C', color: '#ffffff', fontSize: 12, borderRadius: 10, padding: 10, maxWidth: '85%', lineHeight: 1.4 }}>
          Hi, this is {businessName}. Cold snap hitting tonight, temps dropping to 28F. We have emergency availability. Reply STOP to opt out.
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>161 characters</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Send Now', 'Schedule 6 AM'].map((label, idx) => (
          <button key={label} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            backgroundColor: idx === 0 ? '#00C27C' : 'rgba(255,255,255,0.1)',
            color: idx === 0 ? '#ffffff' : '#9ca3af',
            fontWeight: idx === 0 ? 600 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onConfirm} style={{ width: 'auto', alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Confirm Customer Outreach
        </button>
      </div>
    </div>
  )
}

function GBPPanel({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>Your HVAC Business</div>
        <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4, marginBottom: 8 }}>
          Cold snap warning: Temps dropping to 28F. Emergency heating availability. Call now or book online. Stay warm.
        </div>
        <div style={{ display: 'inline-flex', fontSize: 10, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 4, padding: '3px 8px' }}>
          Emergency Hours
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onConfirm} style={{ width: 'auto', alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Confirm Business Profile
        </button>
      </div>
    </div>
  )
}

function MissedCallPanel({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ backgroundColor: '#00C27C', color: '#ffffff', fontSize: 12, borderRadius: 10, padding: 10, maxWidth: '85%', lineHeight: 1.4 }}>
          Hi, you reached [Business Name]. We missed your call but we are on it. Emergency heating availability tonight. Book here: mantistech.org/book
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Active', 'Inactive'].map((label, idx) => (
          <button key={label} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            backgroundColor: idx === 0 ? '#00C27C' : 'rgba(255,255,255,0.1)',
            color: idx === 0 ? '#ffffff' : '#9ca3af',
            fontWeight: idx === 0 ? 600 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onConfirm} style={{ width: 'auto', alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Confirm Auto-Reply
        </button>
      </div>
    </div>
  )
}

function WebsiteBannerPanel({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        backgroundColor: 'rgba(0,194,124,0.1)',
        border: '1px solid rgba(0,194,124,0.3)',
        borderRadius: 8, padding: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{ fontSize: 12, color: '#ffffff', flex: 1, lineHeight: 1.4 }}>
          Cold snap alert: Emergency heating service available now. Call or book online.
        </span>
        <div style={{ fontSize: 10, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap' }}>
          Book Now
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Visible', 'Hidden'].map((label, idx) => (
          <button key={label} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 4, border: 'none', cursor: 'pointer',
            backgroundColor: idx === 0 ? '#00C27C' : 'rgba(255,255,255,0.1)',
            color: idx === 0 ? '#ffffff' : '#9ca3af',
            fontWeight: idx === 0 ? 600 : 400,
          }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onConfirm} style={{ width: 'auto', alignSelf: 'flex-end', padding: '8px 16px', fontSize: 13, backgroundColor: '#00C27C', color: '#ffffff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
          Confirm Website Banner
        </button>
      </div>
    </div>
  )
}

// Suppress unused-variable warnings for panel components reserved for future use
void AutomatedAdsPanel
void CustomerOutreachPanel
void GBPPanel
void MissedCallPanel
void WebsiteBannerPanel
void ChevronIcon

// ── Main component ─────────────────────────────────────────────────────────────

const WEATHER_LOCATION = SERVICE_AREA

export default function WeatherActivation({ businessName: _businessName }: Props) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/weather?location=${encodeURIComponent(WEATHER_LOCATION)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WeatherData | null) => {
        setWeatherData(data)
        setWeatherLoading(false)
      })
      .catch(() => setWeatherLoading(false))
  }, [])

  const trigger = weatherData?.trigger
  const forecast = weatherData?.forecast ?? []
  const isEventActive = trigger?.active === true

  const eventTitle = trigger?.type === 'heat_wave' ? 'Heat Wave Detected' : 'Cold Snap Detected'
  const eventDotColor = trigger?.severity === 'severe' ? '#ef4444' : '#f59e0b'
  const eventLabelColor = trigger?.severity === 'severe' ? '#ef4444' : '#f59e0b'
  const severityLabel = trigger?.severity === 'severe' ? 'Severe' : 'Moderate'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Section 1: 5-day forecast row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {weatherLoading ? (
          // Loading skeleton — 5 placeholder cards
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.08)',
                padding: 12,
                minHeight: 130,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <div style={{ width: 32, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, marginBottom: 6 }} />
              <div style={{ width: 24, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4 }} />
            </div>
          ))
        ) : forecast.length > 0 ? (
          forecast.slice(0, 5).map((day) => {
            const activate = shouldActivate(day.highF, day.lowF)
            const iconType = conditionToIconType(day.condition)
            const isColdActivate = activate && day.lowF < day.highF - 10
            return (
              <div
                key={day.date}
                style={{
                  backgroundColor: activate ? 'rgba(0,194,124,0.04)' : '#ffffff',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderLeft: activate ? '3px solid #00C27C' : '1px solid rgba(0,0,0,0.08)',
                  padding: 12,
                  textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', marginBottom: 1, fontWeight: 600 }}>
                  {shortLabel(day.dayLabel)}
                </div>
                <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6 }}>
                  {formatDate(day.date)}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <WeatherIcon type={iconType} size={20} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                  {day.highF}F / {day.lowF}F
                </div>
                <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 6 }}>
                  {day.condition}
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6, width: '100%', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>{isColdActivate ? "Tonight's Low" : 'High'}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                      {isColdActivate ? `${day.lowF}F` : `${day.highF}F`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#4b5563' }}>Precip</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                      {day.precipChance}%
                    </span>
                  </div>
                </div>
                {activate && (
                  <div style={{ fontSize: 10, color: '#00C27C', fontWeight: 600, backgroundColor: 'rgba(0,194,124,0.12)', borderRadius: 999, padding: '2px 6px', whiteSpace: 'nowrap', marginTop: 6 }}>
                    Activation Recommended
                  </div>
                )}
              </div>
            )
          })
        ) : (
          // No data — show a single message spanning the grid
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '24px 0' }}>
            Forecast unavailable
          </div>
        )}
      </div>

      {/* ── Section 2: Monitoring / event card ── */}
      <div style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 24 }}>

        {weatherLoading ? (
          // Loading state
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4b5563', flexShrink: 0 }} />
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', fontWeight: 600 }}>
                Checking
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
              Fetching live weather data for your service area...
            </div>
          </>
        ) : isEventActive ? (
          // ── Weather event active ──
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: eventDotColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: eventLabelColor, fontWeight: 600 }}>
                Weather Event Active
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
              {eventTitle}
            </div>

            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 600,
                color: eventLabelColor,
                border: `1px solid ${eventLabelColor}`,
                borderRadius: 4,
                padding: '2px 8px',
                letterSpacing: '0.05em',
              }}>
                {severityLabel}
              </span>
            </div>

            {trigger?.reason && (
              <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 1.5 }}>
                {trigger.reason}
              </div>
            )}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }} />

            {/* Tool rows showing what will activate */}
            <div style={{ marginBottom: 24 }}>
              {ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 12, paddingBottom: 12,
                  borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: 'rgba(0,194,124,0.15)',
                      border: '1.5px solid #00C27C',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#00C27C' }}>Ready</span>
                </div>
              ))}
            </div>

            <button
              style={{
                display: 'block', width: '100%', textAlign: 'center',
                backgroundColor: '#00C27C', border: 'none', color: '#ffffff',
                fontSize: 14, fontWeight: 700, padding: '12px 0', borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Activate All Tools
            </button>
          </>
        ) : (
          // ── All Clear / monitoring state ──
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6b7280', flexShrink: 0 }} />
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
                Monitoring Your Area
              </span>
            </div>

            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.5 }}>
              No weather triggers detected. Your platform will activate automatically when conditions are met.
            </div>

            <div>
              {ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, paddingBottom: 14,
                  borderBottom: i < ITEMS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '1.5px solid #6b7280',
                      flexShrink: 0,
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Standby</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Section 3: Activation History ── */}
      <div>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', fontWeight: 600, marginBottom: 12 }}>
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
                {ACTIVATION_HISTORY.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingTop: 20, paddingBottom: 20 }}>
                      No activations yet
                    </td>
                  </tr>
                ) : ACTIVATION_HISTORY.map((row, i) => (
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
