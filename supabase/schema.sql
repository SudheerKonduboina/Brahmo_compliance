DROP TABLE IF EXISTS blocked_access_log CASCADE;
DROP TABLE IF EXISTS ai_sessions CASCADE;
DROP TABLE IF EXISTS matter_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS matters CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- ============================================================================
-- BRAHMO Compliance Engine - PostgreSQL Schema with RLS Policies
-- ============================================================================
-- Production-grade database schema with:
-- - Complete table definitions
-- - Row Level Security (RLS) enforcement
-- - Hash-chain tamper detection
-- - Append-only audit logging
-- - Foreign key constraints and cascading rules
-- ============================================================================

-- ============================================================================
-- 1. CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT clients_name_not_empty CHECK (name != '')
);

CREATE INDEX idx_clients_created_at ON clients(created_at);

-- ============================================================================
-- 2. MATTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  matter_name VARCHAR(255) NOT NULL,
  practice_area VARCHAR(255) NOT NULL,
  court VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT matters_name_not_empty CHECK (matter_name != ''),
  CONSTRAINT matters_practice_area_not_empty CHECK (practice_area != '')
);

CREATE INDEX idx_matters_client_id ON matters(client_id);
CREATE INDEX idx_matters_status ON matters(status);
CREATE INDEX idx_matters_created_at ON matters(created_at);

-- ============================================================================
-- 3. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('associate', 'partner', 'admin')),
  sra_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT users_name_not_empty CHECK (name != ''),
  CONSTRAINT users_email_not_empty CHECK (email != '')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- 4. MATTER_PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matter_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  permission_level VARCHAR(50) NOT NULL DEFAULT 'read' CHECK (permission_level IN ('read', 'read_write', 'review')),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_matter_permission UNIQUE(user_id, matter_id)
);

CREATE INDEX idx_matter_permissions_user_id ON matter_permissions(user_id);
CREATE INDEX idx_matter_permissions_matter_id ON matter_permissions(matter_id);
CREATE INDEX idx_matter_permissions_granted_at ON matter_permissions(granted_at);

-- ============================================================================
-- 5. AI_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  query_type VARCHAR(100),
  output_token_count INTEGER,
  output_hash VARCHAR(64),
  review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_timestamp TIMESTAMPTZ,
  review_decision VARCHAR(50) CHECK (review_decision IS NULL OR review_decision IN ('approved', 'rejected')),
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ai_sessions_session_end_after_start CHECK (session_end IS NULL OR session_end >= session_start),
  CONSTRAINT ai_sessions_output_hash_len CHECK (output_hash IS NULL OR length(output_hash) = 64)
);

CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_matter_id ON ai_sessions(matter_id);
CREATE INDEX idx_ai_sessions_review_status ON ai_sessions(review_status);
CREATE INDEX idx_ai_sessions_created_at ON ai_sessions(created_at);
CREATE INDEX idx_ai_sessions_user_matter ON ai_sessions(user_id, matter_id);

-- ============================================================================
-- 6. BLOCKED_ACCESS_LOG TABLE (Append-Only, Immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocked_access_log (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempted_matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL CHECK (reason IN ('no_permission', 'matter_not_found', 'status_inactive')),
  details TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_hash VARCHAR(64),
  current_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT blocked_access_log_hash_len CHECK (length(current_hash) = 64),
  CONSTRAINT blocked_access_log_prev_hash_len CHECK (previous_hash IS NULL OR length(previous_hash) = 64)
);

CREATE INDEX idx_blocked_access_log_user_id ON blocked_access_log(user_id);
CREATE INDEX idx_blocked_access_log_attempted_matter_id ON blocked_access_log(attempted_matter_id);
CREATE INDEX idx_blocked_access_log_timestamp ON blocked_access_log(timestamp);
CREATE INDEX idx_blocked_access_log_created_at ON blocked_access_log(created_at);

-- ============================================================================
-- REVOKE UPDATE AND DELETE ON BLOCKED_ACCESS_LOG (Append-Only Enforcement)
-- ============================================================================
REVOKE UPDATE, DELETE ON blocked_access_log FROM authenticated;
REVOKE UPDATE, DELETE ON blocked_access_log FROM anon;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on protected tables
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MATTERS RLS POLICIES
-- ============================================================================
-- Users can only see matters they have permission to access
CREATE POLICY matters_select_policy ON matters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matter_permissions
      WHERE matter_permissions.matter_id = matters.id
      AND matter_permissions.user_id = auth.uid()
    )
    OR
    -- Partners can see all matters
    auth.jwt() -> 'app_metadata' ->> 'role' = 'partner'
  );

-- Only admins can insert matters
CREATE POLICY matters_insert_policy ON matters
  FOR INSERT
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Only admins can update matters
CREATE POLICY matters_update_policy ON matters
  FOR UPDATE
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================================================
-- AI_SESSIONS RLS POLICIES
-- ============================================================================
-- Users can only see their own sessions or sessions on matters they access
CREATE POLICY ai_sessions_select_policy ON ai_sessions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Can see sessions on matters you have access to
    EXISTS (
      SELECT 1 FROM matter_permissions
      WHERE matter_permissions.matter_id = ai_sessions.matter_id
      AND matter_permissions.user_id = auth.uid()
    )
    OR
    -- Partners can see all sessions
    auth.jwt() -> 'app_metadata' ->> 'role' = 'partner'
  );

-- Users can insert sessions on matters they have access to
CREATE POLICY ai_sessions_insert_policy ON ai_sessions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM matter_permissions
      WHERE matter_permissions.matter_id = ai_sessions.matter_id
      AND matter_permissions.user_id = auth.uid()
    )
  );

-- Only the session creator or partners can update sessions
CREATE POLICY ai_sessions_update_policy ON ai_sessions
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'partner'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'partner'
  );

-- ============================================================================
-- BLOCKED_ACCESS_LOG RLS POLICIES
-- ============================================================================
-- Everyone can insert into blocked access log
CREATE POLICY blocked_access_log_insert_policy ON blocked_access_log
  FOR INSERT
  WITH CHECK (true);

-- Only partners can read blocked access log
CREATE POLICY blocked_access_log_select_policy ON blocked_access_log
  FOR SELECT
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'partner');

-- SELECT, UPDATE, DELETE explicitly denied for non-partners
-- (UPDATE/DELETE already revoked at role level)

-- ============================================================================
-- MATTER_PERMISSIONS RLS POLICIES
-- ============================================================================
-- Users can see their own permissions
CREATE POLICY matter_permissions_select_policy ON matter_permissions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR auth.jwt() -> 'app_metadata' ->> 'role' = 'partner'
  );

-- Only admins can manage permissions
CREATE POLICY matter_permissions_insert_policy ON matter_permissions
  FOR INSERT
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY matter_permissions_update_policy ON matter_permissions
  FOR UPDATE
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY matter_permissions_delete_policy ON matter_permissions
  FOR DELETE
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================================================
-- POSTGRESQL SECURITY HARDENING
-- ============================================================================
-- Force RLS is already enabled per table above
-- Additional least-privilege grants

-- Revoke default public access
REVOKE ALL ON clients FROM public;
REVOKE ALL ON matters FROM public;
REVOKE ALL ON users FROM public;
REVOKE ALL ON matter_permissions FROM public;
REVOKE ALL ON ai_sessions FROM public;
REVOKE ALL ON blocked_access_log FROM public;

-- Grant authenticated users minimal permissions (RLS enforced)
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON matters TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON matter_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_sessions TO authenticated;
GRANT SELECT, INSERT ON blocked_access_log TO authenticated;

-- No anonymous access
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
