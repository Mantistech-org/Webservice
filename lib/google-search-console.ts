import { JWT } from 'google-auth-library'
import { getApiKey } from '@/lib/api-keys'

export type ServiceAccountKey = {
  type: string
  project_id: string
  private_key_id?: string
  private_key: string
  client_email: string
  client_id?: string
}

// Synchronous flag — only reflects env vars present at startup.
// Use isGscEnabled() for checks that must include Supabase-stored keys.
export const gscEnabled = !!process.env.GOOGLE_SEARCH_CONSOLE_KEY

export async function isGscEnabled(): Promise<boolean> {
  const key = await getApiKey('google_search_console')
  return !!key
}

/**
 * Parse and validate a service account JSON string.
 * Throws a descriptive error if the JSON is invalid or missing required fields.
 * Also normalises the private_key: Railway env vars can double-escape \n as \\n,
 * which breaks PEM parsing. We convert \\n → actual newline here.
 */
export function parseServiceAccountJson(raw: string): ServiceAccountKey {
  let sa: ServiceAccountKey
  try {
    sa = JSON.parse(raw)
  } catch {
    throw new Error('Value is not valid JSON')
  }
  const required = ['type', 'project_id', 'private_key', 'client_email'] as const
  const missing = required.filter((f) => !sa[f])
  if (missing.length > 0) {
    throw new Error(`Service account JSON is missing required fields: ${missing.join(', ')}`)
  }
  // Normalise: if the key was stored via env var, \n may have been double-escaped to \\n
  if (sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  }
  return sa
}

/**
 * Build a google-auth-library JWT client from the stored service account JSON.
 */
async function getAuthClient(scope: string): Promise<JWT> {
  const raw = await getApiKey('google_search_console')
  if (!raw) throw new Error('Google Search Console key is not configured')
  const sa = parseServiceAccountJson(raw)
  return new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [scope],
  })
}

export type SearchAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

// The Search Console property is registered as 'https://mantistech.org/' (without www).
// Using www or omitting the trailing slash results in a 403.
const GSC_SITE_URL = 'https://mantistech.org/'

export async function getSearchAnalytics(params: {
  startDate: string
  endDate: string
  dimensions: ('query' | 'page' | 'country' | 'device')[]
  rowLimit?: number
}): Promise<SearchAnalyticsRow[]> {
  const siteUrl = GSC_SITE_URL
  const client = await getAuthClient('https://www.googleapis.com/auth/webmasters.readonly')
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Failed to obtain access token from Google')

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
    const siteUrl = GSC_SITE_URL

    const client = await getAuthClient('https://www.googleapis.com/auth/webmasters')
    const { token } = await client.getAccessToken()
    if (!token) return

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
