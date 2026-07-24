-- Espelha nova conta de auth.users em curadoria.profiles + user_settings.
-- Resiliente: qualquer falha é engolida para NUNCA abortar o signup — nem o
-- deste produto nem o do produto de jornadas, que compartilham auth.users.
-- Não atribui papel (isso é decisão do fluxo de cadastro do app).
create or replace function curadoria.handle_new_user()
returns trigger language plpgsql security definer set search_path = curadoria as $$
begin
  begin
    insert into curadoria.profiles (id, display_name) values (new.id, new.raw_user_meta_data ->> 'display_name');
    insert into curadoria.user_settings (profile_id) values (new.id);
  exception when others then
    null; -- nunca propaga: o signup (de qualquer produto) jamais é abortado por este espelhamento
  end;
  return new;
end; $$;

create trigger on_auth_user_created_curadoria
  after insert on auth.users
  for each row
  execute function curadoria.handle_new_user();