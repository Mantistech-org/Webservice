import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendBookingNotificationEmail } from '@/lib/resend'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const DEFAULT_AUTOMATIONS = [
  { trigger: 'booking_confirmed',       subject: 'Your appointment is confirmed',         body: 'Hi [customer_name], your appointment on [date] at [time] is confirmed. We look forward to seeing you.',        enabled: true },
  { trigger: 'appointment_cancelled',   subject: 'Your appointment has been cancelled',   body: 'Hi [customer_name], your appointment on [date] at [time] has been cancelled. Please contact us to reschedule.', enabled: true },
  { trigger: 'appointment_rescheduled', subject: 'Your appointment has been rescheduled', body: 'Hi [customer_name], your appointment has been rescheduled to [date] at [time].',                                  enabled: true },
  { trigger: 'appointment_reminder',    subject: 'Reminder: upcoming appointment',        body: 'Hi [customer_name], this is a reminder that you have an appointment on [date] at [time].',                        enabled: true },
]

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured' }, { status: 503, headers: CORS })

  const body = await req.json().catch(() => ({}))
  const name    = typeof body.name    === 'string' ? body.name.trim()    : null
  const email   = typeof body.email   === 'string' ? body.email.trim()   : null
  const phone   = typeof body.phone   === 'string' ? body.phone.trim()   : null
  const date    = typeof body.date    === 'string' ? body.date.trim()    : null
  const time    = typeof body.time    === 'string' ? body.time.trim()    : null
  const message = typeof body.message === 'string' ? body.message.trim() : null

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400, headers: CORS })
  }

  try {
    const title = name ? `Booking: ${name}` : 'Website Booking'
    await query(
      `INSERT INTO public.events (project_id, title, event_date, event_time, notes, customer_name, customer_email, customer_phone, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', 'website_booking')`,
      [project.id, title, date, time || null, message || null, name, email, phone]
    )

    // Seed default automations if none exist yet
    const existing = await query(`SELECT id FROM public.email_automations WHERE project_id = $1 LIMIT 1`, [project.id]).catch(() => [])
    if (existing.length === 0) {
      for (const a of DEFAULT_AUTOMATIONS) {
        await query(
          `INSERT INTO public.email_automations (project_id, trigger, subject, body, enabled)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (project_id, trigger) DO NOTHING`,
          [project.id, a.trigger, a.subject, a.body, a.enabled]
        ).catch(() => {})
      }
    }

    sendBookingNotificationEmail({
      projectId: project.id,
      businessName: project.businessName,
      ownerEmail: project.email,
      customerName: name ?? '',
      customerEmail: email ?? '',
      customerPhone: phone ?? '',
      preferredDate: date,
      preferredTime: time ?? '',
      message: message ?? '',
    }).catch(err => console.error('[bookings] Notification email failed:', err))

    return NextResponse.json({ success: true }, { status: 201, headers: CORS })
  } catch (err) {
    console.error('[bookings] POST failed:', err)
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500, headers: CORS })
  }
}
