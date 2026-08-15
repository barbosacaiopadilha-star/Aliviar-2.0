-- ---------------------------------------------------------------------------
-- OPS-G5 · CORTE 7 (remediação final) — a autoria vem da sessão, não do payload
-- ---------------------------------------------------------------------------
--
-- O Verificador registrou: o trigger exigia autoria NÃO NULA, mas não a
-- conferia contra a sessão — um writer futuro poderia gravar o UUID de
-- terceiro. Esta migration fecha isso sem tocar em grants, policies ou RLS:
--
--   · sessão autenticada  → `ciclo_alterado_por` e `updated_by` := auth.uid(),
--     e o que o cliente mandou nesses campos é DESCARTADO;
--   · service_role        → exige o ator técnico em `curadoria.actor_id`
--     (mesma transação), valida o UUID e a existência do perfil, e audita
--     `ator_tecnico: true`;
--   · papéis de banco (postgres, migrations, provas por psql) → seguem
--     obrigados a declarar o autor, como sempre — nada muda para eles.
--
-- A GUC é lida SOMENTE quando o papel efetivo é `service_role`: uma sessão
-- autenticada que a defina não ganha nada, porque o ramo dela nem a consulta.
-- Todas as funções seguem SECURITY INVOKER. O relógio segue o contrato
-- monotônico já aprovado. ⛔ Nenhuma das quatro migrations anteriores é editada.

create or replace function curadoria.assert_ciclo_do_profissional()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  permitidos curadoria.motivo_do_ciclo[];
  conexoes_ativas integer;
  classificando_legado boolean;
  mudou_ciclo boolean;
  v_uid uuid;
  v_role text;
  v_ator_txt text;
  v_ator uuid;
