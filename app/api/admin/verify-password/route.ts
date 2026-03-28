import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, getEffectiveAdminPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { password?: string }
  if (!body.password || body.password !== getEffectiveAdminPassword()) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
