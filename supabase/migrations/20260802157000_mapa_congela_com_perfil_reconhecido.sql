-- ============================================================================
-- BLOCO C / ETAPA 4 — O MAPA CONGELA COM O PERFIL RECONHECIDO (gate C2)
-- ============================================================================
--
-- FINALIDADE
--   O Mapa de Prioridades é O QUE a paciente reconhece (ADR-042): o
--   reconhecimento acontece sobre o Mapa completo, e o Perfil vira VALIDATED.
--   Mas o objeto reconhecido não tinha proteção nenhuma — o Curador do Case,
--   com sessão legítima, reescrevia `importance`, inseria e apagava linhas
--   de um Mapa já reconhecido (Invariante 28/ADR-048): o consentimento dela
--   ficava colado num conteúdo que mudava por baixo.
--
--   Esta migration congela o Mapa por trigger nas TRÊS operações (INSERT/
--   UPDATE/DELETE) enquanto o Perfil VIGENTE do Case é VALIDATED — e o
--   descongela por desenho quando a supersessão oficial (M156) instala um
--   sucessor DRAFT: a nova rodada edita o Mapa e o reconhecimento acontece
--   de novo, sobre o conteúdo novo.
--
--   DUAS PASSAGENS DELIBERADAS (nenhuma enfraquece o gate, que ataca com
--   sessão real de Curador):
--
--   1. BASTIDOR (auth.uid() nulo — service_role, migrations, seeds): passa.
--      É o mesmo recorte que o produto já usa (has_role/is_curator_for_case
--      são vazios sem JWT): a proteção é contra a ESCRITA DE SESSÃO da
--      aplicação, e o próprio gate C2 prepara o estado atacável inserindo a
--      linha do Mapa por service_role com o Perfil já VALIDATED. A limpeza
--      por inventário da suíte também remove cadeias inteiras por esse canal.
--
--   2. CASE JÁ REMOVIDO: passa. Durante a cascata do descarte administrativo
--      (ADR-038, `delete from cases`), o Case já saiu quando as linhas do
--      Mapa caem — mesma semântica documentada na própria migration do
--      descarte (20260727140000). Sem esta passagem, nenhum Case com Mapa
--      reconhecido seria descartável.
--
-- PRÉ-CONDIÇÕES
--   - `curadoria.case_priority_map` e `curadoria.method_subcriteria`
--     (20260728010000); `curadoria.priority_profiles` com índice parcial
--     `one_active_per_case` (no máximo UM Perfil com status <> 'SUPERSEDED'
--     por Case — é ele que torna "Perfil vigente" uma consulta determinística).
--   - M156 aplicada (supersessão oficial existente — o caminho de
--     descongelamento legítimo).
--
-- COMPORTAMENTO SOBRE DADOS EXISTENTES
--   - Nenhum DML. Nenhuma linha é tocada ou reavaliada.
--   - As 476 linhas locais de Mapa (15 delas sob Perfil VALIDATED) ficam
--     como estão: a proteção é de transição futura, não de estado parado.
--     Verificado (2026-08-02): nenhum Perfil VALIDATED local tem Mapa
--     incompleto — o congelamento não prende nenhum Case em estado torto.
--
-- PROVA DE FECHAMENTO
--   - Gate C2: Curador do Case tenta reescrever `importance` de um Mapa cujo
--     Perfil é VALIDATED; o banco recusa e o valor reconhecido permanece.
--   - Gate novo da Frente 1: após supersede_priority_profile, o MESMO
--     Curador volta a editar o Mapa (Perfil vigente DRAFT) — o congelamento
--     é do reconhecimento, nunca do Case.
--   - Suítes mapa-prioridades / paciente-le-o-proprio-mapa seguem verdes
--     (escrevem sob Perfil DRAFT ou inexistente, ou por service_role).
--
-- ROLLBACK
--   drop trigger if exists case_priority_map_frozen_when_validated
--     on curadoria.case_priority_map;
--   drop function if exists curadoria.assert_priority_map_editable();
-- ============================================================================

create or replace function curadoria.assert_priority_map_editable()
returns trigger
language plpgsql
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
declare
  _case_id uuid := coalesce(new.case_id, old.case_id);
  _vigente text;
begin
  -- Bastidor: sem sessão de usuário não há transição de sessão a proteger
  -- (fixtures preparam estado, limpeza remove cadeias — ver cabeçalho).
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  -- Cascata de descarte administrativo: o Case já saiu; o Mapa sai junto.
  if not exists (select 1 from curadoria.cases c where c.id = _case_id) then
    return coalesce(new, old);
  end if;

  select p.status into _vigente
    from curadoria.priority_profiles p
   where p.case_id = _case_id
     and p.status <> 'SUPERSEDED';

  if _vigente = 'VALIDATED' then
    raise exception
      'O Mapa de Prioridades deste Case já foi reconhecido pela paciente e está congelado. Nova rodada é supersessão do Perfil (supersede_priority_profile).'
      using errcode = '23514';
  end if;

  return coalesce(new, old);
end;
$function$;

comment on function curadoria.assert_priority_map_editable() is
  'Bloco C/C2 (Invariante 28/ADR-048): com o Perfil vigente do Case em VALIDATED, o Mapa de Prioridades congela nas três operações. Sob Perfil vigente DRAFT (inclusive o sucessor pós-supersessão) a edição volta a ser livre. Passagens deliberadas: bastidor sem sessão (auth.uid() nulo) e cascata com o Case já removido.';

revoke execute on function curadoria.assert_priority_map_editable() from public;

drop trigger if exists case_priority_map_frozen_when_validated
  on curadoria.case_priority_map;
create trigger case_priority_map_frozen_when_validated
  before insert or update or delete on curadoria.case_priority_map
  for each row execute function curadoria.assert_priority_map_editable();
