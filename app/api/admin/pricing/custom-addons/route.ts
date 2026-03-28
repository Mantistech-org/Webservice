import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export type CustomAddon = {
  id: string
  name: string
  client_name: string | null
  description: string
  one_time_fee: number | null
  monthly_fee: number | null
  active: boolean
  created_at: string
  updated_at: string
}

// GET /api/admin/pricing/custom-addons — list all custom add-ons
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) return NextResponse.json({ addons: [] })

  try {
    const addons = await query<CustomAddon>(
      `SELECT * FROM public.custom_addons ORDER BY created_at DESC`
    )
    return NextResponse.json({ addons })
  } catch (err) {
    console.error('[custom-addons] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load custom add-ons.' }, { status: 500 })
  }
}

type CreateBody = {
  name: string
  client_name?: string
  description?: string
  one_time_fee?: number | null
  monthly_fee?: number | null
  active?: boolean
}

// POST /api/admin/pricing/custom-addons — create a new custom add-on
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = (await req.json()) as CreateBody

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required.' }, { status: 400 })
  }

  try {
    const rows = await query<CustomAddon>(
      `INSERT INTO public.custom_addons
         (name, client_name, description, one_time_fee, monthly_fee, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        body.name.trim(),
        body.client_name?.trim() || null,
        body.description?.trim() || '',
        body.one_time_fee ?? null,
        body.monthly_fee ?? null,
        body.active ?? true,
      ]
    )
    return NextResponse.json({ addon: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[custom-addons] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create add-on.' }, { status: 500 })
  }
}
