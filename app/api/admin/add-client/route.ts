import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { readProjects, writeProjects } from '@/lib/db'
import { sendDashboardReadyEmail } from '@/lib/resend'
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

  await sendDashboardReadyEmail({ businessName, ownerName, email, clientToken }).catch(() => { /* non-fatal */ })

  return NextResponse.json({ success: true, projectId: id })
}
