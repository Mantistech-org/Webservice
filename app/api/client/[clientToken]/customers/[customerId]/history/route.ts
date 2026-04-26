import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

const TEMPLATE_PROJECT_ID = 'template-project-id'

function calcServiceStatus(lastServiceDate: string | null | undefined): string {
  if (!lastServiceDate) return 'Up to Date'
  const months = (Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  if (months <= 6) return 'Up to Date'
  if (months <= 12) return 'Due for Service'
  return 'Overdue'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; customerId: string }> }
) {
  const { clientToken, customerId } = await params

  const project = await getProjectByClientToken(clientToken)
  const projectId = project?.id ?? (clientToken === 'template-preview' ? TEMPLATE_PROJECT_ID : null)
  if (!projectId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ history: [] })
  }

  try {
    // Verify customer belongs to this project
    const customers = await query(
      `SELECT id FROM customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
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

  const project = await getProjectByClientToken(clientToken)
  const projectId = project?.id ?? (clientToken === 'template-preview' ? TEMPLATE_PROJECT_ID : null)
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
    // Verify customer belongs to this project
    const customers = await query(
      `SELECT id FROM customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, projectId]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Insert history entry
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

    // Recalculate lifetime_value, last_service_date, and service_status
    const [agg] = await query<{ total: string; latest: string | null }>(
      `SELECT COALESCE(SUM(cost), 0) AS total, MAX(service_date)::text AS latest
       FROM client_service_history WHERE customer_id = $1`,
      [customerId]
    )

    const newLastServiceDate = agg.latest
    const newServiceStatus = calcServiceStatus(newLastServiceDate)

    await query(
      `UPDATE customers
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
