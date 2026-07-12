# TASK-004A — Fundação de autenticação (arquitetura, middleware, bootstrap) — Claude Code

**Status:** Planejada, próxima na fila de execução (pelo Claude Code, não delegada ao Cursor). Não implementada ainda.

Depende de TASK-003 (aprovada e publicada em `e2a780b`): `profiles`, `user_roles`, `roles`, `has_role()`, trigger `handle_new_user`, RLS.

## Objetivo

Construir a camada de autenticação (Supabase Auth) e autorização por papel: login, logout, recuperação de senha, callback de confirmação/recuperação, resolução de estado de sessão, middleware de proteção de rotas por papel, e um script de bootstrap que cria usuários técnicos de teste localmente com senha gerada automaticamente. **Sem nenhuma tela/formulário** — isso é a TASK-004B.

## Causa raiz

A TASK-003 criou a fundação de identidade e RLS, mas não existe hoje nenhum jeito de uma pessoa real se autenticar, nem de o Next.js saber quem está logado e com qual papel. Sem isso, `(admin)`, `(profissional)`, `(paciente)` são apenas pastas vazias sem proteção nenhuma.

## Escopo

- `middleware.ts` (raiz do projeto): renova sessão a cada request e bloqueia acesso a `(admin)`, `(profissional)`, `(paciente)` conforme o papel exigido por cada grupo, redirecionando para login quando não autenticado, e para uma página de "acesso negado" (ou para a área do próprio papel) quando autenticado mas sem o papel exigido.
- `src/lib/supabase/middleware.ts`: factory de client Supabase específica para middleware (padrão `@supabase/ssr` de refresh de cookies em middleware, diferente do client de server component/action já existente).
- `src/modules/auth/schema.ts`: schemas Zod para login (email/senha), solicitação de recuperação de senha, definição de nova senha.
- `src/modules/auth/actions.ts`: server actions — `signInAction`, `signOutAction`, `requestPasswordResetAction`, `updatePasswordAction`. Validunderlying com os schemas Zod antes de chamar o Supabase Auth. **Sem UI** — 004B só vai importar e chamar essas actions a partir dos formulários.
- `src/modules/auth/session.ts`: `getAuthState()` — resolve `{ user, profile, roles }` a partir da sessão atual (server-side), usando `has_role`/consulta a `user_roles` já existentes da TASK-003.
- `src/app/auth/callback/route.ts`: route handler (sem UI) que troca o código do link de confirmação/recuperação por uma sessão (`exchangeCodeForSession`), conforme o fluxo padrão do Supabase Auth.
- `scripts/bootstrap-local-test-users.mjs`: cria (de forma **idempotente** — lição da revisão da TASK-003) 3 usuários técnicos de teste (administrador/profissional/paciente) via Admin API do Supabase local, com senha forte gerada aleatoriamente por execução. Nunca imprime a senha; grava credenciais **só** em `test-users.local.json` (novo arquivo, já coberto pelo padrão `*.local.json` do `.gitignore` atual — confirmar antes de criar). A service role key usada pelo script é lida em tempo de execução (mesma técnica de `scripts/generate-local-env.mjs`), nunca persistida em `.env.local` nem em nenhum arquivo versionado.
- Testes unitários (Vitest): schemas Zod, função de mapeamento rota→papel usada pelo middleware, `getAuthState()` com client mockado.
- Testes de integração (Vitest, novo diretório `tests/integration/`): login real contra o Supabase local (usando as contas do bootstrap), confirmando sessão válida, papel resolvido corretamente, e que login com papel errado é bloqueado pela mesma lógica usada no middleware.
- Testes de segurança: confirmar que uma sessão de paciente não consegue acessar rotas de `(admin)`/`(profissional)` (testado diretamente contra a função de autorização do middleware, não via clique de UI — isso é responsabilidade da 004B).

Fora do escopo: qualquer página, formulário, componente visual, ou teste de interface (E2E com clique real) — tudo isso é 004B.

## Arquivos permitidos

`middleware.ts`, `src/lib/supabase/middleware.ts`, `src/modules/auth/**`, `src/app/auth/callback/route.ts`, `scripts/bootstrap-local-test-users.mjs`, `tests/unit/**`, `tests/integration/**` (novo), `test-users.local.json` (gerado, nunca commitado), `package.json` (scripts `test:integration`, `bootstrap:test-users`).

## Arquivos proibidos

`docs/**` (exceto atualização de `docs/CREDENTIALS.md` registrando o identificador do bootstrap, sem valores, e `docs/ENGINEERING_PLAN.md` só se o roadmap precisar refletir a conclusão da fase — a decidir no momento da execução), `supabase/migrations/**` (nenhuma migration nova deveria ser necessária — a RLS/trigger da TASK-003 já cobre a sincronização com `profiles`), qualquer componente/página/formulário (isso é 004B), `.env.local`/`.env.example` além do que já existe (nenhuma nova variável pública deveria ser necessária).

## Critérios de aceite

- Middleware bloqueia rota de papel errado e redireciona corretamente; permite rota do papel certo.
- `bootstrap-local-test-users.mjs` roda duas vezes seguidas sem erro (idempotente — não duplica nem quebra ao encontrar usuário já existente).
- Login/logout funcionam de fato contra o Supabase local (testado via integração, sem UI).
- Callback de confirmação/recuperação troca código por sessão sem erro.
- `getAuthState()` retorna papel correto para cada uma das 3 contas de bootstrap.
- Nenhuma senha exibida em log/relatório; `test-users.local.json` nunca aparece em `git status` como rastreável.
- Nenhum uso de service role fora de scripts server-side.

## Comandos obrigatórios

```
npm run supabase:start
node scripts/bootstrap-local-test-users.mjs
npm run lint
npx tsc --noEmit
npm run test
npm run test:integration
npm run build
git status
```

## Riscos

- Padrão de client Supabase para middleware é diferente do de server components/actions (cookies somente-leitura vs. necessidade de refresh) — risco de sessão não renovar corretamente; mitigar seguindo exatamente o padrão documentado do `@supabase/ssr` para middleware.
- Bootstrap não-idempotente (repetir o erro da TASK-003) — mitigar testando explicitamente rodar o script duas vezes antes de considerar concluído.
- Vazamento de service role key para o bundle do cliente por engano — mitigar garantindo que ela só é lida dentro do próprio script Node (nunca em código sob `src/`).

## Checklist

- [ ] Middleware testado para os 3 papéis + não autenticado.
- [ ] Bootstrap idempotente (rodado 2x).
- [ ] Nenhuma senha em log/relatório.
- [ ] `test-users.local.json` confirmado ignorado pelo Git.
- [ ] Testes unitários + integração passando.
- [ ] lint/typecheck/build passando.
- [ ] Commit local, sem push (revisão do usuário decide o push, como nas tarefas anteriores).

## Resultado esperado

Mecanismo de autenticação completo e testado, pronto para a 004B só "pendurar" formulários em cima — sem nenhuma decisão de segurança ficando para a camada de UI.
