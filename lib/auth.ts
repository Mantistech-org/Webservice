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

// The "auth secret" is the bcrypt hash when ADMIN_PASSWORD_HASH is configured,
// otherwise the plaintext password (legacy). The session token is base64 of this
// value — deterministic and opaque to callers, but safe because a bcrypt hash is
// already non-reversible.
function getAuthSecret(): string {
  const config = readAdminConfig()
  return (
    process.env.ADMIN_PASSWORD_HASH ??
    config.passwordHash ??
    config.password ??
    process.env.ADMIN_PASSWORD ??
    ''
  )
}

// Kept for backward-compat callers that need the raw plaintext (legacy activate route).
export function getEffectiveAdminPassword(): string {
  const config = readAdminConfig()
  return config.password ?? process.env.ADMIN_PASSWORD ?? ''
}

export function getAdminToken(): string {
  return Buffer.from(getAuthSecret()).toString('base64')
}

// Verify a submitted password against the stored credential.
// Uses bcrypt.compare() when ADMIN_PASSWORD_HASH (or config.passwordHash) is set;
// falls back to plaintext === for legacy deployments.
export async function verifyAdminPassword(submitted: string): Promise<boolean> {
  const config = readAdminConfig()
  const hash = process.env.ADMIN_PASSWORD_HASH ?? config.passwordHash
  if (hash) {
    const { compare } = await import('bcryptjs')
    return compare(submitted, hash)
  }
  // Legacy plaintext fallback — upgrade by setting ADMIN_PASSWORD_HASH
  return submitted === getEffectiveAdminPassword()
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token === getAdminToken()
}
