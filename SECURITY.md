# Security Audit — Mantis Tech Web Service

**Audit date:** 2026-03-28
**Auditor:** Internal — AI-assisted full-stack review
**Scope:** All API routes, authentication, database, infrastructure, and client-side code

---

## Critical & High Issues — Fixed in This Audit

| ID | Severity | File | Issue | Fix Applied |
|----|----------|------|-------|-------------|
| C1 | CRITICAL | `app/api/admin/pricing/stripe-debug/route.ts` | Zero auth — entire Stripe product & price catalog exposed publicly | Added `isAdminAuthenticated()` guard |
| C2 | CRITICAL | `app/api/admin/leads/process-campaigns/route.ts` | Optional auth: `if (secret && ...)` means endpoint is fully public when `cron_secret` is not configured, allowing unauthenticated mass email sending to all leads | Changed to `if (!secret \|\| ...)` |
| C3 | CRITICAL | `app/api/cron/generate-blog/route.ts` | Same optional auth bug — unauthenticated callers could burn Anthropic API credits and insert blog posts | Changed to `if (!secret \|\| ...)` |
| H1 | HIGH | `next.config.js` | No HTTP security headers: missing HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy | Added `async headers()` with all six headers |
| H2 | HIGH | `Dockerfile` | Container ran as root — any container escape grants root on host | Added non-root `appuser`, moved resolv.conf write to build stage |

---

## Medium Severity — Open Issues

### M1 — No Rate Limiting on Public Endpoints

**Affected routes:**
- `POST /api/intake` — project inquiry form (no brute-force or spam protection)
- `POST /api/leads/[clientToken]` — lead capture widget (can be spammed by bots)
- `POST /api/admin/login` — admin login (password-spray risk)
- `POST /api/client/[clientToken]/events` — event tracking endpoint

**Risk:** An attacker or bot can hammer these endpoints to spam the database, flood Resend email quota, or attempt brute-force on admin login.

**Recommended fix:** Add `upstash/ratelimit` middleware or a Railway-level reverse proxy rule (e.g., limit `/api/admin/login` to 5 req/minute per IP, `/api/intake` to 3 req/minute per IP).

---

### M2 — Wide-Open CORS on Lead Capture Endpoint

**File:** `app/api/leads/[clientToken]/route.ts`
**Issue:** `Access-Control-Allow-Origin: *` allows any website to POST leads to any client's endpoint. A malicious site could submit fake lead data to any client's dashboard just by knowing their `clientToken`.
**Risk:** Data poisoning of client dashboards.
**Recommended fix:** Restrict the `Access-Control-Allow-Origin` header to the known domain for each client (stored in the project record), or at minimum apply rate limiting so flooding is impractical.

---

### M3 — Plaintext Admin Password Storage

**File:** `lib/auth.ts`, `data/admin-config.json`
**Issue:** The admin password is stored in plaintext in `data/admin-config.json` and compared with `===`. If the file or environment variable is ever exposed (logs, container snapshot, volume mount), the password is immediately usable.
**Risk:** Full admin compromise if the secret store is ever accessed.
**Recommended fix:** Hash the password with `bcrypt` or `argon2` at set-time and use a constant-time comparison library for verification. This is an architectural change requiring updates to `lib/auth.ts`, the login route, and the password-reset route.

---

### M4 — MFA Verification Timing Attack

**File:** `app/api/admin/verify-mfa/route.ts`
**Issue:** `String(code).trim() !== config.mfaCode` uses JavaScript's built-in string inequality, which is not constant-time. A sufficiently precise timing oracle could theoretically deduce the correct MFA code character-by-character.
**Risk:** Low in practice (requires sub-millisecond measurement across a network), but violates cryptographic best practice.
**Recommended fix:**
```typescript
import { timingSafeEqual } from 'crypto'
const a = Buffer.from(String(code).trim())
const b = Buffer.from(config.mfaCode)
if (a.length !== b.length || !timingSafeEqual(a, b)) { /* reject */ }
```

