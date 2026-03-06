import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, getAdminToken } from '@/lib/auth'
import { cookies } from 'next/headers'
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
  const { code } = await req.json()
  const config = readConfig()

  if (!config.mfaCode || !config.mfaExpires) {
    return NextResponse.json({ error: 'No pending verification. Please log in again.' }, { status: 400 })
  }

  if (Date.now() > Number(config.mfaExpires)) {
    return NextResponse.json({ error: 'Code has expired. Please log in again.' }, { status: 400 })
  }

  if (code !== config.mfaCode) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 401 })
  }

  // Invalidate the code
  delete config.mfaCode
  delete config.mfaExpires
  writeConfig(config)

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, getAdminToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  })

  return NextResponse.json({ success: true })
}
