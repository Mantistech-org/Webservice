import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendNewLeadEmail } from '@/lib/resend'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params

  const project = await getProjectByClientToken(clientToken)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404, headers: CORS })
  }

  if (!pgEnabled) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503, headers: CORS }
    )
  }

  const body = await req.json().catch(() => ({}))
  const name    = typeof body.name    === 'string' ? body.name.trim()    : null
  const email   = typeof body.email   === 'string' ? body.email.trim()   : null
  const phone   = typeof body.phone   === 'string' ? body.phone.trim()   : null
  const message = typeof body.message === 'string' ? body.message.trim() : null
  const source  = typeof body.source  === 'string' ? body.source.trim()  : 'contact_form'

  await query(
    `INSERT INTO public.leads (project_id, name, email, phone, message, source)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [project.id, name, email, phone, message, source]
  )

  sendNewLeadEmail({
    projectId: project.id,
    businessName: project.businessName,
    leadName: name ?? '',
    leadEmail: email ?? '',
    leadPhone: phone ?? undefined,
    leadMessage: message ?? undefined,
    source,
  }).catch((err) => console.error('[leads] Failed to send lead email:', err))

  return NextResponse.json({ success: true }, { status: 201, headers: CORS })
}
