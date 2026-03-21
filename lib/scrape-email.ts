const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Domains/patterns that are almost never real contact emails
const IGNORE_DOMAINS = new Set([
  'example.com',
  'sentry.io',
  'sentry-next.com',
  'wix.com',
  'squarespace.com',
  'shopify.com',
  'wordpress.com',
  'githubusercontent.com',
  'google.com',
  'gstatic.com',
  'w3.org',
  'schema.org',
])

const IGNORE_PREFIXES = ['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'mailer', 'bounce']

function extractEmails(html: string): string[] {
  // Prefer mailto: links first (most likely to be real contact emails)
  const mailtoMatches: string[] = []
  const mailtoRe = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  let m: RegExpExecArray | null
  while ((m = mailtoRe.exec(html)) !== null) {
    mailtoMatches.push(m[1].toLowerCase())
  }

  // Also scan plain text for email patterns
  const textMatches = (html.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase())

  const candidates = [...mailtoMatches, ...textMatches]
  const seen = new Set<string>()
  const results: string[] = []

  for (const email of candidates) {
    if (seen.has(email)) continue
    seen.add(email)
    const domain = email.split('@')[1] ?? ''
    const prefix = email.split('@')[0] ?? ''
    if (IGNORE_DOMAINS.has(domain)) continue
    if (domain.endsWith('.png') || domain.endsWith('.jpg') || domain.endsWith('.svg')) continue
    if (IGNORE_PREFIXES.some((p) => prefix.startsWith(p))) continue
    // Skip image/asset file extensions accidentally matched
    if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(email)) continue
    results.push(email)
  }

  return results
}

async function fetchHtml(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; emailscraper/1.0)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html') && !ct.includes('text/plain')) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function normalizeBase(website: string): string {
  try {
    const u = new URL(website)
    return u.origin // e.g. https://example.com
  } catch {
    // If no protocol, prepend https://
    return `https://${website.replace(/^\/+/, '')}`
  }
}

/**
 * Attempts to find a contact email address on the given website.
 * Checks the homepage first, then /contact and /about if needed.
 * Returns null if none found or the site is unreachable.
 */
export async function scrapeEmailFromWebsite(website: string): Promise<string | null> {
  const base = normalizeBase(website)
  const pagesToCheck = [base, `${base}/contact`, `${base}/about`]

  for (const url of pagesToCheck) {
    const html = await fetchHtml(url, 5000)
    if (!html) continue
    const emails = extractEmails(html)
    if (emails.length > 0) return emails[0]
  }

  return null
}
