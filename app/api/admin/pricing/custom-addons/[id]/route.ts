import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import type { CustomAddon } from '@/app/api/admin/pricing/custom-addons/route'

type PatchBody = {
  name?: string
  client_name?: string | null
  description?: string
  one_time_fee?: number | null
  monthly_fee?: number | null
  active?: boolean
}

// PATCH /api/admin/pricing/custom-addons/[id] — update any fields
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
  const body = (await req.json()) as PatchBody

  const existing = await query<CustomAddon>(
    `SELECT id FROM public.custom_addons WHERE id = $1`,
    [id]
  )
  if (!existing[0]) {
    return NextResponse.json({ error: 'Add-on not found.' }, { status: 404 })
  }

  // Build update from allowed fields only
  const allowed: (keyof PatchBody)[] = [
    'name', 'client_name', 'description', 'one_time_fee', 'monthly_fee', 'active',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      if (key === 'name') {
        const v = (body.name ?? '').trim()
        if (!v) return NextResponse.json({ error: 'name cannot be empty.' }, { status: 400 })
        updates.name = v
      } else if (key === 'client_name') {
        updates.client_name = typeof body.client_name === 'string' && body.client_name.trim()
          ? body.client_name.trim()
          : null
      } else if (key === 'description') {
        updates.description = (body.description ?? '').trim()
      } else {
        updates[key] = body[key] ?? null
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    const rows = await query<CustomAddon>(`SELECT * FROM public.custom_addons WHERE id = $1`, [id])
    return NextResponse.json({ addon: rows[0] })
  }

  const setEntries = Object.entries(updates)
  const setClauses = setEntries.map(([k], i) => `${k} = $${i + 2}`).join(', ')
  const values = setEntries.map(([, v]) => v)

  const updated = await query<CustomAddon>(
    `UPDATE public.custom_addons
     SET ${setClauses}, updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, ...values]
  )

  return NextResponse.json({ addon: updated[0] })
}

// DELETE /api/admin/pricing/custom-addons/[id] — permanently remove
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params

  const rows = await query<{ id: string }>(
    `DELETE FROM public.custom_addons WHERE id = $1 RETURNING id`,
    [id]
  )

  if (!rows[0]) {
    return NextResponse.json({ error: 'Add-on not found.' }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}
