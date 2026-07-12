-- Seed mínimo de desenvolvimento (TASK-003).
-- Só roda contra o Supabase local — nunca aplicado a um projeto hospedado
-- (ADR-007 em docs/DECISIONS.md).
--
-- Cria 3 contas de teste técnico (uma por papel inicial) só para validar as
-- políticas de RLS desta tarefa. A senha de cada conta é gerada
-- aleatoriamente em tempo de execução, usada apenas para satisfazer o hash
-- exigido pelo schema de auth.users, e descartada imediatamente — nunca é
-- escrita em nenhum arquivo nem exibida. Não existe fluxo de login/cadastro
-- implementado ainda (isso é uma tarefa futura), então essas contas não têm
-- uso funcional de login hoje; servem só para os testes de RLS.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001';
  v_pro_id uuid := '00000000-0000-0000-0000-000000000002';
  v_paciente_id uuid := '00000000-0000-0000-0000-000000000003';
  v_role_admin_id smallint;
  v_role_pro_id smallint;
  v_role_paciente_id smallint;
  v_seed_password text := encode(extensions.gen_random_bytes(18), 'base64');
begin
  select id into v_role_admin_id from public.roles where slug = 'administrador';
  select id into v_role_pro_id from public.roles where slug = 'profissional';
  select id into v_role_paciente_id from public.roles where slug = 'paciente';

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values
    ('00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin.teste@aliviar-conexao.local', extensions.crypt(v_seed_password, extensions.gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Teste"}'),
    ('00000000-0000-0000-0000-000000000000', v_pro_id, 'authenticated', 'authenticated',
      'profissional.teste@aliviar-conexao.local', extensions.crypt(v_seed_password, extensions.gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Profissional Teste"}'),
    ('00000000-0000-0000-0000-000000000000', v_paciente_id, 'authenticated', 'authenticated',
      'paciente.teste@aliviar-conexao.local', extensions.crypt(v_seed_password, extensions.gen_salt('bf')),
      now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Paciente Teste"}');

  -- Os inserts acima disparam public.handle_new_user() (trigger em
  -- auth.users), que já cria profiles + user_settings automaticamente.
  -- Falta só atribuir o papel de cada conta de teste.
  insert into public.user_roles (profile_id, role_id) values
    (v_admin_id, v_role_admin_id),
    (v_pro_id, v_role_pro_id),
    (v_paciente_id, v_role_paciente_id);
end $$;
