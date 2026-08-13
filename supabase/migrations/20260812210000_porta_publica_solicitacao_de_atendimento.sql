-- OPS-R3A1 · A PORTA PÚBLICA DE SOLICITAÇÃO DE ATENDIMENTO.
--
-- Hoje ninguém entra. A pessoa que descobre a Aliviar não tem por onde pedir
-- atendimento: `crm_contacts` só aceita `INSERT` de `authenticated` com papel
-- de administrador, atendente ou concierge. Esta migration abre UMA porta, do
-- tamanho exato do pedido, e nada além dela.
--
-- O QUE ESTA MIGRATION **NÃO** FAZ:
--   · não cria conta, paciente nem Case — quem converte é o Atendimento;
--   · não afrouxa a RLS de `crm_contacts`: as três policies existentes ficam
--     intactas, e nenhum `INSERT` direto é aberto a `anon`;
--   · não aceita conteúdo clínico: a assinatura não tem onde recebê-lo;
--   · não guarda IP, nem bruto nem derivado. Rate-limit é camada de borda.
--
-- A FRONTEIRA É A ASSINATURA. `solicitar_atendimento_publico` recebe cinco
-- argumentos e ponto. Não há `p_status`, `p_assigned_to`, `p_patient_id` nem
-- `p_case_id`: o cliente não tem como pedir estado, dono ou vínculo, porque a
-- função não tem parâmetro para isso. Fronteira que não existe não pode ser
-- burlada — é a mesma doutrina do `acknowledge_priority_profile`.
--
-- IDEMPOTÊNCIA ATÔMICA, e por que não é `select` seguido de `insert`. Dois
-- envios simultâneos da mesma pessoa passariam pelo `select` antes de qualquer
-- `insert` e criariam dois contatos. Aqui a unicidade é do BANCO — dois índices
-- parciais únicos sobre uma janela de 24 h —, e a corrida resolve no
-- `on conflict`. O segundo envio encontra o primeiro e devolve a mesma resposta.
--
-- NORMALIZAÇÃO ESPELHADA. `normalizar_email_publico` e `normalizar_telefone_publico`
-- reproduzem `normalizeEmail`/`normalizePhone` de `src/modules/crm/lead.ts`.
-- Duplicar é deliberado: o índice único precisa da regra dentro do banco, e um
-- teste falseável compara as duas implementações caso a caso.
--
-- ⛔ NOME NUNCA IDENTIFICA. Duas pessoas homônimas são duas pessoas. A janela
-- só funde quem tem o MESMO identificador único normalizado.

-- ---------------------------------------------------------------------------
-- 1 · Normalização, dentro do banco
-- ---------------------------------------------------------------------------

create or replace function curadoria.normalizar_email_publico(_bruto text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(trim(coalesce(_bruto, ''))), '');
$$;

comment on function curadoria.normalizar_email_publico(text) is
  'Espelha normalizeEmail de src/modules/crm/lead.ts. Usada pelo índice único da janela de 24h.';

