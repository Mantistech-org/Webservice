import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { eventId } = await params
  const body = await req.json().catch(() => ({}))

  const fieldMap: Record<string, string> = {
    event_date:      'preferred_date',
    event_time:      'preferred_time',
    status:          'status',
    customer_name:   'name',
    customer_email:  'email',
    customer_phone:  'phone',
    notes:           'message',
    title:           'name',
  }

  const setClauses: string[] = []
  const values: unknown[] = []

  for (const [calKey, dbCol] of Object.entries(fieldMap)) {
    if (calKey in body) {
      setClauses.push(`${dbCol} = $${values.length + 1}`)
      values.push(body[calKey])
    }
  }

  if (!setClauses.length) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  values.push(eventId)

  try {
    const rows = await query(
      `UPDATE public.consultations SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )
    if (!rows.length) {
      return NextResponse.json({ error: 'Consultation not found.' }, { status: 404 })
    }
    return NextResponse.json({ event: rows[0] })
  } catch (err) {
    console.error('[consultations] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update consultation.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { eventId } = await params

  try {
    await query('DELETE FROM public.consultations WHERE id = $1', [eventId])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[consultations] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete consultation.' }, { status: 500 })
  }
}