begin
  mudou_ciclo := new.ciclo_de_vida is distinct from old.ciclo_de_vida;

  -- Os campos antigos são ESPELHO. Quem quiser mudá-los muda o ciclo.
  if not mudou_ciclo then
    if new.status is distinct from old.status
       or new.publication_status is distinct from old.publication_status then
      raise exception 'Publicar e despublicar são mudanças de ciclo. Use a transição do ciclo de vida — `status` e `publication_status` apenas a espelham.'
        using errcode = 'check_violation';
    end if;
    return new;
  end if;

  classificando_legado := old.ciclo_de_vida is null;

  if classificando_legado then
    if new.ciclo_motivo is distinct from 'CLASSIFICACAO_DE_LEGADO' then
      raise exception 'Este cadastro é legado sem ciclo classificado. A classificação é ato próprio, com o motivo CLASSIFICACAO_DE_LEGADO, autoria e justificativa.'
        using errcode = 'check_violation';
    end if;
    if new.ciclo_nota is null or char_length(btrim(new.ciclo_nota)) < 10 then
      raise exception 'A classificação de legado exige justificativa escrita — pelo menos 10 caracteres.'
        using errcode = 'check_violation';
    end if;
    if char_length(btrim(new.ciclo_nota)) > 280 then
      raise exception 'A justificativa da classificação tem no máximo 280 caracteres.'
        using errcode = 'check_violation';
    end if;
  else
    if new.ciclo_motivo = 'CLASSIFICACAO_DE_LEGADO' then
      raise exception 'Este cadastro já tem ciclo classificado. Use a transição correspondente, com o motivo dela.'
        using errcode = 'check_violation';
    end if;
  end if;

  if new.ciclo_de_vida is null then
    raise exception 'O ciclo de vida não volta a ser indefinido.'
      using errcode = 'check_violation';
  end if;

  -- Só a demonstração é barrada no ESTADO (o CHECK que a proíbe publicada já
  -- existia). A fixture pode ocupar o estado — a certificação depende disso —,
  -- mas elegível ela nunca é: quem responde é `elegibilidade_do_profissional`.
  if new.ciclo_de_vida = 'PUBLICADO_ATIVO' and new.is_demo then
    raise exception 'Perfil de demonstração não entra na Rede como publicado.'
      using errcode = 'check_violation';
  end if;

  if not classificando_legado then
    permitidos := curadoria.motivos_da_transicao(old.ciclo_de_vida, new.ciclo_de_vida);

    if array_length(permitidos, 1) is null then
      raise exception 'Transição de ciclo não permitida: % para %.', old.ciclo_de_vida, new.ciclo_de_vida
        using errcode = 'check_violation';
    end if;

    if new.ciclo_motivo is null then
      raise exception 'Toda mudança de ciclo exige um motivo.'
        using errcode = 'check_violation';
    end if;

    if not (new.ciclo_motivo = any (permitidos)) then
      raise exception 'O motivo % não vale para a transição de % para %.', new.ciclo_motivo, old.ciclo_de_vida, new.ciclo_de_vida
        using errcode = 'check_violation';
    end if;

    if new.ciclo_motivo = 'OUTRO' then
      if new.ciclo_nota is null or char_length(btrim(new.ciclo_nota)) < 10 then
        raise exception 'Quando o motivo é OUTRO, escreva o que aconteceu — pelo menos 10 caracteres.'
          using errcode = 'check_violation';
      end if;
      if char_length(btrim(new.ciclo_nota)) > 280 then
        raise exception 'A nota do motivo tem no máximo 280 caracteres.'
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  -- A AUTORIA VEM DA SESSÃO.
  --
  -- A ordem dos ramos é a segurança: o autenticado é resolvido ANTES de
  -- qualquer leitura da GUC, então defini-la não lhe serve de nada.
  v_uid := auth.uid();
  v_role := auth.role();

  if v_uid is not null then
    -- O que o cliente mandou em `ciclo_alterado_por`/`updated_by` é descartado.
    new.ciclo_alterado_por := v_uid;
    new.updated_by := v_uid;
  elsif v_role = 'service_role' then
    -- Serviço nunca é anônimo: o job declara em nome de quem age, na mesma
    -- transação, e a trilha o registra como ator técnico.
    v_ator_txt := nullif(btrim(coalesce(current_setting('curadoria.actor_id', true), '')), '');
    if v_ator_txt is null then
      raise exception 'Transição por serviço exige ator técnico: defina curadoria.actor_id (set_config, mesma transação) com o perfil responsável.'
        using errcode = 'check_violation';
    end if;
    begin
      v_ator := v_ator_txt::uuid;
    exception when others then
      raise exception 'curadoria.actor_id não é um UUID válido.'
        using errcode = 'check_violation';
    end;
    if not exists (select 1 from curadoria.profiles p where p.id = v_ator) then
      raise exception 'curadoria.actor_id não corresponde a nenhum perfil conhecido.'
        using errcode = 'check_violation';
    end if;
    new.ciclo_alterado_por := v_ator;
    new.updated_by := v_ator;
  end if;
  -- Papéis de banco (postgres, migrations, provas): caem na exigência abaixo,
  -- que sempre existiu — o autor é declarado explicitamente ou o ato não passa.

  if new.ciclo_alterado_por is null then
    raise exception 'Toda mudança de ciclo tem autor.'
      using errcode = 'check_violation';
  end if;

  -- O instante é do banco, estritamente crescente, com NULL sem piso.
  new.ciclo_alterado_em := greatest(
    clock_timestamp(),
    coalesce(old.ciclo_alterado_em + interval '1 microsecond', clock_timestamp())
  );

  -- GUARDA 11 (D5) · Connection ativa recusa a retirada; a pausa nunca.
  if new.ciclo_de_vida = 'RETIRADO_ARQUIVADO' then
    select count(*) into conexoes_ativas
      from curadoria.connection_records c
     where c.professional_profile_id = new.id
       and c.status <> 'ENCERRADO_SEM_RELACIONAMENTO';

    if conexoes_ativas > 0 then
      raise exception 'Este profissional tem acompanhamento em curso. Encerre ou substitua antes de retirar da rede.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- ESPELHO ATÔMICO.
  new.status := case new.ciclo_de_vida
    when 'PREPARACAO' then 'ativo'
    when 'PUBLICADO_ATIVO' then 'ativo'
    else 'inativo'
  end;

  new.publication_status := case new.ciclo_de_vida
    when 'PUBLICADO_ATIVO' then 'publicado'
    else 'nao_publicado'
  end;

  return new;
