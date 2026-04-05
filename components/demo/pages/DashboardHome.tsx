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
      })

      // Service area circle — attached to map, moves with pan/zoom
      new gm.Circle({
        map,
        center: { lat: 34.7465, lng: -92.2896 },
        radius: 15000,
        fillColor: '#000000',
        fillOpacity: 0,
        strokeColor: '#1a1a1a',
        strokeOpacity: 1.0,
        strokeWeight: 2,
        clickable: false,
      })

      // Weather pill — sits on the east edge of the service area circle
      // 15000m radius at lat 34.7465 = ~0.1712 degrees longitude
      const weatherTemp = '28F'
      const weatherEvent = 'Cold Snap'
      const pillText = `${weatherTemp} — ${weatherEvent}`
      const pillW = 110, pillH = 26
      const pillSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pillW}" height="${pillH}"><rect width="${pillW}" height="${pillH}" rx="6" fill="rgba(20,20,20,0.85)"/><text x="${pillW / 2}" y="${pillH / 2}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="11" fill="white">${pillText}</text></svg>`
      const weatherPillMarker = new gm.Marker({
        map,
        position: { lat: 34.7465, lng: -92.1184 },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(pillSvg)}`,
          scaledSize: new gm.Size(pillW, pillH),
          anchor: new gm.Point(0, pillH / 2),
        },
        clickable: false,
      })

      // Individual pin markers (shown at zoom >= 14)
      const individualMarkers = JOB_LATLNGS.map((pos) =>
        new gm.Marker({ map, position: pos, clickable: false, visible: false })
      )

      // Cluster markers (shown at zoom < 14)
      const clusterDefs = [
        { position: { lat: 34.7425, lng: -92.3310 }, count: 9 },
        { position: { lat: 34.7530, lng: -92.3190 }, count: 5 },
        { position: { lat: 34.7820, lng: -92.2650 }, count: 4 },
        { position: { lat: 34.7920, lng: -92.2430 }, count: 3 },
      ]
      const makeBadgeSvg = (count: number) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><circle cx="18" cy="18" r="18" fill="#EA4335"/><text x="18" y="18" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="white">${count}</text></svg>`
        return {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new gm.Size(36, 36),
          anchor: new gm.Point(18, 18),
        }
      }
      const clusterMarkers = clusterDefs.map(({ position, count }) =>
        new gm.Marker({ map, position, icon: makeBadgeSvg(count), clickable: false, visible: true })
      )

      // Toggle clusters vs individual pins based on zoom
      const updateVisibility = () => {
        const zoom = map.getZoom() ?? 12
        const showIndividual = zoom >= 14
        individualMarkers.forEach((m) => m.setVisible(showIndividual))
        clusterMarkers.forEach((m) => m.setVisible(!showIndividual))
      }
      map.addListener('zoom_changed', updateVisibility)

      // Toggle bottom-right cold snap pill based on whether weather pill is in view
      const coldSnapPillEl = mapDivRef.current?.parentElement?.querySelector<HTMLElement>('[data-cold-snap-pill]')
      const updatePillVisibility = () => {
        if (!coldSnapPillEl) return
        const bounds = map.getBounds()
        const pillPos = weatherPillMarker.getPosition()
        if (bounds && pillPos) {
          coldSnapPillEl.style.display = bounds.contains(pillPos) ? 'none' : 'block'
        }
      }
      map.addListener('bounds_changed', updatePillVisibility)

      // Zip code boundary layer
      fetch(
        "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/2/query?where=ZCTA5+IN+('72201','72202','72204','72205','72206','72207','72209','72212')&outFields=ZCTA5&f=geojson"
      )
        .then((r) => r.json())
        .then((geojson) => {
          map.data.addGeoJson(geojson)
          map.data.setStyle({
            strokeColor: '#555555',
            strokeWeight: 1,
            strokeOpacity: 0.6,
            fillOpacity: 0,
          })
        })
        .catch(() => { /* silently skip if fetch fails */ })
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
    <div data-cold-snap-pill style={{
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
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
          <path d="M7 0C3.13 0 0 3.13 0 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335"/>
        </svg>
        <span style={{ color: '#ffffff', fontSize: 12, lineHeight: 1.8, fontFamily: 'inherit' }}>Recent clients</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          display: 'inline-block', width: 14, height: 14,
          borderRadius: '50%', border: '2px solid #1a1a1a',
          backgroundColor: 'transparent', flexShrink: 0, boxSizing: 'border-box',
        }} />
        <span style={{ color: '#ffffff', fontSize: 12, lineHeight: 1.8, fontFamily: 'inherit' }}>Service area</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-block', width: 14, height: 2,
          backgroundColor: '#555555', flexShrink: 0,
        }} />
        <span style={{ color: '#ffffff', fontSize: 12, lineHeight: 1.8, fontFamily: 'inherit' }}>Zip codes</span>
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardHome({ businessName, onNavigateToWeather }: DashboardProps) {
  const [activating, setActivating] = useState(false)

  const handleActivate = () => {
    if (activating) return
    setActivating(true)
    setTimeout(() => {
      setActivating(false)
      onNavigateToWeather?.()
    }, 1500)
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
        @keyframes jobRipple {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4.5); opacity: 0; }
        }
        @keyframes loadingBar {
          from { width: 0%; }
          to   { width: 100%; }
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
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Loading bar */}
          {activating && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              height: 3,
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#00C27C',
                animation: 'loadingBar 1.5s linear forwards',
              }} />
            </div>
          )}
          {/* Top zone: label + headline + stat pills */}
          <div style={{ marginBottom: 16 }}>
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
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#00ff88',
              }}>
                Weather Event Active
              </span>
            </div>
            <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 12 }}>
              Cold Snap Detected
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 13,
                borderRadius: 6,
                padding: '6px 10px',
              }}>
                28F Tonight
              </span>
              <span style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 13,
                borderRadius: 6,
                padding: '6px 10px',
              }}>
                Forecast: 3 days
              </span>
            </div>
          </div>

          {/* Middle zone: button + subtext */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={handleActivate}
              disabled={activating}
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
                cursor: activating ? 'default' : 'pointer',
                animation: activating ? 'none' : 'glowPulse 2s ease-in-out infinite',
                opacity: activating ? 0.75 : 1,
                marginBottom: 10,
              }}
            >
              {activating ? 'Activating...' : 'Activate Now'}
            </button>
            <p style={{
              fontSize: '0.7rem',
              color: '#9ca3af',
              textAlign: 'center',
              margin: 0,
            }}>
              Your platform is ready. Activate to fill your schedule.
            </p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 10 }} />

          {/* Bottom zone: two-column tool grid */}
          <div style={{ flex: 1 }}>
            {ACTIVATION_ITEMS.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 7,
                paddingBottom: 7,
                borderBottom: i < ACTIVATION_ITEMS.length - 1
                  ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#00C27C',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: '#ffffff' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  color: '#ffffff',
                  fontSize: 11,
                  borderRadius: 5,
                  padding: '4px 8px',
                  flexShrink: 0,
                }}>
                  Ready
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

      {/* ── 2x2 grid: Bookings, Reviews, SEO, SMS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        marginTop: 24,
      }}>

        {/* Bookings */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#374151', marginBottom: 16 }}>
            Bookings
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1a1a1a', marginBottom: 12 }}>
            Next: James Perkins — 7:00 AM
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>5 jobs scheduled today</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>2 open slots remaining</div>
          <div style={{ flex: 1 }} />
          <a
            href="/demo/bookings"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            View Bookings
          </a>
        </div>

        {/* Reviews */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#374151', marginBottom: 16 }}>
            Reviews
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>3 new reviews this month</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>4.8 average rating</div>
          <div style={{ flex: 1 }} />
          <a
            href="/demo/reviews"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            View Reviews
          </a>
        </div>

        {/* SEO */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#374151', marginBottom: 16 }}>
            SEO
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>12 local keywords ranking</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>847 impressions this month</div>
          <div style={{ flex: 1 }} />
          <a
            href="/demo/seo"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            View SEO
          </a>
        </div>

        {/* SMS */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderRadius: 8,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#374151', marginBottom: 16 }}>
            SMS
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 6 }}>1,247 contacts</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Last blast sent last night</div>
          <div style={{ flex: 1 }} />
          <a
            href="/demo/sms"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
          >
            View SMS
          </a>
        </div>

      </div>

      {/* ── Recent Activity (full width, bottom) ── */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
        borderRadius: 8,
        padding: 24,
        marginTop: 24,
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

    </div>
  )
}
