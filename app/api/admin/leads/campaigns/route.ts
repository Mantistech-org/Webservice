import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.lead_campaigns (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      audience text NOT NULL DEFAULT 'all',
      selected_lead_ids jsonb DEFAULT '[]',
      status text NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS public.lead_campaign_emails (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid NOT NULL REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
      step_number int NOT NULL,
      subject text NOT NULL,
      body text NOT NULL,
      delay_days int NOT NULL DEFAULT 0
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS public.lead_campaign_sends (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid NOT NULL REFERENCES public.lead_campaigns(id) ON DELETE CASCADE,
      lead_id text NOT NULL,
      lead_email text NOT NULL,
      step_number int NOT NULL,
      sent_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ campaigns: [] })
  }

  await ensureSchema()

  const campaigns = await query(`
    SELECT
      c.id, c.name, c.description, c.audience, c.selected_lead_ids, c.status, c.created_at,
      (SELECT COUNT(*) FROM public.lead_campaign_emails WHERE campaign_id = c.id)::int AS email_steps,
      (SELECT COUNT(*) FROM public.lead_campaign_sends WHERE campaign_id = c.id AND step_number = 1)::int AS leads_reached,
      (SELECT COUNT(*) FROM public.lead_campaign_sends WHERE campaign_id = c.id)::int AS total_sends
    FROM public.lead_campaigns c
    ORDER BY c.created_at DESC
  `)

  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  await ensureSchema()

  const body = await req.json()
  const { name, description, audience, selected_lead_ids, emails } = body as {
    name: string
    description?: string
    audience: 'all' | 'selected'
    selected_lead_ids?: string[]
    emails: Array<{ step_number: number; subject: string; body: string; delay_days: number }>
  }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 })
  }
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'At least one email step is required.' }, { status: 400 })
  }

  const campaignRows = await query(
    `INSERT INTO public.lead_campaigns (name, description, audience, selected_lead_ids)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      name.trim(),
      description?.trim() || null,
      audience ?? 'all',
      JSON.stringify(selected_lead_ids ?? []),
    ]
  )
  const campaignId = (campaignRows as Array<{ id: string }>)[0].id

  for (const step of emails) {
    await query(
      `INSERT INTO public.lead_campaign_emails (campaign_id, step_number, subject, body, delay_days)
       VALUES ($1, $2, $3, $4, $5)`,
      [campaignId, step.step_number, step.subject.trim(), step.body.trim(), step.delay_days ?? 0]
    )
  }

  return NextResponse.json({ success: true, campaign_id: campaignId }, { status: 201 })
}
