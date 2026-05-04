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

const STATE_CITIES: Record<string, string[]> = {
  'georgia': ['Atlanta GA', 'Savannah GA', 'Augusta GA', 'Columbus GA', 'Macon GA', 'Athens GA', 'Warner Robins GA', 'Albany GA', 'Roswell GA', 'Sandy Springs GA'],
  'arkansas': ['Little Rock AR', 'Fort Smith AR', 'Fayetteville AR', 'Springdale AR', 'Jonesboro AR', 'Conway AR', 'Rogers AR', 'Pine Bluff AR', 'Bentonville AR', 'Hot Springs AR'],
  'texas': ['Houston TX', 'Dallas TX', 'San Antonio TX', 'Austin TX', 'Fort Worth TX', 'El Paso TX', 'Arlington TX', 'Corpus Christi TX', 'Plano TX', 'Laredo TX'],
  'florida': ['Jacksonville FL', 'Miami FL', 'Tampa FL', 'Orlando FL', 'St Petersburg FL', 'Hialeah FL', 'Tallahassee FL', 'Fort Lauderdale FL', 'Port St Lucie FL', 'Cape Coral FL'],
  'tennessee': ['Memphis TN', 'Nashville TN', 'Knoxville TN', 'Chattanooga TN', 'Clarksville TN', 'Murfreesboro TN', 'Franklin TN', 'Jackson TN', 'Johnson City TN', 'Bartlett TN'],
  'alabama': ['Birmingham AL', 'Montgomery AL', 'Huntsville AL', 'Mobile AL', 'Tuscaloosa AL', 'Hoover AL', 'Dothan AL', 'Auburn AL', 'Decatur AL', 'Madison AL'],
  'mississippi': ['Jackson MS', 'Gulfport MS', 'Southaven MS', 'Hattiesburg MS', 'Biloxi MS', 'Meridian MS', 'Tupelo MS', 'Olive Branch MS', 'Greenville MS', 'Horn Lake MS'],
  'louisiana': ['New Orleans LA', 'Baton Rouge LA', 'Shreveport LA', 'Metairie LA', 'Lafayette LA', 'Lake Charles LA', 'Kenner LA', 'Bossier City LA', 'Monroe LA', 'Alexandria LA'],
  'north carolina': ['Charlotte NC', 'Raleigh NC', 'Greensboro NC', 'Durham NC', 'Winston-Salem NC', 'Fayetteville NC', 'Cary NC', 'Wilmington NC', 'High Point NC', 'Concord NC'],
  'south carolina': ['Columbia SC', 'Charleston SC', 'North Charleston SC', 'Mount Pleasant SC', 'Rock Hill SC', 'Greenville SC', 'Summerville SC', 'Goose Creek SC', 'Hilton Head SC', 'Myrtle Beach SC'],
}

const FIELD_MASK = 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.businessStatus,places.types,places.id'

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

async function fetchCityResults(
  expandedQuery: string,
  cityLocation: string,
  radius: number,
  minRating: unknown,
  apiKey: string
): Promise<Record<string, unknown>[]> {
  const textQuery = `${expandedQuery} ${cityLocation}`
  const reqBody: Record<string, unknown> = {
    textQuery,
    languageCode: 'en',
    regionCode: 'US',
    maxResultCount: 20,
  }
  if (minRating) reqBody.minRating = Number(minRating)

  const coords = await geocode(cityLocation, apiKey)
  if (coords) {
    reqBody.locationBias = {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius: Number(radius),
      },
    }
  }

  const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(reqBody),
  })

  if (!placesRes.ok) {
    const errorText = await placesRes.text()
    console.error('[leads/search] Places API error for', cityLocation, ':', placesRes.status, errorText)
    return []
  }

  const placesData = await placesRes.json()
  console.log('[leads/search] Places API response count for', cityLocation, ':', placesData.places?.length ?? 0)
  return placesData.places ?? []
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
  const locationPart = location.trim()
  const expandedQuery = QUERY_EXPANSIONS[searchQuery.toLowerCase().trim()] || (keyword ? `${keyword} ${searchQuery}` : searchQuery)

  let allRaw: Record<string, unknown>[] = []
  let searchedLocations: string[] = []

  const normalizedLocation = locationPart.toLowerCase().trim()
  const stateCities = STATE_CITIES[normalizedLocation]

  if (stateCities) {
    // State search — query each city sequentially, stop when we have enough
    for (let i = 0; i < stateCities.length; i++) {
      if (allRaw.length >= clampedMax) break
      const city = stateCities[i]
      const cityRaw = await fetchCityResults(expandedQuery, city, Number(radius), minRating, apiKey)
      allRaw = [...allRaw, ...cityRaw]
      searchedLocations.push(city)
      if (i < stateCities.length - 1 && allRaw.length < clampedMax) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Deduplicate by phone number
    const seenPhones = new Set<string>()
    allRaw = allRaw.filter((p) => {
      const phone = (p.nationalPhoneNumber as string) ?? ''
      if (!phone) return true
      if (seenPhones.has(phone)) return false
      seenPhones.add(phone)
      return true
    })
  } else {
    // Single city or national search — paginate up to clampedMax
    const textQuery = locationPart ? `${expandedQuery} ${locationPart}` : expandedQuery
    const placesBodyBase: Record<string, unknown> = {
      textQuery,
      languageCode: 'en',
      regionCode: 'US',
      maxResultCount: 20,
    }
    if (minRating) placesBodyBase.minRating = Number(minRating)

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

    const pagesNeeded = Math.ceil(clampedMax / 20)
    let nextPageToken: string | undefined

    for (let page = 0; page < pagesNeeded; page++) {
      const reqBody: Record<string, unknown> = { ...placesBodyBase }
      if (nextPageToken) reqBody.pageToken = nextPageToken

      const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(reqBody),
      })

      if (!placesRes.ok) {
        const errorText = await placesRes.text()
        console.error('[leads/search] Places API error:', placesRes.status, errorText)
        return NextResponse.json({ results: [], total: 0, error: errorText }, { status: 200 })
      }

      const placesData = await placesRes.json()
      console.log('[leads/search] Places API response count:', placesData.places?.length ?? 0)
      allRaw = [...allRaw, ...(placesData.places ?? [])]
      nextPageToken = placesData.nextPageToken ?? undefined

      if (!nextPageToken) break
    }

    searchedLocations = [locationPart || 'United States']
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
    total: results.length,
    location_searched: locationPart || 'United States',
    searched_locations: searchedLocations,
    category: searchQuery,
  })
}
