import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, transaction, pgEnabled } from '@/lib/pg'

export interface Campaign {
  id: string
  name: string
  template_id: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused'
  send_mode: 'immediate' | 'scheduled' | 'drip'
  scheduled_at: string | null
  daily_limit: number | null
  weekly_limit: number | null
  sent_count: number
  total_leads: number
  created_at: string
  updated_at: string
  // joined
  template_name?: string
  open_count?: number
  bounce_count?: number
}

// GET /api/admin/leads/campaigns
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
    const campaigns = await query<Campaign>(`
      SELECT
        c.*,
        t.name AS template_name,
        COUNT(cl.id) FILTER (WHERE cl.status = 'opened')  AS open_count,
        COUNT(cl.id) FILTER (WHERE cl.status = 'bounced') AS bounce_count
      FROM public.email_campaigns c
      LEFT JOIN public.email_templates t ON t.id = c.template_id
      LEFT JOIN public.campaign_leads cl ON cl.campaign_id = c.id
      GROUP BY c.id, t.name
      ORDER BY c.created_at DESC
    `)
    return NextResponse.json({ campaigns })
  } catch (err) {
    console.error('[campaigns] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load campaigns.' }, { status: 500 })
  }
}

// POST /api/admin/leads/campaigns — create a new campaign
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await req.json()
  const {
    name,
    template_id,
    lead_ids,
    send_mode = 'immediate',
    scheduled_at,
    daily_limit,
    weekly_limit,
  } = body as {
    name: string
    template_id: string
    lead_ids: string[]
    send_mode: 'immediate' | 'scheduled' | 'drip'
    scheduled_at?: string
    daily_limit?: number
    weekly_limit?: number
  }

  if (!name?.trim()) return NextResponse.json({ error: 'name is required.' }, { status: 400 })
  if (!template_id) return NextResponse.json({ error: 'template_id is required.' }, { status: 400 })
  if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
    return NextResponse.json({ error: 'At least one lead is required.' }, { status: 400 })
  }

  // Filter out leads that have already been emailed
  const alreadyEmailed = await query<{ id: string }>(
    `SELECT id FROM public.outreach_leads WHERE id = ANY($1::uuid[]) AND status = 'emailed'`,
    [lead_ids]
  )
  const emailedSet = new Set(alreadyEmailed.map((r) => r.id))
  const freshLeadIds = lead_ids.filter((id) => !emailedSet.has(id))

  if (freshLeadIds.length === 0) {
    return NextResponse.json({ error: 'All selected leads have already been emailed.' }, { status: 400 })
  }

  let campaignId: string | null = null

  await transaction(async (client) => {
    const campaignRows = await client.query(
      `INSERT INTO public.email_campaigns
         (name, template_id, status, send_mode, scheduled_at, daily_limit, weekly_limit, total_leads)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        name.trim(),
        template_id,
        send_mode === 'scheduled' ? 'scheduled' : 'draft',
        send_mode,
        scheduled_at ?? null,
        daily_limit ?? null,
        weekly_limit ?? null,
        freshLeadIds.length,
      ]
    )
    campaignId = campaignRows.rows[0].id

    for (const leadId of freshLeadIds) {
      await client.query(
        `INSERT INTO public.campaign_leads (campaign_id, lead_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [campaignId, leadId]
      )
    }
  })

  const skipped = emailedSet.size

  return NextResponse.json({ campaign_id: campaignId, total_leads: freshLeadIds.length, skipped }, { status: 201 })
}
