import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

interface CsvRow {
  business_name?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  category?: string
  rating?: string
  status?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await req.json()
  const { rows } = body as { rows: CsvRow[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows array is required.' }, { status: 400 })
  }

  const validRows = rows.filter(r => r.business_name?.trim() || r.phone?.trim())
  const skipped = rows.length - validRows.length

  if (validRows.length === 0) {
    return NextResponse.json({ success: true, imported: 0, skipped })
  }

  const values = validRows.map((_, i) =>
    `($${i*9+1}, $${i*9+2}, $${i*9+3}, $${i*9+4}, $${i*9+5}, $${i*9+6}, $${i*9+7}, $${i*9+8}, $${i*9+9})`
  ).join(', ')

  try {
    await query(
      `INSERT INTO public.outreach_leads (business_name, phone, email, website, address, category, rating, status, notes)
       VALUES ${values}`,
      validRows.flatMap(r => [
        r.business_name?.trim() || null,
        r.phone?.trim() || null,
        r.email?.trim() || null,
        r.website?.trim() || null,
        r.address?.trim() || null,
        r.category?.trim() || null,
        r.rating ? parseFloat(r.rating) || null : null,
        r.status?.trim() || 'new',
        r.notes?.trim() || null,
      ])
    )
  } catch (err) {
    console.error('[leads/import] batch insert failed:', err)
    return NextResponse.json({ error: 'Import failed.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, imported: validRows.length, skipped })
}
