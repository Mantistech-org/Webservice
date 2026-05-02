import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { query, pgEnabled } from '@/lib/pg'
import { getStripe } from '@/lib/stripe'

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
    CREATE TABLE IF NOT EXISTS public.client_invoices (
      id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      project_id              TEXT NOT NULL,
      invoice_token           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      proposal_id             TEXT,
      customer_name           TEXT NOT NULL,
      customer_email          TEXT,
      customer_phone          TEXT,
      service_address         TEXT,
      line_items              JSONB NOT NULL DEFAULT '[]',
      subtotal                NUMERIC NOT NULL DEFAULT 0,
      tax_rate                NUMERIC NOT NULL DEFAULT 0,
      tax_amount              NUMERIC NOT NULL DEFAULT 0,
      total                   NUMERIC NOT NULL DEFAULT 0,
      due_date                DATE,
      notes                   TEXT,
      stripe_payment_link     TEXT,
      stripe_payment_intent_id TEXT,
      status                  TEXT NOT NULL DEFAULT 'draft',
      paid_at                 TIMESTAMPTZ,
      created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(
    `CREATE INDEX IF NOT EXISTS idx_client_invoices_project_id ON public.client_invoices (project_id)`
  )
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_client_invoices_token ON public.client_invoices (invoice_token)`
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
  if (!pgEnabled) return NextResponse.json({ invoices: [] })

  try {
    await ensureSchema()
    const rows = await query(
      `SELECT * FROM public.client_invoices
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    )
    return NextResponse.json({ invoices: rows })
  } catch (err) {
    console.error('[invoices] GET failed:', err)
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
    proposal_id,
    customer_name,
    customer_email,
    customer_phone,
    service_address,
    line_items,
    subtotal,
    tax_rate,
    tax_amount,
    total,
    due_date,
    notes,
  } = body

  if (!customer_name) {
    return NextResponse.json({ error: 'customer_name is required' }, { status: 400 })
  }

  try {
    await ensureSchema()

    const rows = await query<{ id: string; invoice_token: string }>(
      `INSERT INTO public.client_invoices
         (project_id, proposal_id, customer_name, customer_email, customer_phone,
          service_address, line_items, subtotal, tax_rate, tax_amount, total, due_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)
       RETURNING id, invoice_token`,
      [
        projectId,
        proposal_id ?? null,
        customer_name,
        customer_email ?? null,
        customer_phone ?? null,
        service_address ?? null,
        JSON.stringify(line_items ?? []),
        subtotal ?? 0,
        tax_rate ?? 0,
        tax_amount ?? 0,
        total ?? 0,
        due_date ?? null,
        notes ?? null,
      ]
    )

    const invoiceId = rows[0].id
    const invoiceToken = rows[0].invoice_token

    // Create Stripe payment link if email provided and total > 0
    if (customer_email && total > 0) {
      try {
        const s = await getStripe()
        const price = await s.prices.create({
          currency: 'usd',
          unit_amount: Math.round(total * 100),
          product_data: { name: `Invoice - ${customer_name}` },
        })
        const paymentLink = await s.paymentLinks.create({
          line_items: [{ price: price.id, quantity: 1 }],
          metadata: { invoice_id: invoiceId, client_token: clientToken },
        })
        await query(
          `UPDATE public.client_invoices SET stripe_payment_link = $1, updated_at = NOW() WHERE id = $2`,
          [paymentLink.url, invoiceId]
        )
      } catch (err) {
        console.error('[invoices] Stripe payment link creation failed:', err)
      }
    }

    const created = await query(
      `SELECT * FROM public.client_invoices WHERE id = $1`,
      [invoiceId]
    )
    return NextResponse.json({ invoice: created[0], invoice_token: invoiceToken }, { status: 201 })
  } catch (err) {
    console.error('[invoices] POST failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
