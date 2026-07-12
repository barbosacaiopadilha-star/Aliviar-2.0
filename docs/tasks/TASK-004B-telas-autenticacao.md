# TASK-004B — Telas e UX de autenticação (Cursor)

**Status:** Aprovada para envio ao Cursor. Depende da TASK-004A, aprovada e publicada em `7ae8260` (`origin/main`).

---

## Objetivo

Implementar exclusivamente a camada visual e de interação da autenticação, consumindo a fundação já pronta da TASK-004A (`src/modules/auth/actions.ts`, `src/modules/auth/schema.ts`, `src/modules/auth/redirect-safety.ts`, middleware, guard). **Nenhuma lógica de autenticação nova.**

## Causa raiz

A TASK-004A entrega o mecanismo (server actions, middleware, sessão, autorização por papel), testado por integração, mas sem nenhuma superfície visual — ninguém consegue de fato logar pela interface ainda.

## Telas a implementar

- `src/app/(auth)/login/page.tsx` → `/login`
- `src/app/(auth)/recuperar-senha/page.tsx` → `/recuperar-senha`
- `src/app/(auth)/nova-senha/page.tsx` → `/nova-senha`

Cada uma com: formulário (React Hook Form + Zod, usando os schemas já existentes em `src/modules/auth/schema.ts` — só importar, nunca editar), estado de carregamento (botão desabilitado durante submit), estado de erro (mensagem amigável vinda do `ActionResult` retornado pelas actions, nunca um detalhe técnico do Supabase), acessibilidade básica (labels associados aos inputs, mensagens de erro anunciadas, navegação por teclado), responsividade simples (mobile-first, Tailwind).

## Funcionalidades

- Formulário de login chamando `signInAction`; em caso de sucesso, redirecionar usando `next` da query string — **obrigatório** passar esse valor por `getSafeRedirectPath()` (`src/modules/auth/redirect-safety.ts`, já existe) antes de usá-lo em qualquer `redirect()`/navegação. Isso é a mesma mitigação de open redirect já aplicada no callback (`src/app/auth/callback/route.ts`) — achado real da revisão da TASK-004A.
- Ação/botão de logout (em algum ponto acessível — pode ser um componente simples reutilizado, sem precisar de layout completo de área logada) chamando `signOutAction`.
- Formulário de solicitação de recuperação chamando `requestPasswordResetAction` — mensagem de sucesso **genérica** ("se o e-mail existir, você receberá instruções"), nunca confirmando ou negando a existência da conta.
- Formulário de nova senha (acessado via `/nova-senha`, depois do callback) chamando `updatePasswordAction`.

## Restrições — não alterar

`src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/modules/auth/guard.ts`, `src/modules/auth/session.ts`, `src/modules/auth/redirect-safety.ts`, `src/modules/auth/actions.ts`, `src/modules/auth/schema.ts` (só importar), `src/app/auth/callback/route.ts`, `supabase/**` (migrations, seed, config), `scripts/**`, qualquer arquivo `.env*`, `docs/**` (exceto se pedido explicitamente). Se algo parecer faltando ou errado nesses arquivos, **documentar o achado e parar** — não ampliar escopo nem "corrigir" por conta própria (regra de `docs/AGENTS.md`).

## Segurança — obrigatório

- Nunca exibir credenciais (nem as de teste, nem as digitadas pelo usuário) em log, console ou mensagem de erro.
- Nunca hardcodar e-mail/senha das contas de teste técnico nos componentes — se precisar delas para os testes E2E, ler de `test-users.local.json` (gerado por `npm run bootstrap:test-users`, já ignorado pelo Git), nunca copiar os valores para dentro do código-fonte.
- Nunca importar ou referenciar a service role key no lado do cliente.
- Nunca logar a senha digitada (nem em `console.log` de debug, nem em analytics).
- Mensagem de recuperação de senha não pode revelar se o e-mail existe ou não.
- Todo uso do parâmetro `next` (vindo da URL) **deve** passar por `getSafeRedirectPath()` antes de qualquer redirecionamento — não reimplementar essa validação, importar a função existente.

