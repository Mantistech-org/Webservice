import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendNewLeadEmail } from '@/lib/resend'
import { rateLimit } from '@/lib/rate-limit'

// Restrict CORS to the production domain only — wildcard (*) would allow any
// third-party site to submit fake leads to any client's dashboard.
const ALLOWED_ORIGINS = new Set([
  'https://mantistech.org',
  'https://www.mantistech.org',
])

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://mantistech.org'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const origin = req.headers.get('origin')
  const CORS = corsHeaders(origin)

  const limited = rateLimit(req, 10, 60 * 60 * 1000) // 10/IP/hour
  if (limited) return new NextResponse(limited.body, { status: 429, headers: { ...Object.fromEntries(limited.headers), ...CORS } })

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
