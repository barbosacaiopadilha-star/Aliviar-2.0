-- FATO DA ENTREGA — separar "houve entrega?" de "posso ler a Curadoria?".
--
-- `hasDeliveredCuradoria` lia `curadoria_reports` e `curated_selections` sob a
-- RLS de quem pergunta. O Concierge responsável não tem policy de leitura
-- nessas tabelas — e por isso um Case entregue chegava ao quadro dele como não
-- entregue, projetando `doctor_selected` em vez de `scheduling_support`.
--
-- Ampliar a RLS daquelas tabelas resolveria a projeção dando ao Concierge
-- acesso ao conteúdo curatorial — critérios, justificativas, as três opções.
-- Ele não precisa disso para acompanhar. Precisa de um booleano.

create function curadoria.case_has_delivered_curadoria(_case_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = curadoria, public
as $$
declare
  _actor uuid := auth.uid();
  _vinculado boolean;
begin
  if _actor is null then
    return false;
  end if;

  -- Vínculo com o Case, derivado do banco — nunca declarado por quem chama.
  -- Sem vínculo a resposta é `false`, igual à de um Case inexistente ou sem
  -- entrega: quem não participa do Case não consegue distinguir os três casos,
  -- e portanto não consegue enumerar Cases sondando esta função.
  select exists (
    select 1 from curadoria.cases c
    where c.id = _case_id
      and (
        c.patient_profile_id = _actor
        or c.responsible_id = _actor
        or c.assigned_curator_id = _actor
        or curadoria.has_role('administrador')
      )
  ) into _vinculado;

  if not _vinculado then
    return false;
  end if;

  -- A regra de entrega válida é a mesma da âncora de Connection — reusada, não
  -- reescrita. `canonical_delivery_matches` já exige Relatório emitido e
  -- entregue, seleção entregue do mesmo Case, autoria humana e exatamente três
  -- opções distintas.
  if exists (
    select 1
    from curadoria.curadoria_reports r
    join curadoria.cases c on c.id = r.case_id
    where r.case_id = _case_id
      and curadoria.canonical_delivery_matches(r.id, _case_id, c.patient_profile_id)
  ) then
    return true;
  end if;

  -- Legado, somente na ausência de entrega canônica. Nunca combinado.
  return exists (
    select 1 from curadoria.final_curadoria_deliveries d
    where d.case_id = _case_id
      and d.delivered_at is not null
      and jsonb_array_length(coalesce(d.provider_presentations, '[]'::jsonb)) = 3
  );
end; $$;

comment on function curadoria.case_has_delivered_curadoria is
  'Responde apenas se o Case possui Curadoria validamente entregue. Nao devolve conteudo, ids nem profissionais. Sem vinculo com o Case responde false, para nao permitir enumeracao.';

grant execute on function curadoria.case_has_delivered_curadoria to authenticated;
