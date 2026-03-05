import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken, updateProject } from '@/lib/db'
import { createAddonCheckoutSession, createPlanUpgradeCheckoutSession } from '@/lib/stripe'
import { Plan } from '@/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = getProjectByClientToken(clientToken)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await req.json()
  const { type, addonId, addonLabel, newPlan } = body

  // Track upsell click
  const clicks = project.upsellClicks ?? []
  const clickLabel = type === 'addon' ? `addon:${addonId}` : `upgrade:${newPlan}`
  if (!clicks.includes(clickLabel)) {
    updateProject(project.id, { upsellClicks: [...clicks, clickLabel] })
  }

  try {
    let checkoutUrl: string

    if (type === 'addon' && addonId) {
      checkoutUrl = await createAddonCheckoutSession({
        projectId: project.id,
        clientToken: project.clientToken,
        addonId,
        addonLabel: addonLabel ?? addonId,
        email: project.email,
      })
    } else if (type === 'upgrade' && newPlan) {
      checkoutUrl = await createPlanUpgradeCheckoutSession({
        projectId: project.id,
        clientToken: project.clientToken,
        newPlan: newPlan as Plan,
        businessName: project.businessName,
        email: project.email,
      })
    } else {
      return NextResponse.json({ error: 'Invalid upsell type' }, { status: 400 })
    }

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('Upsell checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
