import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'
import { sendCustomAddonPricedEmail } from '@/lib/resend'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { addonId, monthlyPrice } = await req.json()
  if (!addonId || typeof monthlyPrice !== 'number' || monthlyPrice <= 0) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const project = await getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const customAddons = (project.customAddons ?? []).map((a) =>
    a.id === addonId ? { ...a, status: 'priced' as const, monthlyPrice } : a
  )
  const updated = await updateProject(id, { customAddons })
  if (!updated) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  const addon = customAddons.find((a) => a.id === addonId)
  if (addon) {
    sendCustomAddonPricedEmail({
      businessName: project.businessName,
      ownerName: project.ownerName,
      email: project.email,
      clientToken: project.clientToken,
      addonName: addon.name,
      monthlyPrice,
    }).catch(() => { /* non-fatal */ })
  }
  return NextResponse.json({ success: true, project: updated })
}
