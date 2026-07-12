# TASK-004B — Telas de autenticação (login, logout, recuperação) — Cursor

**Status:** Planejada, **não delegada ainda**. Só deve ser enviada ao Cursor depois que a TASK-004A estiver concluída e revisada pelo Claude Code — as páginas abaixo consomem as server actions e o middleware que a 004A cria; sem isso não há o que a 004B chamar.

## Objetivo

Construir as páginas e formulários de login, logout e recuperação de senha, usando **exclusivamente** as server actions já criadas e testadas em `src/modules/auth/actions.ts` (TASK-004A). Nenhuma lógica de autenticação nova — só UI, formulário, validação de UX e navegação.

## Causa raiz

A TASK-004A entrega o mecanismo de autenticação (server actions, middleware, sessão), mas ele não tem nenhuma superfície visual — ninguém consegue de fato logar pela interface ainda.

## Escopo

- `src/app/(auth)/login/page.tsx` — formulário de e-mail/senha, usando React Hook Form + Zod (schema já existe em `src/modules/auth/schema.ts`, só importar), chamando `signInAction`.
- `src/app/(auth)/logout/page.tsx` ou botão/ação de logout acessível nas áreas autenticadas, chamando `signOutAction`.
- `src/app/(auth)/recuperar-senha/page.tsx` — formulário de solicitação de recuperação, chamando `requestPasswordResetAction`.
- `src/app/(auth)/nova-senha/page.tsx` — formulário de definição de nova senha (após o callback), chamando `updatePasswordAction`.
- Estados de erro/carregamento nos formulários (ex.: credenciais inválidas, e-mail não encontrado) — mensagens amigáveis, sem vazar detalhes técnicos do erro do Supabase.
- Testes de interface (Playwright): login com uma das contas de bootstrap da 004A → redireciona para a área do papel correto; login com senha errada → mostra erro, não navega; logout → volta para login; acessar rota protegida sem sessão → redireciona para login.

Fora do escopo: qualquer lógica de autenticação, qualquer alteração em `middleware.ts`, `src/modules/auth/actions.ts` ou `src/modules/auth/session.ts` — se algo parecer faltando ali, isso é achado para reportar ao Claude Code, não para implementar por conta própria (regra de `docs/AGENTS.md`: Cursor não amplia escopo nem altera arquitetura por iniciativa própria).

## Arquivos permitidos

`src/app/(auth)/**` (páginas e componentes de formulário), `src/components/**` (componentes de UI compartilhados que os formulários precisarem, ex.: input/button genéricos, se ainda não existirem), `tests/e2e/**`.

## Arquivos proibidos

`middleware.ts`, `src/lib/supabase/**`, `src/modules/auth/actions.ts`, `src/modules/auth/session.ts`, `src/modules/auth/schema.ts` (só importar, nunca editar), `docs/**`, `supabase/**`, `scripts/**`, qualquer arquivo `.env*`.

## Critérios de aceite

- Login com conta de teste válida (bootstrap da 004A) navega para a área correta do papel.
- Login com credencial inválida mostra erro sem navegar.
- Logout limpa a sessão e volta para login.
- Rota protegida sem sessão redireciona para login (comportamento do middleware da 004A, só confirmado aqui via teste de interface).
- Nenhuma lógica de autenticação duplicada ou reimplementada nas páginas — tudo passa pelas actions da 004A.

## Comandos de validação

```
npm run lint
npx tsc --noEmit
npm run build
npx playwright test
```

## Riscos

- Tentação de "ajustar" a action em vez de reportar um problema real nela — não fazer; reportar ao Claude Code.
- Mensagens de erro vazando detalhes internos do Supabase — validar que os textos exibidos são genéricos e amigáveis.

## Resultado esperado

Fluxo de login/logout/recuperação de senha utilizável de ponta a ponta pela interface, sem nenhuma decisão de segurança tomada nesta camada.
