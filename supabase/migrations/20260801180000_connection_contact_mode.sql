-- Incremento 1 da Continuidade Pós-Decisão
-- (docs/architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md §18)
--
-- Corrige um defeito concreto: o Case tem responsável, mas o Concierge
-- responsável não conseguia enxergar a decisão pela qual responde. E dá à
-- paciente o único registro que faltava para que a continuidade tenha
-- autoria dela — como ela quer começar.
--
-- O que esta migration NÃO faz, deliberadamente: não cria approach_attempts,
-- não cria team_notifications, não cria pausa por segurança, não cria
-- Temporary Access, não toca Relationship, não altera nenhum trigger
-- existente, não faz backfill e não infere modo nenhum.

-- ---------------------------------------------------------------------------
-- 1. contact_mode — como a paciente quer começar
-- ---------------------------------------------------------------------------

alter table curadoria.connection_records
  add column if not exists contact_mode text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'connection_records_contact_mode_check'
      and conrelid = 'curadoria.connection_records'::regclass
  ) then
    alter table curadoria.connection_records
      add constraint connection_records_contact_mode_check
      check (
        contact_mode is null
        or contact_mode in ('CONTATO_DIRETO_ACOMPANHADO', 'APROXIMACAO_INTERMEDIADA')
      );
  end if;
end $$;

comment on column curadoria.connection_records.contact_mode is
  'Como a paciente quer começar, declarado por ela. NULL significa registro legado ou modo ainda não definido — nunca escolha implícita, e nenhuma rotina pode tratá-lo como padrão. Sem default e sem backfill: atribuir um modo a registros anteriores afirmaria uma escolha que ninguém fez. CONTATO_INICIADO continua significando declaração da própria paciente de que ELA iniciou o contato, e é independente deste campo.';

-- ---------------------------------------------------------------------------
-- 2. Evento — aditivo. Nenhum valor removido, nenhum trigger alterado.
-- ---------------------------------------------------------------------------

alter table curadoria.connection_events
  drop constraint if exists connection_events_type_check;

alter table curadoria.connection_events
  add constraint connection_events_type_check
  check (event_type in (
    'DECISAO_REGISTRADA',
    'CORRECAO_ESCOLHA',
    'CONTATO_INICIADO',
    'PRIMEIRO_ATENDIMENTO_REALIZADO',
    'ENCERRADO_SEM_RELACIONAMENTO',
    'MODO_CONTATO_DEFINIDO'
  ));

-- ---------------------------------------------------------------------------
-- 3. RPC — modo + evento na mesma transação
--
-- Mesmo padrão de create_connection_with_event/apply_connection_transition:
-- security INVOKER, para que a RLS continue sendo a autoridade. Quem não
-- pode atualizar a linha simplesmente não a atualiza.
-- ---------------------------------------------------------------------------

create or replace function curadoria.set_connection_contact_mode(
  p_connection_id uuid,
  p_expected_mode text,
  p_new_mode text,
  p_actor_id uuid,
  p_occurred_at timestamptz,
  p_recorded_at timestamptz
)
returns curadoria.connection_records
language plpgsql
security invoker
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  v_record curadoria.connection_records;
begin
  select * into v_record
  from curadoria.connection_records
  where id = p_connection_id
  for update;

  if not found then
    raise exception 'connection_records: registro não encontrado' using errcode = '02000';
  end if;

  -- Concorrência otimista, mesmo contrato de apply_connection_transition.
  if v_record.contact_mode is distinct from p_expected_mode then
    raise exception 'connection_records: modo de contato mudou desde a leitura' using errcode = '55000';
  end if;

  -- Idempotência: repetir o mesmo modo é sucesso sem evento novo. Histórico
  -- só nasce quando houve mudança real.
  if v_record.contact_mode is not distinct from p_new_mode then
    return v_record;
  end if;

  -- O modo não altera o estado da Connection. Só se define enquanto nenhum
  -- efeito foi produzido — depois de declarado contato ou de um terminal,
  -- o modo é história.
  if v_record.status is distinct from 'DECISAO_REGISTRADA' then
    raise exception 'connection_records: o modo de contato só pode ser definido enquanto status = DECISAO_REGISTRADA (atual: %)', v_record.status
      using errcode = '23514';
  end if;

  update curadoria.connection_records
  set contact_mode = p_new_mode
  where id = p_connection_id
  returning * into v_record;

  if not found then
    raise exception 'connection_records: atualização não autorizada' using errcode = '42501';
  end if;

  insert into curadoria.connection_events (
    connection_id, event_type, actor_id, payload, occurred_at, recorded_at
  ) values (
    p_connection_id,
    'MODO_CONTATO_DEFINIDO',
    p_actor_id,
    jsonb_build_object('previousMode', p_expected_mode, 'contactMode', p_new_mode),
    p_occurred_at,
    p_recorded_at
  );

  return v_record;
end;
$function$;

comment on function curadoria.set_connection_contact_mode(uuid, text, text, uuid, timestamptz, timestamptz) is
  'Define o modo de contato declarado pela paciente, gravando coluna e evento na mesma transação. security invoker: a RLS é a autoridade — Curador, Concierge e administrador não conseguem definir em nome dela. Idempotente para o mesmo modo, com concorrência otimista (55000).';

revoke execute on function curadoria.set_connection_contact_mode(uuid, text, text, uuid, timestamptz, timestamptz) from public;
grant execute on function curadoria.set_connection_contact_mode(uuid, text, text, uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Leitura do responsável atual do Case
--
-- Reutiliza curadoria.can_access_case(uuid) — o helper canônico, que já
-- autoriza `cases` e cuja regra é a do projeto: autorização pela
-- responsabilidade ATUAL; quem já entregou o Case não continua enxergando.
--
-- Nenhum predicado novo é criado. Nenhum acesso é concedido por
-- has_role('concierge'): sem vínculo com o Case, não há leitura.
--
-- connection_events NÃO recebe case_id — sua âncora é connection_id, e o
-- join abaixo é o mesmo padrão já usado por connection_events_select_own_patient.
-- Acrescentar a coluna duplicaria um fato derivável por chave estrangeira.
-- ---------------------------------------------------------------------------

drop policy if exists connection_records_select_case_responsible on curadoria.connection_records;
create policy connection_records_select_case_responsible
  on curadoria.connection_records for select to authenticated
  using (curadoria.can_access_case(case_id));

drop policy if exists connection_events_select_case_responsible on curadoria.connection_events;
create policy connection_events_select_case_responsible
  on curadoria.connection_events for select to authenticated
  using (
    exists (
      select 1
      from curadoria.connection_records cr
      where cr.id = connection_events.connection_id
        and curadoria.can_access_case(cr.case_id)
    )
  );

comment on policy connection_records_select_case_responsible on curadoria.connection_records is
  'Leitura pelo responsável ATUAL do Case (inclui o Concierge após a transferência auditada), pelo Curador designado e pelo administrador — via can_access_case. Acrescenta ao conjunto existente, não substitui as policies da paciente. Não concede escrita.';

comment on policy connection_events_select_case_responsible on curadoria.connection_events is
  'Mesma autorização de connection_records, alcançada por join em connection_id porque esta tabela não possui case_id.';
