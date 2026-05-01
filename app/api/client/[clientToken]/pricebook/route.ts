import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

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

// Schema is ensured by the proposals route (same module load order is not guaranteed,
// but both tables are created there). We add a lightweight guard here just in case.
let schemaReady = false
async function ensureSchema() {
  if (schemaReady) return
  await query(`
    CREATE TABLE IF NOT EXISTS public.client_pricebook (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id TEXT NOT NULL,
      item_name  TEXT NOT NULL,
      unit_price NUMERIC NOT NULL DEFAULT 0,
      category   TEXT NOT NULL DEFAULT 'Other',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_pricebook_project_id ON public.client_pricebook (project_id)`
  )
  schemaReady = true
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ items: [] })

  try {
    await ensureSchema()
    const rows = await query(
      `SELECT * FROM public.client_pricebook
       WHERE project_id = $1
       ORDER BY category ASC, item_name ASC`,
      [projectId]
    )
    return NextResponse.json({ items: rows })
  } catch (err) {
    console.error('[pricebook] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const body = await req.json()
  const { item_name, unit_price, category } = body

  if (!item_name) {
    return NextResponse.json({ error: 'item_name is required' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const rows = await query<{ id: string }>(
      `INSERT INTO public.client_pricebook (project_id, item_name, unit_price, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [projectId, item_name, unit_price ?? 0, category ?? 'Other']
    )
    return NextResponse.json({ item: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[pricebook] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    await ensureSchema()
    await query(
      `DELETE FROM public.client_pricebook WHERE id = $1 AND project_id = $2`,
      [id, projectId]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[pricebook] DELETE failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
