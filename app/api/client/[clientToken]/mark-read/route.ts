import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken, updateProject } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const notifications = (project.notifications ?? []).map((n) => ({ ...n, read: true }))
  const updated = updateProject(project.id, { notifications })

  if (!updated) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
