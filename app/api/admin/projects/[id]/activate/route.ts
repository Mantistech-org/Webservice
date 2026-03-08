import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, getEffectiveAdminPassword } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Support both cookie auth (admin UI) and Authorization header (manual/external)
  const authHeader = req.headers.get('Authorization')
  const headerAuth = authHeader
    ? authHeader.replace(/^Bearer\s+/i, '') === getEffectiveAdminPassword()
    : false

  if (!headerAuth && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const project = await getProject(id)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (project.status === 'active') {
    return NextResponse.json({ success: true, project, message: 'Already active' })
  }

  const updated = await updateProject(id, { status: 'active' })
  console.log(`[activate] Project ${id} manually activated by admin`)

  return NextResponse.json({ success: true, project: updated })
}
