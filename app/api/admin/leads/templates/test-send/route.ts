import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { Resend } from 'resend'

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
    .map((l) => `<p style="margin:0 0 14px 0;line-height:1.6;">${l}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="padding:32px 40px 0 40px;">
            <p style="margin:0 0 24px 0;font-size:13px;font-weight:600;letter-spacing:0.05em;color:#333;text-transform:uppercase;">Mantis Tech</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 40px 40px;font-size:15px;color:#333;">
            ${paragraphs}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f9f9f9;border-top:1px solid #eee;font-size:12px;color:#888;font-family:monospace;">
            Mantis Tech &mdash; Web Design &amp; Digital Marketing<br>
            <a href="https://mantistech.org" style="color:#888;">mantistech.org</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST /api/admin/leads/templates/test-send
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
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
