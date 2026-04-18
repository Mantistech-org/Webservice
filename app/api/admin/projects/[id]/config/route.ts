import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { supabase, supabaseEnabled } from '@/lib/supabase'
import { getProject } from '@/lib/db'
import { configureClientDashboard, DashboardConfig } from '@/lib/configure-dashboard'

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIELD_TO_COL: Record<string, string> = {
  missedCallReply:        'missed_call_reply',
  reviewRequestSms:       'review_request_sms',
  reviewRequestEmail:     'review_request_email',
  gbpPostTemplates:       'gbp_post_templates',
  smsTemplates:           'sms_templates',
  emailTemplates:         'email_templates',
  serviceAreaDescription: 'service_area_description',
  welcomeMessage:         'welcome_message',
}

function rowToConfig(row: Record<string, unknown>): DashboardConfig {
  return {
    missedCallReply:        (row.missed_call_reply        as string)   ?? '',
    reviewRequestSms:       (row.review_request_sms       as string)   ?? '',
    reviewRequestEmail:     (row.review_request_email     as string)   ?? '',
    gbpPostTemplates:       (row.gbp_post_templates       as string[]) ?? [],
    smsTemplates:           (row.sms_templates            as string[]) ?? [],
    emailTemplates:         (row.email_templates          as string[]) ?? [],
    serviceAreaDescription: (row.service_area_description as string)   ?? '',
    welcomeMessage:         (row.welcome_message          as string)   ?? '',
  }
}

async function fetchRow(projectId: string) {
  const { data } = await supabase
    .from('client_configs')
    .select('*')
    .eq('project_id', projectId)
    .single()
  return data as Record<string, unknown> | null
}

// ── GET /api/admin/projects/[id]/config ───────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseEnabled) return NextResponse.json({ config: null })

  const { id } = await params
  const row = await fetchRow(id)
  if (!row) return NextResponse.json({ config: null })
  return NextResponse.json({ config: rowToConfig(row) })
}

// ── PATCH /api/admin/projects/[id]/config ─────────────────────────────────────
//
// Three modes — exactly one of these keys must be present:
//   { updates: Partial<Record<fieldName, value>> }  — save manual edits
//   { regenerate: true }                            — regenerate entire config
//   { regenerateField: keyof DashboardConfig }      — regenerate one field only

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseEnabled) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 })
  }

  const { id } = await params
  const body = await req.json() as {
    updates?:        Record<string, unknown>
    regenerate?:     boolean
    regenerateField?: string
  }

  // ── Regenerate entire config ──────────────────────────────────────────────

  if (body.regenerate) {
    const project = await getProject(id)
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    try {
      const config = await configureClientDashboard(project)
      return NextResponse.json({ config })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  // ── Regenerate a single field ─────────────────────────────────────────────

  if (body.regenerateField) {
    const fieldName = body.regenerateField
    const col = FIELD_TO_COL[fieldName]
    if (!col) return NextResponse.json({ error: `Unknown field: ${fieldName}` }, { status: 400 })

    const project = await getProject(id)
    if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })

    let fullConfig: DashboardConfig
    try {
      // Generate the full config; pull just the requested field value from it
      fullConfig = await configureClientDashboard(project)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const newValue = fullConfig[fieldName as keyof DashboardConfig]
    const { error: updateErr } = await supabase
      .from('client_configs')
      .update({ [col]: newValue, updated_at: new Date().toISOString() })
      .eq('project_id', id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    const row = await fetchRow(id)
    if (!row) return NextResponse.json({ error: 'Config not found after update.' }, { status: 404 })
    return NextResponse.json({ config: rowToConfig(row) })
  }

  // ── Save manual edits ─────────────────────────────────────────────────────

  if (body.updates && Object.keys(body.updates).length > 0) {
    const dbUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const [field, value] of Object.entries(body.updates)) {
      const col = FIELD_TO_COL[field]
      if (col) dbUpdate[col] = value
    }

    const { error: updateErr } = await supabase
      .from('client_configs')
      .update(dbUpdate)
      .eq('project_id', id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    const row = await fetchRow(id)
    if (!row) return NextResponse.json({ error: 'Config not found after update.' }, { status: 404 })
    return NextResponse.json({ config: rowToConfig(row) })
  }

  return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
}
