-- TASK-003: estrutura mínima de preferências por pessoa. Nenhuma preferência
-- concreta foi definida pelo produto ainda — usa-se um jsonb genérico para
-- não exigir migration a cada nova preferência futura (evita migração
-- estrutural por causa de uma configuração de UI ainda não decidida).

create table public.user_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_settings is 'Preferências por pessoa (1:1 com profiles). Estrutura mínima proposital: chaves concretas de preferência ainda não foram decididas pelo produto.';

create trigger set_user_settings_updated_at
  before update on public.user_settings
  for each row
  execute function public.set_updated_at();
