import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { readProjects } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = (await readProjects()).map((p) => ({
    id: p.id,
    businessName: p.businessName,
    ownerName: p.ownerName,
    email: p.email,
    plan: p.plan,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    addons: p.addons,
    adminNotes: p.adminNotes,
  }))

  // Sort newest first
  projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ projects })
}
