-- CORREÇÃO da fase 3a, encontrada pelos testes de integração na
-- consolidação estrutural.
--
-- O defeito: as policies de `cases` usavam can_access_case(id), que
-- RECONSULTA a tabela. A função é STABLE, então em INSERT ... RETURNING o
-- snapshot dela ainda não contém a linha recém-inserida — o EXISTS devolve
-- false e o RETURNING falha com violação de RLS. Todo .insert().select() do
-- supabase-js quebrava, mesmo para quem tinha permissão.
--
-- A regra não muda em nada: administrador, responsável atual, ou Curador
-- designado (vínculo histórico dos Cases anteriores à Correção de Domínio).
-- Muda só o mecanismo: a policy da PRÓPRIA tabela avalia as colunas da
-- linha, como policy de linha deve fazer.
--
-- can_access_case(uuid) continua existindo para as OUTRAS tabelas
-- (case_events etc.), onde a linha do Case já está visível no snapshot.

drop policy if exists cases_select_responsavel_atual on curadoria.cases;
create policy cases_select_responsavel_atual
  on curadoria.cases for select to authenticated
  using (
    curadoria.has_role('administrador')
    or responsible_id = auth.uid()
    or assigned_curator_id = auth.uid()
  );

drop policy if exists cases_update_responsavel_atual on curadoria.cases;
create policy cases_update_responsavel_atual
  on curadoria.cases for update to authenticated
  using (
    curadoria.has_role('administrador')
    or responsible_id = auth.uid()
    or assigned_curator_id = auth.uid()
  )
  with check (
    curadoria.has_role('administrador')
    or responsible_id = auth.uid()
    or assigned_curator_id = auth.uid()
  );