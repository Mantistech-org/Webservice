import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { readProjects, writeProjects } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { businessName, ownerName, email, phone, businessType, location, plan, businessDescription, primaryGoal, timeline, stylePreference } = body

  if (!businessName || !ownerName || !email || !businessType || !location || !plan || !businessDescription || !primaryGoal || !timeline || !stylePreference) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const projects = readProjects()
  const id = crypto.randomUUID()
  const adminToken = crypto.randomBytes(24).toString('hex')
  const clientToken = crypto.randomBytes(24).toString('hex')
  const now = new Date().toISOString()

  const project = {
    id,
    adminToken,
    clientToken,
    status: 'admin_review' as const,
    createdAt: now,
    updatedAt: now,
    businessName,
    ownerName,
    email,
    phone: phone ?? '',
    businessType,
    location,
    currentWebsite: '',
    businessDescription,
    primaryGoal,
    timeline,
    stylePreference,
    specificFeatures: '',
    additionalNotes: '',
    addons: [],
    plan,
    generatedHtml: '',
    adminNotes: '',
    uploadedFiles: [],
    changeRequests: [],
    notifications: [],
    upsellClicks: [],
  }

  projects.push(project)
  writeProjects(projects)

  const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/client/dashboard/${clientToken}`
  const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your Mantis Tech dashboard is ready',
    html: `<p>Hi ${ownerName},</p><p>Your Mantis Tech client dashboard has been created. You can access it here:</p><p><a href="${dashboardUrl}">${dashboardUrl}</a></p><p>Keep this link safe. It is your personal access link.</p>`,
  })

  return NextResponse.json({ success: true, projectId: id })
}
