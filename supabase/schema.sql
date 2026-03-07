-- Mantis Tech — projects table
-- Run this SQL in the Supabase dashboard: SQL Editor → New Query → Run
--
-- Design: id / admin_token / client_token as indexed lookup columns
-- plus a `data` JSONB column holding the full Project object.
-- This avoids snake_case ↔ camelCase mapping entirely.

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  admin_token TEXT NOT NULL,
  client_token TEXT NOT NULL,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_admin_token  ON projects (admin_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_client_token ON projects (client_token);
CREATE        INDEX IF NOT EXISTS idx_projects_created_at   ON projects (created_at DESC);

-- Optional: disable RLS since we use the service role key from the server.
-- If you prefer to enable RLS, add policies allowing the service role full access.
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
