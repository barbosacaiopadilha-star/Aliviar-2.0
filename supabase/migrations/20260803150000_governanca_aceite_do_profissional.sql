-- GOVERNANÇA — o aceite do PROFISSIONAL, registrado pela equipe.
--
-- Premissa operacional da 1.0: não existe Portal do Profissional e a Rede não
-- é marketplace. A Rede é construída e homologada pela equipe de Curadoria —
-- o profissional não se cadastra, não se autoedita e não faz login. Logo o
-- aceite dele NÃO é um ato eletrônico do titular: é um ato do titular
-- (verbal, assinado, por e-mail) que a equipe REGISTRA.
--
-- A regra que este arquivo protege é a mesma da Base de Evidências: a
-- proveniência conta a verdade. Um aceite registrado pela equipe jamais pode
-- ser confundido com um aceite eletrônico do próprio titular — são atos de
-- peso jurídico diferente, e o banco não deixa a diferença sumir.
--
-- Por que UMA tabela e não duas: o livro de aceites precisa ser único para a
-- auditoria, e quando o Portal do Profissional existir (1.1+) o aceite dele
-- passa a ser eletrônico SEM refatoração — muda a natureza da linha, muda o
-- sujeito preenchido, e nada mais.
--
-- Rollback: remover as colunas e o tipo criados aqui; a migration anterior
-- (20260803140000) volta a ser suficiente.

-- ---------------------------------------------------------------------------
-- Natureza do aceite — a distinção que não pode se perder
-- ---------------------------------------------------------------------------

create type curadoria.legal_acceptance_nature as enum (
  -- O titular praticou o ato na tela, autenticado. É o aceite do paciente e
  -- o da equipe interna.
  'eletronico_pelo_titular',
  -- O titular manifestou concordância fora do sistema e a equipe registrou,
  -- declarando COMO obteve e anexando evidência quando existir. É o aceite
  -- do profissional na 1.0.
  'registrado_pela_equipe'
);

-- ---------------------------------------------------------------------------
-- O sujeito do aceite deixa de ser sempre uma conta
-- ---------------------------------------------------------------------------

-- O profissional pode não ter conta nenhuma: o sujeito é o PERFIL dele.
alter table curadoria.legal_acceptances
  add column professional_profile_id uuid
    references curadoria.professional_profiles (id) on delete restrict,
  add column natureza curadoria.legal_acceptance_nature
    not null default 'eletronico_pelo_titular',
  -- Quem operou o registro. No aceite eletrônico é nulo (o ator É o titular).
  add column registrado_por uuid references curadoria.profiles (id) on delete set null,
  -- COMO o aceite foi obtido, nas palavras de quem registrou. Texto livre de
  -- propósito: "assinatura em papel digitalizada", "e-mail de confirmação de
  -- 12/08", "confirmação verbal em reunião de homologação com duas
  -- testemunhas". A forma importa juridicamente, e enumerá-la aqui
  -- empobreceria o registro.
  add column forma_de_obtencao text,
  -- Ponteiro para a evidência quando existir (caminho no storage, número de
  -- protocolo, id de mensagem). Ausência é registrada como ausência.
  add column evidencia_ref text;

-- O titular deixa de ser obrigatoriamente uma conta.
alter table curadoria.legal_acceptances
  alter column profile_id drop not null;

-- Exatamente UM sujeito: ou uma conta, ou um perfil profissional. Nunca os
-- dois (seria ambíguo de quem é o ato), nunca nenhum (seria aceite de
-- ninguém).
alter table curadoria.legal_acceptances
  add constraint legal_acceptances_um_sujeito check (
    (profile_id is not null and professional_profile_id is null)
    or (profile_id is null and professional_profile_id is not null)
  );

-- A natureza não é decorativa: registro pela equipe EXIGE quem registrou e
-- como obteve. Sem isso, o registro seria uma afirmação sem autor — e é
-- exatamente esse vazio que invalidaria a prova.
alter table curadoria.legal_acceptances
  add constraint legal_acceptances_proveniencia_coerente check (
    (natureza = 'eletronico_pelo_titular'
      and registrado_por is null
      and forma_de_obtencao is null)
    or (natureza = 'registrado_pela_equipe'
      and registrado_por is not null
      and length(btrim(coalesce(forma_de_obtencao, ''))) > 0)
  );

-- Aceite eletrônico é sempre de uma conta; o perfil profissional só entra
-- pelo caminho registrado. Quando o Portal existir, esta constraint é a
-- única linha a rever — e a revisão será deliberada, não acidental.
alter table curadoria.legal_acceptances
  add constraint legal_acceptances_natureza_do_sujeito check (
    professional_profile_id is null or natureza = 'registrado_pela_equipe'
  );

