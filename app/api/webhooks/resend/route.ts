import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'

// POST /api/webhooks/resend
// Receives open and bounce events from Resend.
// Configure in Resend dashboard: Webhooks -> Add endpoint -> select email.opened, email.bounced

export async function POST(req: NextRequest) {
  let event: { type: string; data: { email_id: string } }

  try {
    event = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ received: true })
  }

  const { type, data } = event
  const resendId = data?.email_id

  if (!resendId) {
    return NextResponse.json({ received: true })
  }

  try {
    if (type === 'email.opened') {
      await query(
        `UPDATE public.campaign_leads
         SET status = 'opened', opened_at = now()
         WHERE resend_id = $1 AND status = 'sent'`,
        [resendId]
      )
    } else if (type === 'email.bounced') {
      const rows = await query<{ lead_id: string }>(
        `UPDATE public.campaign_leads
         SET status = 'bounced', bounced_at = now()
         WHERE resend_id = $1
         RETURNING lead_id`,
        [resendId]
      )
      if (rows.length > 0) {
        await query(
          `UPDATE public.outreach_leads SET status = 'bounced', updated_at = now() WHERE id = $1`,
          [rows[0].lead_id]
        )
      }
    }
  } catch (err) {
    console.error('[webhook/resend] DB update failed:', err)
  }

  return NextResponse.json({ received: true })
}