create or replace function curadoria.normalizar_telefone_publico(_bruto text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  digitos text := regexp_replace(coalesce(_bruto, ''), '\D', '', 'g');
begin
  if length(digitos) = 0 then
    return null;
  end if;
  -- `(11) 97903-7133`, `11979037133` e `+55 11 97903-7133` são a mesma pessoa.
  if length(digitos) >= 12 and left(digitos, 2) = '55' then
    return digitos;
  end if;
  if length(digitos) in (10, 11) then
    return '55' || digitos;
  end if;
  return digitos;
end;
$$;

comment on function curadoria.normalizar_telefone_publico(text) is
  'Espelha normalizePhone de src/modules/crm/lead.ts. Usada pelo índice único da janela de 24h.';

-- ---------------------------------------------------------------------------
-- 2 · A janela de 24 h, como fato do banco
-- ---------------------------------------------------------------------------
--
-- `janela_publica_24h` é o dia UTC do contato. Dois envios do mesmo
-- identificador no mesmo dia colidem no índice; no dia seguinte, não. É
-- grosseiro de propósito: uma janela deslizante exigiria estado, e estado
-- exigiria guardar quem pediu — que é justamente o que a decisão proíbe.

alter table curadoria.crm_contacts
  add column if not exists janela_publica_24h date;

comment on column curadoria.crm_contacts.janela_publica_24h is
  'OPS-R3A1: dia UTC da solicitação pública, só para a unicidade da janela. Nulo em contato criado pela equipe.';

create unique index if not exists crm_contacts_janela_publica_email_uidx
  on curadoria.crm_contacts (email_normalized, janela_publica_24h)
  where janela_publica_24h is not null and email_normalized is not null;

create unique index if not exists crm_contacts_janela_publica_telefone_uidx
  on curadoria.crm_contacts (phone_normalized, janela_publica_24h)
  where janela_publica_24h is not null and phone_normalized is not null;

-- ---------------------------------------------------------------------------
-- 3 · O writer público — a única porta
-- ---------------------------------------------------------------------------
--
-- `security definer` porque a RLS de `crm_contacts` recusa `anon`, e deve mesmo
-- recusar. O privilégio fica AQUI, do tamanho desta assinatura, em vez de virar
-- uma policy aberta que valeria para toda escrita futura na tabela.
--
-- Devolve apenas `boolean`. Não devolve id, não devolve estado, não devolve se
-- criou ou reaproveitou — porque a resposta pública precisa ser indistinguível.

create or replace function curadoria.solicitar_atendimento_publico(
  _nome text,
  _email text,
  _telefone text,
  _para_outra_pessoa boolean,
  _consentimento_versao text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  nome_limpo text := nullif(trim(coalesce(_nome, '')), '');
  email_norm text := curadoria.normalizar_email_publico(_email);
  telefone_norm text := curadoria.normalizar_telefone_publico(_telefone);
  versao_limpa text := nullif(trim(coalesce(_consentimento_versao, '')), '');
  hoje date := (now() at time zone 'utc')::date;
begin
  -- As mesmas exigências do cliente, ditas de novo aqui. O formulário é
  -- conveniência; esta é a regra.
  if nome_limpo is null then
    raise exception 'Nome é obrigatório.' using errcode = '22023';
  end if;
  if email_norm is null and telefone_norm is null then
    raise exception 'Informe e-mail ou telefone.' using errcode = '22023';
  end if;
  if versao_limpa is null then
    raise exception 'Consentimento é obrigatório.' using errcode = '22023';
  end if;

  -- Contato já convertido não é tocado por envio público. Quem virou paciente
  -- tem histórico, e um pedido novo dela não pode reabrir nem sobrescrever
  -- nada — a equipe trata pelo caminho interno.
  if exists (
    select 1 from curadoria.crm_contacts c
    where c.converted_at is not null
      and (
        (email_norm is not null and c.email_normalized = email_norm)
        or (telefone_norm is not null and c.phone_normalized = telefone_norm)
      )
  ) then
    return true;
  end if;

  insert into curadoria.crm_contacts (
    full_name, email, email_normalized, phone, phone_normalized,
    source, source_detail, pipeline_stage, assigned_to,
    consent_status, consent_recorded_at, janela_publica_24h, preferred_channel
  )
  values (
    nome_limpo,
    nullif(trim(coalesce(_email, '')), ''), email_norm,
    nullif(trim(coalesce(_telefone, '')), ''), telefone_norm,
    'porta_publica',
    'solicitar-atendimento' || case when _para_outra_pessoa then ' · para outra pessoa' else ' · para mim' end
      || ' · consentimento ' || versao_limpa,
    'new_contact',
    null,                                   -- ⛔ nasce SEM responsável
    'concedido',
    now(),
    hoje,
    case when email_norm is not null then 'email' else 'telefone' end
  )
  on conflict do nothing;                   -- a janela decide; a corrida não

  return true;
end;
$$;

comment on function curadoria.solicitar_atendimento_publico(text, text, text, boolean, text) is
  'OPS-R3A1: única porta pública para crm_contacts. Assinatura fechada — sem estado, dono, paciente ou Case vindos do cliente. Devolve sempre true: a resposta é indistinguível por desenho.';

-- ---------------------------------------------------------------------------
-- 4 · Privilégio mínimo
-- ---------------------------------------------------------------------------
--
-- `CREATE FUNCTION` concede EXECUTE a PUBLIC por padrão. Revogar primeiro e
-- conceder depois é o que torna o grant uma delimitação, e não um acréscimo —
-- lição da migration 20260803170000.

revoke execute on function curadoria.solicitar_atendimento_publico(text, text, text, boolean, text) from public;
revoke execute on function curadoria.normalizar_email_publico(text) from public;
revoke execute on function curadoria.normalizar_telefone_publico(text) from public;

grant execute on function curadoria.solicitar_atendimento_publico(text, text, text, boolean, text) to anon, authenticated;
