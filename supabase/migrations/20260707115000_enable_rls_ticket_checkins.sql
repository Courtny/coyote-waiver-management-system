-- Migration: Enable RLS on public.ticket_checkins (lint 0013_rls_disabled_in_public)
--
-- Security note:
-- public.ticket_checkins was exposed in the public schema without Row Level Security.
-- This migration enables RLS, revokes broad anon access, and adds least-privilege
-- ownership policies for authenticated users. service_role retains full backend access.
--
-- Introspected state (2026-07-07):
--   - RLS: disabled
--   - Policies: none
--   - Grants: anon/authenticated/service_role had full table privileges
--   - Columns: id, productId, orderId, variantId, unitIndex, checkedInAt (no user_id yet)
--
-- ============================================================================
-- A) Safety checks (read-only introspection — run manually before/after apply)
-- ============================================================================
--
-- Confirm table exists:
--   SELECT to_regclass('public.ticket_checkins');
--
-- Check current RLS status:
--   SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
--   FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relname = 'ticket_checkins';
--
-- List existing policies:
--   SELECT policyname, roles, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'ticket_checkins';
--
-- List grants for anon/authenticated/service_role:
--   SELECT grantee, privilege_type, is_grantable
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name = 'ticket_checkins'
--     AND grantee IN ('anon', 'authenticated', 'service_role')
--   ORDER BY grantee, privilege_type;

-- ============================================================================
-- B) Apply fix
-- ============================================================================

-- Ownership column required for per-user RLS (nullable for legacy/admin rows).
ALTER TABLE public.ticket_checkins
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id);

ALTER TABLE public.ticket_checkins ENABLE ROW LEVEL SECURITY;

-- Remove broad public/anon access (especially write).
REVOKE ALL ON TABLE public.ticket_checkins FROM anon;

-- Narrow authenticated to DML; RLS policies enforce row ownership.
REVOKE ALL ON TABLE public.ticket_checkins FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ticket_checkins TO authenticated;

-- service_role: retain full privileges for backend/admin flows (bypasses RLS in Supabase).
GRANT ALL ON TABLE public.ticket_checkins TO service_role;

-- Drop prior versions of these policies for idempotent re-apply.
DROP POLICY IF EXISTS ticket_checkins_authenticated_select_own ON public.ticket_checkins;
DROP POLICY IF EXISTS ticket_checkins_authenticated_insert_own ON public.ticket_checkins;
DROP POLICY IF EXISTS ticket_checkins_authenticated_update_own ON public.ticket_checkins;
DROP POLICY IF EXISTS ticket_checkins_authenticated_delete_own ON public.ticket_checkins;
DROP POLICY IF EXISTS ticket_checkins_service_role_all ON public.ticket_checkins;

CREATE POLICY ticket_checkins_authenticated_select_own
  ON public.ticket_checkins
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY ticket_checkins_authenticated_insert_own
  ON public.ticket_checkins
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY ticket_checkins_authenticated_update_own
  ON public.ticket_checkins
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY ticket_checkins_authenticated_delete_own
  ON public.ticket_checkins
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY ticket_checkins_service_role_all
  ON public.ticket_checkins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- C) Performance hardening
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ticket_checkins_user_id
  ON public.ticket_checkins (user_id);

-- ============================================================================
-- D) Verification queries (run after apply)
-- ============================================================================
--
-- RLS enabled:
--   SELECT relrowsecurity FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname = 'public' AND c.relname = 'ticket_checkins';
--   -- Expect: true
--
-- Policies present:
--   SELECT policyname, roles, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'ticket_checkins'
--   ORDER BY policyname;
--
-- Resulting grants:
--   SELECT grantee, privilege_type FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND table_name = 'ticket_checkins'
--     AND grantee IN ('anon', 'authenticated', 'service_role')
--   ORDER BY grantee, privilege_type;

-- ============================================================================
-- E) Rollback (run manually only if reverting this migration)
-- ============================================================================
--
-- DROP POLICY IF EXISTS ticket_checkins_authenticated_select_own ON public.ticket_checkins;
-- DROP POLICY IF EXISTS ticket_checkins_authenticated_insert_own ON public.ticket_checkins;
-- DROP POLICY IF EXISTS ticket_checkins_authenticated_update_own ON public.ticket_checkins;
-- DROP POLICY IF EXISTS ticket_checkins_authenticated_delete_own ON public.ticket_checkins;
-- DROP POLICY IF EXISTS ticket_checkins_service_role_all ON public.ticket_checkins;
--
-- -- Revert grants changed by this migration:
-- GRANT ALL ON TABLE public.ticket_checkins TO anon;
-- GRANT ALL ON TABLE public.ticket_checkins TO authenticated;
-- GRANT ALL ON TABLE public.ticket_checkins TO service_role;
--
-- DROP INDEX IF EXISTS public.idx_ticket_checkins_user_id;
--
-- -- Disable RLS only if operator explicitly chooses to revert hardening:
-- -- ALTER TABLE public.ticket_checkins DISABLE ROW LEVEL SECURITY;
--
-- -- Optional: remove ownership column if it was introduced by this migration:
-- -- ALTER TABLE public.ticket_checkins DROP COLUMN IF EXISTS user_id;
