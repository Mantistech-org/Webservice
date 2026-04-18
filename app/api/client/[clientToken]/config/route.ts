import { NextRequest, NextResponse } from 'next/server'
import { getProjectByClientToken } from '@/lib/db'
import { supabase, supabaseEnabled } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientToken: string }> }
) {
  const { clientToken } = await params
  const project = await getProjectByClientToken(clientToken)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  if (!supabaseEnabled) {
    return NextResponse.json({ config: null })
  }

  const { data } = await supabase
    .from('client_configs')
    .select('*')
    .eq('project_id', project.id)
    .single()

  if (!data) return NextResponse.json({ config: null })

  const row = data as Record<string, unknown>
  return NextResponse.json({
    config: {
      missedCallReply:        (row.missed_call_reply        as string)   ?? '',
      reviewRequestSms:       (row.review_request_sms       as string)   ?? '',
      reviewRequestEmail:     (row.review_request_email     as string)   ?? '',
      gbpPostTemplates:       (row.gbp_post_templates       as string[]) ?? [],
      smsTemplates:           (row.sms_templates            as string[]) ?? [],
      emailTemplates:         (row.email_templates          as string[]) ?? [],
      serviceAreaDescription: (row.service_area_description as string)   ?? '',
      welcomeMessage:         (row.welcome_message          as string)   ?? '',
    },
  })
}
