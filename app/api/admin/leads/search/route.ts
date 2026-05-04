import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { getApiKey } from '@/lib/api-keys'

interface PlacesResult {
  place_id: string
  business_name: string
  address: string
  phone: string
  website: string
  email: string | null
  rating: number | null
  rating_count: number
  already_saved: boolean
}
const QUERY_EXPANSIONS: Record<string, string> = {
  'hvac': 'HVAC heating and cooling contractor',
  'plumber': 'plumbing contractor',
  'electrician': 'electrical contractor',
  'roofer': 'roofing contractor',
  'landscaping': 'landscaping and lawn care',
  'restaurant': 'restaurant',
}

async function geocode(location: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location
    }
  } catch {
    // fall through to null
  }
  return null
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = await getApiKey('google_places')
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY is not configured.' }, { status: 500 })
  }

  const body = await req.json()
  const {
    query: searchQuery = '',
    location = '',
    radius = 50000,
    minRating,
    maxRating,
    hasWebsite,
    hasPhone,
    hasEmail,
    keyword = '',
    maxResults = 20,
  } = body

  if (!searchQuery) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 })
  }

  const clampedMax = Math.min(Math.max(1, Number(maxResults)), 200)

  // Build the text query — expand common categories and include location
  const locationPart = location.trim()
  const expandedQuery = QUERY_EXPANSIONS[searchQuery.toLowerCase().trim()] || searchQuery
  const textQuery = locationPart
    ? `${expandedQuery} ${locationPart}`
    : expandedQuery

  // Base Places API request body
  const placesBodyBase: Record<string, unknown> = { textQuery, languageCode: 'en', regionCode: 'US', maxResultCount: 20 }
  if (minRating) placesBodyBase.minRating = Number(minRating)

  // Add location bias only when a specific location was provided
  if (locationPart) {
    const coords = await geocode(locationPart, apiKey)
    if (coords) {
      placesBodyBase.locationBias = {
        circle: {
          center: { latitude: coords.lat, longitude: coords.lng },
          radius: Number(radius),
        },
      }
    }
  }

  // Paginate the Places API to collect up to clampedMax raw results
  const pagesNeeded = Math.ceil(clampedMax / 20)
  let allRaw: Record<string, unknown>[] = []
  let nextPageToken: string | undefined

  for (let page = 0; page < pagesNeeded; page++) {
    const reqBody: Record<string, unknown> = { ...placesBodyBase }
    if (nextPageToken) reqBody.pageToken = nextPageToken

    const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.id',
      },
      body: JSON.stringify(reqBody),
    })

    if (!placesRes.ok) {
      const errorText = await placesRes.text()
      console.error('[leads/search] Places API error:', placesRes.status, errorText)
      return NextResponse.json({ results: [], error: errorText }, { status: 200 })
    }

    const placesData = await placesRes.json()
    console.log('[leads/search] Places API response count:', placesData.places?.length ?? 0)
    allRaw = [...allRaw, ...(placesData.places ?? [])]
    nextPageToken = placesData.nextPageToken ?? undefined

    if (!nextPageToken) break
  }

  // Map to our shape
  let results: PlacesResult[] = allRaw
    .filter((p) => p.businessStatus === 'OPERATIONAL' || !p.businessStatus)
    .map((p) => {
      const displayName = p.displayName as { text?: string } | undefined
      return {
        place_id: p.id as string,
        business_name: displayName?.text ?? 'Unknown',
        address: (p.formattedAddress as string) ?? '',
        phone: (p.nationalPhoneNumber as string) ?? '',
        website: (p.websiteUri as string) ?? '',
        email: null,
        rating: typeof p.rating === 'number' ? p.rating : null,
        rating_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
        already_saved: false,
      }
    })

  // Post-fetch filters
  if (maxRating) {
    results = results.filter((r) => r.rating === null || r.rating <= Number(maxRating))
  }
  if (hasWebsite === 'yes') {
    results = results.filter((r) => !!r.website)
  } else if (hasWebsite === 'no') {
    results = results.filter((r) => !r.website)
  }
  if (hasPhone === 'yes') {
    results = results.filter((r) => !!r.phone)
  } else if (hasPhone === 'no') {
    results = results.filter((r) => !r.phone)
  }

  // Trim to requested max after filtering
  results = results.slice(0, clampedMax)

  // Mark already-saved results and pull their stored emails
  if (pgEnabled && results.length > 0) {
    try {
      const placeIds = results.map((r) => r.place_id).filter(Boolean)
      if (placeIds.length > 0) {
        const placeholders = placeIds.map((_, i) => `$${i + 1}`).join(', ')
        const existing = await query<{ place_id: string; email: string | null }>(
          `SELECT place_id, email FROM public.outreach_leads WHERE place_id IN (${placeholders})`,
          placeIds
        )
        const savedMap = new Map(existing.map((r) => [r.place_id, r.email]))
        results = results.map((r) => ({
          ...r,
          already_saved: savedMap.has(r.place_id),
          email: savedMap.has(r.place_id) ? (savedMap.get(r.place_id) ?? null) : null,
        }))
      }
    } catch {
      // Non-fatal — skip already_saved markers
    }
  }

  // Apply hasEmail filter after DB lookup (only meaningful for already-saved results)
  if (hasEmail === 'yes') {
    results = results.filter((r) => !!r.email)
  } else if (hasEmail === 'no') {
    results = results.filter((r) => !r.email)
  }

  return NextResponse.json({
    results,
    location_searched: locationPart || 'United States',
    category: searchQuery,
  })
}
