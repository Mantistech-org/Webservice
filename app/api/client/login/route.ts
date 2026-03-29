import { NextRequest, NextResponse } from 'next/server'
import { readProjects } from '@/lib/db'
import { sendClientDashboardLinkEmail } from '@/lib/resend'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 10, 60 * 60 * 1000) // 10/IP/hour
  if (limited) return limited

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  // Non-blocking: find project and send email
  try {
    const projects = await readProjects()
    const project = projects.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.status === 'active'
    )
    if (project) {
      await sendClientDashboardLinkEmail({
        businessName: project.businessName,
        ownerName: project.ownerName,
        email: project.email,
        clientToken: project.clientToken,
      })
    }
  } catch {
    // Silently fail - don't reveal errors
  }

  return NextResponse.json({ success: true })
}
