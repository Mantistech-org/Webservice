# Mantis Tech Webservice — Project Context

## What This Is
A Next.js web agency platform deployed on Railway via Docker. Small businesses submit an intake form, get an AI-generated website, manage their project, and pay via Stripe.

## Core Flow
1. Client submits intake form → POST /api/intake
2. Project saved to Supabase (JSON fallback if unavailable)
3. Non-blocking fetch to /api/generate triggers AI website generation
4. Emails sent via Resend (client confirmation + admin notification)
5. Admin reviews in dashboard → approves → client gets review link
6. Client reviews site → approves → Stripe payment → project goes "active"

## Stack
- Next.js (App Router) deployed on Railway via Dockerfile
- Supabase — primary database (projects table)
- Local JSON (data/projects.json) — fallback DB
- Anthropic Claude (claude-sonnet-4-5) — generates full HTML websites
- Resend — transactional email (16 email types)
- Stripe — upfront + monthly subscriptions + addon subscriptions

## Plans
- Starter: $100 upfront / $40/mo / 4 pages
- Mid: $150 upfront / $125/mo / 6 pages
- Pro: $200 upfront / $250/mo / 9 pages

## Project Statuses
admin_review → client_review → changes_requested ↔ client_review → active

## Standing Rules for All Changes
- No emojis anywhere in UI or emails
- No AI-style em dashes (—) in copy — use plain punctuation
- Always write professional but human copy
- Every change must be committed to GitHub with a descriptive commit message and pushed to main, then trigger a Railway redeploy

## Environment Variables (Railway)
- ANTHROPIC_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
- RESEND_API_KEY
- EMAIL_FROM
- ADMIN_EMAIL
- NEXT_PUBLIC_BASE_URL
- ADMIN_PASSWORD
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_* (various plan and addon price IDs)
- SUPABASE_DB_URL (Transaction pooler postgres:// URI from Supabase Project Settings → Connect)

## Recent Fixes
- Dockerfile: DNS moved from build time to runtime in CMD so Supabase resolves correctly
- lib/anthropic.ts: timeout increased from 30s to 120s
- app/api/generate/route.ts: created with maxDuration 300 to handle long-running AI generation
- app/api/intake/route.ts: replaced fire-and-forget promise with non-blocking fetch to /api/generate
- Switched Supabase client from REST API (HTTP) to direct postgres connection via pg pool (Transaction pooler) to bypass Railway Hobby plan DNS restrictions on external HTTP hosts
