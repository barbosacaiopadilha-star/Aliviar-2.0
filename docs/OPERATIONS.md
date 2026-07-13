# Guia de Operação e Deploy

Runbook operacional para ativar e manter o ambiente de produção da Aliviar Curadoria Médica (`www.aliviarcuradoriamedica.com.br`). Escrito originalmente na sprint GO LIVE (publicado como Artifact) e materializado aqui para ficar versionado junto do código. Nenhuma etapa aqui é executada por um agente de IA sem autorização explícita e separada do responsável pelo projeto (`docs/AGENTS.md`) — nenhum segredo deve ser colado em chat, sempre cadastrado diretamente no painel do Supabase/Vercel.

## Ordem de execução

1. Criar o projeto Supabase de produção
2. Reunir as variáveis de ambiente (ver `docs/ENVIRONMENT_VARIABLES.md`) — sem enviar valores a um agente
3. Aplicar as migrations
4. Validar migrations e RLS
5. Validar os buckets do Storage
6. Criar o primeiro usuário Administrador
7. Atribuir o papel `administrador`
8. Conectar o repositório à Vercel
9. Configurar as variáveis na Vercel
10. Configurar o domínio
11. Deploy de produção
12. Smoke tests
13. (referência) Plano de rollback

---

## 1. Criação do projeto Supabase de produção

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard).
2. **New project** → escolha a organização, dê um nome (ex.: `aliviar-curadoria-medica-prod`).
3. **Database password**: gere uma senha forte, guarde apenas no seu gerenciador de senhas.
4. **Region**: `South America (São Paulo)`, se disponível.
5. Aguarde o provisionamento.

## 2. Variáveis de ambiente necessárias

Ver `docs/ENVIRONMENT_VARIABLES.md` para o propósito de cada uma. Resumo de onde encontrar cada valor:

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role (**nunca** no navegador) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `ANTHROPIC_MODEL` | Opcional — deixe em branco para usar o padrão |

Todas cadastradas na Vercel (etapa 9), nunca em arquivo versionado.

## 3. Aplicação das migrations

O schema é composto apenas por `CREATE TABLE`, `ALTER TABLE ... ADD COLUMN` e `CREATE POLICY` — nenhuma migration em `supabase/migrations/` contém `DROP TABLE`, `DROP COLUMN` ou `TRUNCATE` (ver `docs/DATABASE.md` para o catálogo completo). Como o banco de produção começa vazio, o risco desta etapa é mínimo.

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF   # o ref aparece na URL do dashboard
npx supabase db push                               # aplica todas as migrations, em ordem
```

## 4. Validação de migrations e RLS

No SQL Editor do Supabase Studio (somente leitura):

```sql
-- Deveria retornar 0 linhas — nenhuma tabela em public sem RLS habilitado.
select relname from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
```

```sql
-- Deveria retornar 0 linhas — nenhuma tabela com RLS habilitado mas sem
-- nenhuma policy (o que bloquearia todo acesso, mesmo do dono).
select t.relname from pg_class t
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public' and t.relkind = 'r' and t.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = t.relname
  );
```

Alternativa visual: **Database → Advisors → Security Advisor** no Supabase Studio.

## 5. Validação dos buckets do Storage

```sql
select id, name, public from storage.buckets;
```

Esperado: `professional-documents` e `patient-documents`, ambos com `public = false`.

## 6. Criação do primeiro Administrador

Não existe cadastro público por desenho do produto (ADR-018) — o primeiro administrador é criado manualmente, uma única vez:

1. Supabase Studio → **Authentication → Users → Add user → Create new user**.
2. E-mail real da pessoa responsável.
3. Marque **Auto Confirm User**.
4. Defina uma senha (o próprio Studio pode gerar) — nunca compartilhada com um agente.

Isso já cria a linha em `profiles` via trigger — falta só o papel.

## 7. Atribuição do papel administrador

```sql
insert into public.user_roles (profile_id, role_id)
select u.id, r.id
from auth.users u
cross join public.roles r
where u.email = 'email-da-pessoa@dominio.com.br'
  and r.slug = 'administrador'
