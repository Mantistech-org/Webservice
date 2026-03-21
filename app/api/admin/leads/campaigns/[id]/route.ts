import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// GET /api/admin/leads/campaigns/[id] — get campaign with per-lead statuses
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

  try {
    const campaigns = await query(
      `SELECT c.*, t.name AS template_name, t.subject, t.body
       FROM public.email_campaigns c
       LEFT JOIN public.email_templates t ON t.id = c.template_id
       WHERE c.id = $1`,
      [id]
    )
    if (campaigns.length === 0) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }

    const leads = await query(
      `SELECT cl.*, ol.business_name, ol.email, ol.address, ol.phone, ol.website
       FROM public.campaign_leads cl
       JOIN public.outreach_leads ol ON ol.id = cl.lead_id
       WHERE cl.campaign_id = $1
       ORDER BY cl.status, ol.business_name`,
      [id]
    )

    return NextResponse.json({ campaign: campaigns[0], leads })
  } catch (err) {
    console.error('[campaigns] GET [id] failed:', err)
    return NextResponse.json({ error: 'Failed to load campaign.' }, { status: 500 })
  }
}

// PATCH /api/admin/leads/campaigns/[id] — update status or limits
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
  const allowed = ['status', 'daily_limit', 'weekly_limit', 'scheduled_at']

  const sets: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      values.push(body[key])
      sets.push(`${key} = $${values.length}`)
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  values.push(new Date().toISOString())
  sets.push(`updated_at = $${values.length}`)
  values.push(id)

  try {
    const rows = await query(
      `UPDATE public.email_campaigns SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
    }
    return NextResponse.json({ campaign: rows[0] })
  } catch (err) {
    console.error('[campaigns] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update campaign.' }, { status: 500 })
  }
}
