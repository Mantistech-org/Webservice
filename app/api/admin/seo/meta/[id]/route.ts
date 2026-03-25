import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import type { SeoMeta } from '../route'

// PUT /api/admin/seo/meta/[id] — update a meta tag record
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = (await req.json()) as Partial<SeoMeta>

  try {
    const rows = await query<SeoMeta>(
      `UPDATE public.seo_meta
       SET meta_title       = COALESCE($1, meta_title),
           meta_description = COALESCE($2, meta_description),
           og_title         = COALESCE($3, og_title),
           og_description   = COALESCE($4, og_description),
           og_image         = COALESCE($5, og_image),
           status           = COALESCE($6, status),
           updated_at       = now()
       WHERE id = $7
       RETURNING *`,
      [
        body.meta_title ?? null,
        body.meta_description ?? null,
        body.og_title ?? null,
        body.og_description ?? null,
        body.og_image ?? null,
        body.status ?? null,
        id,
      ]
    )

    if (!rows.length) {
      return NextResponse.json({ error: 'Record not found.' }, { status: 404 })
    }

    return NextResponse.json({ meta: rows[0] })
  } catch (err) {
    console.error('[seo/meta] PUT failed:', err)
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}
