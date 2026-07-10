# GATE-001 — Relatório de Validação e Publicação (Sprint 0B)

**Data:** 10/07/2026  
**Status:** Parcialmente concluído — pendências dependem do proprietário

---

## 1. Caminho do projeto utilizado

```
C:\Users\barbo\Downloads\Aliviar Cursor
```

Mesmo projeto local mantido. Nenhum `create-next-app`, pasta nova ou reinicialização.

---

## 2. Branch utilizada

```
main
```

Repositório Git inicializado nesta sessão (`git init` + `git branch -M main`).

---

## 3. Remote Git configurado

```
(nenhum)
```

`git remote -v` retornou vazio. Push **não executado** — aguardando URL oficial do repositório `aliviar-app`.

---

## 4. Commit criado

```
(não criado)
```

**Motivo:** Git exige identidade do autor e a política do projeto proíbe alterar `git config`.

Mensagem exibida:
```
Author identity unknown — Please tell me who you are.
```

**Arquivos já staged** com `git add .` (prontos para commit).

### Comandos para o proprietário executar localmente

```powershell
cd "C:\Users\barbo\Downloads\Aliviar Cursor"

# Configure sua identidade (uma vez)
git config user.email "seu@email.com"
git config user.name "Seu Nome"

git commit -m "feat(core): adiciona autenticação, pacientes e jornadas"
git status
git log -1 --oneline
```

### Conectar ao GitHub oficial

```powershell
git remote add origin https://github.com/<ORG_OU_USUARIO>/aliviar-app.git
git push -u origin main
```

Se `origin` já existir, verifique com `git remote -v` antes de substituir.

---

## 5. Resultado de lint

```
npm run lint → ✅ sem erros
```

---

## 6. Resultado dos testes

```
npm run test → ✅ 66 passando | 6 skipped (integração Supabase)
```

Os 6 skipped são testes RLS que exigem Supabase real configurado.

---

## 7. Resultado do build

```
npm run build → ✅ sucesso
Next.js 16.2.10 (Turbopack)
9 rotas geradas
```

Após migração `middleware.ts` → `proxy.ts`, o aviso de depreciação **não aparece mais**.

---

## 8. Variáveis de ambiente necessárias

### Produção e local (`.env.local`)

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

### Nomes padronizados no código

