-- Per-product "Show as active" flags for the admin event tickets list.
-- The Next.js admin API uses the database role (service_role / postgres);
-- anon and authenticated have no access.

CREATE TABLE IF NOT EXISTS public.event_ticket_active (
  "productId" TEXT PRIMARY KEY,
  "showAsActive" BOOLEAN NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.event_ticket_active ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.event_ticket_active FROM anon;
REVOKE ALL ON TABLE public.event_ticket_active FROM authenticated;
GRANT ALL ON TABLE public.event_ticket_active TO service_role;

DROP POLICY IF EXISTS event_ticket_active_service_role_all ON public.event_ticket_active;

CREATE POLICY event_ticket_active_service_role_all
  ON public.event_ticket_active
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
