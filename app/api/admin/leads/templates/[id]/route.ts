import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

// PUT /api/admin/leads/templates/[id]
export async function PUT(
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
  const { name, subject, body } = await req.json()

  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'name, subject, and body are required.' }, { status: 400 })
  }

  try {
    const rows = await query(
      `UPDATE public.email_templates
       SET name = $1, subject = $2, body = $3, updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [name.trim(), subject.trim(), body.trim(), id]
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }
    return NextResponse.json({ template: rows[0] })
  } catch (err) {
    console.error('[templates] PUT failed:', err)
    return NextResponse.json({ error: 'Failed to update template.' }, { status: 500 })
  }
}

// DELETE /api/admin/leads/templates/[id]
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
    await query('DELETE FROM public.email_templates WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[templates] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete template.' }, { status: 500 })
  }
}
