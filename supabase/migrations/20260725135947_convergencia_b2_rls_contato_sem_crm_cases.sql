-- DOMAIN CONVERGENCE — B2, parte 2: can_access_crm_contact() deixa de
-- depender de crm_cases. É o ponto único de estrangulamento: contatos,
-- tarefas, agendamentos e interações gateiam por esta função (B0).
--
-- DEFINIÇÃO ANTERIOR (guardada conforme exigido; ativa até este momento):
--   admin
--   OR (concierge AND (assigned_to null OR assigned_to = uid))
--   OR (curador AND EXISTS crm_cases k WHERE k.contact_id = c.id
--        AND k.responsible_curator_id = uid
--        AND k.pipeline_stage IN ('sent_to_curator','curation_in_progress',
--            'report_ready','report_delivered','doctor_selected',
--            'scheduling_support','completed'))
--   (+ atendente adicionado em crm_lead_qualificacao_e_conversao)
--
-- NOVO GRAFO DE AUTORIZAÇÃO (somente relações canônicas):
--   administrador  → qualquer contato
--   atendente      → contato sem dono OU atribuído a ele (o lead é o trabalho dele)
--   concierge      → idem (acompanha depois; mesa de contatos compartilhada)
--   curador_medico → SOMENTE se existir Case canônico do paciente originado
--                    deste contato sob a responsabilidade dele (responsible_id
--                    OU assigned_curator_id — o vínculo histórico das
--                    pré-Correção). Sem Case, o Curador não vê lead: ele
--                    recebe o Case pronto, nunca a fila de aquisição.
--   demais papéis  → nada.

create or replace function curadoria.can_access_crm_contact(_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'curadoria', 'pg_temp'
as $function$
  select exists (
    select 1
    from curadoria.crm_contacts c
    where c.id = _contact_id
      and (
        curadoria.has_role('administrador')
        or (curadoria.has_role('atendente') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (curadoria.has_role('concierge') and (c.assigned_to is null or c.assigned_to = auth.uid()))
        or (
          curadoria.has_role('curador_medico')
          and c.patient_profile_id is not null
          and exists (
            select 1
            from curadoria.cases k
            where k.patient_profile_id = c.patient_profile_id
              and (k.responsible_id = auth.uid() or k.assigned_curator_id = auth.uid())
          )
        )
      )
  );
$function$;

comment on function curadoria.can_access_crm_contact(uuid) is
  'Acesso ao contato do CRM por relações canônicas — nunca via crm_cases (convergência 2026-07-25). Curador só alcança o contato através do Case real do paciente sob sua responsabilidade.';
