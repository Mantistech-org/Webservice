import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken, updateProject } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const { addonId, response } = await req.json()
  if (!addonId || !['accept', 'decline'].includes(response)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const project = getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const customAddons = (project.customAddons ?? []).map((a) =>
    a.id === addonId
      ? { ...a, status: (response === 'accept' ? 'accepted' : 'declined') as 'accepted' | 'declined', respondedAt: new Date().toISOString() }
      : a
  )
  const updated = updateProject(project.id, { customAddons })
  return NextResponse.json({ success: true, project: updated })
}
