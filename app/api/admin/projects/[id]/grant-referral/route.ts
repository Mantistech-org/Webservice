import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject, getProjectByClientToken } from '@/lib/db'
import { sendReferralRewardEmail } from '@/lib/resend'

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
    sendReferralRewardEmail({
      ownerName: referrer.ownerName,
      email: referrer.email,
      clientToken: referrer.clientToken,
    }).catch(() => { /* non-fatal */ })
  }
  return NextResponse.json({ success: true, project: updated })
}
