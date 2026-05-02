import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { sendInvoiceEmail } from '@/lib/resend'

const TEMPLATE_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

async function resolveProjectId(clientToken: string): Promise<string | null> {
  const project = await getProjectByClientToken(clientToken)
  if (project) return project.id
  if (clientToken === 'template-preview') return TEMPLATE_PROJECT_ID
  return null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; invoiceId: string }> }
) {
  const { clientToken, invoiceId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const rows = await query(
      `SELECT * FROM public.client_invoices WHERE id = $1 AND project_id = $2`,
      [invoiceId, projectId]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ invoice: rows[0] })
  } catch (err) {
    console.error('[invoices/id] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; invoiceId: string }> }
) {
  const { clientToken, invoiceId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  const body = await req.json()
  const allowed = ['status', 'notes', 'due_date', 'paid_at', 'stripe_payment_link']

  const setClauses: string[] = []
  const values: unknown[] = []
  let idx = 1

  for (const key of allowed) {
    if (key in body) {
      setClauses.push(`${key} = $${idx}`)
      values.push(body[key] ?? null)
      idx++
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  setClauses.push(`updated_at = NOW()`)
  values.push(invoiceId, projectId)

  try {
    const rows = await query(
      `UPDATE public.client_invoices
       SET ${setClauses.join(', ')}
       WHERE id = $${idx} AND project_id = $${idx + 1}
       RETURNING *`,
      values
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const invoice = rows[0] as {
      customer_email: string | null
      customer_name: string
      stripe_payment_link: string | null
      invoice_token: string
      due_date: string | null
      total: string | number
    }

    // Send email when status changes to 'sent'
    if (body.status === 'sent' && invoice.customer_email && invoice.stripe_payment_link) {
      try {
        const project = await getProjectByClientToken(clientToken)
        const businessName = project?.businessName ?? 'Your Service Provider'
        const invoiceUrl = `${BASE_URL}/client/invoice/${invoice.invoice_token}`
        const dueDate = invoice.due_date
          ? new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Upon Receipt'
        await sendInvoiceEmail({
          to: invoice.customer_email,
          customerName: invoice.customer_name,
          businessName,
          total: parseFloat(String(invoice.total)),
          dueDate,
          paymentLink: invoice.stripe_payment_link,
          invoiceUrl,
        })
      } catch (err) {
        console.error('[invoices/id] email send failed:', err)
      }
    }

    return NextResponse.json({ invoice: rows[0] })
  } catch (err) {
    console.error('[invoices/id] PATCH failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string; invoiceId: string }> }
) {
  const { clientToken, invoiceId } = await params
  const projectId = await resolveProjectId(clientToken)
  if (!projectId) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    await query(
      `DELETE FROM public.client_invoices WHERE id = $1 AND project_id = $2`,
      [invoiceId, projectId]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[invoices/id] DELETE failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
