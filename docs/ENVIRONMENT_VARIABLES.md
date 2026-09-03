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

Nomes documentados em `.env.example` (nunca valores). Preencha `.env.local` (ignorado pelo Git) para desenvolvimento — gerado automaticamente por `npm run supabase:env` a partir do Supabase local. Em produção, vivem apenas na configuração de ambiente da Vercel. Ver `docs/CREDENTIALS.md` para o inventário de credenciais (metadados, nunca valores) e `docs/AGENTS.md` para as regras de segurança.

| Variável | Obrigatória | Onde é lida | Efeito |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | `src/lib/supabase/env.ts`, `src/lib/supabase/admin.ts` | URL do projeto Supabase. Prefixo `NEXT_PUBLIC_` é intencional — não é segredo, mas nunca deve ser confundida com a service role key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | `src/lib/supabase/env.ts` | Chave anônima do Supabase, usada pelos clients de browser/server autenticados por sessão de usuário — toda autorização real continua sendo aplicada por RLS, nunca por esta chave. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | `src/lib/supabase/admin.ts` (server-only) | Bypassa RLS. **Nunca prefixar com `NEXT_PUBLIC_`, nunca usar no cliente.** Usada apenas para operações administrativas de conta (criação de paciente pela equipe Aliviar, redefinição de senha). |
| `NODE_ENV` | Definida pelo runtime, nunca manual | `src/app/foundation/page.tsx`, `src/components/curadoria/portal-shell.tsx` | Esconde superfícies de construção em produção: a bancada `/foundation` responde 404 (salvo `NEXT_PUBLIC_FOUNDATION_PREVIEW=1`) e o rodapé "dados de demonstração" do portal não é renderizado. Nunca decide comportamento clínico. |

## Histórico — `CLAUDE_API_KEY` e `ANTHROPIC_MODEL` (aposentadas em 2026-09-03)

Serviam ao `AceLanguageModel` do ACE, em `src/modules/concierge/`, que não existe mais: a chave selecionava o modelo real da Anthropic e, ausente, o sistema caía no `FakeAceLanguageModel` em dev/teste ou falhava explicitamente em produção (`ACE_MODEL_NOT_CONFIGURED`). Com a aposentadoria do ACE não há mais modelo real nem fake no código, e o `@anthropic-ai/sdk` saiu do `package.json` (ADR-056, registro de implementação de 03/09). Nada em `src/`, `scripts/` ou `tests/` lê essas variáveis; só o guard do Golden Set (`tests/golden/real-model-call-guard.ts`, ADR-022) cita o nome, por desenho, para nunca autorizar chamada real. Se `CLAUDE_API_KEY` ainda existir no painel da Vercel, é resíduo a remover pelo proprietário — ver `docs/CREDENTIALS.md`.

Fica registrado porque pode voltar a importar se um fornecedor de modelo entrar de novo: o nome era `CLAUDE_API_KEY`, e não `ANTHROPIC_API_KEY`, por contorno de um bug da própria Vercel (caso aberto no suporte deles) em que uma variável chamada `ANTHROPIC_API_KEY` ficava registrada no painel mas chegava como string vazia em `process.env` em runtime, enquanto uma variável irmã funcionava na mesma implantação. Não reutilizar `ANTHROPIC_API_KEY` sem antes confirmar com o suporte da Vercel que o bug foi corrigido.

## Adicionando uma variável nova

1. Documentar o **nome** (nunca o valor) em `.env.example`, com um comentário explicando onde é lida e o que acontece na ausência dela.
2. Registrar em `docs/CREDENTIALS.md` (identificador, finalidade, ambiente, local de armazenamento, consumidores, rotação).
3. Ler via `process.env.NOME_DA_VARIAVEL` apenas em código server-only (nunca em Client Component) — a menos que seja genuinamente pública, e nesse caso o prefixo `NEXT_PUBLIC_` é obrigatório e deliberado.
4. Atualizar esta tabela.

Com a V1 congelada, isso só se aplica a uma correção de bug que genuinamente exija uma variável nova — nunca a uma funcionalidade nova.
