-- RC1 / R1 — elimina o bypass de RLS em curadoria.patient_case_overview.
--
-- O que era: a view não declarava `security_invoker`, e por isso é avaliada
-- com as permissões de quem a criou. A RLS de `curadoria.cases` simplesmente
-- não se aplicava a quem a consultasse.
--
-- O que NÃO era: um vazamento entre pacientes. A própria view já filtra por
-- `where c.patient_profile_id = auth.uid()`, e esse predicado é avaliado por
-- chamador. Quem consultava via só os próprios Cases.
--
-- Então por que corrigir: porque a proteção dependia de UMA cláusula WHERE,
-- sem segunda linha de defesa. Qualquer edição futura da view que afrouxasse
-- esse filtro passaria a expor Cases de outras pessoas, e a RLS — que existe
-- exatamente para impedir isso — estaria desligada. É defesa em profundidade,
-- não remendo de falha ativa.
--
-- Por que é seguro: a policy `cases_select_paciente` usa
-- `curadoria.is_patient_for_case(id)`, que é
-- `patient_profile_id = auth.uid()` — o MESMO predicado do WHERE da view.
-- Com security_invoker ligado, as linhas visíveis são idênticas; muda apenas
-- quem as autoriza.
--
-- Nenhuma regra de negócio é alterada. Nenhuma coluna, nenhum rótulo, nenhuma
-- ordenação. A view continua sendo a mesma para quem a lê.

alter view curadoria.patient_case_overview set (security_invoker = true);

comment on view curadoria.patient_case_overview is
  'Panorama do próprio Case para a paciente, em linguagem dela. security_invoker: a RLS de curadoria.cases é a autoridade, e o filtro por auth.uid() na view é a segunda camada, não a única. Alterar esta view sem manter as duas remove a proteção.';
