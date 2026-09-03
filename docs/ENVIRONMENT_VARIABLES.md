# Variáveis de Ambiente

## Isolamento dos ambientes (2026-07-27)

`.env.local` deste repositório aponta **deliberadamente para um projeto hospedado** — é o que permite validação assistida contra dados reais. O problema não era esse: era todo script local lê-lo como fallback silencioso. A suíte de integração, que cria e apaga contas, Cases e profissionais, passou a autenticar contra o projeto remoto sem nenhum aviso.

A regra agora: **nenhum comando local resolve o alvo por arquivo `.env`**. Quem resolve é `scripts/env-guard.mjs`, perguntando à CLI do Supabase, e a recusa acontece antes da primeira chamada de rede. A validação é pelo **identificador real do projeto** (`https://<ref>.supabase.co`), com lista explícita de projetos proibidos.

| Comando | Ambiente | Como o alvo é resolvido |
|---|---|---|
| `npm run dev` | `.env.development.local` (local) → `.env.local` (hospedado) | Next.js. Em `next dev` o arquivo local vence; sem ele, cai no hospedado. |
| `npm run dev:local` | **local, garantido** | Runner injeta a stack local no processo. |
| `npm run build` / `start` | produção (Vercel) ou `.env.local` | Inalterado — é assim que tem de ser. |
| `npm test` (unitários) | nenhum banco | — |
| `npm run test:components` | nenhum banco | — |
| `npm run test:integration` | **local, garantido** | Runner + `assertSupabaseLocal` no setup da suíte. |
| `npm run test:e2e` | **local, garantido** | Runner + guarda própria do `playwright.config.ts`. |
| `npm run bootstrap:test-users` | **local, garantido** | Runner + guarda no script. |
| `npm run seed:rede-demo:local` | **local, garantido** | Guarda antes de criar o client (o script faz `DELETE`). |
| `npm run seed:mesa:local` | **local, garantido** | Runner com `SEED_MESA=1`. |
| `npm run supabase:reset` | **local, garantido** | `guard-db-reset.mjs` recusa `--linked`, `--project-ref` e `--db-url` remoto. |
| `npm run supabase:env` | local | Gera `.env.development.local`/`.env.local` a partir da stack local. |
| `npm run validation:*` | **projeto hospedado, por desenho** | Fluxo de validação assistida. `validation:diagnose` já verifica o ref esperado. Não é comando de rotina. |
| `scripts/extract-remote-migrations.mjs` | **projeto hospedado, por desenho** | Só lê migrations. |

Arquivos de exemplo: `.env.example` (aplicação) e `.env.test.example` (suíte de integração). Nenhum contém segredo.

---

Nomes documentados em `.env.example` (nunca valores). Preencha `.env.local` (ignorado pelo Git) para desenvolvimento — gerado automaticamente por `npm run supabase:env` a partir do Supabase local. Em produção, vivem apenas na configuração de ambiente da Vercel. Ver `docs/CREDENTIALS.md` para o inventário de credenciais (metadados, nunca valores) e `docs/AGENTS.md` para as regras de segurança. Nem toda variável da tabela está em `.env.example`: as de build e as que a Vercel injeta não se preenchem à mão. Levantamento por `grep process.env` em `src/` e `scripts/`, 2026-09-03.

| Variável | Obrigatória | Onde é lida | Efeito |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | `src/lib/supabase/env.ts`, `src/lib/supabase/admin.ts` | URL do projeto Supabase. Prefixo `NEXT_PUBLIC_` é intencional — não é segredo, mas nunca deve ser confundida com a service role key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | `src/lib/supabase/env.ts` | Chave anônima do Supabase, usada pelos clients de browser/server autenticados por sessão de usuário — toda autorização real continua sendo aplicada por RLS, nunca por esta chave. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | `src/lib/supabase/admin.ts` (server-only) | Bypassa RLS. **Nunca prefixar com `NEXT_PUBLIC_`, nunca usar no cliente.** Usada apenas para operações administrativas de conta (criação de paciente pela equipe Aliviar, redefinição de senha). |
| `NODE_ENV` | Definida pelo runtime, nunca manual | `src/app/foundation/page.tsx`, `src/components/curadoria/portal-shell.tsx` | Esconde superfícies de construção em produção: a bancada `/foundation` responde 404 (salvo `NEXT_PUBLIC_FOUNDATION_PREVIEW=1`) e o rodapé "dados de demonstração" do portal não é renderizado. Nunca decide comportamento clínico. |
| `CRM_SITE_LEAD_SECRET` | Sim, em todo ambiente | `src/app/api/crm/leads/route.ts` | Segredo que o integrador do site envia no header `x-crm-lead-secret` de `POST /api/crm/leads`. Ausente, o endpoint responde 503 sempre — nunca fica aberto. Local: `scripts/with-local-supabase.mjs` injeta um valor de teste fixo. |
| `NEXT_PUBLIC_SITE_URL` | Não | `src/lib/site-url.ts` | Sobrescreve o endereço público do site. Ausente, usa `VERCEL_PROJECT_PRODUCTION_URL`; sem os dois, `http://localhost:3000`. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Injetada pela Vercel, nunca manual | `src/lib/site-url.ts` | Host de produção do projeto, sem protocolo. É o que resolve o endereço público hoje. |
| `NEXT_PUBLIC_FOUNDATION_PREVIEW` | Não | `src/app/foundation/page.tsx` | `"1"` mantém a bancada `/foundation` visível em produção. Nunca definir na Vercel: a bancada é superfície de prova, não de produto. |
| `FORMACAO_EXTRACAO_B2` | Não | `src/modules/profiles/formacao-academica-extracao.ts` | Só o valor `habilitada` liga o adaptador B2 de extração de formação. Não ligar sem o gate de governança e privacidade do Fundador; desligado, recusa antes de qualquer chamada de rede. |
| `WHATSAPP_ACCESS_TOKEN` | Não | `src/modules/crm/integrations/whatsapp/provider.ts` | Lida, mas sem efeito: com ou sem valor o provider é o `DisabledWhatsAppProvider`. A integração não foi construída. Não configurar. |
| `NEXT_PUBLIC_ALIVIAR_AMBIENTE`, `NEXT_PUBLIC_BACKEND_HOST`, `NEXT_PUBLIC_BUILD_COMMIT`, `NEXT_PUBLIC_BUILD_TIME`, `NEXT_PUBLIC_BUILD_ID` | Definidas pelo build (`next.config.ts`, bloco `env`), nunca manual | `src/app/api/build-info/route.ts` | Identidade do build servido, exposta em `/api/build-info`. Nenhum segredo: ambiente, host do backend, commit, hora e id do build. |

