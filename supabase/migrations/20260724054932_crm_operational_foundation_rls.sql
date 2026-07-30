alter table curadoria.crm_contacts enable row level security;
alter table curadoria.crm_cases enable row level security;
alter table curadoria.crm_interactions enable row level security;
alter table curadoria.crm_tasks enable row level security;
alter table curadoria.crm_appointments enable row level security;
alter table curadoria.crm_audit_log enable row level security;

grant select, insert, update on curadoria.crm_contacts to authenticated;
grant select, insert, update on curadoria.crm_cases to authenticated;
grant select, insert on curadoria.crm_interactions to authenticated;
grant select, insert, update on curadoria.crm_tasks to authenticated;
grant select, insert, update on curadoria.crm_appointments to authenticated;
grant select, insert on curadoria.crm_audit_log to authenticated;

grant all on
  curadoria.crm_contacts,
  curadoria.crm_cases,
  curadoria.crm_interactions,
  curadoria.crm_tasks,
  curadoria.crm_appointments,
  curadoria.crm_audit_log
to service_role;

create policy crm_contacts_select on curadoria.crm_contacts for select to authenticated using (curadoria.can_access_crm_contact(id));
create policy crm_contacts_insert on curadoria.crm_contacts for insert to authenticated with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));
create policy crm_contacts_update on curadoria.crm_contacts for update to authenticated using (curadoria.can_access_crm_contact(id)) with check (curadoria.can_access_crm_contact(id));

create policy crm_cases_select on curadoria.crm_cases for select to authenticated using (curadoria.has_role('administrador') or (curadoria.has_role('concierge') and (responsible_concierge_id is null or responsible_concierge_id = auth.uid() or exists (select 1 from curadoria.crm_contacts c where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())))) or curadoria.is_curator_for_crm_case(id));
create policy crm_cases_insert on curadoria.crm_cases for insert to authenticated with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));
create policy crm_cases_update on curadoria.crm_cases for update to authenticated using (curadoria.has_role('administrador') or (curadoria.has_role('concierge') and (responsible_concierge_id = auth.uid() or exists (select 1 from curadoria.crm_contacts c where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid()))))) with check (curadoria.has_role('administrador') or (curadoria.has_role('concierge') and (responsible_concierge_id = auth.uid() or exists (select 1 from curadoria.crm_contacts c where c.id = contact_id and (c.assigned_to is null or c.assigned_to = auth.uid())))));

create policy crm_interactions_select on curadoria.crm_interactions for select to authenticated using (curadoria.can_access_crm_contact(contact_id) and (visibility = 'operacional' or (visibility = 'restrita' and curadoria.has_role('administrador')) or (visibility = 'administrativa' and curadoria.has_role('administrador'))));
create policy crm_interactions_insert on curadoria.crm_interactions for insert to authenticated with check (curadoria.can_access_crm_contact(contact_id) and (curadoria.has_role('administrador') or curadoria.has_role('concierge')));

create policy crm_tasks_select on curadoria.crm_tasks for select to authenticated using (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));
create policy crm_tasks_insert on curadoria.crm_tasks for insert to authenticated with check (curadoria.has_role('administrador') or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));
create policy crm_tasks_update on curadoria.crm_tasks for update to authenticated using (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))) with check (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));

create policy crm_appointments_select on curadoria.crm_appointments for select to authenticated using (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));
create policy crm_appointments_insert on curadoria.crm_appointments for insert to authenticated with check (curadoria.has_role('administrador') or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));
create policy crm_appointments_update on curadoria.crm_appointments for update to authenticated using (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id))) with check (curadoria.has_role('administrador') or assigned_to = auth.uid() or (curadoria.has_role('concierge') and curadoria.can_access_crm_contact(contact_id)));

create policy crm_audit_log_select on curadoria.crm_audit_log for select to authenticated using (curadoria.has_role('administrador'));
create policy crm_audit_log_insert on curadoria.crm_audit_log for insert to authenticated with check (curadoria.has_role('administrador') or curadoria.has_role('concierge'));

comment on table curadoria.crm_contacts is 'Contatos operacionais do CRM Aliviar — leads e pessoas em acompanhamento comercial.';
comment on table curadoria.crm_cases is 'Casos operacionais vinculados a contatos — distintos dos casos clínicos de curadoria.';
comment on table curadoria.crm_interactions is 'Histórico de interações operacionais (não clínicas).';
comment on table curadoria.crm_tasks is 'Tarefas e próximas ações do Concierge.';
comment on table curadoria.crm_appointments is 'Agenda operacional — não é prontuário nem agenda médica complexa.';
comment on table curadoria.crm_audit_log is 'Trilha de auditoria do CRM — somente leitura administrativa.';