import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

const DEFAULT_AUTOMATIONS = [
  { trigger: 'booking_confirmed',       subject: 'Your appointment is confirmed',       body: 'Hi [customer_name], your appointment on [date] at [time] is confirmed. We look forward to seeing you.',                   enabled: true },
  { trigger: 'appointment_cancelled',   subject: 'Your appointment has been cancelled', body: 'Hi [customer_name], your appointment on [date] at [time] has been cancelled. Please contact us to reschedule.',            enabled: true },
  { trigger: 'appointment_rescheduled', subject: 'Your appointment has been rescheduled', body: 'Hi [customer_name], your appointment has been rescheduled to [date] at [time].',                                          enabled: true },
  { trigger: 'appointment_reminder',    subject: 'Reminder: upcoming appointment',       body: 'Hi [customer_name], this is a reminder that you have an appointment on [date] at [time].',                                 enabled: true },
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!pgEnabled) {
    return NextResponse.json({
      automations: DEFAULT_AUTOMATIONS.map((a, i) => ({ ...a, id: `default-${i}`, project_id: project.id })),
    })
  }

  try {
    let rows = await query(`SELECT * FROM public.email_automations WHERE project_id = $1 ORDER BY created_at`, [project.id])
    if (rows.length === 0) {
      for (const a of DEFAULT_AUTOMATIONS) {
        await query(
          `INSERT INTO public.email_automations (project_id, trigger, subject, body, enabled)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (project_id, trigger) DO NOTHING`,
          [project.id, a.trigger, a.subject, a.body, a.enabled]
        ).catch(() => {})
      }
      rows = await query(`SELECT * FROM public.email_automations WHERE project_id = $1 ORDER BY created_at`, [project.id])
    }
    return NextResponse.json({ automations: rows })
  } catch (err) {
    console.error('[email-automations] GET failed:', err)
    return NextResponse.json({
      automations: DEFAULT_AUTOMATIONS.map((a, i) => ({ ...a, id: `default-${i}` })),
    })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { trigger, subject, body: emailBody, enabled } = body

  if (!trigger || !subject || !emailBody) {
    return NextResponse.json({ error: 'trigger, subject, and body are required' }, { status: 400 })
  }

  try {
    const rows = await query(
      `INSERT INTO public.email_automations (project_id, trigger, subject, body, enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, trigger)
       DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body, enabled = EXCLUDED.enabled
       RETURNING *`,
      [project.id, trigger, subject, emailBody, enabled ?? true]
    )
    return NextResponse.json({ automation: rows[0] })
  } catch (err) {
    console.error('[email-automations] POST failed:', err)
    return NextResponse.json({ error: 'Failed to save automation' }, { status: 500 })
  }
}
