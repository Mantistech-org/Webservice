import * as crypto from 'crypto'
import { getApiKey } from '@/lib/api-keys'

type ServiceAccountKey = {
  client_email: string
  private_key: string
}

export const gscEnabled = !!process.env.GOOGLE_SEARCH_CONSOLE_KEY

async function getServiceAccount(): Promise<ServiceAccountKey> {
  const raw = await getApiKey('google_search_console')
  if (!raw) throw new Error('GOOGLE_SEARCH_CONSOLE_KEY is not set')
  try {
    return JSON.parse(raw) as ServiceAccountKey
  } catch {
    throw new Error('GOOGLE_SEARCH_CONSOLE_KEY is not valid JSON')
  }
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(scope: string): Promise<string> {
  const sa = await getServiceAccount()
  const now = Math.floor(Date.now() / 1000)

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  )

  const signingInput = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = base64url(sign.sign(sa.private_key))
  const jwt = `${signingInput}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC auth failed: ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export type SearchAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function getSearchAnalytics(params: {
  startDate: string
  endDate: string
  dimensions: ('query' | 'page' | 'country' | 'device')[]
  rowLimit?: number
}): Promise<SearchAnalyticsRow[]> {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const token = await getAccessToken('https://www.googleapis.com/auth/webmasters.readonly')

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: params.startDate,
        endDate: params.endDate,
        dimensions: params.dimensions,
        rowLimit: params.rowLimit ?? 25,
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC API error: ${text}`)
  }

  const data = (await res.json()) as { rows?: SearchAnalyticsRow[] }
  return data.rows ?? []
}

// Best-effort sitemap submission — never throws.
export async function submitSitemap(sitemapUrl: string): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    if (!siteUrl) return

    const token = await getAccessToken('https://www.googleapis.com/auth/webmasters')

    await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }
    )
  } catch (err) {
    console.error('[gsc] submitSitemap failed (non-fatal):', err)
  }
}