| Variável | Usada em |
|----------|----------|
| `NEXT_PUBLIC_SITE_URL` | Documentação |
| `NEXT_PUBLIC_SUPABASE_URL` | `client.ts`, `server.ts`, `middleware.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `client.ts`, `server.ts`, `middleware.ts` |

**Não existe** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no código.  
**Não incluir** `SUPABASE_SERVICE_ROLE_KEY` no frontend nem em variáveis `NEXT_PUBLIC_*`.

### Vercel (mesmas 3 variáveis)

```
NEXT_PUBLIC_SITE_URL=https://<seu-dominio>.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
```

### Criar `.env.local`

```powershell
cd "C:\Users\barbo\Downloads\Aliviar Cursor"
copy .env.example .env.local
# Edite .env.local com os valores reais do Supabase
```

**Status atual:** `.env.local` **não existe** — Supabase ainda não conectado.

---

## 9. Migration

### GATE-001 (mínimo Sprint 0B)

Arquivo: `supabase/migrations/20260710180000_create_profiles_patients_journeys.sql`

Confirma criação de:
- [x] enums (`user_role`, `patient_status`, `journey_status`, `journey_priority`)
- [x] `profiles`, `patients`, `journeys`
- [x] RLS nas 3 tabelas
- [x] `is_active_staff()`
- [x] `is_valid_manager()`
- [x] `create_patient_with_initial_journey()`

### Como aplicar no Supabase oficial

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo completo de `20260710180000_create_profiles_patients_journeys.sql`
4. Execute (**Run**)
5. Confirme no **Table Editor**: `profiles`, `patients`, `journeys`

### Observação importante

O código atual também referencia tabelas das Sprints 1 e 2A. Para a aplicação completa funcionar, aplique **em ordem**:

1. `20260710180000_create_profiles_patients_journeys.sql`
2. `20260710190000_create_journey_events.sql`
3. `20260710200000_create_journey_commitments.sql`

Para validar **somente o escopo 0B** (auth + paciente + Jornada), basta a migration 1 — mas páginas de Timeline/Compromissos falharão até aplicar 2 e 3.

**Status:** Migration **não aplicada** nesta sessão (sem projeto Supabase autenticado).

---

## 10. Primeiro usuário ADMIN

### Passo 1 — Criar usuário no Auth

Supabase Dashboard → **Authentication** → **Users** → **Add user**  
Informe e-mail e senha. Copie o **UUID** gerado.

### Passo 2 — Criar perfil (substitua os placeholders)

```sql
insert into public.profiles (
  id,
  full_name,
  role,
  is_active
)
values (
  '<UUID_DO_AUTH_USER>',
  '<NOME_DO_USUARIO>',
  'ADMIN',
  true
);
```

**Não invente o UUID** — use o valor exato de Authentication → Users.

**Status:** Não validado — depende de Supabase + usuário criado pelo proprietário.

---

## 11. Testes reais de RLS

| Teste | Status |
|-------|--------|
| Login válido | ⏳ Pendente |
| Login inválido | ⏳ Pendente |
| Proteção `/workspace` | ✅ Código (`src/proxy.ts`) |
| Sessão após refresh | ⏳ Pendente |
| Logout | ⏳ Pendente |
| Criar paciente + Jornada | ⏳ Pendente |
| Listar / abrir paciente e Jornada | ⏳ Pendente |
| Usuário sem perfil bloqueado | ⏳ Pendente |
| Perfil inativo bloqueado | ⏳ Pendente |
| Sem exclusão física na interface | ✅ Código (sem DELETE) |

Mocks **não** substituem RLS real — testes de integração skipped sem credenciais.

---

## 12. URL da Vercel

```
(pendente)
```

Deploy **não executado** — requer repositório no GitHub + conta Vercel do proprietário.

### Passos para deploy

1. Push do código para `aliviar-app` (branch `main`)
2. [vercel.com/new](https://vercel.com/new) → Import Git Repository → `aliviar-app`
3. Framework: **Next.js** (detectado automaticamente)
4. Production Branch: **main**
5. Build Command: `npm run build` (padrão)
6. Cadastre as 3 variáveis `NEXT_PUBLIC_*`
7. Deploy → copie a URL gerada
8. Atualize `NEXT_PUBLIC_SITE_URL` na Vercel com a URL final
9. Em Supabase → Authentication → URL Configuration, adicione a URL da Vercel em **Redirect URLs**

---

## 13. Fluxo funcional validado

```
(não validado ao vivo)
```

Checklist manual após Supabase + `.env.local` + migration:

- [ ] `/login` — credenciais válidas → `/workspace`
- [ ] `/login` — credenciais inválidas → erro
- [ ] `/workspace` sem login → redirect `/login`
- [ ] Refresh mantém sessão
- [ ] Logout → `/login`
- [ ] `/patients/new` — cadastro paciente + Jornada
- [ ] `/patients` — listagem
- [ ] `/journeys/[id]` — detalhe da Jornada

---

## 14. Pendências restantes

| # | Pendência | Responsável |
|---|-----------|-------------|
| 1 | Configurar `git config user.email` / `user.name` e commit | Proprietário |
| 2 | Informar URL do repositório `aliviar-app` e `git push` | Proprietário |
| 3 | Criar `.env.local` com Supabase real | Proprietário |
| 4 | Aplicar migration(ões) no SQL Editor | Proprietário |
| 5 | Criar usuário Auth + perfil ADMIN | Proprietário |
| 6 | Testes manuais + RLS real | Proprietário |
| 7 | Deploy Vercel + validação publicada | Proprietário |
| 8 | Autenticar MCP Supabase (opcional, para automação) | Proprietário |

---

## Alterações feitas nesta GATE (sem novas funcionalidades)

| Alteração | Motivo |
|-----------|--------|
| `src/middleware.ts` → `src/proxy.ts` | Convenção Next.js 16 |
| `.gitignore` — `.env.local` e `.env.*.local` explícitos | GATE-001 |
| `.env.example` — apenas vars de produção 0B | Padronização |
| `git init` + branch `main` | Versionamento |

## Lockfiles

| Arquivo | Status |
|---------|--------|
| `package-lock.json` | ✅ Oficial (único na raiz) |
| `yarn.lock` | Apenas dentro de `node_modules/` (dependência transitiva) — **não remover** |
| `pnpm-lock.yaml` | Ausente |
| `bun.lock` / `bun.lockb` | Ausente |

## Segurança

- `service_role`: **ausente** em `src/` e arquivos de config do projeto
- Apenas menção educativa no `README.md`

---

## Critérios de aceite GATE-001

- [x] Mesmo projeto local mantido
- [x] npm como gerenciador
- [x] `package-lock.json` como único lockfile na raiz
- [x] Lint passa
- [x] Testes passam
- [x] Build passa
- [ ] Supabase real conectado
- [ ] Migration aplicada
- [ ] Perfil ADMIN criado
- [ ] Login real funciona
- [ ] Paciente e Jornada criáveis ao vivo
- [ ] RLS validada no banco real
- [ ] Código no GitHub oficial
- [ ] Deploy Vercel funcionando
- [ ] Fluxo publicado testado
- [x] Nenhuma funcionalidade nova criada

**GATE-001 não está concluída** — faltam etapas que dependem de credenciais e ações do proprietário.
