import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/auth'
import { sendAdminMfaCodeEmail } from '@/lib/resend'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'data', 'admin-config.json')

function readConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeConfig(config: Record<string, string>) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!password || !(await verifyAdminPassword(password))) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    // Generate 6-digit MFA code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes

    const config = readConfig()
    config.mfaCode = code
    config.mfaExpires = String(expires)
    writeConfig(config)

    // Send code via email — if it fails, clean up the stored code so the
    // admin isn't stuck on a code-entry screen with no deliverable code.
    try {
      await sendAdminMfaCodeEmail(code)
    } catch (emailErr) {
      delete config.mfaCode
      delete config.mfaExpires
      writeConfig(config)
      console.error('[admin/login] Failed to send MFA code email:', emailErr)
      return NextResponse.json(
        { error: 'Failed to send verification code. Check that ADMIN_EMAIL and RESEND_API_KEY are configured correctly.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ mfaRequired: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
