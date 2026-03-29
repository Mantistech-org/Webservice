import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'
import { sendChangesRequestedEmail } from '@/lib/resend'
import { logAudit } from '@/lib/audit-log'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const project = await getProject(id)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const adminNotes: string = body.notes ?? ''

  const updated = await updateProject(id, {
    status: 'changes_requested',
    adminNotes,
  })
  logAudit('changes_requested', 'project', id, {
    business_name: project.businessName,
    from_status: project.status,
    to_status: 'changes_requested',
  })

  sendChangesRequestedEmail({
    businessName: project.businessName,
    ownerName: project.ownerName,
    email: project.email,
    adminNotes,
  }).catch((err) => console.error('Failed to send changes email:', err))

  return NextResponse.json({ success: true, project: updated })
}
