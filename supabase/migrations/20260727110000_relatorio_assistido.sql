-- RELATÓRIO ASSISTIDO — estados, autoria e congelamento
--
-- O rascunho assistido transforma conclusões já registradas em texto
-- organizado. Para isso ser seguro, o banco precisa garantir três coisas que
-- antes eram só convenção:
--
-- 1. EMITIR EXIGE APROVAÇÃO. Um rascunho montado pelo sistema nunca vira
--    documento emitido sem que um Curador tenha assumido a autoria da versão
--    final, com nome e hora. Antes, emitir era um UPDATE sem pré-condição.
--
-- 2. EMITIDO É CONGELADO. O conteúdo de um Relatório emitido não muda mais —
--    nem por edição, nem por regeneração, nem por script. Entrega
--    (delivered_at) continua possível; conteúdo, não.
--
-- 3. A ORIGEM FICA REGISTRADA. Rascunho assistido carrega quando foi gerado e
--    por qual versão do gerador; edição humana carrega quem e quando. A
--    distinção entre "o sistema montou" e "o Curador escreveu" nunca se perde.

alter table curadoria.curadoria_reports
  add column assisted_generated_at timestamptz,
  add column generator_version text,
  add column draft_version integer not null default 1,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references curadoria.profiles (id),
  add column approved_at timestamptz,
  add column approved_by uuid references curadoria.profiles (id);

comment on column curadoria.curadoria_reports.assisted_generated_at is
  'Quando o rascunho assistido foi gerado. Null = o Relatorio nasceu inteiramente humano.';
comment on column curadoria.curadoria_reports.approved_at is
  'Quando o Curador assumiu a autoria da versao final. Emitir sem isto e impossivel (trigger).';

create function curadoria.assert_report_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
begin
  -- Emitir exige aprovação prévia, com autor.
  if new.emitted_at is not null and old.emitted_at is null then
    if new.approved_at is null or new.approved_by is null then
      raise exception
        'Emitir exige aprovacao previa do Curador — um rascunho nao vira documento sem autoria humana.'
        using errcode = 'check_violation';
    end if;
  end if;

  -- Depois de emitido, o conteúdo congela. Entrega e carimbo de emissão da
  -- entrega continuam possíveis; texto e autoria, não.
  if old.emitted_at is not null then
    if new.composition_rationale is distinct from old.composition_rationale
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.assisted_generated_at is distinct from old.assisted_generated_at
       or new.draft_version is distinct from old.draft_version then
      raise exception
        'Relatorio emitido e um documento congelado. Alteracao posterior exige novo documento.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function curadoria.assert_report_lifecycle() from public;

create trigger assert_report_lifecycle
  before update on curadoria.curadoria_reports
  for each row execute function curadoria.assert_report_lifecycle();

-- As opções congelam junto com o Relatório.
create function curadoria.assert_report_options_frozen()
returns trigger
language plpgsql
security definer
set search_path = curadoria, pg_catalog
as $$
declare emitted timestamptz;
begin
  select r.emitted_at into emitted
    from curadoria.curadoria_reports r
   where r.id = coalesce(new.report_id, old.report_id);

  if emitted is not null then
    raise exception
      'Relatorio emitido e um documento congelado — as opcoes nao mudam mais.'
      using errcode = 'check_violation';
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function curadoria.assert_report_options_frozen() from public;

create trigger assert_report_options_frozen
  before insert or update or delete on curadoria.curadoria_report_options
  for each row execute function curadoria.assert_report_options_frozen();
