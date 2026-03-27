import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'

const TRACKED_KEYS = [
  'ANTHROPIC_API_KEY',
  'RESEND_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_SEARCH_CONSOLE_KEY',
]

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status: Record<string, { set: boolean; last4: string | null }> = {}
  for (const key of TRACKED_KEYS) {
    const val = process.env[key]
    status[key] = {
      set: !!val,
      last4: val && val.length >= 4 ? val.slice(-4) : null,
    }
  }

  return NextResponse.json({ status })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { key, value } = await req.json()

  if (!TRACKED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 400 })
  }

  if (!value || typeof value !== 'string' || !value.trim()) {
    return NextResponse.json({ error: 'Value is required' }, { status: 400 })
  }

  // Apply to the running process immediately.
  // This persists until the next process restart.
  // To survive redeployments, set the variable in Railway project settings.
  process.env[key] = value.trim()

  return NextResponse.json({ ok: true })
}
