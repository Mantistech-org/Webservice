import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params

  const campaigns = await query(
    `SELECT * FROM public.lead_campaigns WHERE id = $1`,
    [id]
  )
  if ((campaigns as unknown[]).length === 0) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
  }

  const emailSteps = await query(
    `SELECT * FROM public.lead_campaign_emails WHERE campaign_id = $1 ORDER BY step_number`,
    [id]
  )

  const sends = await query(
    `SELECT s.*, ol.business_name
     FROM public.lead_campaign_sends s
     LEFT JOIN public.outreach_leads ol ON ol.id::text = s.lead_id
     WHERE s.campaign_id = $1
     ORDER BY s.sent_at DESC`,
    [id]
  )

  return NextResponse.json({
    campaign: (campaigns as unknown[])[0],
    email_steps: emailSteps,
    sends,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body as { status?: string }

  if (!status) {
    return NextResponse.json({ error: 'status is required.' }, { status: 400 })
  }

  const rows = await query(
    `UPDATE public.lead_campaigns SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  )

  if ((rows as unknown[]).length === 0) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
  }

  return NextResponse.json({ campaign: (rows as unknown[])[0] })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params

  await query(`DELETE FROM public.lead_campaigns WHERE id = $1`, [id])

  return NextResponse.json({ success: true })
}
