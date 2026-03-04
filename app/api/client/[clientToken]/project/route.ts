import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    project: {
      businessName: project.businessName,
      ownerName: project.ownerName,
      email: project.email,
      plan: project.plan,
      status: project.status,
      addons: project.addons,
      clientToken: project.clientToken,
    },
  })
}
