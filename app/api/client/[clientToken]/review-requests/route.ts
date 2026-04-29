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
    CREATE TABLE IF NOT EXISTS public.client_review_requests (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id    TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone         TEXT,
      email         TEXT,
      method        TEXT NOT NULL DEFAULT 'sms',
      status        TEXT NOT NULL DEFAULT 'sent',
      sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_review_requests_project_id ON public.client_review_requests (project_id)`
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
    return NextResponse.json({ requests: [] })
  }

  try {
    await ensureSchema()

    const rows = await query<{
      id: string
      project_id: string
      customer_name: string
      phone: string | null
      email: string | null
      method: string
      status: string
      sent_at: string
    }>(
      `SELECT id, project_id, customer_name, phone, email, method, status, sent_at
       FROM public.client_review_requests
       WHERE project_id = $1
       ORDER BY sent_at DESC`,
      [projectId]
    )

    return NextResponse.json({ requests: rows })
  } catch (err) {
    console.error('[review-requests] GET failed:', err)
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
  const { customer_name, phone, email, method } = body as {
    customer_name: string
    phone?: string
    email?: string
    method?: string
  }

  if (!customer_name) {
    return NextResponse.json({ error: 'customer_name is required' }, { status: 400 })
  }

  try {
    await ensureSchema()

    const rows = await query<{ id: string }>(
      `INSERT INTO public.client_review_requests (project_id, customer_name, phone, email, method, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
       RETURNING id`,
      [
        projectId,
        customer_name,
        phone ?? null,
        email ?? null,
        method ?? 'sms',
      ]
    )

    const created = await query(
      `SELECT * FROM public.client_review_requests WHERE id = $1`,
      [rows[0].id]
    )

    return NextResponse.json({ request: created[0] }, { status: 201 })
  } catch (err) {
    console.error('[review-requests] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
