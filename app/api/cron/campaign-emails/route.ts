// cron route v2
import { NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { sendCampaignStepEmail } from '@/lib/resend'

export async function GET(req: Request) {
  console.log('[cron/campaign-emails] route hit')
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  try {
    // Fetch all active campaigns and their email steps
    const campaigns = await query<{ id: string; name: string; status: string }>(`
      SELECT id, name, status FROM public.email_campaigns WHERE status = 'active'
    `)

    if (campaigns.length === 0) {
      return NextResponse.json({ success: true, processed: 0, sent: 0 })
    }

    const campaignIds = campaigns.map((c) => c.id)

    const campaignEmails = await query<{
      id: string
      campaign_id: string
      step_number: number
      days_after_enrollment: number
      subject: string
      body: string
    }>(`
      SELECT id, campaign_id, step_number, days_after_enrollment, subject, body
      FROM public.campaign_emails
      WHERE campaign_id = ANY($1)
      ORDER BY campaign_id, step_number
    `, [campaignIds])

    // Group emails by campaign_id
    const emailsByCampaign: Record<string, typeof campaignEmails> = {}
    for (const e of campaignEmails) {
      if (!emailsByCampaign[e.campaign_id]) emailsByCampaign[e.campaign_id] = []
      emailsByCampaign[e.campaign_id].push(e)
    }

    // Fetch all incomplete enrollments joined with demo_leads for email/name
    const enrollments = await query<{
      id: string
      campaign_id: string
      lead_email: string
      lead_name: string | null
      enrolled_at: string
      current_step: number
      completed: boolean
    }>(`
      SELECT e.id, e.campaign_id, e.lead_email, e.lead_name, e.enrolled_at, e.current_step, e.completed
      FROM public.campaign_enrollments e
      WHERE e.completed = false
        AND e.campaign_id = ANY($1)
    `, [campaignIds])

    // Fetch all sends for these enrollments
    const enrollmentIds = enrollments.map((e) => e.id)
    let sends: { enrollment_id: string; step_number: number }[] = []
    if (enrollmentIds.length > 0) {
      sends = await query<{ enrollment_id: string; step_number: number }>(`
        SELECT enrollment_id, step_number FROM public.campaign_sends
        WHERE enrollment_id = ANY($1)
      `, [enrollmentIds])
    }

    // Build set of already-sent steps: "enrollmentId:stepNumber"
    const sentSet = new Set(sends.map((s) => `${s.enrollment_id}:${s.step_number}`))

    const now = Date.now()
    let processed = 0
    let sent = 0

    for (const enrollment of enrollments) {
      processed++
      const steps = emailsByCampaign[enrollment.campaign_id] ?? []
      if (steps.length === 0) continue

      const enrolledAt = new Date(enrollment.enrolled_at).getTime()

      for (const step of steps) {
        const dueAt = enrolledAt + step.days_after_enrollment * 24 * 60 * 60 * 1000
        if (now < dueAt) continue
        if (sentSet.has(`${enrollment.id}:${step.step_number}`)) continue

        try {
          await sendCampaignStepEmail({
            to: enrollment.lead_email,
            subject: step.subject,
            body: step.body,
            businessName: enrollment.lead_name ?? '',
          })

          await query(`
            INSERT INTO public.campaign_sends (enrollment_id, step_number)
            VALUES ($1, $2)
          `, [enrollment.id, step.step_number])

          sentSet.add(`${enrollment.id}:${step.step_number}`)
          sent++
        } catch (err) {
          console.error(`[cron/campaign-emails] Failed to send step ${step.step_number} to ${enrollment.lead_email}:`, err)
        }
      }

      // Check if all steps have been sent → mark enrollment complete
      const allSent = steps.every((s) => sentSet.has(`${enrollment.id}:${s.step_number}`))
      if (allSent) {
        await query(`
          UPDATE public.campaign_enrollments SET completed = true WHERE id = $1
        `, [enrollment.id])
      }
    }

    console.log(`[cron/campaign-emails] processed=${processed} sent=${sent}`)
    return NextResponse.json({ success: true, processed, sent })
  } catch (err) {
    console.error('[cron/campaign-emails] error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
