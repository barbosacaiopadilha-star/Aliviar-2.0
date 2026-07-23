-- Production readiness: demo mode feature flags (default OFF)

insert into public.feature_flags (key, enabled, rollout_percentage, description) values
  ('PATIENT_DEMO_MODE', false, 0, 'Runtime demo do portal do paciente (in-memory)'),
  ('CURATOR_DEMO_MODE', false, 0, 'Runtime demo do workspace do curador (in-memory)'),
  ('REPORT_DEMO_MODE', false, 0, 'Runtime demo da leitura de relatório (in-memory)')
on conflict (key) do nothing;
