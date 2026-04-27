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
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const customers = await query(
      `SELECT * FROM public.client_customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, projectId]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const history = await query(
      `SELECT * FROM public.client_service_history WHERE customer_id = $1 ORDER BY service_date DESC`,
      [customerId]
    )

    return NextResponse.json({ customer: customers[0], history })
  } catch (err) {
    console.error('[customers/:id] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
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

  const body = await req.json() as Record<string, unknown>

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const customers = await query(
      `SELECT * FROM public.client_customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, projectId]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const allowed = [
      'name', 'phone', 'email', 'address', 'equipment_type',
      'install_year', 'last_service_date', 'notes', 'source',
    ]

    const setClauses: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const field of allowed) {
      if (field in body) {
        setClauses.push(`${field} = $${idx}`)
        values.push(body[field] ?? null)
        idx++
      }
    }

    const newLastServiceDate =
      'last_service_date' in body
        ? (body.last_service_date as string | null)
        : (customers[0] as Record<string, unknown>).last_service_date as string | null

    setClauses.push(`service_status = $${idx}`)
    values.push(calcServiceStatus(newLastServiceDate))
    idx++

    setClauses.push(`updated_at = NOW()`)

    const updated = await query(
      `UPDATE public.client_customers SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, customerId]
    )

    return NextResponse.json({ customer: updated[0] })
  } catch (err) {
    console.error('[customers/:id] PATCH failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
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

  try {
    await query(`ALTER TABLE public.client_customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`)

    const result = await query(
      `UPDATE public.client_customers SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
      [customerId, projectId]
    )

    if (!result[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[customers/:id] DELETE failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
