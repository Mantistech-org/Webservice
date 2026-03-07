import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendClientChangeResponseEmail } from '@/lib/resend'

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

  const { changeRequestId, response } = await req.json()
  if (!changeRequestId || !response?.trim()) {
    return NextResponse.json({ error: 'changeRequestId and response are required' }, { status: 400 })
  }

  const changeRequests = (project.changeRequests ?? []).map((cr) =>
    cr.id === changeRequestId
      ? { ...cr, adminResponse: response.trim(), resolvedAt: new Date().toISOString(), status: 'resolved' as const }
      : cr
  )

  const updated = await updateProject(id, { changeRequests })
  if (!updated) {
    return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 })
  }

  sendClientChangeResponseEmail({
    businessName: project.businessName,
    ownerName: project.ownerName,
    email: project.email,
    adminResponse: response.trim(),
    clientToken: project.clientToken,
  }).catch((err) => console.error('Failed to send change response email:', err))

  return NextResponse.json({ success: true, project: updated })
}
