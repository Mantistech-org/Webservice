import { NextRequest, NextResponse } from 'next/server'
import { getProject, saveProject } from '@/lib/db'
import { generateWebsite } from '@/lib/anthropic'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { projectId, overrideNotes } = body
  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const notes = typeof overrideNotes === 'string' && overrideNotes.trim() ? overrideNotes.trim() : undefined

  // Capture original status to restore after generation completes or fails
  const originalStatus = project.status

  // Mark as generating and persist before returning
  project.status = 'generating'
  project.updatedAt = new Date().toISOString()
  await saveProject(project)

  // Fire-and-forget: generation runs in the background after the 202 response
  ;(async () => {
    try {
      const html = await generateWebsite(project, notes)
      project.generatedHtml = html
      project.status = originalStatus
      project.updatedAt = new Date().toISOString()
      await saveProject(project)
    } catch (err) {
      console.error(`[generate] Failed for project ${projectId}:`, err)
      project.status = originalStatus
      project.updatedAt = new Date().toISOString()
      await saveProject(project)
    }
  })()

  return NextResponse.json({ success: true }, { status: 202 })
}