end;
$$;

-- A trilha registra quando o ato veio de um ator técnico.
create or replace function curadoria.registrar_trilha_do_ciclo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.ciclo_de_vida is not distinct from old.ciclo_de_vida then
    return null;
  end if;

  insert into curadoria.audit_logs (actor_id, action, target_profile_id, metadata)
  values (
    new.ciclo_alterado_por,
    case
      when old.ciclo_de_vida is null then 'professional_ciclo_classificacao_de_legado'
      else 'professional_ciclo_' || lower(new.ciclo_de_vida::text)
    end::curadoria.audit_action,
    new.profile_id,
    jsonb_build_object(
      'professional_profile_id', new.id,
      'de', old.ciclo_de_vida,
      'para', new.ciclo_de_vida,
      'motivo', new.ciclo_motivo,
      'nota', new.ciclo_nota,
      'em', new.ciclo_alterado_em,
      'status', new.status,
      'publication_status', new.publication_status,
      -- Ator técnico: serviço agindo em nome de um perfil declarado. Nunca
      -- anônimo — o `actor_id` da linha é o perfil declarado na GUC.
      'ator_tecnico', (auth.uid() is null and auth.role() = 'service_role')
    )
  );

  return null;
end;
$$;

revoke execute on function curadoria.registrar_trilha_do_ciclo() from public;

-- ---------------------------------------------------------------------------
-- A porta do serviço — GUC e transição na MESMA transação
-- ---------------------------------------------------------------------------
--
-- PostgREST fecha a transação a cada chamada, então um `set_config` avulso não
-- sobrevive até o UPDATE seguinte. Esta função faz as duas coisas juntas, e é
-- por ela que jobs e fixtures de serviço transitam. SECURITY INVOKER: roda com
-- os privilégios que `service_role` já tem — nenhuma escada de privilégio.
--
-- Grant: objeto NOVO desta migration (nenhum grant existente é alterado).
-- ⛔ `authenticated` e `anon` ficam de fora: quem tem sessão usa a sessão.

create or replace function curadoria.transicionar_ciclo_como_servico(
  p_profissional uuid,
  p_para curadoria.ciclo_do_profissional,
  p_motivo curadoria.motivo_do_ciclo,
  p_ator uuid,
  p_nota text default null,
  p_quando timestamptz default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform set_config('curadoria.actor_id', coalesce(p_ator::text, ''), true);
  update curadoria.professional_profiles
     set ciclo_de_vida = p_para,
         ciclo_motivo = p_motivo,
         ciclo_nota = p_nota,
         -- O carimbo do chamador entra só para PROVAR que é ignorado: o
         -- trigger o sobrescreve com o relógio do banco.
         ciclo_alterado_em = p_quando
   where id = p_profissional;

  if not found then
    raise exception 'Profissional % não encontrado.', p_profissional
      using errcode = 'no_data_found';
  end if;
end;
$$;

revoke execute on function curadoria.transicionar_ciclo_como_servico(
  uuid, curadoria.ciclo_do_profissional, curadoria.motivo_do_ciclo, uuid, text, timestamptz
) from public;

grant execute on function curadoria.transicionar_ciclo_como_servico(
  uuid, curadoria.ciclo_do_profissional, curadoria.motivo_do_ciclo, uuid, text, timestamptz
) to service_role;

comment on function curadoria.transicionar_ciclo_como_servico is
  'OPS-G5 C7R: transição de ciclo para service_role — declara o ator técnico (curadoria.actor_id) e transita na mesma transação. O trigger valida tudo; isto só junta as duas instruções.';
