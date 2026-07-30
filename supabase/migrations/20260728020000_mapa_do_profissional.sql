-- MAPA DO PROFISSIONAL — a característica está presente, ou não está
--
-- O outro lado do Mapa de Prioridades (ADR-039). Os dois falam do MESMO
-- subcritério, com naturezas diferentes:
--
--   case_priority_map        → quanto isto importa NESTE Case  (cinco níveis)
--   professional_subcriterion_map → isto está presente?        (três estados)
--
-- A identidade compartilhada é `method_subcriteria.id`. Nenhum catálogo
-- paralelo, nenhum enum com os mesmos nomes em outro lugar, nenhuma conversão
-- por rótulo visível — é essa identidade que torna o cruzamento futuro uma
-- comparação, e não uma interpretação de texto.
--
-- O profissional NUNCA recebe peso, nota ou importância. Não existe
-- "excelente" nem "especialista de alto nível": adjetivo de qualidade aqui
-- seria a Aliviar opinando sobre gente, e o Método não faz isso.
--
-- ADITIVA. Não altera nenhuma tabela de profissional, não muda
-- `publication_status`, não toca Rede, Cases, seleções nem Relatórios.

-- ---------------------------------------------------------------------------
-- 1. Os três estados
-- ---------------------------------------------------------------------------
--
-- Sem estados intermediários, de propósito. "Parcial", "provável" e
-- "evidência forte" parecem mais precisos e são menos: cada um vira uma
-- decisão disfarçada de medida.
create type curadoria.subcriterion_status as enum (
  'CONFIRMADO',
  'NAO_CONFIRMADO',
  'NAO_INFORMADO'
);

comment on type curadoria.subcriterion_status is
  'CONFIRMADO: a caracteristica esta presente. NAO_CONFIRMADO: a operacao verificou que nao esta. NAO_INFORMADO: nao ha informacao suficiente para afirmar nem negar. AUSENCIA DE LINHA e diferente de NAO_INFORMADO: a primeira e item nao trabalhado, a segunda e item analisado.';

-- ---------------------------------------------------------------------------
-- 2. O Mapa
-- ---------------------------------------------------------------------------

create table curadoria.professional_subcriterion_map (
  id uuid primary key default gen_random_uuid(),
  professional_profile_id uuid not null
    references curadoria.professional_profiles (id) on delete cascade,
  subcriterion_id uuid not null
    references curadoria.method_subcriteria (id) on delete restrict,
  status curadoria.subcriterion_status not null,
  -- Observação é apoio à leitura, não laudo: curta, opcional, e nunca vazia
  -- disfarçada de preenchida.
  note text check (note is null or (length(btrim(note)) between 1 and 280)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (professional_profile_id, subcriterion_id)
);

comment on table curadoria.professional_subcriterion_map is
  'Estado de cada subcriterio canonico no profissional. Dado OPERACIONAL INTERNO: nao e perfil publico, nao publica ninguem e nao altera publication_status. Sem peso, sem nota, sem score.';

create index professional_subcriterion_map_professional_idx
  on curadoria.professional_subcriterion_map (professional_profile_id);

-- Só subcritério em circulação recebe declaração NOVA. Reclassificar o que já
-- existe continua permitido: o cadastro não trava porque o catálogo mudou.
create or replace function curadoria.assert_subcriterion_active_for_professional()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_temp
as $$
begin
  if tg_op = 'INSERT' and not exists (
    select 1 from curadoria.method_subcriteria m
     where m.id = new.subcriterion_id and m.active
  ) then
    raise exception 'Subcriterio fora de circulacao nao recebe nova declaracao.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger professional_subcriterion_map_active
  before insert on curadoria.professional_subcriterion_map
  for each row execute function curadoria.assert_subcriterion_active_for_professional();

-- Observação em branco vira NULL antes de chegar ao disco. Uma observação
-- vazia não é uma observação, e guardá-la como string faria a tela mostrar um
-- campo "preenchido" que não diz nada.
create or replace function curadoria.normalize_subcriterion_note()
returns trigger
language plpgsql
set search_path = curadoria, pg_temp
as $$
begin
  new.note := nullif(btrim(coalesce(new.note, '')), '');
  return new;
end;
$$;

create trigger professional_subcriterion_map_normalize_note
  before insert or update on curadoria.professional_subcriterion_map
  for each row execute function curadoria.normalize_subcriterion_note();

create trigger professional_subcriterion_map_touch
  before update on curadoria.professional_subcriterion_map
  for each row execute function curadoria.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Acesso — o mesmo recorte de quem edita profissional
-- ---------------------------------------------------------------------------
--
-- `professional_profiles` só aceita INSERT e UPDATE de `administrador`. O
-- Mapa segue exatamente isso: quem edita profissional gerencia o Mapa.
--
-- Leitura: administrador e curador_medico. NÃO o paciente, NÃO o público,
-- NÃO o próprio profissional — este é um registro operacional SOBRE ele,
-- feito pela operação, e não um campo do perfil dele.
alter table curadoria.professional_subcriterion_map enable row level security;

grant select, insert, update, delete on curadoria.professional_subcriterion_map to authenticated;
grant all on curadoria.professional_subcriterion_map to service_role;

create policy "professional_subcriterion_map_read_interno"
  on curadoria.professional_subcriterion_map
  for select to authenticated
  using (curadoria.has_role('administrador') or curadoria.has_role('curador_medico'));

create policy "professional_subcriterion_map_write_admin"
  on curadoria.professional_subcriterion_map
  for all to authenticated
  using (curadoria.has_role('administrador'))
  with check (curadoria.has_role('administrador'));

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   drop table if exists curadoria.professional_subcriterion_map;
--   drop function if exists curadoria.assert_subcriterion_active_for_professional();
--   drop function if exists curadoria.normalize_subcriterion_note();
--   drop type if exists curadoria.subcriterion_status;
--
-- Reverter descarta os Mapas declarados — e nada mais: nenhuma tabela de
-- profissional foi tocada por esta migration.
