import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getProjectByClientToken, updateProject } from '@/lib/db'
import { sendAdminChangeRequestEmail } from '@/lib/resend'
import { ChangeRequest } from '@/types'
import { Resend } from 'resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

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
  const updated = updateProject(project.id, {
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
  const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'
  resend.emails.send({
    from: FROM,
    to: project.email,
    subject: `We received your request: ${project.businessName}`,
    html: `<div style="font-family: monospace; background: #080c10; color: #e0e0e0; padding: 32px; border-radius: 8px; max-width: 600px;"><h1 style="color: #00ff88; font-size: 22px; margin-bottom: 8px;">Request Received</h1><p style="color: #8ab8b5; margin-bottom: 8px;">Hi ${project.ownerName},</p><p style="color: #e0e0e0; margin-bottom: 16px;">We have received your change request for <strong>${project.businessName}</strong>. Our team is reviewing it and will be in touch shortly.</p><div style="background: #0d1117; border-left: 3px solid #00ff88; padding: 16px; margin-bottom: 24px; border-radius: 4px;"><p style="color: #8ab8b5; font-size: 12px; margin-bottom: 6px;">Your Request</p><p style="color: #e0e0e0; font-size: 14px; margin: 0;">${message.trim()}</p></div><p style="color: #5a6a7a; font-size: 13px;">Thank you for choosing Mantis Tech.</p></div>`,
  }).catch(() => { /* non-fatal */ })

  return NextResponse.json({ success: true, changeRequest: newRequest })
}
