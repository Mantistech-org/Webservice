import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

// ── Template-preview fallback ─────────────────────────────────────────────────

const TEMPLATE_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'

const TEMPLATE_PROJECT = {
  id:           TEMPLATE_PROJECT_ID,
  clientToken:  'template-preview',
  adminToken:   'template-admin',
  businessName: 'Your Business Name',
  ownerName:    'Template Admin',
  email:        'template@mantistech.org',
  plan:         'platform-plus',
  status:       'active',
  createdAt:    new Date().toISOString(),
  updatedAt:    new Date().toISOString(),
}

async function resolveProjectId(clientToken: string): Promise<string | null> {
  const project = await getProjectByClientToken(clientToken)
  if (project) return project.id
  if (clientToken !== 'template-preview') return null
  if (pgEnabled) {
    await query(
      `INSERT INTO public.projects (id, admin_token, client_token, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [TEMPLATE_PROJECT_ID, 'template-admin', 'template-preview', JSON.stringify(TEMPLATE_PROJECT)]
    )
  }
  return TEMPLATE_PROJECT_ID
}

// ── Schema init ───────────────────────────────────────────────────────────────

let schemaReady = false

async function ensureSchema() {
  if (schemaReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS public.client_reviews (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id  TEXT NOT NULL,
      author      TEXT NOT NULL,
      rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      platform    TEXT NOT NULL DEFAULT 'google',
      review_text TEXT,
      review_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_reviews_project_id ON public.client_reviews (project_id)`
  )
  schemaReady = true
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ reviews: [] })
  }

  try {
    await ensureSchema()

    const rows = await query<{
      id: string
      project_id: string
      author: string
      rating: number
      platform: string
      review_text: string | null
      review_date: string
      created_at: string
    }>(
      `SELECT id, project_id, author, rating, platform, review_text, review_date, created_at
       FROM public.client_reviews
       WHERE project_id = $1
       ORDER BY review_date DESC`,
      [projectId]
    )

    return NextResponse.json({ reviews: rows })
  } catch (err) {
    console.error('[reviews] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const body = await req.json()
  const { author, rating, platform, review_text, review_date } = body as {
    author: string
    rating: number
    platform?: string
    review_text?: string
    review_date?: string
  }

  if (!author || !rating) {
    return NextResponse.json({ error: 'author and rating are required' }, { status: 400 })
  }

  try {
    await ensureSchema()

    const rows = await query<{ id: string }>(
      `INSERT INTO public.client_reviews (project_id, author, rating, platform, review_text, review_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        projectId,
        author,
        rating,
        platform ?? 'google',
        review_text ?? null,
        review_date ?? new Date().toISOString().split('T')[0],
      ]
    )

    const created = await query(
      `SELECT * FROM public.client_reviews WHERE id = $1`,
      [rows[0].id]
    )

    return NextResponse.json({ review: created[0] }, { status: 201 })
  } catch (err) {
    console.error('[reviews] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
