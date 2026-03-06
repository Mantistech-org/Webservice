import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
  const { token, newPassword } = await req.json()

  if (!token || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const config = readConfig()

  if (!config.resetToken || config.resetToken !== token) {
    return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 400 })
  }

  if (Date.now() > Number(config.resetTokenExpires)) {
    return NextResponse.json({ error: 'Token has expired.' }, { status: 400 })
  }

  config.password = newPassword
  delete config.resetToken
  delete config.resetTokenExpires
  writeConfig(config)

  return NextResponse.json({ success: true })
}