---

### M5 — Raw LIMIT Clause in Process-Campaigns Query

**File:** `app/api/admin/leads/process-campaigns/route.ts`, line ~132
**Issue:** `pendingQuery += \` LIMIT ${sendLimit}\`` concatenates a computed integer directly into SQL.
**Context:** `sendLimit` is derived from integer arithmetic on database columns (daily_limit, weekly_limit), so it is always a JS number. However, any future change that allows non-integer input here would create an injection vector.
**Risk:** Low under current code; medium if the value source ever changes.
**Recommended fix:** Use parameterized binding or explicitly cast: `LIMIT ${Math.floor(Number(sendLimit))}`.

---

### M6 — Generated HTML Preview Has No Content-Security-Policy

**File:** `app/api/preview/[token]/route.ts`
**Issue:** The endpoint serves raw `project.generatedHtml` with no CSP header. If an AI generation ever produced a script tag, or if the database were compromised, XSS could execute in a viewer's browser.
**Recommended fix:** Add `Content-Security-Policy: default-src 'self'; script-src 'none'` (or a tightly scoped policy that allows only the CSS/fonts the generated site needs).

---

## Low Severity — Open Issues

### L1 — No Admin Audit Log

There is no record of which admin user performed actions (approve project, change price, activate client, etc.). All mutations happen without attribution.
**Recommended fix:** Add an `admin_audit_log` table and insert a row on every state-changing admin API call.

---

### L2 — Silent Failure Modes for Missing Environment Variables

**Files:** `lib/stripe.ts`, `lib/supabase.ts`
`getStripe()` uses `process.env.STRIPE_SECRET_KEY ?? 'placeholder'` and the Supabase client uses `'https://placeholder.supabase.co'`. A missing env var causes subtle runtime failures rather than a clear startup error.
**Recommended fix:** Throw at module load time if required env vars are absent:
```typescript
if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is required')
```

---

### L3 — PII in Server Logs

**File:** `app/api/intake/route.ts`
Several `console.log` calls emit business names and email addresses (e.g., after lead notification email is sent). These appear in Railway deployment logs which may be retained and accessible to support staff.
**Recommended fix:** Replace PII log lines with non-identifying identifiers (project ID, timestamp only).

---

### L4 — Client Token Enumeration (No Login Throttle)

Client tokens are 48-character hex strings (192 bits of entropy — effectively unguessable by brute force). No throttling is needed for enumeration. This is informational only.

---

## Environment Variables Checklist

All of the following must be set as **private** environment variables in Railway — never as public variables and never committed to source control:

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Admin panel access |
| `STRIPE_SECRET_KEY` | Stripe API (secret key — never expose client-side) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature validation |
| `ANTHROPIC_API_KEY` | Claude API |
| `RESEND_API_KEY` | Transactional email |
| `GOOGLE_PLACES_API_KEY` | Places autocomplete |
| `GOOGLE_SEARCH_CONSOLE_KEY` | GSC service account JSON |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase privileged access (never expose client-side) |
| `DATABASE_URL` | Direct PostgreSQL connection string |
| `CRON_SECRET` | Required to call cron endpoints — must be set or all cron endpoints are locked |

`.env.local` is already in `.gitignore`. Verify it is never committed.

---

## Stripe Webhook Security

`app/api/webhooks/stripe/route.ts` uses `stripe.webhooks.constructEvent(rawBody, signature, secret)` which cryptographically validates the webhook signature before processing any event. This is correct.

---

## Database (Supabase) RLS Note

Row Level Security configuration must be verified directly in the Supabase dashboard — it cannot be audited from application code alone. Ensure RLS is enabled on all tables listed in the security requirements, particularly:
- `api_keys` — must use service role only, never anon key
- `projects` — clients should not be able to read other clients' rows
- All tables should have a default-deny policy with explicit allow rules

---

*This document should be reviewed and updated after any significant architectural change or dependency upgrade.*
