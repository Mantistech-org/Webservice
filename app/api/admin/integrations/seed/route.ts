import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { seedApiKeysFromEnv } from '@/lib/api-keys'

// POST /api/admin/integrations/seed
// Reads all API keys from Railway environment variables and inserts them into the
// Supabase api_keys table. Existing rows are left untouched (INSERT ... ON CONFLICT DO NOTHING).
// Call this once after the api_keys table has been created.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const seeded = await seedApiKeysFromEnv()
  return NextResponse.json({ ok: true, seeded })
}
