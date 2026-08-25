-- ============================================================================
-- CAPABILITY · A QUEM SE PODE ENTREGAR UM CASE — equipe interna, por papel
-- ============================================================================
--
-- Nasceu de um defeito da curadoria simulada (25/08): o Atendente qualificava
-- o Case e a ficha dizia "Nenhuma pessoa com o papel de Curador está
-- cadastrada. Sem isso não há a quem encaminhar." — com o Curador cadastrado.
-- `listCurators` fazia join de `user_roles` com `profiles`, e a RLS de ambas
-- devolvia vazio para quem não é administrador. O Case parava na entrega.
--
-- POR QUE CAPABILITY, E NÃO POLICY. A primeira tentativa abriu duas policies
-- de SELECT — uma em `user_roles`, outra em `profiles`. A guarda G-2.6-2
-- (CONTRATO_2_6 §16) derrubou, e com razão: o regime lavrado no item 2.6 diz
-- que `profiles` NÃO se abre por RLS. Quando alguém precisa de um nome, o
-- instrumento é uma capability nomeada, mínima e com gate interno — foi assim
-- que `nome_do_curador_do_caso` resolveu o mesmo problema do lado da paciente.
-- Esta função é a irmã dela do lado da equipe. A RLS de `profiles` e de
-- `user_roles` continua exatamente como estava.
--
-- REGIME (espelha §11 da capability irmã):
--   · GATE-FIRST — a autoridade é decidida antes de qualquer dado ser lido.
--     Quem não é equipe interna recebe conjunto vazio, sem distinguir "papel
--     sem gente" de "você não pode perguntar".
--   · ESCOPO FECHADO — só os quatro papéis INTERNOS podem ser perguntados.
--     `paciente` e `profissional` não são endereçáveis por esta função: quem
--     é paciente de quem não é assunto de fila, e a listagem que a guarda
--     proíbe continua impossível.
--   · SAÍDA MÍNIMA — `profile_id` (para a transferência auditada endereçar) e
--     `display_name` (para a pessoa aparecer com nome). Nenhum e-mail,
--     telefone, papel extra, timestamp ou metadado.
--   · Read-only · STABLE · STRICT · sem SQL dinâmico · search_path fixo ·
--     referências qualificadas · NENHUMA policy nova.
--
-- ROLLBACK: drop function curadoria.equipe_por_papel(text); — objeto único e
-- aditivo. Sem ele, a ficha do Atendente volta a dizer que não há a quem
-- encaminhar, e o Case fica preso a quem o abriu.
-- ============================================================================

create or replace function curadoria.equipe_por_papel(_slug text)
returns table (profile_id uuid, display_name text)
language plpgsql
stable
strict
security definer
set search_path = curadoria, pg_temp
as $$
begin
  -- GATE-FIRST: só equipe interna pergunta. Fora disso, silêncio — nunca uma
  -- resposta que distinga "não existe" de "você não pode".
  if not (
    curadoria.has_role('administrador')
    or curadoria.has_role('atendente')
    or curadoria.has_role('curador_medico')
    or curadoria.has_role('concierge')
  ) then
    return;
  end if;

  -- ESCOPO FECHADO: papéis internos e nada além. `paciente` e `profissional`
  -- não são endereçáveis aqui, nem por engano de quem chama.
  if _slug not in ('administrador', 'atendente', 'curador_medico', 'concierge') then
    return;
  end if;

  return query
  select ur.profile_id, p.display_name
  from curadoria.user_roles ur
  join curadoria.roles r on r.id = ur.role_id
  join curadoria.profiles p on p.id = ur.profile_id
  where r.slug = _slug
  order by p.display_name;
end;
$$;

comment on function curadoria.equipe_por_papel(text) is
  'Quem, na equipe interna, pode receber um Case — id e nome, por papel interno. Gate-first: só equipe interna pergunta; papel não-interno devolve vazio. Irmã de nome_do_curador_do_caso para o lado da operação: capability nomeada em vez de abrir RLS de profiles (G-2.6-2). Nasceu do defeito "não há a quem encaminhar" da curadoria simulada de 25/08.';

revoke execute on function curadoria.equipe_por_papel(text) from anon;
grant execute on function curadoria.equipe_por_papel(text) to authenticated;
