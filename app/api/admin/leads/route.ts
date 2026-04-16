import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { query, pgEnabled } from '@/lib/pg'
import { scrapeEmailFromWebsite } from '@/lib/scrape-email'
import type { OutreachLead } from '@/types/leads'

export type { OutreachLead }

let migrated = false
async function ensureMigration() {
  if (migrated) return
  await query(`ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz`)
  migrated = true
}

// GET /api/admin/leads — list all outreach leads
// ?deleted=true returns soft-deleted rows; otherwise returns active rows
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ leads: [] })
  }

  await ensureMigration()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const deleted = searchParams.get('deleted') === 'true'

  let sql = 'SELECT * FROM public.outreach_leads'
  const params: unknown[] = []
  const conditions: string[] = []

  conditions.push(deleted ? 'deleted_at IS NOT NULL' : 'deleted_at IS NULL')

  if (status && status !== 'all') {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(business_name ILIKE $${params.length} OR address ILIKE $${params.length})`)
  }

  sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY created_at DESC'

  try {
    const leads = await query<OutreachLead>(sql, params.length ? params : undefined)
    return NextResponse.json({ leads })
  } catch (err) {
    console.error('[leads] GET failed:', err)
    return NextResponse.json({ error: 'Failed to load leads.' }, { status: 500 })
  }
}

// POST /api/admin/leads — save a batch of new leads (deduplicates by place_id)
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  const body = await req.json()
  const { leads, category, location_searched } = body as {
    leads: Array<{
      place_id: string
      business_name: string
      address?: string
      phone?: string
      website?: string
      rating?: number | null
    }>
    category?: string
    location_searched?: string
  }

  if (!Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json({ error: 'leads array is required.' }, { status: 400 })
  }

  let saved = 0
  let skipped = 0

  // Track newly inserted leads that have a website (for email scraping)
  const toScrape: Array<{ id: string; website: string }> = []

  for (const lead of leads) {
    try {
      const result = await query<{ id: string }>(
        `INSERT INTO public.outreach_leads
           (business_name, address, phone, website, rating, category, location_searched, place_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (place_id) DO NOTHING
         RETURNING id`,
        [
          lead.business_name,
          lead.address ?? null,
          lead.phone ?? null,
          lead.website ?? null,
          lead.rating ?? null,
          category ?? null,
          location_searched ?? null,
          lead.place_id ?? null,
        ]
      )
      if (result.length > 0) {
        saved++
        if (lead.website) {
          toScrape.push({ id: result[0].id, website: lead.website })
        }
      } else {
        skipped++
      }
    } catch (err) {
      console.error('[leads] insert failed for', lead.business_name, err)
      skipped++
    }
  }

  // Scrape all newly saved leads' websites in parallel, then patch any found emails
  if (toScrape.length > 0) {
    await Promise.all(
      toScrape.map(async ({ id, website }) => {
        try {
          const email = await scrapeEmailFromWebsite(website)
          if (email) {
            await query(
              `UPDATE public.outreach_leads SET email = $1, updated_at = now() WHERE id = $2 AND email IS NULL`,
              [email, id]
            )
          }
        } catch (err) {
          console.error('[leads] scrape failed for', website, err)
        }
      })
    )
  }

  return NextResponse.json({ saved, skipped })
}

// DELETE /api/admin/leads?id= — soft delete a lead (sets deleted_at = NOW())
export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  await ensureMigration()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  try {
    await query(
      `UPDATE public.outreach_leads SET deleted_at = NOW() WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[leads] DELETE failed:', err)
    return NextResponse.json({ error: 'Delete failed.' }, { status: 500 })
  }
}

// PATCH /api/admin/leads?id=&action=restore — restore a soft-deleted lead
export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!pgEnabled) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 })
  }

  await ensureMigration()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')

  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })
  if (action !== 'restore') return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })

  try {
    await query(
      `UPDATE public.outreach_leads SET deleted_at = NULL WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[leads] PATCH restore failed:', err)
    return NextResponse.json({ error: 'Restore failed.' }, { status: 500 })
  }
}
