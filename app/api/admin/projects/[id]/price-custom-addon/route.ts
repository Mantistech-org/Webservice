import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getProject, updateProject } from '@/lib/db'
import { Resend } from 'resend'

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
  const project = getProject(id)
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  const customAddons = (project.customAddons ?? []).map((a) =>
    a.id === addonId ? { ...a, status: 'priced' as const, monthlyPrice } : a
  )
  const updated = updateProject(id, { customAddons })
  if (!updated) return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  const addon = customAddons.find((a) => a.id === addonId)
  if (addon) {
    const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
    const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    await resend.emails.send({
      from: FROM,
      to: project.email,
      subject: `Custom Add-On Pricing Ready: ${addon.name}`,
      html: `<p>Hi ${project.ownerName},</p><p>We have reviewed your request for <strong>${addon.name}</strong> and have set a price of <strong>$${monthlyPrice}/mo</strong>.</p><p>Log in to your dashboard to accept or decline: <a href="${BASE_URL}/client/dashboard/${project.clientToken}">${BASE_URL}/client/dashboard/${project.clientToken}</a></p>`,
    }).catch(() => { /* non-fatal */ })
  }
  return NextResponse.json({ success: true, project: updated })
}
