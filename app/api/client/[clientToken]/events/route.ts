import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendNewBookingNotificationEmail } from '@/lib/resend'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ events: [] })

  try {
    const rows = await query(
      `SELECT * FROM public.events WHERE project_id = $1 ORDER BY event_date, event_time NULLS LAST`,
      [project.id]
    )
    return NextResponse.json({ events: rows })
  } catch (err) {
    console.error('[events] GET failed:', err)
    return NextResponse.json({ events: [] })
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
  const {
    title, event_date, event_time, notes,
    customer_name, customer_email, customer_phone,
    status = 'confirmed', source = 'manual',
  } = body

  if (!title?.trim() || !event_date) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  try {
    const rows = await query(
      `INSERT INTO public.events
         (project_id, title, event_date, event_time, notes, customer_name, customer_email, customer_phone, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        project.id, title.trim(), event_date,
        event_time || null, notes || null,
        customer_name || null, customer_email || null, customer_phone || null,
        status, source,
      ]
    )
    const event = rows[0]

    // Add CRM record for the customer (no-op if already exists)
    if (customer_name || customer_email || customer_phone) {
      await query(
        `INSERT INTO public.client_customers (project_id, name, phone, email, source)
         VALUES ($1, $2, $3, $4, 'booking')
         ON CONFLICT DO NOTHING`,
        [project.id, customer_name || null, customer_phone || null, customer_email || null]
      ).catch((err) => console.error('[events] CRM insert failed:', err))
    }

    // Notify project owner
    if (project.email) {
      sendNewBookingNotificationEmail({
        businessName: project.businessName,
        ownerEmail: project.email,
        customerName: customer_name || null,
        customerEmail: customer_email || null,
        customerPhone: customer_phone || null,
        title: title.trim(),
        eventDate: event_date,
        eventTime: event_time || null,
        notes: notes || null,
      }).catch((err) => console.error('[events] Booking email failed:', err))
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    console.error('[events] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
