-- Harden SECURITY DEFINER RPC exposure and search_path (infra only)

ALTER FUNCTION public.set_updated_at() SET search_path = public;

DO $$
BEGIN
  IF to_regprocedure('public.prevent_operational_incident_delete()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.prevent_operational_incident_delete() SET search_path = public';
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.correct_journey_event(uuid, text, public.journey_event_category, text, text, text, text, timestamptz, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_journey_event(uuid, public.journey_event_category, text, text, text, text, timestamptz, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_patient_with_initial_journey(text, text, date, text, text, text, text, text, text, text, text, uuid, public.journey_priority, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_system_journey_event(uuid, public.journey_event_category, text, text, text, text, timestamptz, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_patient_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_active_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_active_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_patient_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_valid_manager(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.journey_accepts_commitments(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.on_journey_insert_create_event() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_journey_status_change_create_event() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.correct_journey_event(uuid, text, public.journey_event_category, text, text, text, text, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_journey_event(uuid, public.journey_event_category, text, text, text, text, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_patient_with_initial_journey(text, text, date, text, text, text, text, text, text, text, text, uuid, public.journey_priority, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_journey_event(uuid, public.journey_event_category, text, text, text, text, timestamptz, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_patient_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_valid_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.journey_accepts_commitments(uuid) TO authenticated;
