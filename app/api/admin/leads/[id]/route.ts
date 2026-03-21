import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// PATCH /api/admin/leads/[id] — update status, email, or notes
export async function PATCH(
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
  const body = await req.json()

  const allowed = ['status', 'email', 'notes']
  const sets: string[] = []
  const values: unknown[] = []

  for (const key of allowed) {
    if (key in body) {
      values.push(body[key])
      sets.push(`${key} = $${values.length}`)
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  values.push(new Date().toISOString())
  sets.push(`updated_at = $${values.length}`)

  values.push(id)
  const sql = `UPDATE public.outreach_leads SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`

  try {
    const rows = await query(sql, values)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })
    }
    return NextResponse.json({ lead: rows[0] })
  } catch (err) {
    console.error('[leads] PATCH failed:', err)
    return NextResponse.json({ error: 'Failed to update lead.' }, { status: 500 })
  }
}

// DELETE /api/admin/leads/[id]
export async function DELETE(
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

  try {
    await query('DELETE FROM public.outreach_leads WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[leads] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete lead.' }, { status: 500 })
  }
}
