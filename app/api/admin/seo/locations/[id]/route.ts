import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { gscEnabled, submitSitemap } from '@/lib/google-search-console'
import type { LocationPage } from '../route'

// GET /api/admin/seo/locations/[id] — get full location page (including content)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })

  const { id } = await params

  try {
    const rows = await query<LocationPage>(
      `SELECT * FROM public.seo_location_pages WHERE id = $1`,
      [id]
    )
    if (!rows.length) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ page: rows[0] })
  } catch (err) {
    console.error('[seo/locations] GET [id] failed:', err)
    return NextResponse.json({ error: 'Failed to load page.' }, { status: 500 })
  }
}

// PUT /api/admin/seo/locations/[id] — update or publish a location page
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = (await req.json()) as Partial<LocationPage>

  const isPublishing = body.status === 'published'

  try {
    const rows = await query<LocationPage>(
      `UPDATE public.seo_location_pages
       SET meta_title       = COALESCE($1, meta_title),
           meta_description = COALESCE($2, meta_description),
           headline         = COALESCE($3, headline),
           content          = COALESCE($4, content),
           status           = COALESCE($5, status),
           published_at     = CASE WHEN $5 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
           updated_at       = now()
       WHERE id = $6
       RETURNING *`,
      [
        body.meta_title ?? null,
        body.meta_description ?? null,
        body.headline ?? null,
        body.content ?? null,
        body.status ?? null,
        id,
      ]
    )

    if (!rows.length) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const page = rows[0]

    if (isPublishing && gscEnabled) {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      submitSitemap(`${base}/sitemap.xml`)
    }

    return NextResponse.json({ page })
  } catch (err) {
    console.error('[seo/locations] PUT failed:', err)
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}
