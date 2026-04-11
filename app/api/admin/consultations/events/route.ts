import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import type { CalEvent } from '@/components/calendar/CalendarCore'

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ events: [] })
  }

  try {
    const rows = await query<{
      id: string
      name: string
      business_name: string | null
      email: string | null
      phone: string | null
      preferred_date: string | null
      preferred_time: string | null
      status: string | null
      message: string | null
      created_at: string | null
    }>(
      `SELECT id, name, business_name, email, phone, preferred_date, preferred_time, status, message, created_at
       FROM public.consultations
       ORDER BY preferred_date ASC, preferred_time ASC NULLS LAST`
    )

    const events: CalEvent[] = rows.map((row) => {
      const title = row.business_name
        ? `${row.name} — ${row.business_name}`
        : row.name

      // Map form status to CalEvent status
      let status: CalEvent['status'] = 'pending'
      if (row.status === 'confirmed') status = 'confirmed'
      else if (row.status === 'cancelled') status = 'cancelled'
      else status = 'pending'

      // Convert preferred_time from "9:00 AM" style to "09:00" 24h if needed
      let event_time: string | null = null
      if (row.preferred_time) {
        const match = row.preferred_time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
        if (match) {
          let h = parseInt(match[1], 10)
          const m = match[2]
          const meridiem = match[3].toUpperCase()
          if (meridiem === 'PM' && h !== 12) h += 12
          if (meridiem === 'AM' && h === 12) h = 0
          event_time = `${String(h).padStart(2, '0')}:${m}`
        } else {
          event_time = row.preferred_time
        }
      }

      return {
        id: row.id,
        title,
        event_date: row.preferred_date ?? new Date().toISOString().split('T')[0],
        event_time,
        notes: row.message ?? null,
        customer_name: row.name,
        customer_email: row.email ?? null,
        customer_phone: row.phone ?? null,
        status,
        source: 'website_booking' as const,
        created_at: row.created_at ?? undefined,
      }
    })

    return NextResponse.json({ events })
  } catch (err) {
    console.error('[consultations] GET failed:', err)
    return NextResponse.json({ events: [] })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const {
    title, event_date, event_time,
    customer_name, customer_email, customer_phone,
    notes, status = 'pending',
  } = body

  if (!customer_name?.trim() || !event_date) {
    return NextResponse.json({ error: 'Name and date are required.' }, { status: 400 })
  }

  try {
    const rows = await query(
      `INSERT INTO public.consultations
         (name, email, phone, preferred_date, preferred_time, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        customer_name.trim(),
        customer_email || null,
        customer_phone || null,
        event_date,
        event_time || null,
        notes || null,
        status,
      ]
    )
    const row = rows[0] as Record<string, unknown>
    return NextResponse.json({ event: { ...row, title: title ?? customer_name } }, { status: 201 })
  } catch (err) {
    console.error('[consultations] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create consultation.' }, { status: 500 })
  }
}
