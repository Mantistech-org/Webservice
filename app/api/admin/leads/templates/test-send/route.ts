import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { Resend } from 'resend'
import { getApiKey } from '@/lib/api-keys'

const OUTREACH_FROM = 'Mantis Tech <support@mantistech.org>'
const PREVIEW_NAME = 'Main Street Thrift'
const PREVIEW_LOCATION = 'Austin, TX'

function applyPreviewVars(text: string): string {
  return text
    .replace(/\[Name\]/g, PREVIEW_NAME)
    .replace(/\[Location\]/g, PREVIEW_LOCATION)
    .replace(/\{\{business_name\}\}/g, PREVIEW_NAME)
}

function buildEmailHtml(body: string): string {
  const paragraphs = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p style="margin:0 0 16px 0;">${l}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#000000;line-height:1.6;">
  <div style="max-width:600px;padding:40px 24px;">
    ${paragraphs}
    <p style="margin:32px 0 0 0;font-size:13px;color:#666666;">Mantis Tech - Web Design &amp; Digital Marketing</p>
  </div>
</body>
</html>`
}

// POST /api/admin/leads/templates/test-send
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = await getApiKey('resend')
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured.' }, { status: 500 })
  }

  const { to, subject, body } = await req.json()

  if (!to?.trim()) return NextResponse.json({ error: 'to is required.' }, { status: 400 })
  if (!subject?.trim()) return NextResponse.json({ error: 'subject is required.' }, { status: 400 })
  if (!body?.trim()) return NextResponse.json({ error: 'body is required.' }, { status: 400 })

  const resolvedSubject = applyPreviewVars(subject)
  const resolvedBody = applyPreviewVars(body)

  const resend = new Resend(resendKey)

  try {
    await resend.emails.send({
      from: OUTREACH_FROM,
      to: to.trim(),
      subject: `[TEST] ${resolvedSubject}`,
      html: buildEmailHtml(resolvedBody),
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[test-send] Resend error:', err)
    return NextResponse.json({ error: 'Failed to send test email.' }, { status: 500 })
  }
}
