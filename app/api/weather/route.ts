import { NextRequest, NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-keys'

// ── Monthly averages by US region (°F) ────────────────────────────────────────

type MonthKey = 'jan'|'feb'|'mar'|'apr'|'may'|'jun'|'jul'|'aug'|'sep'|'oct'|'nov'|'dec'
type MonthAvg = { high: number; low: number }

const MONTHLY_AVERAGES: Record<string, Record<MonthKey, MonthAvg>> = {
  south: { // AR, TX, LA, MS, AL, GA, FL, SC, NC, TN
    jan: { high: 52, low: 32 }, feb: { high: 57, low: 36 },
    mar: { high: 65, low: 44 }, apr: { high: 74, low: 53 },
    may: { high: 81, low: 61 }, jun: { high: 88, low: 69 },
    jul: { high: 92, low: 73 }, aug: { high: 91, low: 72 },
    sep: { high: 85, low: 65 }, oct: { high: 74, low: 53 },
    nov: { high: 63, low: 42 }, dec: { high: 54, low: 34 },
  },
  midwest: { // IL, IN, OH, MI, WI, MN, IA, MO, KS, NE, ND, SD, OK
    jan: { high: 32, low: 17 }, feb: { high: 37, low: 21 },
    mar: { high: 50, low: 32 }, apr: { high: 63, low: 43 },
    may: { high: 74, low: 53 }, jun: { high: 83, low: 63 },
    jul: { high: 87, low: 68 }, aug: { high: 85, low: 66 },
    sep: { high: 77, low: 57 }, oct: { high: 65, low: 45 },
    nov: { high: 49, low: 33 }, dec: { high: 36, low: 21 },
  },
  northeast: { // NY, PA, NJ, MA, CT, RI, VT, NH, ME, DE, MD, VA, WV, DC
    jan: { high: 35, low: 22 }, feb: { high: 38, low: 24 },
    mar: { high: 48, low: 33 }, apr: { high: 60, low: 43 },
    may: { high: 71, low: 53 }, jun: { high: 80, low: 62 },
    jul: { high: 85, low: 68 }, aug: { high: 83, low: 66 },
    sep: { high: 75, low: 58 }, oct: { high: 63, low: 47 },
    nov: { high: 51, low: 37 }, dec: { high: 39, low: 27 },
  },
  west: { // CA, OR, WA, NV, AZ, UT, CO, ID, MT, WY, NM, AK, HI
    jan: { high: 55, low: 38 }, feb: { high: 60, low: 41 },
    mar: { high: 65, low: 45 }, apr: { high: 72, low: 50 },
    may: { high: 79, low: 56 }, jun: { high: 87, low: 63 },
    jul: { high: 94, low: 69 }, aug: { high: 93, low: 68 },
    sep: { high: 86, low: 62 }, oct: { high: 75, low: 53 },
    nov: { high: 63, low: 44 }, dec: { high: 55, low: 38 },
  },
}

// ── Region detection ──────────────────────────────────────────────────────────

const REGION_STATES: Record<string, string[]> = {
  south: [
    'ar', 'arkansas', 'tx', 'texas', 'la', 'louisiana', 'ms', 'mississippi',
    'al', 'alabama', 'ga', 'georgia', 'fl', 'florida', 'sc', 'south carolina',
    'nc', 'north carolina', 'tn', 'tennessee',
  ],
  midwest: [
    'il', 'illinois', 'in', 'indiana', 'oh', 'ohio', 'mi', 'michigan',
    'wi', 'wisconsin', 'mn', 'minnesota', 'ia', 'iowa', 'mo', 'missouri',
    'ks', 'kansas', 'ne', 'nebraska', 'nd', 'north dakota', 'sd', 'south dakota',
    'ok', 'oklahoma',
  ],
  northeast: [
    'ny', 'new york', 'pa', 'pennsylvania', 'nj', 'new jersey', 'ma', 'massachusetts',
    'ct', 'connecticut', 'ri', 'rhode island', 'vt', 'vermont', 'nh', 'new hampshire',
    'me', 'maine', 'de', 'delaware', 'md', 'maryland', 'va', 'virginia',
    'wv', 'west virginia', 'dc', 'district of columbia',
  ],
  west: [
    'ca', 'california', 'or', 'oregon', 'wa', 'washington', 'nv', 'nevada',
    'az', 'arizona', 'ut', 'utah', 'co', 'colorado', 'id', 'idaho',
    'mt', 'montana', 'wy', 'wyoming', 'nm', 'new mexico', 'ak', 'alaska', 'hi', 'hawaii',
  ],
}

function detectRegion(location: string): string {
  const normalized = location.toLowerCase()
  for (const [region, states] of Object.entries(REGION_STATES)) {
    for (const state of states) {
      // Match state abbreviation as word boundary (e.g. ", ar" or " ar " but not "par")
      if (state.length === 2) {
        const abbrevPattern = new RegExp(`\\b${state}\\b`)
        if (abbrevPattern.test(normalized)) return region
      } else {
        if (normalized.includes(state)) return region
      }
    }
  }
  // Default to south (AR-based business)
  return 'south'
}

function getMonthKey(month: number): MonthKey {
  const keys: MonthKey[] = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  return keys[month] ?? 'jan'
}

// ── Day label helper ──────────────────────────────────────────────────────────

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const d = new Date(dateStr + 'T12:00:00')
  return days[d.getDay()] ?? dateStr
}

