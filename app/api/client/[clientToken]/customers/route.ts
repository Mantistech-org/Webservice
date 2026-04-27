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
    CREATE TABLE IF NOT EXISTS public.client_customers (
      id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id           TEXT NOT NULL,
      name                 TEXT NOT NULL,
      phone                TEXT,
      email                TEXT,
      address              TEXT,
      equipment_type       TEXT,
      install_year         INTEGER,
      last_service_date    DATE,
      service_status       TEXT NOT NULL DEFAULT 'Up to Date',
      maintenance_plan     BOOLEAN NOT NULL DEFAULT false,
      maintenance_plan_name TEXT,
      maintenance_plan_renewal DATE,
      lifetime_value       NUMERIC NOT NULL DEFAULT 0,
      notes                TEXT,
      source               TEXT NOT NULL DEFAULT 'manual',
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at           TIMESTAMPTZ
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_customers_project_id ON public.client_customers (project_id)`
  )
  await query(`
    CREATE TABLE IF NOT EXISTS public.client_service_history (
      id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      customer_id  TEXT NOT NULL REFERENCES public.client_customers(id) ON DELETE CASCADE,
      project_id   TEXT NOT NULL,
      service_date DATE NOT NULL,
      service_type TEXT NOT NULL,
      technician   TEXT,
      cost         NUMERIC(10,2) NOT NULL DEFAULT 0,
      notes        TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_service_history_customer_id ON public.client_service_history (customer_id)`
  )
  schemaReady = true
}

function calcServiceStatus(lastServiceDate: string | null | undefined): string {
  if (!lastServiceDate) return 'Up to Date'
  const months = (Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  if (months <= 6) return 'Up to Date'
  if (months <= 12) return 'Due for Service'
  return 'Overdue'
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  console.log('[customers] clientToken:', clientToken)

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ customers: [] })
  }

  try {
    await ensureSchema()

    const rows = await query<{
      id: string
      project_id: string
      name: string
      phone: string | null
      email: string | null
      address: string | null
      equipment_type: string | null
      install_year: number | null
      last_service_date: string | null
      notes: string | null
      source: string
      service_status: string
      maintenance_plan: boolean
      maintenance_plan_name: string | null
      maintenance_plan_renewal: string | null
      lifetime_value: string
      created_at: string
      updated_at: string
    }>(
      `SELECT
         c.id, c.project_id, c.name, c.phone, c.email, c.address,
         c.equipment_type, c.install_year,
         c.last_service_date, c.notes, c.source, c.service_status,
         c.maintenance_plan, c.maintenance_plan_name, c.maintenance_plan_renewal,
         c.created_at, c.updated_at,
         COALESCE(SUM(h.cost), 0) AS lifetime_value
       FROM public.client_customers c
       LEFT JOIN public.client_service_history h ON h.customer_id = c.id
       WHERE c.project_id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [projectId]
    )

    return NextResponse.json({
      customers: rows.map((r) => ({
        ...r,
        lifetime_value: parseFloat(r.lifetime_value),
      })),
    })
  } catch (err) {
    console.error('[customers] GET failed:', err)
    console.error('[customers] full error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  console.log('[customers] clientToken:', clientToken)

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const body = await req.json()
  const {
    name,
    phone,
    email,
    address,
    equipment_type,
    install_year,
    last_service_date,
    notes,
    source,
  } = body as {
    name: string
    phone?: string
    email?: string
    address?: string
    equipment_type?: string
    install_year?: number
    last_service_date?: string
    notes?: string
    source?: string
  }

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  try {
    await ensureSchema()

    const service_status = calcServiceStatus(last_service_date)

    const rows = await query<{ id: string }>(
      `INSERT INTO public.client_customers
         (project_id, name, phone, email, address, equipment_type, install_year,
          last_service_date, notes, source, service_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        projectId,
        name,
        phone ?? null,
        email ?? null,
        address ?? null,
        equipment_type ?? null,
        install_year ?? null,
        last_service_date ?? null,
        notes ?? null,
        source ?? 'manual',
        service_status,
      ]
    )

    const created = await query(
      `SELECT * FROM public.client_customers WHERE id = $1`,
      [rows[0].id]
    )

    return NextResponse.json({ customer: created[0] }, { status: 201 })
  } catch (err) {
    console.error('[customers] POST failed:', err)
    console.error('[customers] full error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
