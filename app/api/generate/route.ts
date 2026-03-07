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

  const { projectId } = body
  if (!projectId || typeof projectId !== 'string') {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })
  }

  const project = await getProject(projectId)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  try {
    const html = await generateWebsite(project)
    project.generatedHtml = html
    project.updatedAt = new Date().toISOString()
    await saveProject(project)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error(`[generate] Failed for project ${projectId}:`, err)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
