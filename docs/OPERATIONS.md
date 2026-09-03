# Guia de Operação e Deploy

Runbook operacional para ativar e manter o ambiente de produção da Aliviar Curadoria Médica. Escrito originalmente na sprint GO LIVE (publicado como Artifact) e materializado aqui para ficar versionado junto do código. Nenhuma etapa aqui é executada por um agente de IA sem autorização explícita e separada do responsável pelo projeto (`docs/AGENTS.md`) — nenhum segredo deve ser colado em chat, sempre cadastrado diretamente no painel do Supabase/Vercel.

> **Estado em 2026-09-03.** Produção existe desde julho (projeto `awdlmeykminwyifnygkm`, `sa-east-1` — `CONTEXTO_DE_GESTAO_SOLO.md` §3). As etapas 1 a 11 são o registro de como foi ativada; em rotina usam-se a 12 (smoke), a 13 (rollback) e a 14 (checklist). O motor ACE saiu do produto em 21/08 e a chave da Anthropic foi aposentada em 03/09 — o que dependia deles está marcado *(histórico)*. O schema do produto é **`curadoria`**, não `public` (o `public` do mesmo banco pertence à AliCIA e a Geração 1 foi aposentada em 21/08): o SQL das etapas 4, 7 e 13 foi corrigido para isso.

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
| `CRM_SITE_LEAD_SECRET` | Gerado pelo proprietário e compartilhado só com o integrador do site (header `x-crm-lead-secret`). Obrigatório: sem ele `POST /api/crm/leads` responde 503. |

Todas cadastradas na Vercel (etapa 9), nunca em arquivo versionado. *(histórico)* `CLAUDE_API_KEY` e `ANTHROPIC_MODEL` constavam aqui até 03/09; aposentadas com o ACE — `docs/ENVIRONMENT_VARIABLES.md`, seção Histórico.

## 3. Aplicação das migrations

As migrations até agosto só criavam e alteravam. Desde então há duas que não são só aditivas: a `20260821210000_aposenta_geracao_1_schema_public` derruba as tabelas da Geração 1 no schema `public` (com backup lógico gravado antes), e a `20260903040000_eliminacao_do_titular` altera chaves estrangeiras e cria a porta de eliminação. Ver `docs/DATABASE.md` para o catálogo.

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF   # o ref aparece na URL do dashboard
npx supabase db push                               # aplica todas as migrations, em ordem
```

Hoje o `git push` de `main` aplica as migrations pela integração GitHub do Supabase (`SIM-97` no registro de achados): push de migration é produção. O `db push` manual só se aplica com a integração desligada.

## 4. Validação de migrations e RLS

No SQL Editor do Supabase Studio (somente leitura):

```sql
-- Deveria retornar 0 linhas — nenhuma tabela em curadoria sem RLS habilitado.
select relname from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'curadoria' and c.relkind = 'r' and not c.relrowsecurity;
```

```sql
-- Deveria retornar 0 linhas — nenhuma tabela com RLS habilitado mas sem
-- nenhuma policy (o que bloquearia todo acesso, mesmo do dono).
select t.relname from pg_class t
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'curadoria' and t.relkind = 'r' and t.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'curadoria' and p.tablename = t.relname
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
insert into curadoria.user_roles (profile_id, role_id)
select u.id, r.id
from auth.users u
cross join curadoria.roles r
where u.email = 'email-da-pessoa@dominio.com.br'
  and r.slug = 'administrador'
on conflict do nothing;
```

Valide:

```sql
select p.display_name, u.email, r.slug
from curadoria.user_roles ur
join curadoria.profiles p on p.id = ur.profile_id
join auth.users u on u.id = ur.profile_id
join curadoria.roles r on r.id = ur.role_id;
```

## 8. Conexão do repositório à Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → **Import Git Repository**.
2. Framework preset **Next.js** é detectado automaticamente.
3. **Não faça deploy ainda** — configure as variáveis de ambiente primeiro.

## 9. Configuração das variáveis na Vercel

**Settings → Environment Variables** → adicione as 5 variáveis da seção 2 em **Production** (e **Preview**, se quiser testar branches antes).

## 10. Configuração do domínio

> **2026-08-19 — a Aliviar não tem mais domínio próprio.** O serviço é
> servido pelo endereço da própria hospedagem (`*.vercel.app`). Esta seção
> fica como está para o dia em que houver domínio de novo; **hoje ela é
> inteiramente pulada.** Seguir os passos abaixo agora significa tentar
> apontar DNS de um domínio que não existe.

**Quando houver domínio de novo:**

1. **Settings → Domains** → adicione o domínio.
2. Crie os registros DNS indicados pela Vercel no painel do registrador.
3. Depois que o domínio resolver: no Supabase, **Authentication → URL
   Configuration** → **Site URL** = a URL do domínio, e adicione essa URL +
   `/auth/callback` em **Redirect URLs**.
4. Defina `NEXT_PUBLIC_SITE_URL` nas variáveis da Vercel. Sem isso, o
   `sitemap.xml`, o `robots.txt` e as URLs canônicas continuam apontando
   para o endereço da hospedagem (ver `src/lib/site-url.ts`).

## 11. Deploy de produção

Com as variáveis configuradas, a Vercel faz o deploy ao conectar/push no `main`. Confirme **Ready** no painel — `npm run build` já é validado localmente antes de qualquer deploy (ver `CHANGELOG.md`).

Cabeçalhos de segurança HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`) já estão ativos via `next.config.ts` — nenhuma configuração adicional na Vercel é necessária para eles. CSP completa é backlog registrado, não bloqueia o deploy.

