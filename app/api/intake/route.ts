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
  try {
    const body = await req.json()

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
    if (!businessName || !ownerName || !email || !businessType || !location || !businessDescription || !primaryGoal || !timeline || !stylePreference || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validPlans: Plan[] = ['starter', 'mid', 'pro']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const projectId = uuidv4()
    const adminToken = uuidv4()
    const clientToken = uuidv4()

    // Save uploaded photos
    const uploadedFiles: string[] = []
    if (Array.isArray(photos) && photos.length > 0) {
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
    }

    // Build project object (without generated HTML yet)
    const project: Project = {
      id: projectId,
      adminToken,
      clientToken,
      status: 'admin_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessName,
      ownerName,
      email,
      phone: phone ?? '',
      businessType,
      location,
      currentWebsite: currentWebsite ?? '',
      businessDescription,
      primaryGoal,
      timeline,
      stylePreference,
      specificFeatures: specificFeatures ?? '',
      additionalNotes: additionalNotes ?? '',
      addons: Array.isArray(addons) ? addons : [],
      customAddons: Array.isArray(customAddons) ? (customAddons as Array<{ name: string; description: string; budget: string }>).map((ca) => ({
        id: uuidv4(),
        name: ca.name,
        description: ca.description,
        budget: ca.budget,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      })) : [],
      referredBy: typeof referredBy === 'string' && referredBy ? referredBy : undefined,
      plan,
      requestedPages: typeof requestedPages === 'number' ? requestedPages : undefined,
      generatedHtml: '',
      adminNotes: '',
      uploadedFiles,
    }

    // Generate website with Claude
    const generatedHtml = await generateWebsite(project)

    project.generatedHtml = generatedHtml

    // Save to JSON db
    saveProject(project)

    // Notify admin (non-blocking — don't fail the request if email fails)
    sendAdminNewProjectEmail({
      projectId,
      adminToken,
      businessName,
      ownerName,
      plan,
    }).catch((err) => console.error('Failed to send admin email:', err))

    return NextResponse.json({ success: true, projectId }, { status: 201 })
  } catch (error) {
    console.error('Intake error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
