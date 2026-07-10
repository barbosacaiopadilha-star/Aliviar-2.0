# Aliviar OS — Alpha 0.1

Plataforma interna da **Aliviar Curadoria Médica** para colaboradores autorizados acompanharem pacientes e Jornadas de saúde.

Esta release **não está pronta para produção**. É uma base técnica local validada (lint, testes e build), aguardando conexão com Supabase, aplicação de migrations e deploy.

## Requisitos

- Node.js ≥ 20
- npm (gerenciador oficial deste repositório)
- Conta e projeto Supabase (ainda **não configurado** neste ambiente)

## Instalação

```bash
npm install
cp .env.example .env.local
```

Edite `.env.local` com os valores do painel Supabase (**Settings → API**).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SITE_URL` | Sim | URL da aplicação (ex.: `http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon/public do Supabase |

Nunca use `SUPABASE_SERVICE_ROLE_KEY` no navegador nem em variáveis `NEXT_PUBLIC_*`.

## Comandos de qualidade

```bash
npm run lint
npm run test
npm run build
```

## Migrations existentes (aplicar nesta ordem)

1. `supabase/migrations/20260710180000_create_profiles_patients_journeys.sql` — profiles, patients, journeys, RLS, funções base
2. `supabase/migrations/20260710190000_create_journey_events.sql` — Memória da Jornada (timeline)
3. `supabase/migrations/20260710200000_create_journey_commitments.sql` — Compromissos da Jornada

As migrations **ainda não foram aplicadas** em banco real. Execute no **SQL Editor** do Supabase, uma por vez, na ordem acima.

## Início local

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Rotas principais:

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação |
| `/workspace` | Área operacional |
| `/patients` | Lista de pacientes |
| `/patients/new` | Cadastro paciente + primeira Jornada |
| `/patients/[id]` | Detalhe do paciente |
| `/journeys` | Lista de Jornadas |
| `/journeys/[id]` | Detalhe da Jornada |

## Primeiro usuário (após migration 1 e Auth)

1. Crie o usuário em **Supabase → Authentication → Users**.
2. Insira o perfil ADMIN (substitua o UUID pelo do Auth):

```sql
insert into public.profiles (id, full_name, role, is_active)
values ('<UUID_DO_AUTH_USER>', 'Nome Completo', 'ADMIN', true);
```

## Limitações conhecidas (Alpha 0.1)

- **Supabase real não configurado** — `.env.local` deve ser criado pelo operador.
- **Migrations não aplicadas** — o banco ainda não possui as tabelas.
- **Deploy inexistente** — nenhuma URL de produção publicada.
- **6 testes de integração ignorados** — validação RLS real requer credenciais Supabase (`TEST_STAFF_*` nos módulos de teste).
- **Apresentação funcional limitada** — o escopo operacional mínimo validável é: autenticação, cadastro de paciente, criação da primeira Jornada, listagens e abertura de registros.
- **Módulos adicionais no código** — Timeline (`journey-events`) e Compromissos (`journey-commitments`) estão integrados à interface, mas exigem as migrations 2 e 3 para funcionar em runtime; falham silenciosamente ou com erro de banco se apenas a migration 1 for aplicada.
- **Repositório sem remote e sem commit** — versionamento remoto pendente.

## Estado da Alpha 0.1

| Item | Status |
|------|--------|
| Lint / test / build local | Aprovado |
| Git (commit / remote) | Pendente |
| Supabase conectado | Pendente |
| Migrations aplicadas | Pendente |
| Deploy Vercel | Pendente |
| Pronto para produção | **Não** |

Relatórios de build internos: `docs/build-reports/`.
