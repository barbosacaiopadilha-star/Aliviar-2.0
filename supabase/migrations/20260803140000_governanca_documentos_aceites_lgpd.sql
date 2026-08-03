-- INFRAESTRUTURA DE GOVERNANÇA — documentos, versões, aceite auditável, LGPD.
--
-- Fecha a base do Bloco H (PRIV-01..05, AU-03). Esta migration NÃO contém
-- texto jurídico: cria o mecanismo que os receberá. Nenhum documento nasce
-- aqui — quem publica é a equipe, depois da redação e aprovação jurídica.
--
-- O que sustenta juridicamente um aceite é a capacidade de provar, anos
-- depois, que AQUELA pessoa viu AQUELE texto naquele momento. Por isso:
--
--  1. o TEXTO INTEGRAL mora no banco (`conteudo`), nunca um caminho de
--     arquivo — arquivo muda, e a prova morreria junto;
--  2. o hash é GERADO PELO PRÓPRIO BANCO sobre esse texto (coluna gerada):
--     gerador e verificador não podem divergir, e o cliente nunca o informa;
--  3. versões e aceites são append-only por trigger, no mesmo padrão de
--     `case_responsibility_changes`;
--  4. o aceite carrega uma CÓPIA carimbada do hash — a prova é autocontida
--     mesmo que alguém compare linhas de tabelas diferentes.
--
-- Rollback: drop das 6 tabelas, dos 3 tipos e das funções/trigger deste
-- arquivo, na ordem inversa das dependências. Nenhuma tabela pré-existente é
-- alterada, exceto a adição de valores ao enum `audit_action` (aditiva,
-- irreversível por desenho do Postgres — valores novos não são removíveis).

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

-- Público-alvo de um documento. Um documento pode exigir aceite de mais de um
-- papel (ex.: Política de Privacidade vale para todos).
create type curadoria.legal_audience as enum ('paciente', 'profissional', 'equipe');

-- De onde veio o aceite. Não é decoração: o consentimento de compartilhamento
-- nasce na escolha do profissional, e a origem é o que distingue esse ato do
-- aceite genérico de primeiro acesso.
create type curadoria.legal_acceptance_origin as enum (
  'primeiro_acesso',
  'reaceite_por_nova_versao',
  'escolha_de_profissional',
  'portal_da_conta'
);

create type curadoria.dsr_kind as enum (
  'acesso', 'correcao', 'exclusao', 'portabilidade', 'revogacao'
);

create type curadoria.dsr_status as enum (
  'recebido', 'em_execucao', 'concluido', 'recusado'
);

-- Estado por RECURSO do pedido. 'removido' só é gravado com a remoção
-- CONFIRMADA — é a tradução do PRIV-04: um pedido nunca se dá por cumprido
-- porque "o DELETE não deu erro".
create type curadoria.dsr_item_state as enum (
  'pendente', 'removido', 'retido_por_obrigacao_legal', 'falhou'
);

-- ---------------------------------------------------------------------------
-- Documentos e versões
-- ---------------------------------------------------------------------------

