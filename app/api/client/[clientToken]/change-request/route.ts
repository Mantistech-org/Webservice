import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getProjectByClientToken, updateProject } from '@/lib/db'
import { sendAdminChangeRequestEmail, sendChangeRequestConfirmationEmail } from '@/lib/resend'
import { ChangeRequest } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const { message } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const newRequest: ChangeRequest = {
    id: uuidv4(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  }

  const existing = project.changeRequests ?? []
  const updated = await updateProject(project.id, {
    changeRequests: [...existing, newRequest],
  })

  if (!updated) {
    return NextResponse.json({ error: 'Failed to save change request' }, { status: 500 })
  }

  sendAdminChangeRequestEmail({
    projectId: project.id,
    businessName: project.businessName,
    ownerName: project.ownerName,
    message: message.trim(),
  }).catch((err) => console.error('Failed to send change request email:', err))

  // Send client confirmation email
  sendChangeRequestConfirmationEmail({
    businessName: project.businessName,
    ownerName: project.ownerName,
    email: project.email,
    message: message.trim(),
  }).catch(() => { /* non-fatal */ })

  return NextResponse.json({ success: true, changeRequest: newRequest })
}
