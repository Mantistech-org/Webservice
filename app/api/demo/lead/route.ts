import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'
import { enrollLeadInCampaigns } from '@/lib/campaigns'
import { sendCampaignStepEmail } from '@/lib/resend'
import { isAdminAuthenticated } from '@/lib/auth'

// Run this once in your Supabase SQL editor to create the table:
//
// CREATE TABLE IF NOT EXISTS public.demo_leads (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   email text NOT NULL,
//   business_name text,
//   business_type text,
//   session_id text,
//   created_at timestamptz NOT NULL DEFAULT now()
// );

export async function POST(req: Request) {
  try {
    const { email, businessName, businessType, sessionId } = await req.json()

    if (!email) {
      return NextResponse.json({ success: true })
    }

    if (pgEnabled) {
      await query(
        `INSERT INTO public.demo_leads (email, business_name, business_type, session_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [email.trim(), businessName?.trim() || null, businessType?.trim() || null, sessionId?.trim() || null]
      ).catch(err => console.error('[demo/lead] DB insert failed:', err))

      enrollLeadInCampaigns(email.trim(), businessName?.trim() || null, 'all')
        .then(async () => {
          // Immediately send any day-0 emails for this lead
          const campaignEmails = await query<{
            campaign_id: string; step_number: number; days_after_enrollment: number;
            subject: string; body: string
          }>(
            `SELECT ce.* FROM public.campaign_emails ce
             JOIN public.campaign_enrollments e ON e.campaign_id = ce.campaign_id
             WHERE e.lead_email = $1 AND ce.days_after_enrollment = 0`,
            [email.trim()]
          )

          for (const emailStep of campaignEmails) {
            const alreadySent = await query(
              `SELECT id FROM public.campaign_sends s
               JOIN public.campaign_enrollments e ON e.id = s.enrollment_id
               WHERE e.lead_email = $1 AND s.step_number = $2 AND e.campaign_id = $3`,
              [email.trim(), emailStep.step_number, emailStep.campaign_id]
            )
            if (alreadySent.length > 0) continue

            const enrollment = await query<{ id: string }>(
              `SELECT id FROM public.campaign_enrollments WHERE lead_email = $1 AND campaign_id = $2`,
              [email.trim(), emailStep.campaign_id]
            )
            if (!enrollment[0]) continue

            void sendCampaignStepEmail({
              to: email.trim(),
              subject: emailStep.subject,
              body: emailStep.body,
              businessName: businessName?.trim() ?? '',
            }).then(async () => {
              await query(
                `INSERT INTO public.campaign_sends (enrollment_id, step_number) VALUES ($1, $2)`,
                [enrollment[0].id, emailStep.step_number]
              )
            }).catch(err => console.error('[demo/lead] day-0 email failed:', err))
          }
        })
        .catch(err => console.error('[demo/lead] enrollLeadInCampaigns failed:', err))
    }
  } catch (err) {
    console.error('[demo/lead] unexpected error:', err)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Get the email before deleting
  const lead = await query<{ email: string }>(
    `SELECT email FROM public.demo_leads WHERE id = $1`,
    [id]
  )

  if (lead[0]?.email) {
    // Delete campaign sends for this lead's enrollments
    await query(
      `DELETE FROM public.campaign_sends
       WHERE enrollment_id IN (
         SELECT id FROM public.campaign_enrollments WHERE lead_email = $1
       )`,
      [lead[0].email]
    )
    // Delete campaign enrollments
    await query(
      `DELETE FROM public.campaign_enrollments WHERE lead_email = $1`,
      [lead[0].email]
    )
  }

  // Delete the lead
  await query(`DELETE FROM public.demo_leads WHERE id = $1`, [id])

  return NextResponse.json({ success: true })
}