create index legal_acceptances_professional_idx
  on curadoria.legal_acceptances (professional_profile_id, aceito_em desc);

-- ---------------------------------------------------------------------------
-- A porta de escrita do aceite registrado pela equipe
-- ---------------------------------------------------------------------------

-- Espelha `register_legal_acceptances`, com três diferenças que são o ponto
-- inteiro: o sujeito é o perfil profissional, o ator registrado é o Curador
-- (de auth.uid(), nunca do cliente), e a forma de obtenção é obrigatória.
create or replace function curadoria.register_professional_acceptances(
  _professional_profile_id uuid,
  _version_ids uuid[],
  _forma_de_obtencao text,
  _evidencia_ref text default null,
  _aceito_em timestamptz default null
)
returns setof curadoria.legal_acceptances
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := auth.uid();
  _version_id uuid;
  _versao curadoria.legal_document_versions;
  _vigente curadoria.legal_document_versions;
begin
  if _actor is null then
    raise exception 'Registro de aceite exige sessão autenticada' using errcode = '42501';
  end if;

  -- Quem homologa a Rede é a Curadoria; o administrador também opera.
  if not (curadoria.has_role('administrador') or curadoria.has_role('curador_medico')) then
    raise exception 'Só a Curadoria registra o aceite de um profissional' using errcode = '42501';
  end if;

  if length(btrim(coalesce(_forma_de_obtencao, ''))) = 0 then
    raise exception 'A forma como o aceite foi obtido é obrigatória — um registro sem ela não prova nada'
      using errcode = '23514';
  end if;

  if not exists (select 1 from curadoria.professional_profiles where id = _professional_profile_id) then
    raise exception 'Perfil profissional % não existe', _professional_profile_id using errcode = 'P0002';
  end if;

  if _version_ids is null or cardinality(_version_ids) = 0 then
    raise exception 'Nenhuma versão informada para aceite' using errcode = '23514';
  end if;

  -- A data do ato pode ser anterior ao registro (o profissional assinou na
  -- terça, a equipe registrou na quinta) — mas nunca no futuro.
  if _aceito_em is not null and _aceito_em > now() then
    raise exception 'A data do aceite não pode estar no futuro' using errcode = '23514';
  end if;

  foreach _version_id in array _version_ids loop
    select * into _versao from curadoria.legal_document_versions where id = _version_id;
    if not found then
      raise exception 'Versão % não existe', _version_id using errcode = 'P0002';
    end if;

    _vigente := curadoria.versao_vigente(_versao.document_id);
    if _vigente.id is distinct from _versao.id then
      raise exception 'Versão % não é a vigente do documento', _versao.versao using errcode = '23514';
    end if;

    return query
      insert into curadoria.legal_acceptances (
        profile_id, professional_profile_id, version_id, conteudo_hash,
        aceito_em, origem, idioma, natureza, registrado_por,
        forma_de_obtencao, evidencia_ref, contexto
      )
      values (
        null,
        _professional_profile_id,
        _versao.id,
        _versao.conteudo_hash,               -- do BANCO, sempre
        coalesce(_aceito_em, now()),
        'primeiro_acesso',
        _versao.idioma,
        'registrado_pela_equipe',
        _actor,
        btrim(_forma_de_obtencao),
        nullif(btrim(coalesce(_evidencia_ref, '')), ''),
        jsonb_build_object('registrado_em', now())
      )
      returning *;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- A pergunta que a operação faz: este profissional está autorizado?
-- ---------------------------------------------------------------------------

-- Devolve os slugs dos documentos obrigatórios da audiência 'profissional'
-- que este perfil AINDA NÃO tem aceite vigente e não revogado.
--
-- A função apenas RESPONDE. Bloquear a publicação da Rede por causa dela é
-- decisão de produto/jurídico, deliberada, e não um efeito colateral desta
-- migration — por isso ela não é chamada por trigger nenhum aqui.
create or replace function curadoria.pendencias_legais_do_profissional(
  _professional_profile_id uuid
)
returns table (slug text, nome text, versao_vigente text)
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
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
$$;

-- ---------------------------------------------------------------------------
-- Auditoria e privilégios
-- ---------------------------------------------------------------------------

alter type curadoria.audit_action add value if not exists 'professional_acceptance_registered';

grant execute on function curadoria.register_professional_acceptances(uuid, uuid[], text, text, timestamptz)
  to authenticated;
grant execute on function curadoria.pendencias_legais_do_profissional(uuid)
  to authenticated;

-- Leitura dos aceites do profissional: é dado de homologação da Rede, lido
-- pela equipe. A policy de leitura própria continua valendo para as contas.
create policy legal_acceptances_leitura_equipe
  on curadoria.legal_acceptances for select to authenticated
  using (
    professional_profile_id is not null
    and (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'))
  );