create table curadoria.legal_documents (
  id uuid primary key default extensions.uuid_generate_v4(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nome text not null check (length(btrim(nome)) > 0),
  -- Descrição curta, em linguagem de gente: é o que a pessoa lê no índice
  -- antes de abrir o documento inteiro.
  resumo text,
  audiencia curadoria.legal_audience[] not null check (cardinality(audiencia) > 0),
  -- Obrigatório = sem aceite vigente, a pessoa não entra nas superfícies
  -- protegidas do papel dela.
  obrigatorio boolean not null default true,
  -- Consentimento se revoga; contrato de uso, não. A diferença é jurídica e
  -- por isso é dado, não regra de código.
  revogavel boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index legal_documents_ativo_idx on curadoria.legal_documents (ativo);

create table curadoria.legal_document_versions (
  id uuid primary key default extensions.uuid_generate_v4(),
  document_id uuid not null references curadoria.legal_documents (id) on delete restrict,
  versao text not null check (length(btrim(versao)) > 0),
  -- A PEÇA DE PROVA. Texto integral, imutável.
  conteudo text not null check (length(btrim(conteudo)) > 0),
  -- Gerado pelo banco: ninguém informa, ninguém recalcula por fora.
  conteudo_hash text generated always as (
    encode(extensions.digest(conteudo, 'sha256'), 'hex')
  ) stored,
  idioma text not null default 'pt-BR',
  -- Mudança material exige novo aceite de quem já aceitou; correção
  -- editorial não perturba ninguém. Quem decide é quem assina o documento.
  requires_reacceptance boolean not null default true,
  effective_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  published_by uuid references curadoria.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, versao)
);

create index legal_document_versions_document_idx
  on curadoria.legal_document_versions (document_id, effective_at desc);

-- A versão vigente de cada documento: a mais recente já em vigor.
create or replace function curadoria.versao_vigente(_document_id uuid)
returns curadoria.legal_document_versions
language sql
stable
security definer
set search_path = curadoria, pg_temp
as $$
  select v.*
  from curadoria.legal_document_versions v
  where v.document_id = _document_id
    and v.effective_at <= now()
  order by v.effective_at desc, v.created_at desc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Aceites e revogações
-- ---------------------------------------------------------------------------

create table curadoria.legal_acceptances (
  id uuid primary key default extensions.uuid_generate_v4(),
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  version_id uuid not null references curadoria.legal_document_versions (id) on delete restrict,
  -- Cópia carimbada: a prova não depende de juntar duas tabelas.
  conteudo_hash text not null,
  aceito_em timestamptz not null default now(),
  ip inet,
  user_agent text,
  origem curadoria.legal_acceptance_origin not null,
  idioma text not null default 'pt-BR',
  -- Contexto do ato. No consentimento de compartilhamento, carrega o
  -- professional_profile_id — o consentimento é POR profissional, nomeado.
  contexto jsonb not null default '{}'::jsonb
);

create index legal_acceptances_profile_idx on curadoria.legal_acceptances (profile_id, aceito_em desc);
create index legal_acceptances_version_idx on curadoria.legal_acceptances (version_id);

create table curadoria.legal_acceptance_revocations (
  id uuid primary key default extensions.uuid_generate_v4(),
  acceptance_id uuid not null references curadoria.legal_acceptances (id) on delete restrict,
  revogado_em timestamptz not null default now(),
  motivo text,
  ip inet,
  user_agent text
);

-- Uma revogação por aceite: revogar duas vezes o mesmo ato não significa nada.
create unique index legal_acceptance_revocations_unica
  on curadoria.legal_acceptance_revocations (acceptance_id);

-- ---------------------------------------------------------------------------
-- Pedidos de titular (LGPD)
-- ---------------------------------------------------------------------------

create table curadoria.data_subject_requests (
  id uuid primary key default extensions.uuid_generate_v4(),
  profile_id uuid not null references curadoria.profiles (id) on delete cascade,
  tipo curadoria.dsr_kind not null,
  status curadoria.dsr_status not null default 'recebido',
  -- Prazo é decisão jurídica; a coluna existe para recebê-lo sem refatorar.
  prazo_em timestamptz,
  criado_em timestamptz not null default now(),
  concluido_em timestamptz,
  -- Recusa fundamentada, quando houver (ex.: retenção por obrigação legal).
  desfecho text,
  check (status <> 'concluido' or concluido_em is not null)
);

create index data_subject_requests_profile_idx
  on curadoria.data_subject_requests (profile_id, criado_em desc);
create index data_subject_requests_status_idx
  on curadoria.data_subject_requests (status);

-- O inventário do pedido, recurso a recurso. Existe para que "excluído"
-- signifique CADA recurso confirmado, e não o pedido marcado como pronto.
create table curadoria.data_subject_request_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  request_id uuid not null references curadoria.data_subject_requests (id) on delete cascade,
  -- Endereço do recurso: 'storage:patient-documents/<path>' | 'db:<tabela>/<id>'
  recurso text not null check (length(btrim(recurso)) > 0),
  estado curadoria.dsr_item_state not null default 'pendente',
  verificado_em timestamptz,
  detalhe text,
  unique (request_id, recurso),
  -- Estado terminal sem verificação seria a mesma mentira do PRIV-04.
  check (estado = 'pendente' or verificado_em is not null)
);

create index data_subject_request_items_request_idx
  on curadoria.data_subject_request_items (request_id);
create index data_subject_request_items_pendentes_idx
  on curadoria.data_subject_request_items (estado) where estado <> 'removido';

-- ---------------------------------------------------------------------------
-- Append-only: versões publicadas, aceites e revogações não se reescrevem
-- ---------------------------------------------------------------------------

create or replace function curadoria.enforce_legal_append_only()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  raise exception '%.% é append-only: % não é permitido (a prova jurídica depende da imutabilidade)',
    tg_table_schema, tg_table_name, tg_op;
end;
$$;

create trigger legal_document_versions_append_only
  before update or delete on curadoria.legal_document_versions
  for each row execute function curadoria.enforce_legal_append_only();

