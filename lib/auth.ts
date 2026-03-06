import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

export const COOKIE_NAME = 'mt_admin_session'

const CONFIG_FILE = path.join(process.cwd(), 'data', 'admin-config.json')

function readAdminConfig(): Record<string, string> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

export function getEffectiveAdminPassword(): string {
  const config = readAdminConfig()
  return config.password ?? process.env.ADMIN_PASSWORD ?? ''
}

export function getAdminToken(): string {
  return Buffer.from(getEffectiveAdminPassword()).toString('base64')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token === getAdminToken()
}
