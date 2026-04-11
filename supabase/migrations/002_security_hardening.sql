-- ── Security Hardening Migration ─────────────────────────────────────────────
-- 002_security_hardening.sql
-- Adds rate limiting, audit logging tables, and missing RLS/CHECK constraints.

-- ── Rate Limits ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  request_count INTEGER DEFAULT 1,
  UNIQUE (identifier, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (identifier, action, window_start DESC);

-- Cleanup function to remove expired rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Audit Logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT CHECK (CHAR_LENGTH(user_agent) <= 500),
  metadata JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_severity
  ON audit_logs (severity)
  WHERE severity IN ('warning', 'critical');

-- RLS on audit_logs: only service role can query
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'service_role_select_audit_logs'
  ) THEN
    CREATE POLICY "service_role_select_audit_logs"
      ON audit_logs FOR SELECT
      USING (false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'audit_logs' AND policyname = 'service_role_insert_audit_logs'
  ) THEN
    CREATE POLICY "service_role_insert_audit_logs"
      ON audit_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ── Additional CHECK constraints ──────────────────────────────────────────────

-- Friendships: prevent self-friending at DB level
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'friendships_no_self_friend'
  ) THEN
    ALTER TABLE friendships
      ADD CONSTRAINT friendships_no_self_friend
      CHECK (requester_id <> addressee_id);
  END IF;
END $$;

-- Testimonials: prevent self-testimonials at DB level
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'testimonials_no_self_testimonial'
  ) THEN
    ALTER TABLE testimonials
      ADD CONSTRAINT testimonials_no_self_testimonial
      CHECK (author_id <> recipient_id);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── Missing RLS policies ──────────────────────────────────────────────────────

-- Rate limits: no direct user access
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'rate_limits' AND policyname = 'service_role_rate_limits'
  ) THEN
    CREATE POLICY "service_role_rate_limits"
      ON rate_limits FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
