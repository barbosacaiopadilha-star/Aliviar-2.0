-- CORREÇÃO FINAL DE REGRA DE NEGÓCIO: a equipe Aliviar realiza o cadastro
-- inicial do paciente — o paciente nunca se cadastra por fluxo público
-- (docs/PRODUCT_ARCHITECTURE.md). Isso exige que um administrador também
-- possa inserir/editar dados de public.patient_profiles em nome do
-- paciente (ex.: ao criar a conta, ou ao editar dados permitidos depois).
--
-- As policies "own" da migration anterior (20260712050000) continuam
-- valendo — RLS é permissiva: as duas coexistem (paciente OU
-- administrador). Nenhuma delas cobre bloqueio real de acesso de login —
-- isso é feito via Admin API (auth.users, ban_duration), inteiramente
-- fora de RLS, sempre a partir de src/lib/supabase/admin.ts (server-only).

create policy "patient_profiles_insert_admin" on public.patient_profiles
  for insert
  to authenticated
  with check (public.has_role('administrador'));

create policy "patient_profiles_update_admin" on public.patient_profiles
  for update
  to authenticated
  using (public.has_role('administrador'))
  with check (public.has_role('administrador'));
