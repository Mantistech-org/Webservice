import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { Project, Plan } from '@/types'
import { saveProject } from '@/lib/db'
import { generateWebsite } from '@/lib/anthropic'
import { sendAdminNewProjectEmail } from '@/lib/resend'

// No maxDuration needed — response returns immediately now
export const maxDuration = 30

export async function POST(req: NextRequest) {
  console.log('[intake] POST /api/intake — start', new Date().toISOString())

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
    console.log('[intake] Body parsed successfully')
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

  // ── Validate required fields ────────────────────────────────────────────────
  const missing = [
    !businessName && 'businessName',
    !ownerName && 'ownerName',
    !email && 'email',
    !businessType && 'businessType',
    !location && 'location',
    !businessDescription && 'businessDescription',
    !primaryGoal && 'primaryGoal',
    !timeline && 'timeline',
    !stylePreference && 'stylePreference',
    !plan && 'plan',
  ].filter(Boolean)

  if (missing.length > 0) {
    console.error('[intake] Missing required fields:', missing)
    return NextResponse.json({ error: 'Missing required fields', missing }, { status: 400 })
  }
  console.log('[intake] Validation passed')

  const validPlans: Plan[] = ['starter', 'mid', 'pro']
  if (!validPlans.includes(plan as Plan)) {
    console.error('[intake] Invalid plan:', plan)
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }
  console.log('[intake] Plan valid:', plan)

  // Log env key presence (never log the value)
  console.log('[intake] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)

  // ── Generate IDs ────────────────────────────────────────────────────────────
  const projectId = uuidv4()
  const adminToken = uuidv4()
  const clientToken = uuidv4()
  console.log(`[intake] Project ID generated: ${projectId}`)

  // ── Save uploaded photos (best-effort) ─────────────────────────────────────
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

  // ── Build project object ────────────────────────────────────────────────────
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
  console.log(`[intake] Project object built for "${project.businessName}"`)

  // ── Step 1: Save project immediately ───────────────────────────────────────
  try {
    saveProject(project)
    console.log(`[intake] Project saved to DB (id=${projectId})`)
  } catch (dbErr) {
    console.error('[intake] Failed to save project to DB:', dbErr)
    return NextResponse.json(
      { error: 'Failed to save your project. Please try again.' },
      { status: 500 }
    )
  }

  // ── Step 2: Fire-and-forget AI generation ──────────────────────────────────
  // DO NOT await this — return success to the client immediately.
  // Railway kills requests at 30s; AI generation takes 30-90s.
  // The generation runs in the background after the response is sent.
  console.log(`[intake] Kicking off background AI generation for ${projectId}`)
  generateWebsite(project)
    .then((html) => {
      console.log(`[intake:bg] AI generation succeeded for ${projectId}, saving HTML`)
      project.generatedHtml = html
      project.updatedAt = new Date().toISOString()
      saveProject(project)
      console.log(`[intake:bg] Project updated with generated HTML (id=${projectId})`)
    })
    .catch((err) => {
      console.error(`[intake:bg] AI generation failed for ${projectId}:`, err)
      // Project is already saved without HTML — admin will generate manually
    })

  // ── Step 3: Notify admin (fire-and-forget) ─────────────────────────────────
  sendAdminNewProjectEmail({
    projectId,
    adminToken,
    businessName: businessName as string,
    ownerName: ownerName as string,
    plan: plan as Plan,
  }).catch((err) => console.error('[intake] Failed to send admin email:', err))

  // ── Step 4: Return success immediately ─────────────────────────────────────
  console.log(`[intake] Returning 201 success to client immediately (id=${projectId})`)
  return NextResponse.json(
    {
      success: true,
      projectId,
    },
    { status: 201 }
  )
}