## Testes exigidos

- **Unitários/componente**: validação de formulário (campos obrigatórios, formato de e-mail, tamanho mínimo de senha) usando os schemas já existentes; estado de erro/loading renderiza corretamente.
- **E2E (Playwright)**, usando as contas de `test-users.local.json`:
  - login válido → redireciona para a área do papel correto;
  - login inválido → mostra erro, não navega;
  - logout → volta para `/login`;
  - solicitação de recuperação de senha → mostra mensagem genérica de sucesso;
  - redirecionamento após login respeita `next` quando presente e seguro;
  - acesso a rota protegida sem sessão → redireciona para `/login`.

## Arquivos permitidos

`src/app/(auth)/**`, `src/components/**` (componentes de UI compartilhados que os formulários precisarem — inputs, botões, se ainda não existirem), `tests/e2e/**`.

## Arquivos proibidos

`src/middleware.ts`, `src/lib/supabase/**`, `src/modules/auth/actions.ts`, `src/modules/auth/schema.ts`, `src/modules/auth/session.ts`, `src/modules/auth/guard.ts`, `src/modules/auth/redirect-safety.ts`, `src/app/auth/callback/route.ts`, `docs/**`, `supabase/**`, `scripts/**`, qualquer `.env*`.

## Comandos obrigatórios

```
npm run lint
npx tsc --noEmit
npm run test
npm run build
npm run bootstrap:test-users
npx playwright test
```

## Critérios de aceite

- As 3 páginas existem e renderizam sem erro.
- Login com conta de teste válida (via `test-users.local.json`) navega para a área correta do papel.
- Login com credencial inválida mostra erro sem navegar.
- Logout limpa a sessão e volta para `/login`.
- Rota protegida sem sessão redireciona para `/login` (comportamento já existente do middleware, só confirmado aqui via teste de interface).
- `next` só é usado através de `getSafeRedirectPath()` — nenhum redirect direto com valor cru da query string.
- Nenhuma lógica de autenticação duplicada ou reimplementada nas páginas.
- Nenhum arquivo da lista de proibidos foi tocado.
- Nenhuma credencial exibida em nenhum lugar.

## Checklist

- [ ] 3 páginas implementadas, sem lógica de auth nova.
- [ ] Todas as chamadas às server actions passam pelos módulos já existentes, sem reimplementação.
- [ ] `next` validado via `getSafeRedirectPath()` em todo redirect pós-login.
- [ ] Testes de formulário/validação passando.
- [ ] E2E dos 6 cenários listados passando.
- [ ] Nenhuma credencial hardcoded ou exibida.
- [ ] `git status` sem nenhum arquivo fora do permitido.
- [ ] Commit local criado, sem push.
- [ ] Relatório de conclusão no formato de `docs/WORKFLOW.md`.

## Riscos

- Tentação de "ajustar" uma server action em vez de reportar um problema real nela — não fazer; documentar e parar.
- Mensagens de erro vazando detalhes internos do Supabase — validar que os textos exibidos são sempre os genéricos já retornados pelas actions (`ActionResult.error`), nunca o erro bruto.
- Esquecer de validar `next` e reintroduzir o open redirect corrigido na TASK-004A.

## Git

Commit local ao final (sem push). Mensagem sugerida: `feat: telas de login, logout e recuperação de senha (TASK-004B)`.

## Relatório obrigatório

Objetivo; causa raiz; alterações realizadas; arquivos modificados; comandos executados com resultado; testes (unitários/componente + E2E, com resultado de cada cenário); validações de segurança realizadas; riscos; pendências; hash do commit local.

## Resultado esperado

Fluxo de login/logout/recuperação de senha utilizável de ponta a ponta pela interface, sem nenhuma decisão de segurança tomada nesta camada — tudo delegado à fundação já revisada da TASK-004A.