create trigger legal_acceptances_append_only
  before update or delete on curadoria.legal_acceptances
  for each row execute function curadoria.enforce_legal_append_only();

create trigger legal_acceptance_revocations_append_only
  before update or delete on curadoria.legal_acceptance_revocations
  for each row execute function curadoria.enforce_legal_append_only();

-- O item do pedido evolui (pendente → removido), mas nunca retrocede nem
-- some: estado terminal é final, e apagar o inventário apagaria a prova de
-- que a exclusão foi cumprida.
create or replace function curadoria.enforce_dsr_item_progressao()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'data_subject_request_items não é removível: é a prova do cumprimento';
  end if;
  if old.estado <> 'pendente' and old.estado is distinct from new.estado then
    raise exception 'Item de pedido em estado terminal (%) não muda para %', old.estado, new.estado;
  end if;
  if old.recurso is distinct from new.recurso or old.request_id is distinct from new.request_id then
    raise exception 'Recurso e pedido de um item são imutáveis';
  end if;
  return new;
end;
$$;

create trigger data_subject_request_items_progressao
  before update or delete on curadoria.data_subject_request_items
  for each row execute function curadoria.enforce_dsr_item_progressao();

-- ---------------------------------------------------------------------------
-- Aceite: a porta única de escrita (transacional, com hash do servidor)
-- ---------------------------------------------------------------------------

-- Recebe apenas os IDs de VERSÃO que a pessoa viu. O hash é lido do banco,
-- nunca do cliente — um cliente adulterado não consegue registrar aceite de
-- texto diferente do publicado. Ou todos entram, ou nenhum.
create or replace function curadoria.register_legal_acceptances(
  _version_ids uuid[],
  _origem text,
  _ip text default null,
  _user_agent text default null,
  _contexto jsonb default '{}'::jsonb
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
    raise exception 'Aceite exige sessão autenticada' using errcode = '42501';
  end if;
  if _version_ids is null or cardinality(_version_ids) = 0 then
    raise exception 'Nenhuma versão informada para aceite' using errcode = '23514';
  end if;

  foreach _version_id in array _version_ids loop
    select * into _versao from curadoria.legal_document_versions where id = _version_id;
    if not found then
      raise exception 'Versão % não existe', _version_id using errcode = 'P0002';
    end if;

    -- Só se aceita o que está VIGENTE: aceitar versão superada (ou futura)
    -- produziria uma prova que não corresponde ao que a pessoa deveria ler.
    _vigente := curadoria.versao_vigente(_versao.document_id);
    if _vigente.id is distinct from _versao.id then
      raise exception 'Versão % não é a vigente do documento', _versao.versao using errcode = '23514';
    end if;

    return query
      insert into curadoria.legal_acceptances (
        profile_id, version_id, conteudo_hash, origem, idioma, ip, user_agent, contexto
      )
      values (
        _actor,
        _versao.id,
        _versao.conteudo_hash,          -- do BANCO, sempre
        _origem::curadoria.legal_acceptance_origin,
        _versao.idioma,
        nullif(btrim(coalesce(_ip, '')), '')::inet,
        nullif(btrim(coalesce(_user_agent, '')), ''),
        coalesce(_contexto, '{}'::jsonb)
      )
      returning *;
  end loop;
end;
$$;

-- Revogar é ato do titular sobre o PRÓPRIO aceite, e só onde o documento o
-- permite. A revogação nunca apaga o aceite: ele é a prova de que houve.
create or replace function curadoria.revoke_legal_acceptance(
  _acceptance_id uuid,
  _motivo text default null,
  _ip text default null,
  _user_agent text default null
)
returns curadoria.legal_acceptance_revocations
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
declare
  _actor uuid := auth.uid();
  _aceite curadoria.legal_acceptances;
  _revogavel boolean;
  _revogacao curadoria.legal_acceptance_revocations;
begin
  if _actor is null then
    raise exception 'Revogação exige sessão autenticada' using errcode = '42501';
  end if;

  select * into _aceite from curadoria.legal_acceptances where id = _acceptance_id;
  if not found then
    raise exception 'Aceite % não existe', _acceptance_id using errcode = 'P0002';
  end if;
  if _aceite.profile_id <> _actor then
    raise exception 'Só o titular revoga o próprio aceite' using errcode = '42501';
  end if;

  select d.revogavel into _revogavel
  from curadoria.legal_document_versions v
  join curadoria.legal_documents d on d.id = v.document_id
  where v.id = _aceite.version_id;

  if not coalesce(_revogavel, false) then
    raise exception 'Este documento não é revogável — contrato de uso não se revoga isoladamente'
      using errcode = '23514';
  end if;

  insert into curadoria.legal_acceptance_revocations (acceptance_id, motivo, ip, user_agent)
  values (
    _acceptance_id,
    nullif(btrim(coalesce(_motivo, '')), ''),
    nullif(btrim(coalesce(_ip, '')), '')::inet,
    nullif(btrim(coalesce(_user_agent, '')), '')
  )
  returning * into _revogacao;

  return _revogacao;
end;
$$;

-- ---------------------------------------------------------------------------
-- Auditoria: os atos de governança entram no mesmo livro dos demais
-- ---------------------------------------------------------------------------

alter type curadoria.audit_action add value if not exists 'legal_document_published';
alter type curadoria.audit_action add value if not exists 'legal_acceptance_registered';
alter type curadoria.audit_action add value if not exists 'legal_acceptance_revoked';
alter type curadoria.audit_action add value if not exists 'data_subject_request_opened';
alter type curadoria.audit_action add value if not exists 'data_subject_request_closed';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table curadoria.legal_documents enable row level security;
alter table curadoria.legal_document_versions enable row level security;
alter table curadoria.legal_acceptances enable row level security;
alter table curadoria.legal_acceptance_revocations enable row level security;
alter table curadoria.data_subject_requests enable row level security;
alter table curadoria.data_subject_request_items enable row level security;

-- Documento publicado é público por natureza: quem vai aceitar precisa poder
-- ler ANTES de ter sessão (o portal público serve estas mesmas linhas).
create policy legal_documents_leitura_publica
  on curadoria.legal_documents for select to anon, authenticated
  using (ativo);

create policy legal_document_versions_leitura_publica
  on curadoria.legal_document_versions for select to anon, authenticated
  using (true);

-- Publicar é ato da equipe, pela chave de serviço — nenhum cliente escreve.

create policy legal_acceptances_leitura_propria
  on curadoria.legal_acceptances for select to authenticated
  using (profile_id = auth.uid() or curadoria.has_role('administrador'));

create policy legal_acceptance_revocations_leitura_propria
  on curadoria.legal_acceptance_revocations for select to authenticated
  using (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.legal_acceptances a
      where a.id = legal_acceptance_revocations.acceptance_id
        and a.profile_id = auth.uid()
    )
  );

