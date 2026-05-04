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

const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function dynamicGridSearch(
  searchQuery: string,
  lat: number,
  lng: number,
  maxResults: number,
  apiKey: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> {
  const gridSize = 4 // 4x4 = 16 search points
  const radiusMeters = 5000 // 5km radius per point
  const step = (radiusMeters * 2) / 111000 / gridSize

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPlaces: any[] = []
  const seenIds = new Set<string>()

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (allPlaces.length >= maxResults) break

      const pointLat = lat - ((gridSize - 1) / 2 * step) + (row * step)
      const pointLng = lng - ((gridSize - 1) / 2 * step) + (col * step)

      const body = {
        textQuery: searchQuery,
        maxResultCount: 20,
        languageCode: 'en',
        regionCode: 'US',
        locationRestriction: {
          circle: {
            center: { latitude: pointLat, longitude: pointLng },
            radius: radiusMeters,
          },
        },
      }

      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      for (const place of data.places || []) {
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id)
          allPlaces.push(place)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    if (allPlaces.length >= maxResults) break
  }

  return allPlaces.slice(0, maxResults)
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
  const locationPart = location.trim()
  const expandedQuery = QUERY_EXPANSIONS[searchQuery.toLowerCase().trim()] || (keyword ? `${keyword} ${searchQuery}` : searchQuery)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let places: any[] = []

  if (locationPart) {
    const coords = await geocode(locationPart, apiKey)
    if (coords) {
      places = await dynamicGridSearch(expandedQuery, coords.lat, coords.lng, clampedMax, apiKey)
      console.log(`[leads/search] grid search: ${places.length} results for "${expandedQuery}" near ${locationPart}`)
    } else {
      // Geocode failed — fall back to text-only search
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: `${expandedQuery} ${locationPart}`,
          maxResultCount: 20,
          languageCode: 'en',
          regionCode: 'US',
        }),
      })
      const data = await res.json()
      places = data.places || []
      console.log(`[leads/search] fallback search: ${places.length} results for "${expandedQuery}" ${locationPart}`)
    }
  } else {
    // No location — single global search
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: expandedQuery,
        maxResultCount: 20,
        languageCode: 'en',
        regionCode: 'US',
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[leads/search] Places API error:', res.status, errorText)
      return NextResponse.json({ results: [], total: 0, error: errorText }, { status: 200 })
    }

    const data = await res.json()
    console.log('[leads/search] Places API response count:', data.places?.length ?? 0)
    places = data.places || []
  }

  // Map to our shape
  let results: PlacesResult[] = places
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
    total: results.length,
    location_searched: locationPart || 'United States',
    searched_locations: locationPart ? [locationPart] : ['United States'],
    category: searchQuery,
  })
}
