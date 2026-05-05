import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id: campaignId } = await params
  const { lead_ids } = (await req.json()) as { lead_ids: string[] }

  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids is required.' }, { status: 400 })
  }

  let added = 0
  let skipped = 0

  for (const leadId of lead_ids) {
    const rows = await query<{ email: string | null }>(
      `SELECT email FROM public.outreach_leads WHERE id = $1`,
      [leadId]
    )
    const email = rows[0]?.email
    if (!email) {
      skipped++
      continue
    }

    const existing = await query(
      `SELECT id FROM public.lead_campaign_sends WHERE campaign_id = $1 AND lead_id = $2 AND step_number = 1`,
      [campaignId, leadId]
    )
    if (existing.length > 0) {
      skipped++
      continue
    }

    await query(
      `INSERT INTO public.lead_campaign_sends (campaign_id, lead_id, lead_email, step_number)
       VALUES ($1, $2, $3, 1)`,
      [campaignId, leadId, email]
    )
    added++
  }

  return NextResponse.json({ success: true, added, skipped })
}
