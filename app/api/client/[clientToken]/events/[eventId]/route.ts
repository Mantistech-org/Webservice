import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendAutomationEmail } from '@/lib/resend'

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${suffix}`
}

const TRIGGER_MAP: Record<string, string> = {
  confirm: 'booking_confirmed',
  cancel: 'appointment_cancelled',
  reschedule: 'appointment_rescheduled',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; eventId: string }> }
) {
  const { clientToken, eventId } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { send_email, action, ...fields } = body

  const allowed = ['title', 'event_date', 'event_time', 'notes', 'customer_name', 'customer_email', 'customer_phone', 'status']
  const setClauses: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in fields) {
      setClauses.push(`${key} = $${values.length + 1}`)
      values.push(fields[key])
    }
  }

  if (!setClauses.length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  values.push(eventId, project.id)

  try {
    const rows = await query<Record<string, unknown>>(
      `UPDATE public.events SET ${setClauses.join(', ')} WHERE id = $${values.length - 1} AND project_id = $${values.length} RETURNING *`,
      values
    )
    if (!rows.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const updated = rows[0]

    // Send automation email if requested
    if (send_email && action && typeof updated.customer_email === 'string' && updated.customer_email) {
      const trigger = TRIGGER_MAP[action]
      if (trigger) {
        try {
          const automations = await query<Record<string, unknown>>(
            `SELECT subject, body FROM public.email_automations WHERE project_id = $1 AND trigger = $2 AND enabled = true LIMIT 1`,
            [project.id, trigger]
          )
          if (automations.length > 0) {
            const tpl = automations[0]
            const rawDate = typeof updated.event_date === 'string' ? updated.event_date : String(updated.event_date ?? '')
            const dateStr = rawDate
              ? new Date(rawDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
              : ''
            const rawTime = typeof updated.event_time === 'string' ? updated.event_time : ''
            const timeStr = rawTime ? fmt12(rawTime) : ''
            sendAutomationEmail({
              to: updated.customer_email as string,
              subject: tpl.subject as string,
              body: tpl.body as string,
              customerName: typeof updated.customer_name === 'string' ? updated.customer_name : 'Customer',
              date: dateStr,
              time: timeStr,
              businessName: project.businessName,
            }).catch(err => console.error('[events] Automation email failed:', err))
          }
        } catch (err) {
          console.error('[events] Could not look up automation:', err)
        }
      }
    }

    return NextResponse.json({ event: updated })
  } catch (err) {
    console.error('[events] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; eventId: string }> }
) {
  const { clientToken, eventId } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  try {
    await query(`DELETE FROM public.events WHERE id = $1 AND project_id = $2`, [eventId, project.id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[events] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
