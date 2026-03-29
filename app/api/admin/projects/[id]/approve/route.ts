import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'
import { sendClientReviewEmail } from '@/lib/resend'
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

  const updated = await updateProject(id, { status: 'client_review' })
  logAudit('client_approved', 'project', id, {
    business_name: project.businessName,
    from_status: project.status,
    to_status: 'client_review',
  })

  sendClientReviewEmail({
    clientToken: project.clientToken,
    businessName: project.businessName,
    ownerName: project.ownerName,
    email: project.email,
  }).catch((err) => console.error('Failed to send client review email:', err))

  return NextResponse.json({ success: true, project: updated })
}
