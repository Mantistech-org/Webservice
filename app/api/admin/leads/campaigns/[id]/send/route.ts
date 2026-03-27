import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { Resend } from 'resend'
import { getApiKey } from '@/lib/api-keys'

const OUTREACH_FROM = 'Mantis Tech <support@mantistech.org>'

function applyVariables(text: string, vars: Record<string, string>): string {
  // Support both [Variable] bracket syntax and {{variable}} curly syntax
  return text
    .replace(/\[Name\]/g, vars.name ?? '[Name]')
    .replace(/\[Location\]/g, vars.location ?? '[Location]')
    .replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function buildEmailHtml(body: string): string {
  const paragraphs = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 16px 0;">${line}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#000000;line-height:1.6;">
  <div style="max-width:600px;padding:40px 24px;">
    ${paragraphs}
    <p style="margin:32px 0 0 0;font-size:13px;color:#666666;">Mantis Tech - Web Design &amp; Digital Marketing</p>
  </div>
</body>
</html>`
}

// POST /api/admin/leads/campaigns/[id]/send — trigger send for immediate/drip campaigns
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

  const resendKey = await getApiKey('resend')
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  // dailyOverride lets the admin manually override the drip limit for this run
  const dailyOverride = body?.daily_override ? Number(body.daily_override) : null

  // Load campaign + template
  const campaigns = await query<{
    id: string
    name: string
    status: string
    send_mode: string
    daily_limit: number | null
    weekly_limit: number | null
    sent_count: number
    template_id: string | null
  }>(
    'SELECT * FROM public.email_campaigns WHERE id = $1',
    [id]
  )

  if (campaigns.length === 0) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
  }

  const campaign = campaigns[0]

  if (campaign.status === 'completed') {
    return NextResponse.json({ error: 'Campaign is already completed.' }, { status: 400 })
  }

  if (!campaign.template_id) {
    return NextResponse.json({ error: 'Campaign has no template.' }, { status: 400 })
  }

  const templates = await query<{ subject: string; body: string }>(
    'SELECT subject, body FROM public.email_templates WHERE id = $1',
    [campaign.template_id]
  )

  if (templates.length === 0) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  const template = templates[0]

  // Determine how many emails to send this run
  let sendLimit: number | null = null

  if (campaign.send_mode === 'drip') {
    const effectiveDaily = dailyOverride ?? campaign.daily_limit
    if (effectiveDaily) sendLimit = effectiveDaily

    // Check weekly limit
    if (campaign.weekly_limit) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const weekSent = await query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM public.campaign_leads
         WHERE campaign_id = $1 AND status = 'sent' AND sent_at >= $2`,
        [id, weekStart.toISOString()]
      )
      const sentThisWeek = parseInt(weekSent[0]?.count ?? '0', 10)
      const weeklyRemaining = campaign.weekly_limit - sentThisWeek
      if (weeklyRemaining <= 0) {
        return NextResponse.json({ sent: 0, message: 'Weekly send limit reached.' })
      }
      sendLimit = sendLimit ? Math.min(sendLimit, weeklyRemaining) : weeklyRemaining
    }
  }

  // Load pending leads (with email address)
  let pendingQuery = `
    SELECT cl.id AS campaign_lead_id, cl.lead_id, ol.business_name, ol.email,
           ol.address, ol.location_searched
    FROM public.campaign_leads cl
    JOIN public.outreach_leads ol ON ol.id = cl.lead_id
    WHERE cl.campaign_id = $1 AND cl.status = 'pending' AND ol.email IS NOT NULL AND ol.email != ''
    ORDER BY cl.id
  `
  if (sendLimit) pendingQuery += ` LIMIT ${sendLimit}`

  const pending = await query<{
    campaign_lead_id: string
    lead_id: string
    business_name: string
    email: string
    address: string | null
    location_searched: string | null
  }>(pendingQuery, [id])

  if (pending.length === 0) {
    // Check if all leads are processed
    const remaining = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.campaign_leads WHERE campaign_id = $1 AND status = 'pending'`,
      [id]
    )
    const remainingCount = parseInt(remaining[0]?.count ?? '0', 10)
    if (remainingCount === 0) {
      await query(
        `UPDATE public.email_campaigns SET status = 'completed', updated_at = now() WHERE id = $1`,
        [id]
      )
    }
    return NextResponse.json({ sent: 0, message: 'No leads with email addresses pending.' })
  }

  // Mark campaign as sending
  await query(
    `UPDATE public.email_campaigns SET status = 'sending', updated_at = now() WHERE id = $1`,
    [id]
  )

  const resend = new Resend(resendKey)
  let sent = 0
  let failed = 0

  for (const lead of pending) {
    const location = lead.location_searched ?? lead.address ?? ''
    const vars = {
      name: lead.business_name,
      location,
      business_name: lead.business_name, // legacy {{business_name}} support
    }
    const subject = applyVariables(template.subject, vars)
    const bodyText = applyVariables(template.body, vars)

    try {
      const result = await resend.emails.send({
        from: OUTREACH_FROM,
        to: lead.email,
        subject,
        html: buildEmailHtml(bodyText),
      })

      const resendId = result.data?.id ?? null

      await query(
        `UPDATE public.campaign_leads
         SET status = 'sent', sent_at = now(), resend_id = $1
         WHERE id = $2`,
        [resendId, lead.campaign_lead_id]
      )

      // Mark lead as emailed
      await query(
        `UPDATE public.outreach_leads
         SET status = 'emailed', last_emailed_at = now(), updated_at = now()
         WHERE id = $1`,
        [lead.lead_id]
      )

      sent++
    } catch (err) {
      console.error('[campaign/send] failed to send to', lead.email, err)
      await query(
        `UPDATE public.campaign_leads SET status = 'bounced', bounced_at = now() WHERE id = $1`,
        [lead.campaign_lead_id]
      )
      failed++
    }
  }

  // Update sent_count and check completion
  await query(
    `UPDATE public.email_campaigns
     SET sent_count = sent_count + $1, updated_at = now()
     WHERE id = $2`,
    [sent, id]
  )

  // If immediate mode or all leads processed, mark completed
  if (campaign.send_mode === 'immediate') {
    const stillPending = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.campaign_leads WHERE campaign_id = $1 AND status = 'pending'`,
      [id]
    )
    const remaining = parseInt(stillPending[0]?.count ?? '0', 10)
    const finalStatus = remaining === 0 ? 'completed' : 'sending'
    await query(
      `UPDATE public.email_campaigns SET status = $1, updated_at = now() WHERE id = $2`,
      [finalStatus, id]
    )
  } else {
    await query(
      `UPDATE public.email_campaigns SET status = 'paused', updated_at = now() WHERE id = $1`,
      [id]
    )
  }

  return NextResponse.json({ sent, failed })
}
