'use client'

import { useState, useEffect, useRef } from 'react'
import type { DemoView } from '@/components/demo/Sidebar'

interface DashboardProps {
  businessName?: string
  onNavigateToWeather?: () => void
  onNavigate?: (page: DemoView) => void
  isActive?: boolean
}

const SERVICE_AREA = 'Little Rock, AR'

// ── Static data ────────────────────────────────────────────────────────────────

const ACTIVITY_FEED: Array<{ text: string; time: string }> = []

// ── Demo preset data (shown when real weather has no active event) ─────────────

const DEMO_FORECAST = [
  { date: 'demo-0', dayLabel: 'Tomorrow', highF: 48, lowF: 31, condition: 'Partly Cloudy', precipChance: 20 },
  { date: 'demo-1', dayLabel: 'Saturday', highF: 42, lowF: 27, condition: 'Overcast',      precipChance: 40 },
  { date: 'demo-2', dayLabel: 'Sunday',   highF: 39, lowF: 24, condition: 'Snow Showers',  precipChance: 70 },
]

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
  location: string
  current: {
    tempF: number
    condition: string
    humidity: number
    windMph: number
  }
  forecast: WeatherForecastDay[]
  alerts: Array<{ type: string; description: string; severity: string }>
  trigger: {
    active: boolean
    type: 'cold_snap' | 'heat_wave' | null
    severity: 'moderate' | 'severe' | null
    reason: string | null
  }
}

// ── Condition icon ────────────────────────────────────────────────────────────

function conditionIcon(condition: string) {
  const c = condition.toLowerCase()

  const svgProps = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: '#9ca3af',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { flexShrink: 0 as const },
  }

  if (c.includes('thunder') || c.includes('storm') || c.includes('lightning')) {
    // Cloud with lightning bolt
    return (
      <svg {...svgProps}>
        <path d="M19 16.9A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
        <polyline points="13 11 9 17 15 17 11 23" />
      </svg>
    )
  }

  if (c.includes('snow') || c.includes('freez') || c.includes('sleet') || c.includes('ice') || c.includes('blizzard') || c.includes('flurr')) {
    // Snowflake
    return (
      <svg {...svgProps}>
        <line x1="12" y1="2" x2="12" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="5.64" y1="5.64" x2="18.36" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="5.64" y2="18.36" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  }

  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle') || c.includes('precip')) {
    // Cloud with rain drops
    return (
      <svg {...svgProps}>
        <line x1="16" y1="13" x2="16" y2="21" />
        <line x1="8" y1="13" x2="8" y2="21" />
        <line x1="12" y1="15" x2="12" y2="23" />
        <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
      </svg>
    )
  }

  if (c.includes('overcast') || c.includes('cloudy') || c.includes('fog') || c.includes('mist') || c.includes('haze')) {
    // Single cloud
    return (
      <svg {...svgProps}>
        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
      </svg>
    )
  }

  if (c.includes('partly') || c.includes('mostly') || c.includes('scattered')) {
    // Sun with cloud (partly cloudy)
    return (
      <svg {...svgProps}>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        <circle cx="10" cy="10" r="3" />
        <path d="M20 15h-1.17A4 4 0 108 16.93V17h12a3 3 0 000-6z" />
      </svg>
    )
  }

  // Sunny / Clear — default
  return (
    <svg {...svgProps}>
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
  )
}

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

  // SVG overlays used in fallback/loading states (service area, job dots)
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
      </div>
    )
  }

  // Map legend — bottom left
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
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

const WEATHER_LOCATION = SERVICE_AREA

