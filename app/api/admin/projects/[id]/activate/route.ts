import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated, verifyAdminPassword } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'
import { logAudit } from '@/lib/audit-log'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Support both cookie auth (admin UI) and Authorization header (manual/external)
  const authHeader = req.headers.get('Authorization')
  const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null
  const headerAuth = bearerToken ? await verifyAdminPassword(bearerToken) : false

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
  logAudit('client_activated', 'project', id, {
    business_name: project.businessName,
    from_status: project.status,
    to_status: 'active',
  })
  console.log(`[activate] Project ${id} manually activated by admin`)

  return NextResponse.json({ success: true, project: updated })
}
