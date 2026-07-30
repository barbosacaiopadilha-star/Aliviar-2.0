-- BRIEFING — direito de revisão do AUTOR sobre a própria observação (P8).
--
-- Tensão resolvida: ACE_DATA_CLASSIFICATION diz que a leitura de um Curador
-- não apaga a de outro — elas coexistem com data. Isso continua verdade:
-- estas policies permitem que o AUTOR corrija ou remova o que ELE escreveu,
-- nunca que alguém apague a observação alheia.
--
-- Por que remover precisa existir: se o Curador escreveu sem querer um
-- rótulo sobre a pessoa ("paciente inseguro"), manter isso no sistema é pior
-- que apagar. A correção é parte da proteção, não uma brecha nela.
--
-- Observação NÃO é registro de auditoria (esse é case_responsibility_changes,
-- append-only por trigger e intocado aqui).

create policy curator_observations_update_own on curadoria.curator_observations
  for update to authenticated
  using (author_id = auth.uid() and curadoria.can_access_case(case_id))
  with check (author_id = auth.uid());

create policy curator_observations_delete_own on curadoria.curator_observations
  for delete to authenticated
  using (author_id = auth.uid() and curadoria.can_access_case(case_id));

grant update, delete on curadoria.curator_observations to authenticated;

-- O paciente pode pedir para retirar uma resposta do Perfil de Alinhamento —
-- e a equipe que tem o Case registra a remoção. Nada aqui é permanente.
create policy alignment_patient_answers_delete on curadoria.alignment_patient_answers
  for delete to authenticated using (curadoria.can_access_case(case_id));

grant delete on curadoria.alignment_patient_answers to authenticated;