on conflict do nothing;
```

Valide:

```sql
select p.display_name, u.email, r.slug
from public.user_roles ur
join public.profiles p on p.id = ur.profile_id
join auth.users u on u.id = ur.profile_id
join public.roles r on r.id = ur.role_id;
```

## 8. Conexão do repositório à Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → **Import Git Repository**.
2. Framework preset **Next.js** é detectado automaticamente.
3. **Não faça deploy ainda** — configure as variáveis de ambiente primeiro.

## 9. Configuração das variáveis na Vercel

**Settings → Environment Variables** → adicione as 5 variáveis da seção 2 em **Production** (e **Preview**, se quiser testar branches antes).

## 10. Configuração do domínio

1. **Settings → Domains** → adicione `www.aliviarcuradoriamedica.com.br`.
2. Crie os registros DNS indicados pela Vercel no painel do registrador.
3. Depois que o domínio resolver: no Supabase, **Authentication → URL Configuration** → **Site URL** = `https://www.aliviarcuradoriamedica.com.br`, e adicione essa URL + `/auth/callback` em **Redirect URLs**.

## 11. Deploy de produção

Com as variáveis configuradas, a Vercel faz o deploy ao conectar/push no `main`. Confirme **Ready** no painel — `npm run build` já é validado localmente antes de qualquer deploy (ver `CHANGELOG.md`).

Cabeçalhos de segurança HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) já estão ativos via `next.config.ts` — nenhuma configuração adicional na Vercel é necessária para eles. CSP completa é backlog registrado, não bloqueia o deploy.

## 12. Smoke tests de produção

- [ ] `https://www.aliviarcuradoriamedica.com.br` carrega a Landing.
- [ ] `/login` funciona com a conta Administrador da etapa 6.
- [ ] Administrador acessa `/admin` e vê o dashboard.
- [ ] Administrador cadastra profissionais de teste em `/admin/profissionais/novo` com experiência, abordagem de intake, resumo e ao menos uma área de competência — sem isso, a Shortlist fica bloqueada por falta de dado (o Método recusando inventar, não um bug).
- [ ] Administrador cadastra um paciente de teste em `/admin/pacientes/novo`.
- [ ] Login como esse paciente → preencher "Sua História" → enviar.
- [ ] Como administrador, criar o Caso e avançar até "Pronto para curadoria".
- [ ] Iniciar a execução do ACE no Caso.
- [ ] Em `/admin/ace`, o Health Check mostra `ANTHROPIC_CONFIGURED` — nunca `FAKE_MODEL_NON_PRODUCTION` nem `MODEL_NOT_CONFIGURED` (ver `docs/DEBUGGING.md` se aparecer).
- [ ] Fazer a Revisão Humana e aprovar.
- [ ] Entregar a Curadoria.
- [ ] Login como paciente → `/paciente/curadoria` mostra a entrega, incluindo "Baixar em PDF" (impressão do navegador).

## 13. Rollback

| Etapa | Como reverter |
|---|---|
| Migrations (3–5) | Só adicionam — nada a reverter. Se algo sair muito errado antes de haver dado real, é mais simples descartar o projeto Supabase e recriar. |
| Primeiro admin (6–7) | `delete from public.user_roles where profile_id = '<id>'` e, se preciso, remover o usuário em Authentication → Users. |
| Vercel/variáveis (8–9) | Corrigir a variável e **Redeploy** — não precisa reverter código. |
| Domínio (10) | Remover o domínio em Settings → Domains — a URL `*.vercel.app` continua funcionando. |
| Deploy (11) | Vercel → **Deployments** → **Instant Rollback** para o deploy anterior. |

Regra fixa: nenhum agente de IA executa `supabase db reset` ou qualquer comando destrutivo contra o projeto de produção.

## Proteção do modelo de linguagem em produção (já implementada)

A checagem "produção nunca cai silenciosamente no modelo fake" está implementada e testada desde a sprint GO LIVE — ver `docs/ENVIRONMENT_VARIABLES.md` (seção "Seleção do modelo de linguagem") e `docs/DEBUGGING.md` (seção 2) para o comportamento exato e os `failureCode` possíveis.
