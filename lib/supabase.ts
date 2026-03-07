import { createClient } from '@supabase/supabase-js'
import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Supabase disabled, using local JSON fallback')
} else {
  console.log('[supabase] SUPABASE_URL (first 30 chars):', supabaseUrl.slice(0, 30))
}

// Service role client bypasses Row Level Security and has full table access.
// Never expose this client to the browser.
// Use placeholder values when env vars are missing so the module loads without throwing.
// supabaseEnabled guards all actual usage.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const supabaseEnabled = !!(supabaseUrl && supabaseServiceKey)
