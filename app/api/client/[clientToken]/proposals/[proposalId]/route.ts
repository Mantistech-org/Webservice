import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'

const TEMPLATE_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'

async function resolveProjectId(clientToken: string): Promise<string | null> {
  const project = await getProjectByClientToken(clientToken)
  if (project) return project.id
  if (clientToken === 'template-preview') return TEMPLATE_PROJECT_ID
  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; proposalId: string }> }
) {
  const { clientToken, proposalId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const rows = await query(
      `SELECT * FROM public.client_proposals WHERE id = $1 AND project_id = $2`,
      [proposalId, projectId]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ proposal: rows[0] })
  } catch (err) {
    console.error('[proposals/id] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; proposalId: string }> }
) {
  const { clientToken, proposalId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const body = await req.json()
  const allowed = [
    'customer_name', 'customer_email', 'customer_phone', 'service_address',
    'service_type', 'complaint', 'findings', 'recommended_work',
    'parts_cost', 'labor_hours', 'labor_rate', 'notes', 'valid_until',
    'generated_content', 'status', 'last_sent_at',
  ]

  const setClauses: string[] = []
  const values: unknown[] = []
  let idx = 1

  for (const key of allowed) {
    if (key in body) {
      if (key === 'generated_content') {
        setClauses.push(`${key} = $${idx}::jsonb`)
        values.push(body[key] ? JSON.stringify(body[key]) : null)
      } else {
        setClauses.push(`${key} = $${idx}`)
        values.push(body[key] ?? null)
      }
      idx++
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  setClauses.push(`updated_at = NOW()`)
  values.push(proposalId, projectId)

  try {
    const rows = await query(
      `UPDATE public.client_proposals
       SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND project_id = $${idx + 1}
       RETURNING *`,
      values
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Auto-create draft invoice when proposal is accepted
    if (body.status === 'accepted' && rows[0].generated_content) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = rows[0].generated_content as any
        const lineItems = [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(content.parts_list || []).map((p: any) => ({
            description: p.item,
            quantity: 1,
            unit_price: p.cost,
            total: p.cost,
          })),
          {
            description: `Labor - ${content.labor_hours} hours`,
            quantity: content.labor_hours,
            unit_price: content.labor_rate,
            total: content.labor_total,
          },
        ]
        await query(
          `INSERT INTO public.client_invoices
           (project_id, proposal_id, customer_name, customer_email, service_address,
            line_items, subtotal, total, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW() + INTERVAL '30 days', 'draft')`,
          [
            projectId,
            proposalId,
            rows[0].customer_name,
            rows[0].customer_email,
            rows[0].service_address,
            JSON.stringify(lineItems),
            content.grand_total,
            content.grand_total,
          ]
        )
      } catch (err) {
        console.error('[proposals/id] auto-invoice creation failed:', err)
      }
    }

    return NextResponse.json({ proposal: rows[0] })
  } catch (err) {
    console.error('[proposals/id] PATCH failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; proposalId: string }> }
) {
  const { clientToken, proposalId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    await query(
      `DELETE FROM public.client_proposals WHERE id = $1 AND project_id = $2`,
      [proposalId, projectId]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[proposals/id] DELETE failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