// ── Trigger evaluation ────────────────────────────────────────────────────────

interface CurrentData {
  tempF: number
  condition: string
  humidity: number
  windMph: number
}

interface ForecastDay {
  date: string
  dayLabel: string
  highF: number
  lowF: number
  condition: string
  precipChance: number
}

interface Alert {
  type: string
  description: string
  severity: string
}

type TriggerType = 'cold_snap' | 'heat_wave' | null
type TriggerSeverity = 'moderate' | 'severe' | null

interface TriggerResult {
  active: boolean
  type: TriggerType
  severity: TriggerSeverity
  reason: string | null
}

function evaluateTrigger(
  current: CurrentData,
  forecast: ForecastDay[],
  region: string,
  month: number,
  alerts: Alert[],
): TriggerResult {
  const monthKey = getMonthKey(month)
  const avgs = MONTHLY_AVERAGES[region]?.[monthKey] ?? { high: 75, low: 55 }

  // ── Cold snap checks ──────────────────────────────────────────────────────

  const hasFreezeAlert = alerts.some((a) =>
    a.type.includes('FREEZE') || a.description.toLowerCase().includes('freeze') ||
    a.description.toLowerCase().includes('frost')
  )

  // Count consecutive days with low significantly below average
  let coldDayCount = 0
  for (const day of forecast.slice(0, 5)) {
    if (day.lowF <= avgs.low - 15) coldDayCount++
    else break
  }

  // 2+ consecutive forecast lows 15+ degrees below monthly average
  if (coldDayCount >= 2) {
    const diff = avgs.low - (forecast[0]?.lowF ?? avgs.low)
    return {
      active: true,
      type: 'cold_snap',
      severity: diff >= 20 ? 'severe' : 'moderate',
      reason: `Forecasted lows ${diff}°F below the ${monthKey} average (${avgs.low}°F)`,
    }
  }

  // Active freeze warning
  if (hasFreezeAlert) {
    return {
      active: true,
      type: 'cold_snap',
      severity: 'moderate',
      reason: 'Active freeze warning in your service area',
    }
  }

  // Current temp below 35F and significant drop (10+ degrees) from average high
  if (current.tempF < 35 && current.tempF <= avgs.high - 10) {
    const futureColdDays = forecast.slice(1, 3).filter((d) => d.lowF < 35).length
    if (futureColdDays >= 1) {
      return {
        active: true,
        type: 'cold_snap',
        severity: current.tempF < 28 ? 'severe' : 'moderate',
        reason: `Current temp ${current.tempF}°F with continued cold conditions`,
      }
    }
  }

  // ── Heat wave checks ─────────────────────────────────────────────────────

  const hasHeatAlert = alerts.some((a) =>
    a.type.includes('HEAT') || a.description.toLowerCase().includes('heat advisory') ||
    a.description.toLowerCase().includes('excessive heat')
  )

  // Count consecutive days with high 10+ above average
  let hotDayCount = 0
  for (const day of forecast.slice(0, 5)) {
    if (day.highF >= avgs.high + 10) hotDayCount++
    else break
  }

  if (hotDayCount >= 2) {
    const diff = (forecast[0]?.highF ?? avgs.high) - avgs.high
    return {
      active: true,
      type: 'heat_wave',
      severity: diff >= 15 ? 'severe' : 'moderate',
      reason: `Forecasted highs ${diff}°F above the ${monthKey} average (${avgs.high}°F)`,
    }
  }

  // Active heat advisory
  if (hasHeatAlert) {
    return {
      active: true,
      type: 'heat_wave',
      severity: 'moderate',
      reason: 'Active heat advisory in your service area',
    }
  }

  // 2+ consecutive days above 95F
  const extremeHeatDays = forecast.slice(0, 3).filter((d) => d.highF >= 95).length
  if (extremeHeatDays >= 2) {
    return {
      active: true,
      type: 'heat_wave',
      severity: 'severe',
      reason: `${extremeHeatDays} consecutive days forecast above 95°F`,
    }
  }

  return { active: false, type: null, severity: null, reason: null }
}

// ── Google Weather API response parsers ───────────────────────────────────────

interface GoogleCurrentConditions {
  currentConditions?: {
    temperature?: { degrees?: number }
    humidity?: number
    wind?: { speed?: { value?: number } }
    weatherCondition?: { description?: { text?: string }; type?: string }
  }
}

