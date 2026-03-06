import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const CONFIG_FILE = path.join(process.cwd(), 'data', 'admin-config.json')

function readConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch {
    // ignore
  }
  return {}
}

function writeConfig(config: Record<string, string>) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const adminEmail = process.env.ADMIN_EMAIL ?? ''

  // Always return success to avoid enumeration
  if (!email || email.toLowerCase() !== adminEmail.toLowerCase()) {
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + 1000 * 60 * 30 // 30 minutes

  const config = readConfig()
  config.resetToken = token
  config.resetTokenExpires = String(expires)
  writeConfig(config)

  const resend = new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
  const FROM = process.env.EMAIL_FROM ?? 'no-reply@mantistech.io'

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: 'Mantis Tech Admin Password Reset',
    html: `<p>Your password reset token is:</p><p><strong>${token}</strong></p><p>This token expires in 30 minutes. Go to <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/reset-password">${process.env.NEXT_PUBLIC_BASE_URL}/admin/reset-password</a> to complete the reset.</p>`,
  })

  return NextResponse.json({ success: true })
}
