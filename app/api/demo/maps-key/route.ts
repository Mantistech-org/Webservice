import { NextResponse } from 'next/server'
import { getApiKey } from '@/lib/api-keys'

/**
 * Public endpoint — returns the Google Maps JavaScript API key so the
 * client-side CityMap component can load it without needing a NEXT_PUBLIC_
 * build-time variable. The Maps JS API key is inherently public (it is
 * embedded in every browser request to maps.googleapis.com).
 */
export async function GET() {
  const key = await getApiKey('google_maps')
  return NextResponse.json({ key: key ?? '' })
}
