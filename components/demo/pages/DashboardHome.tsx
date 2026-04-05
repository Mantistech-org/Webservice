'use client'

import { useState, useEffect, useRef } from 'react'

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

// 11 job dots — pixel coords for SVG fallback (600×400 viewBox)
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

// 11 job dots — real lat/lng for Google Maps Circle overlays
// 6 in Midtown, 5 in Hillcrest
const JOB_LATLNGS = [
  { lat: 34.7420, lng: -92.3320 },
  { lat: 34.7435, lng: -92.3290 },
  { lat: 34.7410, lng: -92.3350 },
  { lat: 34.7450, lng: -92.3310 },
  { lat: 34.7425, lng: -92.3270 },
  { lat: 34.7445, lng: -92.3340 },
  { lat: 34.7530, lng: -92.3190 },
  { lat: 34.7515, lng: -92.3210 },
  { lat: 34.7545, lng: -92.3175 },
  { lat: 34.7500, lng: -92.3230 },
  { lat: 34.7560, lng: -92.3155 },
]

// ── Google Maps dark style (command-center night mode) ─────────────────────────
// Strictly neutral grey palette — every value has R=G=B so blue channel
// is never dominant. Approved values only: #1c1c1c #111111 #2a2a2a #3a3a3a #888888
const DARK_MAP_STYLE = [
  { elementType: 'geometry',                                           stylers: [{ color: '#1c1c1c' }] },
  { elementType: 'labels.text.fill',                                   stylers: [{ color: '#888888' }] },
  { elementType: 'labels.text.stroke',                                 stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'administrative',    elementType: 'geometry',         stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'administrative',    elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'landscape',         elementType: 'geometry',         stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'poi',               elementType: 'geometry',         stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'poi',               elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'road',              elementType: 'geometry',         stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road',              elementType: 'geometry.stroke',  stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'road',              elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'road.highway',      elementType: 'geometry',         stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'road.highway',      elementType: 'geometry.stroke',  stylers: [{ color: '#3a3a3a' }] },
  { featureType: 'road.highway',      elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'transit',           elementType: 'geometry',         stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'transit',           elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
  { featureType: 'water',             elementType: 'geometry',         stylers: [{ color: '#111111' }] },
  { featureType: 'water',             elementType: 'labels.text.fill', stylers: [{ color: '#888888' }] },
]

function CityMap() {
  const W = 600
  const H = 400
  const SAX = 265, SAY = 195, SAR = 132
  const mapDivRef = useRef<HTMLDivElement>(null)
  // null = still fetching; '' = no key found; 'abc...' = key ready
  const [apiKey, setApiKey] = useState<string | null>(null)

  // Fetch key from Supabase via server route on mount
  useEffect(() => {
    fetch('/api/demo/maps-key')
      .then((r) => (r.ok ? r.json() : { key: '' }))
      .then((data) => setApiKey(data.key ?? ''))
      .catch(() => setApiKey(''))
  }, [])

  // Load and initialise Google Maps once key is available
  useEffect(() => {
    if (!apiKey || !mapDivRef.current) return

    const initMap = () => {
      if (!mapDivRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gm = (window as any).google.maps

      const map = new gm.Map(mapDivRef.current, {
        center: { lat: 34.7465, lng: -92.2896 },
        zoom: 12,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        styles: DARK_MAP_STYLE,
      })

      // Service area circle — attached to map, moves with pan/zoom
      new gm.Circle({
        map,
        center: { lat: 34.7465, lng: -92.2896 },
        radius: 15000,
        fillColor: '#00ff88',
        fillOpacity: 0,
        strokeColor: '#00ff88',
        strokeOpacity: 1.0,
        strokeWeight: 1,
        clickable: false,
      })

      // Solid green job dots — attached to map, move with pan/zoom
      JOB_LATLNGS.forEach((pos) => {
        new gm.Circle({
          map,
          center: pos,
          radius: 300,
          fillColor: '#00C27C',
          fillOpacity: 1,
          strokeOpacity: 0,
          strokeWeight: 0,
          clickable: false,
        })
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps) { initMap(); return }

    const scriptId = 'google-maps-script'
    if (document.getElementById(scriptId)) {
      const poll = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).google?.maps) { clearInterval(poll); initMap() }
      }, 100)
      return () => clearInterval(poll)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)
  }, [apiKey])

  // Cold snap pill — absolute HTML, informational label not a geographic marker
  const coldSnapPill = (
    <div style={{
      position: 'absolute', bottom: 12, right: 12,
      backgroundColor: 'rgba(0,0,0,0.62)', borderRadius: 20,
      padding: '6px 12px', pointerEvents: 'none',
    }}>
      <span style={{ color: '#ffffff', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
        Cold snap active — 28F tonight
      </span>
    </div>
  )

  // SVG overlays used in fallback/loading states (service area, job dots, cold tint)
  const fallbackOverlay = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <circle cx={SAX} cy={SAY} r={SAR} fill="rgba(0,255,136,0.15)" stroke="rgba(0,255,136,0.60)" strokeWidth="2" />
      {JOB_DOTS.map((dot, i) => (
        <g key={i}>
          <circle cx={dot.cx} cy={dot.cy} r={6} fill="none" stroke="#00ff88" strokeWidth="1.5"
            style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: `jobRipple 3s ease-out ${dot.delay}s infinite` }} />
          <circle cx={dot.cx} cy={dot.cy} r={4} fill="#00ff88" />
        </g>
      ))}
      <rect width={W} height={H} fill="rgba(59,130,246,0.12)" />
    </svg>
  )

  // No key — dark SVG simulated map fallback
  if (apiKey === '') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice">
          <rect width={W} height={H} fill="#1e1e1e" />
          {[28, 72, 116, 160, 204, 248, 292, 336, 380].map((y) => (
            <line key={`mh${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#2a2a2a" strokeWidth="0.8" />
          ))}
          {[24, 70, 116, 162, 208, 254, 300, 346, 392, 438, 484, 530, 576].map((x) => (
            <line key={`mv${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#2a2a2a" strokeWidth="0.8" />
          ))}
          {[116, 292].map((y) => (
            <line key={`ah${y}`} x1={0} y1={y} x2={W} y2={y} stroke="#333333" strokeWidth="2.5" />
          ))}
          {[162, 392].map((x) => (
            <line key={`av${x}`} x1={x} y1={0} x2={x} y2={H} stroke="#333333" strokeWidth="2.5" />
          ))}
          <line x1={0} y1={55} x2={W} y2={310} stroke="#2c2c2c" strokeWidth="5" />
          <line x1={0} y1={290} x2={220} y2={H} stroke="#333333" strokeWidth="2" />
        </svg>
        {fallbackOverlay}
        {coldSnapPill}
      </div>
    )
  }

  // Map legend — bottom left, above the cold snap pill
  const mapLegend = (
    <div style={{
      position: 'absolute', bottom: 48, left: 12,
      backgroundColor: 'rgba(20,20,20,0.85)',
      borderRadius: 6,
      padding: '8px 12px',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          display: 'inline-block', width: 14, height: 14,
          borderRadius: '50%', backgroundColor: '#00C27C', flexShrink: 0,
        }} />
        <span style={{ color: '#ffffff', fontSize: 12, lineHeight: 1.8, fontFamily: 'inherit' }}>Recent clients</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block', width: 14, height: 14,
          borderRadius: '50%', border: '2px solid #00C27C',
          backgroundColor: 'transparent', flexShrink: 0, boxSizing: 'border-box',
        }} />
        <span style={{ color: '#ffffff', fontSize: 12, lineHeight: 1.8, fontFamily: 'inherit' }}>Service area</span>
      </div>
    </div>
  )

  // Loading (null) or Google Maps ready — mapDivRef always in DOM so initMap
  // fires immediately when the key arrives
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#1e1e1e' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      {/* Show placeholder overlays while key is still being fetched */}
      {apiKey === null && fallbackOverlay}
      {mapLegend}
      {coldSnapPill}
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
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

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
        @keyframes jobRipple {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4.5); opacity: 0; }
        }
      `}</style>

      {/* ── Section 1: Hero row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30fr 70fr',
        gap: 24,
        alignItems: 'stretch',
        height: 520,
        overflow: 'hidden',
      }}>

        {/* Left: weather activation card */}
        <div style={{
          backgroundColor: '#1e1e1e',
          borderRadius: 8,
          padding: 24,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          {/* Header row: pulsing dot + label */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#00ff88',
            }}>
              Weather Event Active
            </span>
          </div>

          {/* Heading */}
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
            Cold Snap Detected
          </div>

          {/* Subtext */}
          <p style={{
            fontSize: '0.8rem',
            color: '#888888',
            lineHeight: 1.5,
            marginBottom: 16,
          }}>
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
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              padding: '10px 0',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              animation: 'glowPulse 2s ease-in-out infinite',
              marginBottom: 10,
            }}
          >
            Activate Now
          </button>

          {/* Tools count */}
          <p style={{
            fontSize: '0.7rem',
            color: '#555555',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            5 tools will activate simultaneously
          </p>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }} />

          {/* Tool list */}
          <div style={{ flex: 1 }}>
            {ACTIVATION_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingTop: 6,
                paddingBottom: 6,
                borderBottom: i < ACTIVATION_ITEMS.length - 1
                  ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <span style={{
                  display: 'inline-block',
                  width: 11, height: 11,
                  borderRadius: '50%',
                  border: '1.5px solid #444444',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.75rem', color: '#666666' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
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

      {/* ── Full-width performance card ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        borderRadius: 8,
        padding: 32,
        marginTop: 24,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40fr 60fr', gap: 32, alignItems: 'center' }}>

          {/* Left: hero number block */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#374151',
              marginBottom: 12,
            }}>
              Platform Performance — This Month
            </div>
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
            <p style={{
              fontSize: '0.9rem',
              color: '#9CA3AF',
              lineHeight: 1.5,
              margin: 0,
            }}>
              11 jobs booked through your platform this month
            </p>
          </div>

          {/* Right: stats + activation note + button */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Stat rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Jobs Booked',            value: '11' },
                { label: 'Missed Calls Recovered', value: '24' },
                { label: 'New Reviews This Month', value: '3'  },
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
                    color: '#374151',
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
            <div style={{ borderTop: '1px solid #E5E7EB', margin: '20px 0 16px' }} />

            {/* Green activation note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                display: 'inline-block',
                width: 8, height: 8,
                borderRadius: '50%',
                backgroundColor: '#00cc66',
                flexShrink: 0,
                animation: 'dotPulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: '0.85rem', color: '#00aa55', lineHeight: 1.4 }}>
                3 booked during last night&apos;s cold snap activation
              </span>
            </div>

            {/* Report button */}
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
              }}
            >
              View Monthly Performance Report
            </button>
          </div>
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
          boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
          borderRadius: 8,
          padding: 24,
        }}>
          <div style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#374151',
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
            color: '#374151',
            marginBottom: 20,
          }}>
            Today&apos;s Schedule
          </div>
          {SCHEDULE.map((slot, i) => (
            <div key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
              {/* Clickable row header */}
              <div
                onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    expandedRow === i ? '#F9FAFB' : 'transparent'
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 0',
                  cursor: 'pointer',
                  backgroundColor: expandedRow === i ? '#F9FAFB' : 'transparent',
                  transition: 'background-color 0.15s ease',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#00aa55',
                  }}>
                    Confirmed
                  </span>
                  <svg
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2.5"
                    style={{
                      transform: expandedRow === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease-in-out',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Expandable action buttons */}
              <div style={{
                maxHeight: expandedRow === i ? 64 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.2s ease-in-out',
              }}>
                <div style={{ display: 'flex', gap: 8, paddingBottom: 12 }}>
                  {[
                    { label: 'View Details', color: '#00aa55', border: '#00cc66', hoverBg: 'rgba(0,204,102,0.08)' },
                    { label: 'Reschedule',   color: '#00aa55', border: '#00cc66', hoverBg: 'rgba(0,204,102,0.08)' },
                    { label: 'Cancel',       color: '#DC2626', border: '#DC2626', hoverBg: 'rgba(220,38,38,0.06)' },
                  ].map((btn) => (
                    <a
                      key={btn.label}
                      href="/consultation"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = btn.hoverBg
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '7px 0',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: btn.color,
                        border: `1px solid ${btn.border}`,
                        borderRadius: 6,
                        textDecoration: 'none',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {btn.label}
                    </a>
                  ))}
                </div>
              </div>
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