export default function DashboardHome({ businessName, onNavigateToWeather, onNavigate, isActive }: DashboardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipOpacity, setTooltipOpacity] = useState(0)

  useEffect(() => {
    fetch(`/api/weather?location=${encodeURIComponent(WEATHER_LOCATION)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WeatherData | null) => {
        setWeatherData(data)
        setWeatherLoading(false)
      })
      .catch(() => setWeatherLoading(false))
  }, [])

  // Show tooltip 2s after mount for first-time visitors only
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname.includes('admin')) return
    if (sessionStorage.getItem('demo-tooltip-dismissed')) return
    const timerId = setTimeout(() => {
      setTooltipVisible(true)
      requestAnimationFrame(() => setTooltipOpacity(1))
    }, 400)
    return () => clearTimeout(timerId)
  }, [])

  // Hide tooltip when dashboard tab is deactivated
  useEffect(() => {
    if (!isActive && tooltipVisible) {
      setTooltipOpacity(0)
      const t = setTimeout(() => setTooltipVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [isActive, tooltipVisible])

  const dismissDashTooltip = () => {
    sessionStorage.setItem('demo-tooltip-dismissed', '1')
    setTooltipOpacity(0)
    setTimeout(() => setTooltipVisible(false), 300)
  }

  const forecast = weatherData?.forecast?.length ? weatherData.forecast : DEMO_FORECAST
  const isEventActive = !weatherLoading

  return (
    // Negative margin bleeds to edge of parent's 24px padding, then re-applies it
    // so the #F8F8F8 background fills the entire content area.
    <div className="demo-dashboard" style={{ margin: -24, padding: 24, backgroundColor: '#F8F8F8', minHeight: '100%' }}>
      <style>{`
        @keyframes jobRipple {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(4.5); opacity: 0; }
        }
        @keyframes tooltipPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes activatePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,194,124,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(0,194,124,0); }
        }
      `}</style>

      {/* ── Section 1: Hero row ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '30fr 70fr',
        gap: 24,
        alignItems: 'stretch',
        height: 520,
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

          {weatherLoading ? (
            /* ── Loading state ── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7,
                  borderRadius: '50%', backgroundColor: '#4b5563',
                  flexShrink: 0, marginRight: 7,
                }} />
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', fontWeight: 600 }}>
                  Checking
                </span>
              </div>
              <div style={{ color: '#6b7280', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                Checking conditions...
              </div>
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                Fetching live weather data for your service area.
              </div>
            </>
          ) : isEventActive ? (
            /* ── Weather event active state (static demo) ── */
            <>
              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7,
                  borderRadius: '50%', backgroundColor: '#00C27C',
                  flexShrink: 0, marginRight: 7,
                }} />
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00C27C', fontWeight: 600 }}>
                  Weather Event Active
                </span>
              </div>

              {/* Headline */}
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>
                Cold Snap Detected
              </div>

              {/* Pills */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '3px 10px',
                }}>
                  28°F Tonight
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#ffffff',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '3px 10px',
                }}>
                  Forecast: 3 days
                </span>
              </div>

              {/* 3-day forecast cards */}
              <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
                {/* Today - Partly Cloudy */}
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Today</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 4px', display: 'block' }}>
                    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    <circle cx="10" cy="10" r="3" />
                    <path d="M20 15h-1.17A4 4 0 108 16.93V17h12a3 3 0 000-6z" />
                  </svg>
                  <div style={{ fontSize: 12, color: '#ffffff', marginBottom: 4 }}>Partly Cloudy</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>79F</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>61F</div>
                </div>
                {/* Tomorrow - Rain */}
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Tomorrow</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 4px', display: 'block' }}>
                    <line x1="16" y1="13" x2="16" y2="21" />
                    <line x1="8" y1="13" x2="8" y2="21" />
                    <line x1="12" y1="15" x2="12" y2="23" />
                    <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
                  </svg>
                  <div style={{ fontSize: 12, color: '#ffffff', marginBottom: 4 }}>Rain</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>68F</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>62F</div>
                </div>
                {/* Wednesday - Sunny */}
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '8px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 }}>Wednesday</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 4px', display: 'block' }}>
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
                  <div style={{ fontSize: 12, color: '#ffffff', marginBottom: 4 }}>Sunny</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>76F</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>63F</div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }} />

              {/* Tool rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                {[
                  'Automated Ads',
                  'Customer Outreach',
                  'Google Business Profile',
                  'Missed Call Auto-Reply',
                  'Website Banner',
                ].map((tool) => (
                  <div key={tool} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#d1d5db' }}>{tool}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#00C27C',
                      backgroundColor: 'rgba(0,194,124,0.12)',
                      borderRadius: 4, padding: '2px 8px',
                    }}>
                      Ready
                    </span>
                  </div>
                ))}
              </div>

              {/* Activate Now button with tooltip */}
              <div style={{ position: 'relative', marginTop: 20 }}>
                <button
                  onClick={() => onNavigateToWeather?.()}
                  style={{
                    display: 'block', textAlign: 'center', width: '100%', boxSizing: 'border-box',
                    backgroundColor: '#00C27C', border: 'none', color: '#ffffff',
                    fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 6,
                    cursor: 'pointer',
                    animation: 'activatePulse 2s ease-in-out infinite',
                  }}
                >
                  Activate Now
                </button>
                {tooltipVisible && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 'calc(100% + 12px)',
                      width: 260,
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(0,194,124,0.3)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      zIndex: 50,
                      opacity: tooltipOpacity,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      left: -8,
                      width: 0,
                      height: 0,
                      borderRight: '8px solid #0a0a0a',
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#00C27C',
                        flexShrink: 0,
                        marginTop: 4,
                        animation: 'tooltipPulse 1.5s ease-in-out infinite',
                      }} />
                      <p style={{ fontSize: 13, color: '#ffffff', lineHeight: 1.5, margin: 0 }}>
                        Cold snap detected in your area. Click here to get ahead of jobs before your competitors do.
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 8 }}>
                      <button
                        onClick={dismissDashTooltip}
                        style={{
                          fontSize: 11,
                          color: '#ffffff',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Got it
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* ── All Clear / monitoring state ── */
            <>
              {/* Label */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7,
                  borderRadius: '50%', backgroundColor: '#00C27C',
                  flexShrink: 0, marginRight: 7,
                }} />
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00C27C', fontWeight: 600 }}>
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

              {/* Forecast rows (real data when available, static fallback when null) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {forecast.length > 0 ? forecast.slice(0, 3).map((day) => (
                  <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {conditionIcon(day.condition)}
                    <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>{day.dayLabel}</span>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                      {day.highF}F / {day.lowF}F
                      {day.precipChance > 0 ? ` · ${day.precipChance}%` : ''}
                    </span>
                  </div>
                )) : (
                  /* Static fallback if API returned no forecast rows */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
                      </svg>
                      <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>Today</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>— / —</span>
                    </div>
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
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>— / —</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <line x1="16" y1="13" x2="16" y2="21" />
                        <line x1="8" y1="13" x2="8" y2="21" />
                        <line x1="12" y1="15" x2="12" y2="23" />
                        <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" />
                      </svg>
                      <span style={{ fontSize: 13, color: '#ffffff', flex: 1 }}>Next day</span>
                      <span style={{ fontSize: 13, color: '#9ca3af' }}>— / —</span>
                    </div>
                  </>
                )}
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
            </>
          )}

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
