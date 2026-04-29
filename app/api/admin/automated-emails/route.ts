import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// ── Schema init ───────────────────────────────────────────────────────────────

let schemaReady = false

async function ensureSchema() {
  if (schemaReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS public.email_campaigns (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      audience text NOT NULL,
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS public.campaign_emails (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
      step_number int NOT NULL,
      days_after_enrollment int NOT NULL DEFAULT 0,
      subject text NOT NULL,
      body text NOT NULL
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS public.campaign_enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
      lead_email text NOT NULL,
      lead_name text,
      enrolled_at timestamptz NOT NULL DEFAULT now(),
      current_step int NOT NULL DEFAULT 0,
      completed boolean NOT NULL DEFAULT false
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS public.campaign_sends (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      enrollment_id uuid NOT NULL REFERENCES public.campaign_enrollments(id) ON DELETE CASCADE,
      step_number int NOT NULL,
      sent_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  schemaReady = true
}

// GET — all campaigns with their emails and enrollment/send counts
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
    await ensureSchema()

    const campaigns = await query<{
      id: string
      name: string
      audience: string
      status: string
      created_at: string
      enrollment_count: string
      sent_count: string
    }>(
      `SELECT
         c.id,
         c.name,
         c.audience,
         c.status,
         c.created_at,
         COUNT(DISTINCT e.id) AS enrollment_count,
         COUNT(DISTINCT s.id) AS sent_count
       FROM public.email_campaigns c
       LEFT JOIN public.campaign_enrollments e ON e.campaign_id = c.id
       LEFT JOIN public.campaign_sends s ON s.enrollment_id = e.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    )

    const emails = await query<{
      id: string
      campaign_id: string
      step_number: number
      days_after_enrollment: number
      subject: string
      body: string
    }>(
      `SELECT id, campaign_id, step_number, days_after_enrollment, subject, body
       FROM public.campaign_emails
       ORDER BY campaign_id, step_number`
    )

    const emailsByCampaign = emails.reduce<Record<string, typeof emails>>((acc, e) => {
      if (!acc[e.campaign_id]) acc[e.campaign_id] = []
      acc[e.campaign_id].push(e)
      return acc
    }, {})

    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        audience: c.audience,
        status: c.status,
        created_at: c.created_at,
        emails: (emailsByCampaign[c.id] ?? []).map(({ campaign_id: _cid, ...e }) => e),
        enrollmentCount: Number(c.enrollment_count),
        sentCount: Number(c.sent_count),
      })),
    })
  } catch (err) {
    console.error('[admin/automated-emails] GET error:', err)
    return NextResponse.json({ campaigns: [] })
  }
}

// POST — create a new campaign with its email steps
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { name, audience, emails } = await req.json()

  if (!name || !audience || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  try {
    await ensureSchema()

    const [campaign] = await query<{ id: string }>(
      `INSERT INTO public.email_campaigns (name, audience)
       VALUES ($1, $2)
       RETURNING id`,
      [name, audience]
    )

    await Promise.all(
      emails.map((e: { step_number: number; days_after_enrollment: number; subject: string; body: string }) =>
        query(
          `INSERT INTO public.campaign_emails (campaign_id, step_number, days_after_enrollment, subject, body)
           VALUES ($1, $2, $3, $4, $5)`,
          [campaign.id, e.step_number, e.days_after_enrollment, e.subject, e.body]
        )
      )
    )

    // Enroll all existing demo leads that match the campaign audience
    const audienceFilter = audience === 'engaged' ? 'WHERE engaged = true' : ''

    const existingLeads = await query<{ email: string; business_name: string }>(
      `SELECT email, business_name FROM public.demo_leads ${audienceFilter}`
    )

    for (const lead of existingLeads) {
      await query(
        `INSERT INTO public.campaign_enrollments (campaign_id, lead_email, lead_name, current_step, completed)
         VALUES ($1, $2, $3, 0, false)
         ON CONFLICT DO NOTHING`,
        [campaign.id, lead.email, lead.business_name ?? null]
      )
    }

    return NextResponse.json({ success: true, campaignId: campaign.id })
  } catch (err) {
    console.error('[admin/automated-emails] POST error:', err)
    console.error('[automated-emails] POST error details:', JSON.stringify(err))
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 })
  }
}
