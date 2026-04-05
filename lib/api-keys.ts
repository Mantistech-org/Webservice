import { supabase, supabaseEnabled } from '@/lib/supabase'

/**
 * Maps service name → Railway environment variable name.
 * Used both for DB-to-env fallback and for seeding the table from env vars.
 */
export const ENV_FALLBACKS: Record<string, string> = {
  anthropic:                           'ANTHROPIC_API_KEY',
  resend:                              'RESEND_API_KEY',
  supabase_url:                        'SUPABASE_URL',
  supabase_anon_key:                   'SUPABASE_ANON_KEY',
  supabase_service_role_key:           'SUPABASE_SERVICE_ROLE_KEY',
  supabase_db_url:                     'SUPABASE_DB_URL',
  stripe_secret:                       'STRIPE_SECRET_KEY',
  stripe_webhook_secret:               'STRIPE_WEBHOOK_SECRET',
  stripe_price:                        'STRIPE_PRICE_ID',
  stripe_price_starter_monthly:        'STRIPE_PRICE_STARTER_MONTHLY',
  stripe_price_starter_upfront:        'STRIPE_PRICE_STARTER_UPFRONT',
  stripe_price_mid_monthly:            'STRIPE_PRICE_MID_MONTHLY',
  stripe_price_mid_upfront:            'STRIPE_PRICE_MID_UPFRONT',
  stripe_price_pro_monthly:            'STRIPE_PRICE_PRO_MONTHLY',
  stripe_price_pro_upfront:            'STRIPE_PRICE_PRO_UPFRONT',
  stripe_price_addon_review_management:'STRIPE_PRICE_ADDON_REVIEW_MANAGEMENT',
  stripe_price_addon_social_media:     'STRIPE_PRICE_ADDON_SOCIAL_MEDIA',
  stripe_price_addon_lead_generation:  'STRIPE_PRICE_ADDON_LEAD_GENERATION',
  stripe_price_addon_seo_optimization: 'STRIPE_PRICE_ADDON_SEO_OPTIMIZATION',
  stripe_price_addon_ecommerce:        'STRIPE_PRICE_ADDON_ECOMMERCE',
  stripe_price_addon_ad_creative:      'STRIPE_PRICE_ADDON_AD_CREATIVE',
  stripe_price_addon_chatbot:          'STRIPE_PRICE_ADDON_CHATBOT',
  stripe_price_addon_email_marketing:  'STRIPE_PRICE_ADDON_EMAIL_MARKETING',
  stripe_price_addon_email_domain:     'STRIPE_PRICE_ADDON_EMAIL_DOMAIN',
  google_places:                       'GOOGLE_PLACES_API_KEY',
  google_maps:                         'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  google_search_console:               'GOOGLE_SEARCH_CONSOLE_KEY',
  cron_secret:                         'CRON_SECRET',
}

// In-process cache.
// null = checked DB and not found; fall through to env var each time.
// string = value retrieved from DB; serve directly.
const _cache = new Map<string, string | null>()

/**
 * Retrieve an API key by service name and scope.
 *
 * Lookup order:
 *   1. In-process memory cache
 *   2. Supabase api_keys table (scope + service)
 *   3. Railway environment variable (fallback — zero outage risk)
 *
 * Results are cached per service per process restart to avoid repeated DB hits.
 */
export async function getApiKey(service: string, scope = 'admin'): Promise<string> {
  const cacheKey = `${scope}:${service}`

  if (_cache.has(cacheKey)) {
    const cached = _cache.get(cacheKey)
    return cached ?? process.env[ENV_FALLBACKS[service] ?? ''] ?? ''
  }

  if (supabaseEnabled) {
    try {
      const { data } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('scope', scope)
        .eq('service', service)
        .single()

      if (data?.key_value) {
        _cache.set(cacheKey, data.key_value)
        return data.key_value
      }
    } catch {
      // DB unavailable or table missing — fall through to env var
    }
  }

  // Not found in DB; cache the miss so we don't hit the DB again this process lifetime
  _cache.set(cacheKey, null)
  return process.env[ENV_FALLBACKS[service] ?? ''] ?? ''
}

/**
 * Invalidate the in-memory cache for a specific service/scope.
 * Call this immediately after writing a new value to the database.
 */
export function invalidateApiKeyCache(service: string, scope = 'admin'): void {
  _cache.delete(`${scope}:${service}`)
}

/**
 * Populate the Supabase api_keys table from current environment variables.
 * Uses INSERT ... ON CONFLICT DO NOTHING so existing manually-set keys are preserved.
 * Returns the number of rows the upsert attempted to seed.
 */
export async function seedApiKeysFromEnv(): Promise<number> {
  if (!supabaseEnabled) return 0

  const rows = Object.entries(ENV_FALLBACKS)
    .map(([service, envVar]) => ({
      scope: 'admin' as const,
      service,
      key_value: process.env[envVar] ?? '',
    }))
    .filter((r) => !!r.key_value)

  if (rows.length === 0) return 0

  const { error } = await supabase
    .from('api_keys')
    .upsert(rows, { onConflict: 'scope,service', ignoreDuplicates: true })

  if (error) {
    console.error('[api-keys] seedApiKeysFromEnv error:', error)
    return 0
  }

  _cache.clear()
  return rows.length
}