### Lidas só por scripts e configuração de teste

Nenhuma destas chega ao app. Todas têm padrão seguro; definem-se só para desviar dele.

| Variável | Onde é lida | Efeito |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `scripts/env-guard.mjs`, `playwright.config.ts`, `scripts/verify-bundle-backend.mjs` | Injeção explícita do alvo de um comando local. Validada por `assertSupabaseLocal` antes de qualquer rede: host remoto é recusado. Ausentes, o alvo vem da stack local pela CLI do Supabase — nunca de `.env.local`. |
| `SUPABASE_DB_CONTAINER` | `scripts/env-guard.mjs` | Nome do container do Postgres local. Padrão `supabase_db_aliviar-conexao`. |
| `E2E_PORT` | `scripts/stop-stale-server.mjs` | Porta do servidor E2E a encerrar. Padrão `3001`. |
| `SUPABASE_URL_PROD`, `BACKUP_IMAGEM_PG` | `scripts/backup-producao.mjs` | URL do projeto a dumpar (padrão: o `project-ref` gravado pela CLI) e imagem Docker do `pg_dump` (padrão `postgres:17-alpine`). As credenciais do backup vêm de `.env.backup.local`, nunca de argumento. |
| `VALIDATION_TEST_PATIENT_EMAIL` | `scripts/local/prepare-validation-env.mjs` | E-mail do paciente marcador da validação assistida. Padrão `validation.patient@aliviar.local`. |
| `CI` | `playwright.config.ts` | Presente: proíbe `test.only` e dá 2 tentativas por teste. |

## Histórico — `CLAUDE_API_KEY` e `ANTHROPIC_MODEL` (aposentadas em 2026-09-03)

Serviam ao `AceLanguageModel` do ACE, em `src/modules/concierge/`, que não existe mais: a chave selecionava o modelo real da Anthropic e, ausente, o sistema caía no `FakeAceLanguageModel` em dev/teste ou falhava explicitamente em produção (`ACE_MODEL_NOT_CONFIGURED`). Com a aposentadoria do ACE não há mais modelo real nem fake no código, e o `@anthropic-ai/sdk` saiu do `package.json` (ADR-056, registro de implementação de 03/09). Nada em `src/`, `scripts/` ou `tests/` lê essas variáveis; só o guard do Golden Set (`tests/golden/real-model-call-guard.ts`, ADR-022) cita o nome, por desenho, para nunca autorizar chamada real. Se `CLAUDE_API_KEY` ainda existir no painel da Vercel, é resíduo a remover pelo proprietário — ver `docs/CREDENTIALS.md`.

Fica registrado porque pode voltar a importar se um fornecedor de modelo entrar de novo: o nome era `CLAUDE_API_KEY`, e não `ANTHROPIC_API_KEY`, por contorno de um bug da própria Vercel (caso aberto no suporte deles) em que uma variável chamada `ANTHROPIC_API_KEY` ficava registrada no painel mas chegava como string vazia em `process.env` em runtime, enquanto uma variável irmã funcionava na mesma implantação. Não reutilizar `ANTHROPIC_API_KEY` sem antes confirmar com o suporte da Vercel que o bug foi corrigido.

## Adicionando uma variável nova

1. Documentar o **nome** (nunca o valor) em `.env.example`, com um comentário explicando onde é lida e o que acontece na ausência dela.
2. Registrar em `docs/CREDENTIALS.md` (identificador, finalidade, ambiente, local de armazenamento, consumidores, rotação).
3. Ler via `process.env.NOME_DA_VARIAVEL` apenas em código server-only (nunca em Client Component) — a menos que seja genuinamente pública, e nesse caso o prefixo `NEXT_PUBLIC_` é obrigatório e deliberado.
4. Atualizar esta tabela.

Com a V1 congelada, isso só se aplica a uma correção de bug que genuinamente exija uma variável nova — nunca a uma funcionalidade nova.
