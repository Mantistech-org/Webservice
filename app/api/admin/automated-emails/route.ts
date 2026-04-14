import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { sendDemoLeadCampaignEmail } from '@/lib/resend'

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name text NOT NULL,
    subject text NOT NULL,
    body text NOT NULL,
    audience text NOT NULL,
    recipient_count integer NOT NULL DEFAULT 0,
    sent_at timestamptz NOT NULL DEFAULT now()
  )
`

let tableReady = false
async function ensureTable() {
  if (tableReady || !pgEnabled) return
  await query(CREATE_TABLE_SQL)
  tableReady = true
}

// GET — return campaign history
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ campaigns: [] })
  }

  try {
    await ensureTable()
    const campaigns = await query<{
      id: string
      campaign_name: string
      subject: string
      audience: string
      recipient_count: number
      sent_at: string
    }>(
      `SELECT id, campaign_name, subject, audience, recipient_count, sent_at
       FROM public.email_campaigns
       ORDER BY sent_at DESC`
    )
    return NextResponse.json({ campaigns })
  } catch (err) {
    console.error('[admin/automated-emails] GET error:', err)
    return NextResponse.json({ campaigns: [] })
  }
}

// POST — send a campaign
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { campaignName, subject, body, audience } = await req.json()

  if (!campaignName || !subject || !body || !audience) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    await ensureTable()

    // Fetch recipients
    const leads = await query<{ email: string; business_name: string | null }>(
      audience === 'engaged'
        ? `SELECT email, business_name FROM public.demo_leads WHERE engaged = true`
        : `SELECT email, business_name FROM public.demo_leads`
    )

    // Send to each recipient — fire all in parallel, log individual failures
    await Promise.all(
      leads.map((lead) =>
        sendDemoLeadCampaignEmail({
          to: lead.email,
          subject,
          body,
          businessName: lead.business_name,
        }).catch((err) =>
          console.error(`[admin/automated-emails] Failed to send to ${lead.email}:`, err)
        )
      )
    )

    const recipientCount = leads.length

    // Save campaign record
    await query(
      `INSERT INTO public.email_campaigns (campaign_name, subject, body, audience, recipient_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [campaignName, subject, body, audience, recipientCount]
    )

    return NextResponse.json({ success: true, recipientCount })
  } catch (err) {
    console.error('[admin/automated-emails] POST error:', err)
    return NextResponse.json({ error: 'Failed to send campaign.' }, { status: 500 })
  }
}
