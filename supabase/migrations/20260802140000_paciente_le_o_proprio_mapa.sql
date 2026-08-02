-- ============================================================================
-- A PACIENTE LÊ O PRÓPRIO MAPA DE PRIORIDADES (Release de Reconstrução)
--
-- Defeito capturado no E2E do fluxo completo, PASSO 8: a home da paciente
-- dizia "Falta você reconhecer este Perfil como seu. Sem essa confirmação,
-- nada avança" — e o botão de reconhecimento não existia na página.
--
-- Causa: `case_priority_map` tinha UMA policy (escrita/leitura de admin e
-- Curador do Case). A paciente não tinha SELECT. `loadPatientPerfil` voltava
-- com prioridades vazias, o `ReconhecerPerfil` (que exige prioridades > 0)
-- nunca montava, e o ato central da ADR-042 — ela reconhecer o Perfil como
-- seu — era impossível pela interface. A tela anunciava o beco que a própria
-- RLS criava. O seed de certificação nunca esbarrou nisso porque semeia o
-- reconhecimento por SQL.
--
-- A correção espelha o padrão já usado nas outras superfícies dela
-- (`clinical_context_select_patient`): leitura pela função existente
-- `is_patient_for_case`. Só SELECT — a importância é declarada na conversa e
-- gravada pelo Curador; o que é dela é o ATO de reconhecer, via RPC próprio.
-- ============================================================================

drop policy if exists "case_priority_map_select_patient" on curadoria.case_priority_map;

create policy "case_priority_map_select_patient"
  on curadoria.case_priority_map for select to authenticated
  using (curadoria.is_patient_for_case(case_id));

comment on policy "case_priority_map_select_patient" on curadoria.case_priority_map is
  'A paciente le o proprio Mapa. Sem isto, o reconhecimento do Perfil (ADR-042) era impossivel pela interface: o botao so monta quando ha prioridades visiveis, e ela nao via nenhuma.';
