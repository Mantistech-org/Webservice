import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { readDemoSessions } from '@/lib/demo-db'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessions = readDemoSessions()

  // Sort newest first
  sessions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json({ sessions })
}
