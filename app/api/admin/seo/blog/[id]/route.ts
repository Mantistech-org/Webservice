import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { gscEnabled, submitSitemap } from '@/lib/google-search-console'
import type { BlogPost } from '../route'

// GET /api/admin/seo/blog/[id] — get full post (including content)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })

  const { id } = await params

  try {
    const rows = await query<BlogPost>(
      `SELECT * FROM public.blog_posts WHERE id = $1`,
      [id]
    )
    if (!rows.length) return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    return NextResponse.json({ post: rows[0] })
  } catch (err) {
    console.error('[seo/blog] GET [id] failed:', err)
    return NextResponse.json({ error: 'Failed to load post.' }, { status: 500 })
  }
}

// PUT /api/admin/seo/blog/[id] — update or publish a blog post
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = (await req.json()) as Partial<BlogPost>

  const isPublishing = body.status === 'published'

  try {
    const rows = await query<BlogPost>(
      `UPDATE public.blog_posts
       SET title            = COALESCE($1, title),
           slug             = COALESCE($2, slug),
           meta_description = COALESCE($3, meta_description),
           content          = COALESCE($4, content),
           status           = COALESCE($5, status),
           published_at     = CASE WHEN $5 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
           updated_at       = now()
       WHERE id = $6
       RETURNING *`,
      [
        body.title ?? null,
        body.slug ?? null,
        body.meta_description ?? null,
        body.content ?? null,
        body.status ?? null,
        id,
      ]
    )

    if (!rows.length) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

    const post = rows[0]

    if (isPublishing && gscEnabled) {
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      submitSitemap(`${base}/sitemap.xml`)
    }

    return NextResponse.json({ post })
  } catch (err) {
    console.error('[seo/blog] PUT failed:', err)
    return NextResponse.json({ error: 'Update failed.' }, { status: 500 })
  }
}
