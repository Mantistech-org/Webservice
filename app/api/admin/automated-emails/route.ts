import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// GET — all campaigns with their emails and enrollment/send counts
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
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

    return NextResponse.json({ success: true, campaignId: campaign.id })
  } catch (err) {
    console.error('[admin/automated-emails] POST error:', err)
    return NextResponse.json({ error: 'Failed to create campaign.' }, { status: 500 })
  }
}
