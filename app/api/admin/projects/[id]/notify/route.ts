import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getProject, updateProject } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'
import { sendClientNotificationEmail } from '@/lib/resend'
import { ClientNotification } from '@/types'

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

  const { message } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const notification: ClientNotification = {
    id: uuidv4(),
    message: message.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  }

  const existing = project.notifications ?? []
  const updated = await updateProject(id, { notifications: [...existing, notification] })

  if (!updated) {
    return NextResponse.json({ error: 'Failed to save notification' }, { status: 500 })
  }

  sendClientNotificationEmail({
    businessName: project.businessName,
    ownerName: project.ownerName,
    email: project.email,
    message: message.trim(),
    clientToken: project.clientToken,
  }).catch((err) => console.error('Failed to send notification email:', err))

  return NextResponse.json({ success: true, notification })
}
