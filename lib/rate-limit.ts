// Simple in-memory rate limiter for Next.js API routes.
// Suitable for single-instance Railway deployments. For multi-instance, swap
// the Map for a shared Redis store (e.g. @upstash/ratelimit).

import { NextRequest, NextResponse } from 'next/server'

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

// Periodically purge expired entries so the Map doesn't grow unbounded.
// Runs every 15 minutes; safe to call on every request.
let lastPurge = Date.now()
function maybePurge() {
  const now = Date.now()
  if (now - lastPurge < 15 * 60 * 1000) return
  lastPurge = now
  for (const [key, win] of store) {
    if (now >= win.resetAt) store.delete(key)
  }
}

/**
 * Check whether `ip` has exceeded `limit` requests in the last `windowMs` ms.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterSec }`.
 */
export function checkRateLimit(
  ip: string,
  limit = 10,
  windowMs = 60 * 60 * 1000
): { allowed: boolean; retryAfterSec?: number } {
  maybePurge()
  const now = Date.now()
  const win = store.get(ip)

  if (!win || now >= win.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (win.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((win.resetAt - now) / 1000) }
  }

  win.count++
  return { allowed: true }
}

/**
 * Extract the best available client IP from a Next.js request.
 * Prefers X-Forwarded-For (set by Railway's proxy), falls back to X-Real-IP.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Apply rate limiting to a route. Returns a 429 response if the limit is
 * exceeded, or null if the request should proceed.
 *
 * Usage:
 *   const limit = rateLimit(req)
 *   if (limit) return limit
 */
export function rateLimit(
  req: NextRequest,
  limit = 10,
  windowMs = 60 * 60 * 1000
): NextResponse | null {
  const ip = getClientIp(req)
  const result = checkRateLimit(ip, limit, windowMs)
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(result.retryAfterSec ?? 3600) },
      }
    )
  }
  return null
}
