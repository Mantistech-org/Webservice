import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { Resend } from 'resend'
import { getApiKey } from '@/lib/api-keys'

// POST /api/admin/leads/process-campaigns
// Called by Vercel Cron (see vercel.json) to process scheduled and drip campaigns.
// Can also be called manually with the CRON_SECRET header.

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
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 16px 0;">${l}</p>`)
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

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = await getApiKey('cron_secret')
  const authHeader = req.headers.get('authorization')
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ message: 'Database not configured.' })
  }

  const resendKey = await getApiKey('resend')
  if (!resendKey) {
    return NextResponse.json({ message: 'RESEND_API_KEY not configured.' })
  }

  const resend = new Resend(resendKey)
  const now = new Date().toISOString()
  const results: Array<{ campaign_id: string; sent: number; failed: number }> = []

  // 1. Scheduled campaigns whose time has arrived
  const scheduled = await query<{ id: string }>(
    `SELECT id FROM public.email_campaigns
     WHERE status = 'scheduled' AND send_mode = 'scheduled' AND scheduled_at <= $1`,
    [now]
  )

  // 2. Drip campaigns that are in draft/paused state
  const drip = await query<{ id: string }>(
    `SELECT id FROM public.email_campaigns
     WHERE status IN ('draft', 'paused', 'sending') AND send_mode = 'drip'`
  )

  const campaignIds = [
    ...scheduled.map((c) => c.id),
    ...drip.map((c) => c.id),
  ]

  for (const campaignId of campaignIds) {
    const campaigns = await query<{
      id: string
      template_id: string | null
      send_mode: string
      daily_limit: number | null
      weekly_limit: number | null
      sent_count: number
    }>(
      'SELECT * FROM public.email_campaigns WHERE id = $1',
      [campaignId]
    )

    if (campaigns.length === 0) continue
    const campaign = campaigns[0]
    if (!campaign.template_id) continue

    const templates = await query<{ subject: string; body: string }>(
      'SELECT subject, body FROM public.email_templates WHERE id = $1',
      [campaign.template_id]
    )
    if (templates.length === 0) continue
    const template = templates[0]

    let sendLimit: number | null = null

    if (campaign.send_mode === 'drip') {
      if (campaign.daily_limit) sendLimit = campaign.daily_limit

      if (campaign.weekly_limit) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekSent = await query<{ count: string }>(
          `SELECT COUNT(*) AS count FROM public.campaign_leads
           WHERE campaign_id = $1 AND status = 'sent' AND sent_at >= $2`,
          [campaignId, weekStart.toISOString()]
        )
        const sentThisWeek = parseInt(weekSent[0]?.count ?? '0', 10)
        const weeklyRemaining = campaign.weekly_limit - sentThisWeek
        if (weeklyRemaining <= 0) continue
        sendLimit = sendLimit ? Math.min(sendLimit, weeklyRemaining) : weeklyRemaining
      }
    }

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
    }>(pendingQuery, [campaignId])

    await query(
      `UPDATE public.email_campaigns SET status = 'sending', updated_at = now() WHERE id = $1`,
      [campaignId]
    )

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
          `UPDATE public.campaign_leads SET status = 'sent', sent_at = now(), resend_id = $1 WHERE id = $2`,
          [resendId, lead.campaign_lead_id]
        )
        await query(
          `UPDATE public.outreach_leads SET status = 'emailed', last_emailed_at = now(), updated_at = now() WHERE id = $1`,
          [lead.lead_id]
        )
        sent++
      } catch {
        await query(
          `UPDATE public.campaign_leads SET status = 'bounced', bounced_at = now() WHERE id = $1`,
          [lead.campaign_lead_id]
        )
        failed++
      }
    }

    await query(
      `UPDATE public.email_campaigns SET sent_count = sent_count + $1, updated_at = now() WHERE id = $2`,
      [sent, campaignId]
    )

    const stillPending = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM public.campaign_leads WHERE campaign_id = $1 AND status = 'pending'`,
      [campaignId]
    )
    const remaining = parseInt(stillPending[0]?.count ?? '0', 10)

    let finalStatus: string
    if (remaining === 0) {
      finalStatus = 'completed'
    } else if (campaign.send_mode === 'drip') {
      finalStatus = 'paused'
    } else {
      finalStatus = 'sending'
    }

    await query(
      `UPDATE public.email_campaigns SET status = $1, updated_at = now() WHERE id = $2`,
      [finalStatus, campaignId]
    )

    results.push({ campaign_id: campaignId, sent, failed })
  }

  return NextResponse.json({ processed: results.length, results })
}
