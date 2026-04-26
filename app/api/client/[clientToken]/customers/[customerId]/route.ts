import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

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
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    const customers = await query(
      `SELECT * FROM customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, project.id]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const history = await query(
      `SELECT * FROM client_service_history WHERE customer_id = $1 ORDER BY service_date DESC`,
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

  const project = await getProjectByClientToken(clientToken)
  if (!project) {
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
      `SELECT * FROM customers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [customerId, project.id]
    )
    if (!customers[0]) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const allowed = [
      'name', 'phone', 'email', 'address', 'equipment_type',
      'install_year', 'serial_number', 'last_service_date', 'notes', 'source',
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

    // Recalculate service_status if last_service_date is being updated
    const newLastServiceDate =
      'last_service_date' in body
        ? (body.last_service_date as string | null)
        : (customers[0] as Record<string, unknown>).last_service_date as string | null

    setClauses.push(`service_status = $${idx}`)
    values.push(calcServiceStatus(newLastServiceDate))
    idx++

    setClauses.push(`updated_at = NOW()`)

    const updated = await query(
      `UPDATE customers SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
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

  const project = await getProjectByClientToken(clientToken)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }

  try {
    // Ensure deleted_at column exists (idempotent migration)
    await query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`)

    const result = await query(
      `UPDATE customers SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
      [customerId, project.id]
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
