-- ============================================================================
-- CAPABILITY · O NOME DA PACIENTE DO CASE QUE É MEU — lado da operação
-- ============================================================================
--
-- Achado na linha de chegada da curadoria simulada (25/08): o Concierge
-- recebeu o Case e a mesa dele mostrava "Case 1a1dd209" no lugar de "Mariana
-- Duarte". A tela promete PESSOA — "o Concierge acompanha pessoas, nunca o
-- UUID truncado do Case" (auditoria 22/08) — e o banco negava o nome.
--
-- A causa é a mesma do defeito do Atendente: a RLS de `profiles` responde a
-- administrador e ao Curador designado; o Concierge, responsável ATUAL depois
-- da transferência auditada, não estava em nenhuma das duas.
--
-- E o remédio é o mesmo, pela mesma razão: G-2.6-2 (CONTRATO_2_6 §16) proíbe
-- policy nova de SELECT em `profiles`. Quando alguém precisa de um nome, o
-- instrumento é capability. Esta é a terceira da família:
--   · `nome_do_curador_do_caso`  — a paciente lê o nome do Curador dela;
--   · `equipe_por_papel`         — a operação lê a quem entregar um Case;
--   · esta                       — quem responde pelo Case lê o nome da dona.
--
-- REGIME:
--   · GATE POR RESPONSABILIDADE — `can_access_case` é o helper canônico, e a
--     regra dele é a do projeto: autoriza pela responsabilidade ATUAL (mais o
--     Curador designado, vínculo histórico, e o administrador). Quem entregou
--     o Case e não é mais responsável deixa de enxergar. Nenhum predicado
--     novo nasce aqui.
--   · NÃO É LISTAGEM GENÉRICA — a função não aceita filtro, não paginação e
--     não devolve "os pacientes": devolve o nome dos Cases que o chamador já
--     tem autoridade para abrir, um por linha. Sem Case seu, conjunto vazio.
--   · SAÍDA MÍNIMA — `case_id` (para casar com a linha da lista) e
--     `display_name`. Nenhum id de perfil, e-mail, telefone ou metadado.
--   · Read-only · STABLE · security definer · search_path fixo · referências
--     qualificadas · NENHUMA policy nova.
--
-- POR QUE UMA CHAMADA E NÃO UMA POR CASE: a mesa do Concierge é uma lista. Um
-- RPC por linha seria N+1 contra o banco para responder a mesma pergunta.
--
-- ROLLBACK: drop function curadoria.pacientes_dos_meus_casos(); — objeto único
-- e aditivo. Sem ele, a mesa do Concierge volta a mostrar UUID.
-- ============================================================================

create or replace function curadoria.pacientes_dos_meus_casos()
returns table (case_id uuid, display_name text)
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select c.id, p.display_name
  from curadoria.cases c
  join curadoria.profiles p on p.id = c.patient_profile_id
  where curadoria.can_access_case(c.id);
$$;

comment on function curadoria.pacientes_dos_meus_casos() is
  'O nome da paciente dos Cases que o chamador já pode abrir — autorizado por can_access_case (responsabilidade ATUAL). Existe para a mesa do Concierge mostrar PESSOA e não UUID. Capability em vez de policy nova em profiles (G-2.6-2); irmã de nome_do_curador_do_caso e equipe_por_papel. Nasceu da curadoria simulada de 25/08.';

-- De PUBLIC, não de anon: o Postgres concede EXECUTE a PUBLIC ao criar a
-- função, e revogar de `anon` não tira isso — `anon` é membro de PUBLIC. É a
-- convenção dominante do projeto (81 migrations) e o S1 do backlog técnico.
revoke execute on function curadoria.pacientes_dos_meus_casos() from public;
grant execute on function curadoria.pacientes_dos_meus_casos() to authenticated;
