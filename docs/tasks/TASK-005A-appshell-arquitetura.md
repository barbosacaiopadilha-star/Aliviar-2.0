# TASK-005A — Arquitetura do AppShell e rotas reais por papel (Claude Code)

**Status:** Planejada. Não implementada nesta rodada. Depende de `docs/DESIGN_SYSTEM.md` e ADR-008/ADR-009 (`docs/DECISIONS.md`), produzidos nesta mesma rodada de planejamento.

## Objetivo

Construir a **estrutura** (não o visual) que a TASK-005B vai revestir: rotas reais por papel (`/admin`, `/profissional`, `/paciente`), um componente `AppShell` estrutural único e compartilhado pelos três, refinamento de `requireRole()` para uma página de acesso negado dedicada, e os estados globais mínimos (`loading`/`error`/`not-found`). Sem nenhuma decisão visual — cores, tipografia e componentes de UI são exclusivamente da TASK-005B.

## Causa raiz

Os route groups `(admin)`, `(profissional)`, `(paciente)` (TASK-001, guard adicionado na TASK-004A) não aparecem na URL — não é possível ter `/admin`, `/profissional`, `/paciente` como endereços reais mantendo essa estrutura, e não existe hoje nenhum layout visual compartilhado entre os três papéis nem uma página de "acesso negado" (usuário autenticado com papel errado é redirecionado para `/login`, o que é confuso).

## Escopo

1. **Renomear os route groups para segmentos reais**: `src/app/(admin)/` → `src/app/admin/`, `src/app/(profissional)/` → `src/app/profissional/`, `src/app/(paciente)/` → `src/app/paciente/`. O `layout.tsx` de cada um mantém a chamada a `requireRole()` já existente, sem mudança de comportamento nessa parte.
2. **`AppShell` estrutural** (`src/components/shell/app-shell.tsx`): componente único recebendo `role`, `profile` (do `AuthState` já resolvido por `requireRole()`) e `children`. Semântica HTML correta (`<header>`, `<aside>`, `<main>`, `<nav>`), sem nenhum token visual aplicado (isso é a TASK-005B) — pode usar classes utilitárias mínimas só o suficiente para não quebrar o layout (ex.: `flex`, `min-h-screen`), nunca cor/tipografia de marca. Contrato de navegação: recebe uma lista de itens (`{ label, href }`) — nesta fase, sempre "Início", "Perfil", "Configurações", mais "Sair" (usa o `LogoutButton` já existente da TASK-004B).
3. **Dashboards mínimos**: `page.tsx` em cada um dos três segmentos, usando `AppShell`, com saudação (`profile.displayName`), rótulo do papel ativo, e um placeholder de estado vazio (texto simples — o componente `EmptyState` de verdade é da TASK-005B). **Nenhum dado de negócio inventado.**
4. **Refinamento de `requireRole()`** (`src/modules/auth/guard.ts`): quando há sessão mas o papel não bate, redirecionar para `/acesso-negado` em vez de `/login`. Quando **não** há sessão, continua redirecionando para `/login` — sem mudança nesse caso.
5. **`src/app/acesso-negado/page.tsx`**: página mínima (texto simples, sem estilo de marca) informando que o usuário não tem acesso àquela área com o papel atual, com link de volta.
6. **Estados globais mínimos**: `not-found.tsx` (raiz), `error.tsx` e `loading.tsx` para os segmentos `admin/`, `profissional/`, `paciente/` e `(auth)/` — conteúdo textual simples (mensagens definidas em `docs/DESIGN_SYSTEM.md`, seção 7), sem estilo de marca ainda.
7. **Testes de autorização e navegação** (integração/E2E, reaproveitando `test-users.local.json`): paciente acessando `/admin` ou `/profissional` → `/acesso-negado`; usuário não autenticado acessando qualquer um dos três → `/login?next=...` (comportamento já existente, só confirmar que sobrevive à renomeação); cada papel acessando sua própria rota → dashboard correto, com saudação e papel certos.

## Fora do escopo (é da TASK-005B)

Tokens de cor/tipografia/espaçamento, `tailwind.config.ts`, `src/app/globals.css`, `next/font`, qualquer componente de `src/components/ui/**`, refatoração visual de `Button`/`Input`/`FormMessage`, ícones, sidebar/header/drawer com estilo real, qualquer decisão de aparência.

## Arquivos permitidos

`src/app/admin/**`, `src/app/profissional/**`, `src/app/paciente/**` (renomeados a partir dos route groups existentes), `src/app/acesso-negado/page.tsx`, `src/app/not-found.tsx`, `src/app/(auth)/loading.tsx`, `src/app/(auth)/error.tsx`, `src/components/shell/**` (novo), `src/modules/auth/guard.ts` (só o redirecionamento descrito no item 4), `tests/integration/**`, `tests/e2e/**`, `docs/DESIGN_SYSTEM.md`/`docs/DECISIONS.md` (só se um ajuste arquitetural real for descoberto durante a execução — não reescrever o que já foi decidido nesta rodada).

## Arquivos proibidos

`tailwind.config.ts`, `src/app/globals.css`, `src/components/ui/**`, `src/components/auth/**` (já existem, não precisam mudar aqui), `src/middleware.ts`, `src/lib/supabase/**`, `supabase/**`, `scripts/**`, `package.json` (nenhuma dependência nova nesta tarefa).

## Critérios de aceite

- `/admin`, `/profissional`, `/paciente` respondem como URLs reais (não mais route groups invisíveis).
- Paciente autenticado acessando `/admin` → `/acesso-negado` (não `/login`).
- Usuário não autenticado acessando qualquer uma das três rotas → `/login?next=...` (comportamento preservado).
- Cada dashboard mostra a saudação e o papel corretos, sem nenhum dado de negócio inventado.
- `AppShell` é um único componente reutilizado pelos três — nenhuma cópia divergente.
- Nenhum token/cor/fonte de marca introduzido nesta tarefa.

## Comandos obrigatórios

```
npm run supabase:start
node scripts/bootstrap-local-test-users.mjs
npm run lint
npx tsc --noEmit
npm run test
npm run test:integration
npx playwright test
npm run build
```

## Checklist

- [ ] Rotas renomeadas, sem quebrar o comportamento de proteção já existente.
- [ ] `AppShell` único, sem estilo de marca.
- [ ] `/acesso-negado` funcional para o caso de papel incorreto.
- [ ] Testes de autorização/navegação passando para os 3 papéis + anônimo.
- [ ] Nenhum arquivo da lista de proibidos tocado.
- [ ] Commit local, sem push.
- [ ] Relatório no formato de `docs/WORKFLOW.md`.

## Riscos

- Renomear pastas de route group é uma mudança estrutural — testar exaustivamente que nada mais dependia do nome antigo (ex.: nenhum import relativo usa o caminho com parênteses).
- `EmptyState`/mensagens de erro ainda sem componente formal (é da 005B) — usar texto simples nesta tarefa, sem inventar estilo.

## Git

Commit local ao final, sem push — revisão decide a publicação, como nas tarefas anteriores.

## Relatório obrigatório

Objetivo; causa raiz; alterações realizadas; arquivos modificados; comandos executados com resultado; testes de autorização/navegação (resultado de cada cenário); riscos; pendências; hash do commit local.
