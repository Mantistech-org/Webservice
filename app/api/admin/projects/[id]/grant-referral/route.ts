import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject, getProjectByClientToken } from '@/lib/db'
import { Resend } from 'resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const project = getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  if (!project.referredBy) return NextResponse.json({ error: 'No referral on this project.' }, { status: 400 })
  const updated = updateProject(id, { referralRewardGranted: true })
  const referrer = getProjectByClientToken(project.referredBy)
  if (referrer) {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
    const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    await resend.emails.send({
      from: FROM,
      to: referrer.email,
      subject: 'Your referral reward has been applied',
      html: `<p>Hi ${referrer.ownerName},</p><p>Someone you referred has signed up with Mantis Tech. As a thank you, we are applying a free month to your next billing cycle.</p><p><a href="${BASE_URL}/client/dashboard/${referrer.clientToken}">View your dashboard</a></p>`,
    }).catch(() => { /* non-fatal */ })
  }
  return NextResponse.json({ success: true, project: updated })
}
