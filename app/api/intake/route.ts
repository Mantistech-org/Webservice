import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { Project, Plan } from '@/types'
import { saveProject } from '@/lib/db'
import { generateWebsite } from '@/lib/anthropic'
import { sendAdminNewProjectEmail } from '@/lib/resend'

export const maxDuration = 120 // Allow up to 120s for AI generation

export async function POST(req: NextRequest) {
  console.log('[intake] POST /api/intake — start')

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    console.error('[intake] Failed to parse request body')
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    businessName,
    ownerName,
    email,
    phone,
    businessType,
    location,
    currentWebsite,
    businessDescription,
    primaryGoal,
    timeline,
    stylePreference,
    specificFeatures,
    additionalNotes,
    addons,
    plan,
    photos,
    requestedPages,
    customAddons,
    referredBy,
  } = body

  // Validate required fields
  if (
    !businessName || !ownerName || !email || !businessType ||
    !location || !businessDescription || !primaryGoal ||
    !timeline || !stylePreference || !plan
  ) {
    console.error('[intake] Missing required fields')
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validPlans: Plan[] = ['starter', 'mid', 'pro']
  if (!validPlans.includes(plan as Plan)) {
    console.error('[intake] Invalid plan:', plan)
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // Log env key presence (never log the value)
  console.log('[intake] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)

  const projectId = uuidv4()
  const adminToken = uuidv4()
  const clientToken = uuidv4()

  // Save uploaded photos (best-effort — don't fail the whole request on photo errors)
  const uploadedFiles: string[] = []
  if (Array.isArray(photos) && photos.length > 0) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', projectId)
      fs.mkdirSync(uploadDir, { recursive: true })

      for (let i = 0; i < photos.length && i < 8; i++) {
        const base64Data = photos[i] as string
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        if (!matches) continue

        const mimeType = matches[1]
        const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
        const buffer = Buffer.from(matches[2], 'base64')
        const filename = `photo-${i + 1}.${ext}`
        const filePath = path.join(uploadDir, filename)
        fs.writeFileSync(filePath, buffer)
        uploadedFiles.push(`/uploads/${projectId}/${filename}`)
      }
      console.log(`[intake] Saved ${uploadedFiles.length} photo(s)`)
    } catch (photoErr) {
      console.error('[intake] Photo upload error (non-fatal):', photoErr)
    }
  }

  // Build project object
  const project: Project = {
    id: projectId,
    adminToken,
    clientToken,
    status: 'admin_review',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    businessName: businessName as string,
    ownerName: ownerName as string,
    email: email as string,
    phone: (phone as string) ?? '',
    businessType: businessType as string,
    location: location as string,
    currentWebsite: (currentWebsite as string) ?? '',
    businessDescription: businessDescription as string,
    primaryGoal: primaryGoal as string,
    timeline: timeline as string,
    stylePreference: stylePreference as string,
    specificFeatures: (specificFeatures as string) ?? '',
    additionalNotes: (additionalNotes as string) ?? '',
    addons: Array.isArray(addons) ? (addons as string[]) : [],
    customAddons: Array.isArray(customAddons)
      ? (customAddons as Array<{ name: string; description: string; budget: string }>).map((ca) => ({
          id: uuidv4(),
          name: ca.name,
          description: ca.description,
          budget: ca.budget,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        }))
      : [],
    referredBy: typeof referredBy === 'string' && referredBy ? referredBy : undefined,
    plan: plan as Plan,
    requestedPages: typeof requestedPages === 'number' ? requestedPages : undefined,
    generatedHtml: '',
    adminNotes: '',
    uploadedFiles,
  }

  // ── Step 1: Save the project immediately so it is never lost ──────────────
  try {
    saveProject(project)
    console.log(`[intake] Project saved (id=${projectId}) before AI generation`)
  } catch (dbErr) {
    console.error('[intake] Failed to save project:', dbErr)
    return NextResponse.json(
      { error: 'Failed to save your project. Please try again.' },
      { status: 500 }
    )
  }

  // ── Step 2: Attempt AI website generation (non-blocking on failure) ───────
  let aiSucceeded = false
  try {
    console.log(`[intake] Calling generateWebsite for project ${projectId}`)
    const generatedHtml = await generateWebsite(project)
    project.generatedHtml = generatedHtml
    project.updatedAt = new Date().toISOString()

    // Save again with HTML
    saveProject(project)
    aiSucceeded = true
    console.log(`[intake] AI generation succeeded for project ${projectId}`)
  } catch (aiErr) {
    // Log the full error but don't fail the request — project is already saved
    console.error(`[intake] AI generation failed for project ${projectId}:`, aiErr)
    // Leave generatedHtml as empty string; admin will be alerted via the project
  }

  // ── Step 3: Notify admin ──────────────────────────────────────────────────
  sendAdminNewProjectEmail({
    projectId,
    adminToken,
    businessName: businessName as string,
    ownerName: ownerName as string,
    plan: plan as Plan,
  }).catch((err) => console.error('[intake] Failed to send admin email:', err))

  console.log(`[intake] Returning success (aiSucceeded=${aiSucceeded})`)

  return NextResponse.json(
    {
      success: true,
      projectId,
      aiGenerated: aiSucceeded,
      // If AI failed, tell the frontend so it can show an appropriate message
      message: aiSucceeded
        ? undefined
        : 'Your project has been received. Our team will have your website ready shortly.',
    },
    { status: 201 }
  )
}
