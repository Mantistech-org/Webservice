import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken, readProjects } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const allProjects = readProjects()
  const convertedReferrals = allProjects
    .filter((p) => p.referredBy === project.clientToken)
    .map((p) => ({ businessName: p.businessName, date: p.createdAt }))

  return NextResponse.json({
    project: {
      id: project.id,
      businessName: project.businessName,
      ownerName: project.ownerName,
      email: project.email,
      plan: project.plan,
      status: project.status,
      addons: project.addons,
      clientToken: project.clientToken,
      hasGeneratedHtml: !!project.generatedHtml,
      changeRequests: project.changeRequests ?? [],
      notifications: project.notifications ?? [],
      upsellClicks: project.upsellClicks ?? [],
      stripeAddonSubscriptions: project.stripeAddonSubscriptions ?? [],
      customAddons: project.customAddons ?? [],
      convertedReferrals,
    },
  })
}
