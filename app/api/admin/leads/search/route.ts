import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

interface PlacesResult {
  place_id: string
  business_name: string
  address: string
  phone: string
  website: string
  rating: number | null
  rating_count: number
  already_saved: boolean
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

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
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
    keyword = '',
    maxResults = 20,
  } = body

  if (!searchQuery || !location) {
    return NextResponse.json({ error: 'query and location are required.' }, { status: 400 })
  }

  const textQuery = [keyword, searchQuery, 'in', location].filter(Boolean).join(' ')

  // Build Places API (New) request body
  const placesBody: Record<string, unknown> = {
    textQuery,
    maxResultCount: Math.min(Math.max(1, Number(maxResults)), 20),
  }

  if (minRating) {
    placesBody.minRating = Number(minRating)
  }

  // Try to geocode for a location-biased radius search
  const coords = await geocode(location, apiKey)
  if (coords) {
    placesBody.locationBias = {
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
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.businessStatus',
      ].join(','),
    },
    body: JSON.stringify(placesBody),
  })

  if (!placesRes.ok) {
    const errText = await placesRes.text()
    return NextResponse.json({ error: `Google Places API error: ${errText}` }, { status: 502 })
  }

  const placesData = await placesRes.json()
  const places = placesData.places ?? []

  // Map to our shape
  let results: PlacesResult[] = places
    .filter((p: Record<string, unknown>) => p.businessStatus === 'OPERATIONAL' || !p.businessStatus)
    .map((p: Record<string, unknown>) => {
      const displayName = p.displayName as { text?: string } | undefined
      return {
        place_id: p.id as string,
        business_name: displayName?.text ?? 'Unknown',
        address: (p.formattedAddress as string) ?? '',
        phone: (p.nationalPhoneNumber as string) ?? '',
        website: (p.websiteUri as string) ?? '',
        rating: typeof p.rating === 'number' ? p.rating : null,
        rating_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : 0,
        already_saved: false,
      }
    })

  // Client-side filters
  if (maxRating) {
    results = results.filter((r) => r.rating === null || r.rating <= Number(maxRating))
  }
  if (hasWebsite === 'yes') {
    results = results.filter((r) => !!r.website)
  } else if (hasWebsite === 'no') {
    results = results.filter((r) => !r.website)
  }

  // Mark which results are already saved in the DB
  if (pgEnabled && results.length > 0) {
    try {
      const placeIds = results.map((r) => r.place_id).filter(Boolean)
      if (placeIds.length > 0) {
        const placeholders = placeIds.map((_, i) => `$${i + 1}`).join(', ')
        const existing = await query<{ place_id: string }>(
          `SELECT place_id FROM public.outreach_leads WHERE place_id IN (${placeholders})`,
          placeIds
        )
        const savedSet = new Set(existing.map((r) => r.place_id))
        results = results.map((r) => ({ ...r, already_saved: savedSet.has(r.place_id) }))
      }
    } catch {
      // Non-fatal — just skip the already_saved markers
    }
  }

  return NextResponse.json({ results, location_searched: location, category: searchQuery })
}
