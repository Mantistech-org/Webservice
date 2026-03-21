-- Admin outreach leads, email templates, and campaign tables.
-- Run this once against your Supabase database (safe to re-run).
--
-- NOTE: The existing public.leads table stores per-client website contact-form
-- submissions.  These new tables are for admin cold-outreach to prospective
-- clients discovered via Google Places.

CREATE TABLE IF NOT EXISTS public.outreach_leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name     text        NOT NULL,
  address           text,
  phone             text,
  email             text,
  website           text,
  rating            numeric(3,1),
  category          text,
  location_searched text,
  place_id          text        UNIQUE,   -- Google Places ID, used for deduplication
  status            text        NOT NULL DEFAULT 'new',  -- new / emailed / bounced
  notes             text,
  last_emailed_at   timestamptz,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outreach_leads_status_idx     ON public.outreach_leads(status);
CREATE INDEX IF NOT EXISTS outreach_leads_created_at_idx ON public.outreach_leads(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_templates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  subject    text        NOT NULL,
  body       text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  template_id  uuid        REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'draft',      -- draft / scheduled / sending / completed / paused
  send_mode    text        NOT NULL DEFAULT 'immediate',  -- immediate / scheduled / drip
  scheduled_at timestamptz,
  daily_limit  int,
  weekly_limit int,
  sent_count   int         NOT NULL DEFAULT 0,
  total_leads  int         NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON public.email_campaigns(status);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid        NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  lead_id     uuid        NOT NULL REFERENCES public.outreach_leads(id)  ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'pending',  -- pending / sent / opened / bounced
  sent_at     timestamptz,
  opened_at   timestamptz,
  bounced_at  timestamptz,
  resend_id   text,
  UNIQUE(campaign_id, lead_id)
);

CREATE INDEX IF NOT EXISTS campaign_leads_campaign_id_idx ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_leads_lead_id_idx     ON public.campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS campaign_leads_resend_id_idx   ON public.campaign_leads(resend_id);
