import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, verifyAdminPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { password?: string }
  if (!body.password || !(await verifyAdminPassword(body.password))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
