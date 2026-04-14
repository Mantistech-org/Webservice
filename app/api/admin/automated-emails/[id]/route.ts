import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// PATCH — update campaign status ('active' | 'paused')
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (status !== 'active' && status !== 'paused') {
    return NextResponse.json({ error: 'status must be "active" or "paused".' }, { status: 400 })
  }

  try {
    await query(
      `UPDATE public.email_campaigns SET status = $1 WHERE id = $2`,
      [status, id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/automated-emails/[id]] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update campaign.' }, { status: 500 })
  }
}

// DELETE — remove campaign and all related records (cascade handles children)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params

  try {
    await query(`DELETE FROM public.email_campaigns WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/automated-emails/[id]] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete campaign.' }, { status: 500 })
  }
}
