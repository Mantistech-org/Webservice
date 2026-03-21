import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
  updated_at: string
}

// GET /api/admin/leads/templates
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ templates: [] })
  }

  try {
    const templates = await query<EmailTemplate>(
      'SELECT * FROM public.email_templates ORDER BY updated_at DESC'
    )
    return NextResponse.json({ templates })
  } catch (err) {
    console.error('[templates] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load templates.' }, { status: 500 })
  }
}

// POST /api/admin/leads/templates
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const { name, subject, body } = await req.json()
  if (!name?.trim() || !subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'name, subject, and body are required.' }, { status: 400 })
  }

  try {
    const rows = await query<EmailTemplate>(
      `INSERT INTO public.email_templates (name, subject, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), subject.trim(), body.trim()]
    )
    return NextResponse.json({ template: rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[templates] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create template.' }, { status: 500 })
  }
}
