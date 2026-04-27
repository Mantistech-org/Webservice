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

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  { params }: { params: Promise<{ clientToken: string; customerId: string }> }
) {
  const { clientToken, customerId } = await params

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ history: [] })
  }

  try {
    const customers = await query(
      `SELECT id FROM public.client_customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, projectId]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const history = await query(
      `SELECT * FROM client_service_history WHERE customer_id = $1 ORDER BY service_date DESC`,
      [customerId]
    )

    return NextResponse.json({ history })
  } catch (err) {
    console.error('[customers/:id/history] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; customerId: string }> }
) {
  const { clientToken, customerId } = await params

  const projectId = await resolveProjectId(clientToken)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  const body = await req.json()
  const { service_date, service_type, technician, cost, notes } = body as {
    service_date: string
    service_type: string
    technician?: string
    cost: number
    notes?: string
  }

  if (!service_date || !service_type || cost == null) {
    return NextResponse.json(
      { error: 'service_date, service_type, and cost are required' },
      { status: 400 }
    )
  }

  try {
    const customers = await query(
      `SELECT id FROM public.client_customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, projectId]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const inserted = await query(
      `INSERT INTO client_service_history (customer_id, project_id, service_date, service_type, technician, cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        customerId,
        projectId,
        service_date,
        service_type,
        technician ?? null,
        cost,
        notes ?? null,
      ]
    )

    const [agg] = await query<{ total: string; latest: string | null }>(
      `SELECT COALESCE(SUM(cost), 0) AS total, MAX(service_date)::text AS latest
       FROM client_service_history WHERE customer_id = $1`,
      [customerId]
    )

    const newLastServiceDate = agg.latest
    const newServiceStatus = calcServiceStatus(newLastServiceDate)

    await query(
      `UPDATE public.client_customers
       SET lifetime_value = $1, last_service_date = $2, service_status = $3, updated_at = NOW()
       WHERE id = $4`,
      [parseFloat(agg.total), newLastServiceDate ?? null, newServiceStatus, customerId]
    )

    return NextResponse.json({ entry: inserted[0] }, { status: 201 })
  } catch (err) {
    console.error('[customers/:id/history] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
