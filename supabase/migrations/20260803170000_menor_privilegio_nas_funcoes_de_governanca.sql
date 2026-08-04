-- MENOR PRIVILÉGIO nas funções de governança documental.
--
-- Achado registrado em `docs/ACHADO_SEGURANCA_FUNCOES_GOVERNANCA_PUBLIC.md`,
-- observado na revisão do G0.1. Esta migration corrige APENAS privilégio:
-- nenhuma assinatura, nenhum corpo, nenhum retorno e nenhuma regra de negócio
-- é alterada aqui.
--
-- O QUE ACONTECEU. `CREATE FUNCTION` concede `EXECUTE` a `PUBLIC` por padrão no
-- PostgreSQL. As migrations 20260803140000 e 20260803150000 concederam
-- explicitamente a `authenticated` — o que está certo — mas não revogaram o
-- padrão. O `GRANT` explícito dá a impressão de que o privilégio foi
-- delimitado; ele apenas foi somado ao que já estava aberto. Como `anon`
-- pertence a `PUBLIC`, as sete funções abaixo eram chamáveis sem sessão.
--
-- POR QUE CORRIGIR, se nenhuma delas vaza dado hoje: privilégio é a camada
-- ANTERIOR à validação. A defesa atual depende inteiramente do corpo de cada
-- função — um caminho novo, um `default` acrescentado, uma refatoração que mova
-- a checagem, e o privilégio aberto passa a valer como controle de acesso sem
-- que ninguém tenha decidido isso.
--
-- UMA EXCEÇÃO DELIBERADA. `pendencias_legais_do_profissional` era a única das
-- sete que não validava ator nenhum: sendo `security definer`, lia
-- `legal_acceptances` por cima da RLS e respondia a qualquer conta autenticada
-- que conhecesse um UUID de perfil profissional. Privilégio não resolve isso —
-- a diferença é entre papéis autenticados, e mora dentro da função. Por decisão
-- do responsável, a autorização entra NESTE incremento (§2 abaixo).
--
-- O QUE ESTA MIGRATION NÃO FAZ:
--   · não altera assinatura, tipo de retorno nem o significado do resultado de
--     função nenhuma;
--   · não altera o corpo das outras seis;
--   · não toca em tabela, policy, índice ou dado.
--
-- ROLLBACK (reverte ao estado anterior exato):
--   -- 1. a função, de volta à forma original (sem autorização interna):
--   create or replace function curadoria.pendencias_legais_do_profissional(_professional_profile_id uuid)
--   returns table (slug text, nome text, versao_vigente text)
--   language sql stable security definer set search_path = curadoria, pg_temp as $rollback$
--     select d.slug, d.nome, v.versao
--     from curadoria.legal_documents d
--     cross join lateral curadoria.versao_vigente(d.id) v
--     where d.ativo and d.obrigatorio and 'profissional' = any (d.audiencia) and v.id is not null
--       and not exists (
--         select 1 from curadoria.legal_acceptances a
--         left join curadoria.legal_acceptance_revocations r on r.acceptance_id = a.id
--         where a.professional_profile_id = _professional_profile_id
--           and a.version_id = v.id and r.id is null)
--     order by d.slug;
--   $rollback$;
--   -- 2. os privilégios:
--   grant execute on function curadoria.register_legal_acceptances(uuid[], text, text, text, jsonb) to public;
--   grant execute on function curadoria.revoke_legal_acceptance(uuid, text, text, text) to public;
--   grant execute on function curadoria.register_professional_acceptances(uuid, uuid[], text, text, timestamptz) to public;
--   grant execute on function curadoria.pendencias_legais_do_profissional(uuid) to public;
--   grant execute on function curadoria.versao_vigente(uuid) to public;
--   grant execute on function curadoria.enforce_legal_append_only() to public;
--   grant execute on function curadoria.enforce_dsr_item_progressao() to public;
-- Os grants a `anon`/`authenticated` preservados abaixo não precisam ser
-- desfeitos: eles já existiam antes desta migration.

-- ---------------------------------------------------------------------------
-- 1. As três portas de escrita — só sessão autenticada
-- ---------------------------------------------------------------------------
--
-- As três recusam de dentro quando `auth.uid()` é nulo, então `anon` já não
-- conseguia gravar nada. O que muda é a superfície: deixam de ser chamáveis.
-- `authenticated` é preservado — é por ele que a aplicação e os testes passam.

revoke all on function curadoria.register_legal_acceptances(uuid[], text, text, text, jsonb) from public;
revoke all on function curadoria.revoke_legal_acceptance(uuid, text, text, text) from public;
revoke all on function curadoria.register_professional_acceptances(uuid, uuid[], text, text, timestamptz) from public;

