-- Mantis Tech -- Consultations system
-- Run this SQL in the Supabase dashboard: SQL Editor > New Query > Run

-- Individual consultation bookings
CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  challenge TEXT,
  booked_date TEXT NOT NULL,   -- YYYY-MM-DD
  booked_time TEXT NOT NULL,   -- HH:MM (24-hour)
  status TEXT NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled | completed
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_booked_date ON consultations (booked_date);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations (status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations (created_at DESC);

ALTER TABLE consultations DISABLE ROW LEVEL SECURITY;

-- Availability settings (single config row)
CREATE TABLE IF NOT EXISTS consultation_availability (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consultation_availability DISABLE ROW LEVEL SECURITY;

-- Email templates: confirmation | reminder | admin_notification
CREATE TABLE IF NOT EXISTS consultation_email_templates (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE consultation_email_templates DISABLE ROW LEVEL SECURITY;

-- Seed default availability (all weekdays 9am-5pm, weekends off)
INSERT INTO consultation_availability (id, settings)
VALUES ('default', '{
  "days": {
    "monday":    {"enabled": true,  "start": "09:00", "end": "17:00"},
    "tuesday":   {"enabled": true,  "start": "09:00", "end": "17:00"},
    "wednesday": {"enabled": true,  "start": "09:00", "end": "17:00"},
    "thursday":  {"enabled": true,  "start": "09:00", "end": "17:00"},
    "friday":    {"enabled": true,  "start": "09:00", "end": "17:00"},
    "saturday":  {"enabled": false, "start": "09:00", "end": "17:00"},
    "sunday":    {"enabled": false, "start": "09:00", "end": "17:00"}
  },
  "blockedDates": [],
  "extraSlots": []
}')
ON CONFLICT (id) DO NOTHING;

-- Seed default email templates
INSERT INTO consultation_email_templates (id, subject, body) VALUES
(
  'confirmation',
  'Your Consultation is Confirmed',
  E'Hi [first_name],\n\nYour free 15-minute consultation has been booked.\n\nDate: [date]\nTime: [time]\n\nWe will review your current online presence before the call so we can show you exactly what we would do differently for [business_name]. You do not need to prepare anything.\n\nIf you need to cancel or reschedule, reply to this email or call us at (501) 669-0488.\n\nWe look forward to speaking with you.'
),
(
  'reminder',
  'Reminder: Your Consultation is Tomorrow',
  E'Hi [first_name],\n\nThis is a reminder that your free 15-minute consultation with Mantis Tech is tomorrow.\n\nDate: [date]\nTime: [time]\n\nWe look forward to speaking with you about [business_name]. If you need to cancel or reschedule, reply to this email or call us at (501) 669-0488.'
),
(
  'admin_notification',
  'New Consultation Booked: [business_name]',
  E'A new consultation has been booked. All details are below.'
)
ON CONFLICT (id) DO NOTHING;
