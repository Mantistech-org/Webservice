import { NextRequest, NextResponse } from 'next/server'
import { sendAdminMfaCodeEmail } from '@/lib/resend'
import fs from 'fs'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'data', 'admin-config.json')

function readConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch { /* ignore */ }
  return {}
}

function writeConfig(config: Record<string, string>) {
  const dir = path.dirname(CONFIG_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
}

export async function POST(req: NextRequest) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires = Date.now() + 10 * 60 * 1000

  const config = readConfig()
  config.mfaCode = code
  config.mfaExpires = String(expires)
  writeConfig(config)

  await sendAdminMfaCodeEmail(code).catch(() => { /* non-fatal */ })

  return NextResponse.json({ success: true })
}
