-- Resume Analyzer schema
-- Executed automatically by the Docker Postgres container on first run.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS analyses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT NOW(),
  filename    TEXT        NOT NULL,
  ats_score   INT         NOT NULL,
  analysis    JSONB       NOT NULL,
  resume_data JSONB
);

CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_ats_score_idx  ON analyses (ats_score);
