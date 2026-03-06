import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { readProjects } from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

  // Non-blocking: find project and send email
  try {
    const projects = readProjects()
    const project = projects.find(
      (p) => p.email.toLowerCase() === email.toLowerCase() && p.status === 'active'
    )
    if (project) {
      const link = `${BASE_URL}/client/dashboard/${project.clientToken}`
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Your Mantis Tech Dashboard Link',
        html: `<div style="font-family:monospace;padding:24px;background:#080c10;color:#e0e0e0"><h2 style="color:#00ff88">Your Dashboard Link</h2><p>Hi ${project.ownerName},</p><p>Here is your link to access your Mantis Tech dashboard for ${project.businessName}:</p><a href="${link}" style="display:inline-block;background:#00ff88;color:#080c10;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;margin-top:16px">Access Dashboard</a><p style="color:#5a6a7a;margin-top:24px;font-size:12px">Bookmark this link for easy access in the future.</p></div>`,
      })
    }
  } catch {
    // Silently fail - don't reveal errors
  }

  return NextResponse.json({ success: true })
}
