import { cookies } from 'next/headers'

const COOKIE_NAME = 'mt_admin_session'

export function getAdminToken(): string {
  const password = process.env.ADMIN_PASSWORD ?? ''
  return Buffer.from(password).toString('base64')
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token === getAdminToken()
}

export { COOKIE_NAME }
