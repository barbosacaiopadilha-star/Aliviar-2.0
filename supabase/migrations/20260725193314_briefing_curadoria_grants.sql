-- BRIEFING DA CURADORIA — grants para o role authenticated.
--
-- A RLS decide QUAIS linhas cada pessoa alcança; o grant decide se ela pode
-- sequer tentar. Sem isto, até o Curador responsável recebe "permission
-- denied" — a política mais restritiva possível, mas pela razão errada.
--
-- Mesmo conjunto de curadoria.cases: SELECT, INSERT, UPDATE. Nenhum DELETE
-- em nenhuma das três tabelas: registro do Briefing não se apaga — corrige-se
-- (paciente/médico, via upsert) ou acumula (observações do Curador).

grant select, insert, update on curadoria.alignment_patient_answers to authenticated;
grant select, insert, update on curadoria.alignment_professional_answers to authenticated;
grant select, insert on curadoria.curator_observations to authenticated;
