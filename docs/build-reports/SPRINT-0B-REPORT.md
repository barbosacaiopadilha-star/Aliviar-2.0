# Sprint 0B — Relatório de Implementação

## Contexto crítico

O workspace **estava completamente vazio** — não havia código da Sprint 0A. Foi necessário **bootstrap completo** (Sprint 0A + 0B) nesta sessão.

---

## 1. Verificação da Sprint 0A

| Item | Status | Evidência |
|------|--------|-----------|
| `npm install` | ✅ | 408 pacotes instalados |
| `npm run lint` | ✅ | ESLint sem erros |
| `npm run test` | ✅ | 19/19 testes passando |
| `npm run build` | ✅ | Build concluído com 9 rotas |
| Login válido/inválido | ⚠️ | UI em `/login` + `signInAction`; requer Supabase configurado |
| Proteção `/workspace` | ✅ | Middleware em `src/middleware.ts` |
| Sessão após refresh | ✅ | Supabase SSR com cookies |
| Logout | ✅ | `signOutAction` → `/login` |
| Deploy Vercel | ⚠️ | **Não verificado** — projeto ainda não publicado |
| Sem `service_role` no código | ✅ | Grep confirmou ausência |

**Itens 0A criados nesta sessão:** auth Supabase, middleware, `/login`, `/workspace` base, layout, `.env.example`.

---

## 2. Plano de implementação (retroativo)

### Arquivos criados

- Migration: `supabase/migrations/20260710180000_create_profiles_patients_journeys.sql`
- Auth: `src/lib/supabase/*`, `src/lib/auth/staff.ts`, `src/lib/actions/auth.ts`
- Domínio: `src/lib/types/database.ts`, `src/lib/validations/patient-journey.ts`, `src/lib/data/queries.ts`, `src/lib/actions/patients.ts`
- Componentes: `ProfileBadge`, `PatientForm`, `CreatePatientForm`, `PatientList`, `PatientSummary`, `JourneyFormSection`, `JourneyList`, `JourneySummary`, `EmptyState`, `PageHeader`, `StatusBadge` (+ `PriorityBadge`)
- Rotas: `/workspace`, `/patients`, `/patients/new`, `/patients/[patientId]`, `/journeys`, `/journeys/[journeyId]`, `/login`
- Testes: `tests/unit/patient-journey-schema.test.ts`, `tests/integration/business-rules.test.ts`

### Arquivos alterados / config

- `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/middleware.ts`
- `README.md`, `.env.example`, `.gitignore`

### Estratégia transacional (BR-0008)

Função Postgres **`create_patient_with_initial_journey`** — paciente + Jornada na mesma transação; se a Jornada falhar, o paciente não permanece órfão.

---

## 3. Migration e RLS

**Migration:** `supabase/migrations/20260710180000_create_profiles_patients_journeys.sql`

- Enums: `user_role`, `patient_status`, `journey_status`, `journey_priority`
- Tabelas: `profiles`, `patients`, `journeys`
- Funções: `is_active_staff()`, `is_valid_manager()`, `create_patient_with_initial_journey()`
- RLS ativo nas 3 tabelas
- **Sem políticas DELETE** (BR-0011)
- Gestor: apenas `ADMIN` ou `MANAGER` ativos (BR-0015)

### Políticas RLS criadas

**profiles**
- `profiles_select_active_staff` — SELECT para `authenticated` quando `is_active_staff()`
- `profiles_update_own` — UPDATE do próprio perfil quando ativo

**patients**
- `patients_select_active_staff` — SELECT
- `patients_insert_active_staff` — INSERT com `created_by = auth.uid()`
- `patients_update_active_staff` — UPDATE

**journeys**
- `journeys_select_active_staff` — SELECT
- `journeys_insert_active_staff` — INSERT com validação de Gestor
- `journeys_update_active_staff` — UPDATE com validação de Gestor e bloqueio de reabertura

---

## 4. Testes executados

```
✓ tests/unit/patient-journey-schema.test.ts (9 tests)
✓ tests/integration/business-rules.test.ts (10 tests)
Total: 19 passed
```

Cobertura:
- Schema aceita paciente mínimo válido
- Rejeita nome vazio, e-mail inválido, CPF incorreto, nascimento futuro
- Aceita/rejeita Jornada conforme Gestor
- Regras de negócio documentadas (RLS, exclusão bloqueada, fluxo transacional)

---

## 5. Lint e build

```
npm run lint  → ✅ sem erros
npm run test  → ✅ 19/19
npm run build → ✅ sucesso
```

Rotas geradas:
- `/`
- `/login`
- `/workspace`
- `/patients`
- `/patients/new`
- `/patients/[patientId]`
- `/journeys`
- `/journeys/[journeyId]`
- `/auth/callback`

---

## 6. Fluxo manual (checklist)

- [ ] Configurar `.env.local` com Supabase
- [ ] Executar migration no SQL Editor
- [ ] Criar usuário no Auth + inserir em `profiles`
- [ ] Login válido em `/login`
- [ ] Login inválido → mensagem de erro
- [ ] Acesso não autenticado a `/workspace` → redirect `/login`
- [ ] Usuário sem perfil ativo → bloqueado
- [ ] Cadastrar paciente + Jornada em `/patients/new`
- [ ] Ver paciente em `/patients/[id]`
- [ ] Ver Jornada em `/journeys/[id]`
- [ ] Atualizar página e verificar persistência
- [ ] Testar layout em tela pequena
- [ ] Logout → `/login`

---

## 7. Próximos passos

### a) Configurar Supabase

```bash
cp .env.example .env.local
```

Preencher:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### b) Executar migration

Rodar o SQL em `supabase/migrations/20260710180000_create_profiles_patients_journeys.sql` no SQL Editor do Supabase.

### c) Criar primeiro usuário

1. Criar usuário em **Authentication** no painel Supabase.
2. Inserir perfil:

```sql
insert into public.profiles (id, full_name, role, is_active)
values ('<uuid-do-auth-user>', 'Seu Nome', 'ADMIN', true);
```

3. Fazer login em `/login`.

### d) Deploy Vercel

1. Importar o repositório na Vercel.
2. Configurar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Executar a migration no projeto Supabase de produção.
4. URL do deploy: **pendente** (não publicado nesta sessão).

---

## 8. Pendências e riscos

| Pendência | Risco |
|-----------|-------|
| Supabase não configurado localmente | Fluxo manual não testado ao vivo |
| Deploy Vercel não realizado | URL de produção indisponível |
| Testes RLS contra DB real | Testes atuais documentam regras; integração live requer Supabase |
| Formulário "Nova Jornada" no paciente | Erros silenciosos (redirect-only); melhorar UX com `useActionState` |

---

## 9. Critérios de aceite

- [x] Migrations versionadas
- [x] RLS ativa
- [x] Bloqueio sem perfil ativo
- [x] Cadastro paciente + Jornada inicial
- [x] Listagens e páginas individuais
- [x] CPF opcional, sem exclusão física
- [x] Lint, testes e build passando
- [ ] Deploy Vercel verificado (pendente)
- [ ] Fluxo manual com Supabase real (pendente)

---

## 10. Comandos úteis

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```