interface GoogleForecastDay {
  interval?: { startTime?: string }
  displayDate?: { year?: number; month?: number; day?: number }
  maxTemperature?: { degrees?: number }
  minTemperature?: { degrees?: number }
  daytimeForecast?: {
    weatherCondition?: { description?: { text?: string } }
    precipitation?: { probability?: { percent?: number } }
  }
  overnightForecast?: {
    precipitation?: { probability?: { percent?: number } }
  }
}

interface GoogleForecastResponse {
  forecastDays?: GoogleForecastDay[]
  weatherAlerts?: Array<{
    alertType?: string
    description?: { text?: string }
    severity?: string
  }>
}

function parseCurrent(raw: GoogleCurrentConditions): CurrentData {
  const cc = raw.currentConditions ?? {}
  return {
    tempF: Math.round(cc.temperature?.degrees ?? 70),
    condition: cc.weatherCondition?.description?.text ?? cc.weatherCondition?.type ?? 'Unknown',
    humidity: Math.round(cc.humidity ?? 0),
    windMph: Math.round(cc.wind?.speed?.value ?? 0),
  }
}

function parseForecast(raw: GoogleForecastResponse): ForecastDay[] {
  const days = raw.forecastDays ?? []
  return days.slice(0, 5).map((day, i) => {
    // Build an ISO date string from displayDate or interval startTime
    let dateStr = ''
    if (day.displayDate) {
      const { year = 2025, month = 1, day: d = 1 } = day.displayDate
      dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    } else if (day.interval?.startTime) {
      dateStr = day.interval.startTime.slice(0, 10)
    }

    const daytime = day.daytimeForecast ?? {}
    const overnight = day.overnightForecast ?? {}
    const precipChance = Math.max(
      daytime.precipitation?.probability?.percent ?? 0,
      overnight.precipitation?.probability?.percent ?? 0,
    )

    return {
      date: dateStr,
      dayLabel: getDayLabel(dateStr, i),
      highF: Math.round(day.maxTemperature?.degrees ?? 70),
      lowF: Math.round(day.minTemperature?.degrees ?? 55),
      condition: daytime.weatherCondition?.description?.text ?? 'Unknown',
      precipChance,
    }
  })
}

function parseAlerts(raw: GoogleForecastResponse): Alert[] {
  return (raw.weatherAlerts ?? []).map((a) => ({
    type: a.alertType ?? 'UNKNOWN',
    description: a.description?.text ?? '',
    severity: a.severity ?? 'UNKNOWN',
  }))
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')?.trim()

  if (!location) {
    return NextResponse.json({ error: 'location query parameter is required' }, { status: 400 })
  }

  const apiKey = await getApiKey('google_maps')
  if (!apiKey) {
    return NextResponse.json({ error: 'Google API key not configured' }, { status: 503 })
  }

  // Geocode the location text to coordinates
  const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
  const geocodeRes = await fetch(geocodeUrl, { next: { revalidate: 86400 } }) // cache 24h
  const geocodeData = await geocodeRes.json()
  if (!geocodeRes.ok || !geocodeData.results?.[0]) {
    console.error('[weather] geocode error:', geocodeRes.status, geocodeData.status)
    return NextResponse.json({ error: 'Could not geocode location' }, { status: 400 })
  }
  const { lat, lng } = geocodeData.results[0].geometry.location

  const baseUrl = 'https://weather.googleapis.com/v1'

  // Fetch current conditions and 7-day forecast in parallel
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${baseUrl}/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&unitsSystem=IMPERIAL`, {
      next: { revalidate: 900 }, // cache 15 min
    }),
    fetch(`${baseUrl}/forecast/days:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}&days=5&unitsSystem=IMPERIAL`, {
      next: { revalidate: 900 },
    }),
  ])

  if (!currentRes.ok) {
    const text = await currentRes.text().catch(() => '')
    console.error('[weather] currentConditions error:', currentRes.status, text)
    return NextResponse.json(
      { error: `Weather API error: ${currentRes.status}` },
      { status: currentRes.status >= 500 ? 502 : currentRes.status },
    )
  }

  if (!forecastRes.ok) {
    const text = await forecastRes.text().catch(() => '')
    console.error('[weather] forecast error:', forecastRes.status, text)
    return NextResponse.json(
      { error: `Forecast API error: ${forecastRes.status}` },
      { status: forecastRes.status >= 500 ? 502 : forecastRes.status },
    )
  }

  const [currentRaw, forecastRaw]: [GoogleCurrentConditions, GoogleForecastResponse] =
    await Promise.all([currentRes.json(), forecastRes.json()])

  const current = parseCurrent(currentRaw)
  const forecast = parseForecast(forecastRaw)
  const alerts = parseAlerts(forecastRaw)

  const region = detectRegion(location)
  const month = new Date().getMonth() // 0-indexed

  const trigger = evaluateTrigger(current, forecast, region, month, alerts)

  return NextResponse.json({
    location,
    current,
    forecast,
    alerts,
    trigger,
  })
}