create policy data_subject_requests_proprio
  on curadoria.data_subject_requests for select to authenticated
  using (profile_id = auth.uid() or curadoria.has_role('administrador'));

create policy data_subject_request_items_proprio
  on curadoria.data_subject_request_items for select to authenticated
  using (
    curadoria.has_role('administrador')
    or exists (
      select 1 from curadoria.data_subject_requests r
      where r.id = data_subject_request_items.request_id
        and r.profile_id = auth.uid()
    )
  );

-- Abrir pedido é ato do titular; executá-lo é da operação (service role).
create policy data_subject_requests_abertura_propria
  on curadoria.data_subject_requests for insert to authenticated
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- GRANTs — o mínimo, e explícito (privilégio é camada anterior à policy)
-- ---------------------------------------------------------------------------

grant select on curadoria.legal_documents to anon, authenticated;
grant select on curadoria.legal_document_versions to anon, authenticated;
grant select on curadoria.legal_acceptances to authenticated;
grant select on curadoria.legal_acceptance_revocations to authenticated;
grant select on curadoria.data_subject_requests to authenticated;
grant select, insert on curadoria.data_subject_requests to authenticated;
grant select on curadoria.data_subject_request_items to authenticated;

-- INSERT de aceite e de revogação NÃO é concedido a authenticated: a escrita
-- passa obrigatoriamente pelas funções security definer acima, que validam a
-- vigência e carimbam o hash do servidor. As policies ficam como defesa em
-- profundidade, nunca como porta.

grant execute on function curadoria.register_legal_acceptances(uuid[], text, text, text, jsonb) to authenticated;
grant execute on function curadoria.revoke_legal_acceptance(uuid, text, text, text) to authenticated;
grant execute on function curadoria.versao_vigente(uuid) to anon, authenticated;

grant all on curadoria.legal_documents to service_role;
grant all on curadoria.legal_document_versions to service_role;
grant all on curadoria.legal_acceptances to service_role;
grant all on curadoria.legal_acceptance_revocations to service_role;
grant all on curadoria.data_subject_requests to service_role;
grant all on curadoria.data_subject_request_items to service_role;
