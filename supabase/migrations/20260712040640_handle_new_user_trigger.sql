-- TASK-003: cria profile + configurações padrão automaticamente quando uma
-- conta é criada em auth.users. Não atribui nenhum papel — a escolha de
-- papel (paciente/profissional) é decisão do fluxo de cadastro, que ainda
-- não existe (fica para a tarefa de autenticação, Fase 2 do plano de
-- engenharia). Nunca duplica usuários: profiles.id é sempre auth.users.id.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.user_settings (profile_id)
  values (new.id);

  return new;
end;
$$;

comment on function public.handle_new_user() is 'Espelha toda nova conta de auth.users em public.profiles + public.user_settings. Não atribui papel (isso é decisão do fluxo de cadastro).';

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