-- Reafirmados por clareza: `revoke ... from public` não remove o privilégio já
-- concedido a `authenticated` (são independentes), mas declarar o estado final
-- desejado é o que torna esta migration legível anos depois.
grant execute on function curadoria.register_legal_acceptances(uuid[], text, text, text, jsonb) to authenticated;
grant execute on function curadoria.revoke_legal_acceptance(uuid, text, text, text) to authenticated;
grant execute on function curadoria.register_professional_acceptances(uuid, uuid[], text, text, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. A consulta de pendências do profissional — privilégio E papel
-- ---------------------------------------------------------------------------
--
-- Duas camadas, porque o problema é de duas naturezas:
--
--   · PRIVILÉGIO tira `PUBLIC` da porta — mas não distingue um paciente
--     autenticado de um curador, porque ambos são `authenticated`;
--   · PAPEL é a distinção que falta, e ela só existe dentro da função.
--
-- A regra aplicada é a CANÔNICA do sistema para dado de homologação da Rede, a
-- mesma — literalmente a mesma expressão — usada em dois lugares já
-- publicados: a policy `legal_acceptances_leitura_equipe` (20260803150000) e a
-- guarda de `register_professional_acceptances`. Nenhuma segunda definição de
-- papéis nasce aqui; a identidade continua vindo de `auth.uid()` através de
-- `curadoria.has_role`, o único helper de autorização do esquema.
--
-- O que NÃO muda: assinatura, tipo de retorno, colunas, ordenação e o
-- significado do resultado. A consulta é a mesma, palavra por palavra. Muda a
-- linguagem (`sql` → `plpgsql`), porque recusar exige levantar exceção — e
-- devolver zero linhas no lugar do erro seria pior: silêncio se confunde com
-- "este profissional está em dia".
--
-- A mensagem é GENÉRICA de propósito. Um erro que dissesse "só a Curadoria" já
-- entregaria qual papel é necessário; um que dissesse "perfil não existe"
-- entregaria a existência do profissional. Quem não tem papel recebe sempre a
-- mesma resposta, exista ou não o UUID consultado — e por isso a verificação
-- vem ANTES de qualquer leitura.

create or replace function curadoria.pendencias_legais_do_profissional(
  _professional_profile_id uuid
)
returns table (slug text, nome text, versao_vigente text)
language plpgsql
stable
security definer
set search_path = curadoria, pg_temp
as $$
begin
  -- Sessão ausente e papel insuficiente respondem IGUAL: distinguir os dois
  -- casos já seria informação sobre o estado de quem pergunta.
  if auth.uid() is null
     or not (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'))
  then
    raise exception 'Não autorizado' using errcode = '42501';
  end if;

  return query
    select d.slug, d.nome, v.versao
    from curadoria.legal_documents d
    cross join lateral curadoria.versao_vigente(d.id) v
    where d.ativo
      and d.obrigatorio
      and 'profissional' = any (d.audiencia)
      and v.id is not null
      and not exists (
        select 1
        from curadoria.legal_acceptances a
        left join curadoria.legal_acceptance_revocations r on r.acceptance_id = a.id
        where a.professional_profile_id = _professional_profile_id
          and a.version_id = v.id
          and r.id is null
      )
    order by d.slug;
end;
$$;

-- `authenticated` permanece: a diferenciação entre papéis autenticados é feita
-- acima, dentro da função. Conceder EXECUTE a papéis do PostgreSQL que não
-- representam papéis de negócio seria criar um segundo modelo de autorização.
revoke all on function curadoria.pendencias_legais_do_profissional(uuid) from public;
grant execute on function curadoria.pendencias_legais_do_profissional(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. A versão vigente — `anon` PERMANECE, e é desenho, não descuido
-- ---------------------------------------------------------------------------
--
-- Justificativa individual, como exige o menor privilégio quando se preserva
-- um acesso anônimo:
--
--   a) o que ela devolve é uma linha de `legal_document_versions` de um
--      documento PUBLICADO — exatamente o que a policy
--      `legal_document_versions_leitura_publica` já permite a `anon` ler por
--      SELECT direto, desde 20260803140000;
--   b) portanto executar a função não entrega a `anon` nada que ele não possa
--      obter sem ela: não há escalonamento, só um caminho a mais para o mesmo
--      dado público;
--   c) o portal legal público (`/termos`, `/privacidade`, `/legal/<slug>/v/<v>`)
--      serve leitores SEM sessão — é onde a pessoa lê ANTES de decidir, e
--      fechar esse acesso quebraria a leitura pré-aceite;
--   d) a função não recebe nem devolve dado pessoal: o argumento é o id do
--      documento, e o retorno é o texto publicado.
--
-- O `revoke from public` continua valendo por higiene: PUBLIC alcança papéis
-- futuros que ninguém revisou; `anon` e `authenticated` são explícitos e
-- auditáveis.

revoke all on function curadoria.versao_vigente(uuid) from public;
grant execute on function curadoria.versao_vigente(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. As duas funções de trigger — chamáveis por ninguém
-- ---------------------------------------------------------------------------
--
-- Nunca receberam GRANT explícito: estavam com o `EXECUTE` padrão a PUBLIC.
-- Disparo de trigger NÃO verifica privilégio de execução do usuário que fez o
-- INSERT/UPDATE — a verificação acontece na criação do trigger. Revogar é,
-- portanto, seguro, e é o mesmo padrão já adotado pelas funções de trigger do
-- G0.1.

revoke all on function curadoria.enforce_legal_append_only() from public, anon, authenticated;
revoke all on function curadoria.enforce_dsr_item_progressao() from public, anon, authenticated;
