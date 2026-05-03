import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { sendDemoLeadCampaignEmail } from '@/lib/resend'

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

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const stepNumber: number = body?.step_number ?? 1

  // Load campaign
  const campaigns = await query(
    `SELECT * FROM public.lead_campaigns WHERE id = $1`,
    [id]
  ) as Array<{
    id: string
    name: string
    audience: string
    selected_lead_ids: string[]
    status: string
  }>

  if (campaigns.length === 0) {
    return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 })
  }
  const campaign = campaigns[0]

  if (campaign.status === 'completed') {
    return NextResponse.json({ error: 'Campaign is already completed.' }, { status: 400 })
  }

  // Load the email step
  const steps = await query(
    `SELECT * FROM public.lead_campaign_emails WHERE campaign_id = $1 AND step_number = $2`,
    [id, stepNumber]
  ) as Array<{ subject: string; body: string }>

  if (steps.length === 0) {
    return NextResponse.json({ error: `No email step ${stepNumber} found for this campaign.` }, { status: 404 })
  }
  const step = steps[0]

  // Load target leads
  let leadsQuery: string
  let leadsParams: unknown[]

  if (campaign.audience === 'selected' && Array.isArray(campaign.selected_lead_ids) && campaign.selected_lead_ids.length > 0) {
    leadsQuery = `
      SELECT id::text, business_name, email
      FROM public.outreach_leads
      WHERE id::text = ANY($1::text[]) AND email IS NOT NULL AND email != '' AND deleted_at IS NULL
    `
    leadsParams = [campaign.selected_lead_ids]
  } else {
    leadsQuery = `
      SELECT id::text, business_name, email
      FROM public.outreach_leads
      WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL
    `
    leadsParams = []
  }

  const leads = await query(leadsQuery, leadsParams) as Array<{
    id: string
    business_name: string
    email: string
  }>

  if (leads.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, failed: 0, message: 'No leads with email addresses found.' })
  }

  // Find already-sent lead IDs for this campaign + step
  const alreadySent = await query(
    `SELECT lead_id FROM public.lead_campaign_sends WHERE campaign_id = $1 AND step_number = $2`,
    [id, stepNumber]
  ) as Array<{ lead_id: string }>
  const sentSet = new Set(alreadySent.map((r) => r.lead_id))

  const pending = leads.filter((l) => !sentSet.has(l.id))

  if (pending.length === 0) {
    return NextResponse.json({ sent: 0, skipped: leads.length, failed: 0, message: 'All leads have already received this step.' })
  }

  // Mark campaign as sending
  await query(`UPDATE public.lead_campaigns SET status = 'sending' WHERE id = $1`, [id])

  let sent = 0
  let failed = 0

  for (const lead of pending) {
    try {
      await sendDemoLeadCampaignEmail({
        to: lead.email,
        subject: step.subject,
        body: step.body,
        businessName: lead.business_name,
      })
      await query(
        `INSERT INTO public.lead_campaign_sends (campaign_id, lead_id, lead_email, step_number)
         VALUES ($1, $2, $3, $4)`,
        [id, lead.id, lead.email, stepNumber]
      )
      // Mark lead as emailed if this is step 1
      if (stepNumber === 1) {
        await query(
          `UPDATE public.outreach_leads SET status = 'emailed', last_emailed_at = now(), updated_at = now() WHERE id = $1::uuid`,
          [lead.id]
        )
      }
      sent++
    } catch (err) {
      console.error('[campaign/send] failed for', lead.email, err)
      failed++
    }
  }

  // Update campaign status
  const totalSteps = await query(
    `SELECT COUNT(*) AS count FROM public.lead_campaign_emails WHERE campaign_id = $1`,
    [id]
  ) as Array<{ count: string }>
  const maxStep = parseInt(totalSteps[0]?.count ?? '1', 10)
  const newStatus = stepNumber >= maxStep ? 'completed' : 'sending'
  await query(`UPDATE public.lead_campaigns SET status = $1 WHERE id = $2`, [newStatus, id])

  return NextResponse.json({ sent, skipped: sentSet.size, failed })
}
