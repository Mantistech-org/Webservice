import { NextResponse } from 'next/server'
import { getPublicPricing } from '@/lib/pricing'

// Cache for 60 seconds — price changes propagate within one minute
export const revalidate = 60

// GET /api/pricing — public endpoint, no auth required
export async function GET() {
  try {
    const plans = await getPublicPricing()
    return NextResponse.json({ plans })
  } catch (err) {
    console.error('[api/pricing] GET failed:', err)
    return NextResponse.json({ plans: [] }, { status: 500 })
  }
}
