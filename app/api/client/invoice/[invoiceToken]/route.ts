import { NextRequest, NextResponse } from 'next/server'
import { query, pgEnabled } from '@/lib/pg'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceToken: string }> }
) {
  const { invoiceToken } = await params
  if (!pgEnabled) return NextResponse.json({ error: 'Database not available' }, { status: 503 })

  try {
    const rows = await query(
      `SELECT * FROM public.client_invoices WHERE invoice_token = $1`,
      [invoiceToken]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    return NextResponse.json({ invoice: rows[0] })
  } catch (err) {
    console.error('[invoice/token] GET failed:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
