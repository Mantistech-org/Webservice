'use client'

import { useState, useEffect, useRef } from 'react'
import type { DemoView } from '@/components/demo/Sidebar'

interface DashboardProps {
  businessName?: string
  onNavigateToWeather?: () => void
  onNavigate?: (page: DemoView) => void
}

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVITY_FEED: Array<{ text: string; time: string }> = []


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
      const pillText = `${weatherTemp}: ${weatherEvent}`
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
        Cold snap active: 28F tonight
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

export default function DashboardHome({ businessName, onNavigateToWeather, onNavigate }: DashboardProps) {
  return (
    // Negative margin bleeds to edge of parent's 24px padding, then re-applies it
    // so the #F8F8F8 background fills the entire content area.
    <div className="demo-dashboard" style={{ margin: -24, padding: 24, backgroundColor: '#F8F8F8', minHeight: '100%' }}>
      <style>{`
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

        {/* Left: weather monitoring card */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: 8,
          padding: 24,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <span style={{
              display: 'inline-block',
              width: 7, height: 7,
              borderRadius: '50%',
              backgroundColor: '#00C27C',
              flexShrink: 0,
              marginRight: 7,
            }} />
            <span style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#00C27C',
              fontWeight: 600,
            }}>
              Monitoring
            </span>
          </div>

          {/* Headline */}
          <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
            All Clear
          </div>

          {/* Subline */}
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20, lineHeight: 1.5 }}>
            No weather events detected in your service area.
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }} />

          {/* Forecast snapshot */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>

            {/* Today — partly cloudy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
              </svg>
              <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>Today</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>72F / 54F</span>
            </div>

            {/* Tomorrow — sunny */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>Tomorrow</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>78F / 58F</span>
            </div>

            {/* Wednesday — rain */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <line x1="16" y1="13" x2="16" y2="21" />
                <line x1="8" y1="13" x2="8" y2="21" />
                <line x1="12" y1="15" x2="12" y2="23" />
                <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
              </svg>
              <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>Wednesday</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>65F / 49F</span>
            </div>

          </div>

          {/* Next check status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontSize: 12, color: '#6b7280' }}>Next check in 4 hours</span>
          </div>

          {/* View Full Forecast button */}
          <button
            onClick={() => onNavigateToWeather?.()}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,194,124,0.1)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00C27C', color: '#00C27C',
              fontSize: 13, fontWeight: 600, padding: '10px 0', borderRadius: 6,
              cursor: 'pointer', transition: 'background-color 0.15s ease',
            }}
          >
            View Full Forecast
          </button>
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
              Platform Performance, This Month
            </div>
            <div style={{
              fontSize: '3.5rem',
              fontWeight: 800,
              lineHeight: 1,
              color: '#1a1a1a',
              marginBottom: 10,
              letterSpacing: '-0.02em',
            }}>
              $0
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: '#9CA3AF',
              lineHeight: 1.5,
              margin: 0,
            }}>
              0 jobs booked through your platform this month
            </p>
          </div>

          {/* Right: stats + activation note + button */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Stat rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Jobs Booked',            value: '0' },
                { label: 'Missed Calls Recovered', value: '0' },
                { label: 'New Reviews This Month', value: '0' },
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

            {/* Report button */}
            <button
              onClick={() => onNavigate?.('performance')}
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
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 16 }}>
            Bookings, Today
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            No bookings yet
          </div>
          <button
            onClick={() => onNavigate?.('bookings')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, cursor: 'pointer',
              transition: 'background-color 0.15s ease', marginTop: 16,
            }}
          >
            View Bookings
          </button>
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
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 16 }}>
            Reviews
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
            No reviews yet
          </div>
          <button
            onClick={() => onNavigate?.('review')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            View Reviews
          </button>
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
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 16 }}>
            SEO
          </div>
          <div style={{ fontSize: 14, color: '#0a0a0a', marginBottom: 6 }}>0 local keywords ranking</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>0 impressions this month</div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onNavigate?.('seo')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            View SEO
          </button>
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
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 16 }}>
            SMS
          </div>
          <div style={{ fontSize: 14, color: '#0a0a0a', marginBottom: 6 }}>0 contacts</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>No messages sent yet</div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onNavigate?.('sms')}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,204,102,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            style={{
              display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
              backgroundColor: 'transparent', border: '1px solid #00cc66', color: '#00aa55',
              fontSize: '0.85rem', padding: '10px 0', borderRadius: 6, cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            View SMS
          </button>
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
        {ACTIVITY_FEED.length === 0 ? (
          <div style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '16px 0' }}>
            No activity yet. Events will appear here once your platform is active.
          </div>
        ) : ACTIVITY_FEED.map((item, i) => (
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
