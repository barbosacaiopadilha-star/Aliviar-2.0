-- A PACIENTE LÊ O PRÓPRIO CASE
--
-- `curadoria.cases` tinha duas policies de SELECT, e `patient_profile_id` não
-- aparecia em nenhuma delas:
--
--   cases_select_curador ....... has_role('curador_medico') ou Case sem dono
--   cases_select_operacao ...... has_role('administrador') ou responsible_id
--                                = auth.uid() ou assigned_curator_id = auth.uid()
--
-- Consequência: a pessoa dona do Case não conseguia lê-lo. Tudo o que o
-- Dashboard dela mostra depende de alcançar a própria linha — e sem isso o
-- ambiente dela existe sem conseguir se abrir.
--
-- ADITIVA e mínima:
--
--   - só SELECT. Nada de INSERT, UPDATE ou DELETE: ela lê o próprio Case,
--     nunca o edita;
--   - reusa `curadoria.is_patient_for_case(id)`, a função de domínio que já
--     define o vínculo. Nenhuma regra nova, nenhum vínculo por e-mail ou
--     metadado de texto;
--   - `to authenticated`. Nunca `anon`;
--   - as policies anteriores continuam válidas — policies de SELECT são OR,
--     e esta só ACRESCENTA quem enxerga a própria linha.

create policy cases_select_paciente on curadoria.cases
  for select to authenticated
  using (curadoria.is_patient_for_case(id));

comment on policy cases_select_paciente on curadoria.cases is
  'A paciente le o proprio Case, e apenas o proprio. Somente SELECT: o vinculo vem de curadoria.is_patient_for_case(id), a mesma funcao usada pelas demais policies do paciente.';
