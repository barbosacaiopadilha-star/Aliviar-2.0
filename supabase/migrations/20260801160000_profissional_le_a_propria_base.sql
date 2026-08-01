-- TRANSPARÊNCIA DA BASE — o profissional lê as próprias evidências.
--
-- DECISÃO DE PRODUTO (2026-08-01). A auditoria funcional encontrou uma
-- proibição que ninguém tinha decidido: `practice_evidence` herdou a RLS do
-- Mapa do Profissional, e a ADR-040 item 6 justifica aquela restrição dizendo
-- que o Mapa "é um registro da operação SOBRE ele, não um campo do perfil
-- dele". A justificativa não alcança esta tabela: aqui estão as respostas que
-- o PRÓPRIO profissional deu ao Protocolo.
--
-- O padrão vigente da plataforma para dado do cadastro profissional já é
-- leitura do dono — `professional_care_model_select_own`,
-- `professional_education_entries_select_own`, `professional_experience_select_own`,
-- `professional_practice_areas_select_own`, `professional_documents_select_admin_or_own`
-- e, na Política de Fontes, `divergences_professional_select_own`. Ele já lê
-- as divergências abertas sobre si; não lia apenas o que ele mesmo declarou.
--
-- Esta migration acrescenta UMA policy de SELECT, e nada mais:
--
--   * não amplia nenhum papel — curador e administrador seguem como estavam;
--   * não concede escrita — INSERT continua exclusivo do administrador, e o
--     append-only segue valendo para todos;
--   * não alcança evidência de terceiro — o vínculo é `profile_id = auth.uid()`,
--     o mesmo predicado das demais tabelas do cadastro;
--   * NÃO toca `professional_subcriterion_map`, cuja restrição é decisão
--     registrada da ADR-040 e permanece intacta.
--
-- O recorte do que aparece na TELA dele é mais estreito que o da policy: a
-- superfície projeta apenas fato, estado, datas e versão. Parecer de
-- resolução e identidade de verificador não são renderizados — isso é
-- governança, e governança continua sendo da operação.

create policy "practice_evidence_select_own"
  on curadoria.practice_evidence for select
  to authenticated
  using (
    exists (
      select 1
        from curadoria.professional_profiles pp
       where pp.id = practice_evidence.professional_profile_id
         and pp.profile_id = auth.uid()
    )
  );

comment on table curadoria.practice_evidence is
  'Base de Evidencias de Pratica (Catalogo Canonico 1.0.0). Append-only: toda mudanca e versao nova, leitura corrente = max(version). Resposta de protocolo nasce nao_verificado; verificado exige verificador, data e fonte. Leitura: administrador, curador_medico e o PROPRIO profissional (decisao de 2026-08-01 — sao as respostas dele). Escrita: administrador.';

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop policy if exists "practice_evidence_select_own" on curadoria.practice_evidence;
