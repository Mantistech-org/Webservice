import { NextRequest, NextResponse } from 'next/server'
import { readProjects, updateProject } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientToken: string }> }) {
  const { clientToken } = await params
  const projects = await readProjects()
  const project = projects.find((p) => p.clientToken === clientToken)

  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const body = await req.json()
  const { ownerName, email, phone } = body

  if (!ownerName || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  await updateProject(project.id, { ownerName, email, phone: phone ?? '' })

  return NextResponse.json({ success: true })
}
