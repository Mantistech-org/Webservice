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
    CREATE TABLE IF NOT EXISTS public.client_proposals (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id       TEXT NOT NULL,
      proposal_token   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      customer_name    TEXT NOT NULL,
      customer_email   TEXT,
      customer_phone   TEXT,
      service_address  TEXT,
      service_type     TEXT,
      complaint        TEXT,
      findings         TEXT,
      recommended_work TEXT,
      parts_cost       NUMERIC NOT NULL DEFAULT 0,
      labor_hours      NUMERIC NOT NULL DEFAULT 0,
      labor_rate       NUMERIC NOT NULL DEFAULT 95,
      notes            TEXT,
      valid_until      DATE,
      generated_content JSONB,
      status           TEXT NOT NULL DEFAULT 'draft',
      last_sent_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_proposals_project_id ON public.client_proposals (project_id)`
  )
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_client_proposals_token ON public.client_proposals (proposal_token)`
  )
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

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ proposals: [] })

  try {
    await ensureSchema()
    const rows = await query(
      `SELECT * FROM public.client_proposals
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    )
    return NextResponse.json({ proposals: rows })
  } catch (err) {
    console.error('[proposals] GET failed:', err)
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
  const {
    customer_name,
    customer_email,
    customer_phone,
    service_address,
    service_type,
    complaint,
    findings,
    recommended_work,
    parts_cost,
    labor_hours,
    labor_rate,
    notes,
    valid_until,
    generated_content,
    status,
  } = body

  if (!customer_name) {
    return NextResponse.json({ error: 'customer_name is required' }, { status: 400 })
  }

  try {
    await ensureSchema()
    const rows = await query<{ id: string }>(
      `INSERT INTO public.client_proposals
         (project_id, customer_name, customer_email, customer_phone, service_address,
          service_type, complaint, findings, recommended_work,
          parts_cost, labor_hours, labor_rate, notes, valid_until, generated_content, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16)
       RETURNING id`,
      [
        projectId,
        customer_name,
        customer_email ?? null,
        customer_phone ?? null,
        service_address ?? null,
        service_type ?? null,
        complaint ?? null,
        findings ?? null,
        recommended_work ?? null,
        parts_cost ?? 0,
        labor_hours ?? 0,
        labor_rate ?? 95,
        notes ?? null,
        valid_until ?? null,
        generated_content ? JSON.stringify(generated_content) : null,
        status ?? 'draft',
      ]
    )
    const created = await query(
      `SELECT * FROM public.client_proposals WHERE id = $1`,
      [rows[0].id]
    )
    return NextResponse.json({ proposal: created[0] }, { status: 201 })
  } catch (err) {
    console.error('[proposals] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