## 12. Smoke tests de produção

- [ ] A URL de produção da Vercel (painel → Deployments → Production) carrega a Landing.
- [ ] `/login` funciona com a conta Administrador da etapa 6.
- [ ] Administrador acessa `/admin` e vê o dashboard.
- [ ] Administrador cadastra profissionais de teste em `/admin/profissionais/novo` com experiência, abordagem de intake, resumo e ao menos uma área de competência — o Método recusa inventar dado (na rodada real, a porta é o Formulário do Profissional assinado, `docs/rede/`).
- [ ] Administrador cadastra um paciente de teste em `/admin/pacientes/novo`.
- [ ] Login como esse paciente → preencher "Sua História" → enviar.
- [ ] Como administrador, criar o Caso e avançar até "Pronto para curadoria".
- [ ] Como Curador, registrar a Mesa em `/portal-curador/casos/[id]`. *(histórico: "iniciar a execução do ACE", Health Check `ANTHROPIC_CONFIGURED` em `/admin/ace`, "fazer a Revisão Humana e aprovar" — não existem mais.)*
- [ ] Entregar a Curadoria.
- [ ] Login como paciente → `/paciente/curadoria` mostra a entrega, incluindo "Baixar em PDF" (impressão do navegador).

## 13. Rollback

| Etapa | Como reverter |
|---|---|
| Migrations (3–5) | Aditivas até agosto. As que não são (`20260821210000`, `20260903040000`) não se revertem por migration: o caminho é o backup lógico e a restauração descrita em `docs/RECOVERY.md`, nunca `db reset` em produção. |
| Primeiro admin (6–7) | `delete from curadoria.user_roles where profile_id = '<id>'` e, se preciso, remover o usuário em Authentication → Users. |
| Vercel/variáveis (8–9) | Corrigir a variável e **Redeploy** — não precisa reverter código. |
| Domínio (10) | Remover o domínio em Settings → Domains — a URL `*.vercel.app` continua funcionando. |
| Deploy (11) | Vercel → **Deployments** → **Instant Rollback** para o deploy anterior. |

Regra fixa: nenhum agente de IA executa `supabase db reset` ou qualquer comando destrutivo contra o projeto de produção.

## 14. Checklist do primeiro paciente real

Distinto do smoke test (seção 12, que usa dados de teste descartáveis): esta é a sequência para operar o **primeiro caso real** depois que o smoke test já passou. Cada item usa dado real de uma pessoa real, não um profissional/paciente "de teste".

- [ ] **Primeiro Administrador**: já criado na etapa 6 — confirme que a pessoa certa (não uma conta de teste) tem o papel e consegue logar em produção.
- [ ] **Primeiros profissionais reais**: cadastrar em `/admin/profissionais/novo` com dados reais — nome, identificador profissional, resumo, experiência, abordagem de intake, disponibilidade e ao menos uma área de competência real por profissional. Sem isso o profissional não entra na Mesa (o Método recusa inventar dado). Recomendado: pelo menos 3 profissionais reais, porque a Curadoria entrega três caminhos e, sem três legítimos, a Mesa para (Guia da Primeira Rodada, passo 6).
- [ ] **Primeiro paciente real**: cadastrar em `/admin/pacientes/novo` com o e-mail real da pessoa. A senha inicial só aparece uma vez na tela — entregue com segurança (nunca por canal não confiável).
- [ ] **Primeira História**: a pessoa loga com a própria conta e preenche "Sua História" até o fim (não uma versão de teste/rascunho abandonado).
- [ ] **Primeiro Caso**: Administrador ou Curador Médico cria o Caso a partir dessa história real e avança para "Pronto para curadoria".
- [ ] **Primeira Mesa**: o Curador conduz a Mesa (Folha da Mesa, `docs/rede/`) e a registra em `/portal-curador/casos/[id]`. *(histórico: "primeira execução do ACE", `COMPLETED` em `/admin/ace/[executionId]`.)*
- [ ] **Primeira apresentação e decisão**: os três caminhos apresentados sem inclinar, e a decisão é dela — "nenhuma destas" é resultado válido (Guia, passos 7 e 8). *(histórico: "primeira Revisão Humana" da Shortlist gerada.)*
- [ ] **Primeira Entrega**: confirmar a entrega da Curadoria Final e que a pessoa consegue acessá-la em `/paciente/curadoria`, incluindo "Baixar em PDF".
- [ ] **Acompanhamento**: registrar, fora do sistema (processo da equipe, não uma funcionalidade do produto), a data desta primeira entrega para o acompanhamento periódico de 12 meses previsto em `docs/PRODUCT_ARCHITECTURE.md`.

Só depois deste checklist completo com uma pessoa real, ponta a ponta, a operação está de fato validada — o smoke test da seção 12 prova que o sistema funciona; este prova que a operação funciona.

## *(histórico)* Proteção do modelo de linguagem em produção

A checagem "produção nunca cai silenciosamente no modelo fake" existiu da sprint GO LIVE até a aposentadoria do ACE (21/08). Não há mais modelo, real ou fake, no produto — `docs/ENVIRONMENT_VARIABLES.md` (seção Histórico) e `docs/DEBUGGING.md` §1–3.
