# TASK-005B — Implementação visual do Design System (Cursor)

**Status:** Pronta para envio ao Cursor. TASK-005A **aprovada e publicada** (`origin/main` em `83ffd83`, que inclui o AppShell estrutural e uma correção de revisão: o redirecionamento pós-login agora usa `src/modules/auth/role-home.ts` para decidir a home de cada papel). Esta tarefa constrói sobre essa estrutura já publicada.

Baseada integralmente em `docs/DESIGN_SYSTEM.md` (documento canônico) e ADR-008/ADR-009 (`docs/DECISIONS.md`). Não reinterpretar ou redecidir tokens/paleta/tipografia aqui — só implementar o que já está decidido.

## Objetivo

Implementar os tokens visuais (`tailwind.config.ts`, `src/app/globals.css`), tipografia via `next/font`, refatorar os componentes existentes (`Button`, `Input`, `FormMessage`) para consumi-los, e construir o catálogo de componentes fundamentais e a aparência do `AppShell` e dos dashboards — tudo conforme `docs/DESIGN_SYSTEM.md`.

## Causa raiz

A interface hoje usa cores literais do Tailwind sem relação com a marca aprovada, não tem tipografia customizada, e o `AppShell`/dashboards criados na TASK-005A são estruturais, sem nenhum estilo de marca.

## Sequenciamento recomendado

Esta tarefa é grande — recomenda-se executar e commitar em fases internas (não são tarefas separadas, mas checkpoints dentro desta mesma delegação):

1. **Tokens e tipografia**: `tailwind.config.ts` + `globals.css` com os tokens de `docs/DESIGN_SYSTEM.md` (seção 2); `next/font/google` para `Fraunces` (serif) e `Inter` (sans), pesos 400/500/600 apenas.
2. **Refatoração dos componentes existentes**: `Button`, `Input`, `FormMessage` passam a usar os tokens (mesmo comportamento/props, só a fonte da cor/tamanho muda) + telas de autenticação (`AuthCard`, `LoginForm`, `RequestPasswordResetForm`, `UpdatePasswordForm`) atualizadas visualmente para a nova paleta.
3. **Componentes fundamentais de formulário/feedback**: `FormField`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Card`, `Badge`, `Alert`, `Avatar`, `Spinner`, `Skeleton`, `EmptyState` (nesta ordem de prioridade, conforme `docs/DESIGN_SYSTEM.md` seção 3).
4. **AppShell visual + dashboards**: header, sidebar desktop, drawer mobile (com `Dialog`/`Drawer` — trap de foco, fecha com Esc, `aria-live` quando aplicável) sobre a estrutura já criada pela TASK-005A; dashboards de `/admin`, `/profissional`, `/paciente` com o visual final.
5. **Restante do catálogo**: `Dropdown/Menu`, `Tooltip`, `Tabs`, `Breadcrumb`, `Toast`, `Table` básica, `Pagination`, `SearchField`.
6. **Ícones**: adicionar `lucide-react` (única biblioteca — ver justificativa em `docs/DESIGN_SYSTEM.md` seção 8), aplicar nos pontos já existentes (menu mobile, alertas, etc.).

## Funcionalidades e requisitos transversais

- Todo componente aplicável cobre os estados da seção 4 de `docs/DESIGN_SYSTEM.md` (default/hover/focus-visible/active/disabled/loading/success/warning/error conforme aplicável).
- Contraste AA validado de fato (ferramenta de contraste real, não só a estimativa da seção 2.1 do Design System) antes de finalizar — especialmente os tons de sucesso/aviso/erro, marcados como provisórios no documento.
- Acessibilidade (seção 9 do Design System): foco visível, navegação por teclado completa, `Dialog`/`Drawer` com focus trap e retorno de foco, `prefers-reduced-motion` respeitado globalmente, alvos de toque ≥ 44×44px, HTML semântico, `aria-live` em toasts.
- Responsividade mobile-first (seção 10): `AppShell` colapsa em `lg`; tabelas com rolagem horizontal própria abaixo de `md`.
- Nenhuma ilustração cartoon; fotografia editorial só em páginas públicas, nunca no dashboard; dourado só como acento pontual (nunca preenchimento grande); logo permanece o placeholder atual (`public/favicon.svg`) até haver asset oficial — **não redesenhar o logo**.

## Restrições — não alterar

`src/middleware.ts`, `src/lib/supabase/**`, `src/modules/auth/guard.ts`, `src/modules/auth/session.ts`, `src/modules/auth/redirect-safety.ts`, `src/modules/auth/actions.ts`, `src/modules/auth/schema.ts`, `src/modules/auth/role-home.ts` (mapa papel→rota usado no redirecionamento pós-login e em `/acesso-negado` — lógica, não estilo), `supabase/**`, `scripts/**`, a estrutura de rotas/contrato do `AppShell` definida pela TASK-005A (pode estilizar por dentro, não pode mudar o contrato de props nem a lógica de autorização). `src/components/auth/login-form.tsx` já decide corretamente o destino pós-login (`getSafeRedirectPath(next, getRoleHome(state.roles))`) — preservar essa lógica exatamente, só restilizar o formulário em volta dela. Se algo na TASK-005A parecer incompleto ou incorreto para a implementação visual, **documentar o achado e parar** — não expandir escopo nem corrigir arquitetura por conta própria.

## Testes exigidos

- **Componente** (novo: `@testing-library/react` + `jsdom` — dependência justificada, não existia forma de testar componentes React antes; usar um `vitest.components.config.ts` seguindo o mesmo padrão de `vitest.integration.config.ts`): render de cada componente novo, estados (loading/disabled/error), interação básica (abrir/fechar Dialog/Drawer, navegação de Tabs).
- **E2E (Playwright)**, estendendo `tests/e2e/auth.spec.ts` e criando `tests/e2e/appshell.spec.ts`: navegação pela sidebar (desktop) e pelo drawer (viewport mobile) funciona para cada um dos 3 papéis; dashboard mostra saudação e papel corretos; refatoração visual das telas de login/recuperação/nova senha não quebra nenhum dos 16 testes já existentes (`tests/e2e/auth.spec.ts` + `tests/e2e/authorization.spec.ts`, TASK-004B/005A) — rodar `npx playwright test` completo, não só os arquivos novos.
- Teste de contraste: documentar no relatório os pares texto/fundo verificados e a ferramenta usada.

## Segurança

- Nunca hardcodar as contas de teste técnico — ler de `test-users.local.json` (já é o padrão desde a TASK-004B).
- Nenhuma nova dependência sem justificativa registrada no relatório (mínimo: `next/font` já nativo do Next.js, `lucide-react`, `@testing-library/react` + `jsdom`, e um utilitário pequeno de composição de classes tipo `clsx`/`tailwind-merge` — nenhuma outra biblioteca de UI/componentes prontos).
- Fontes só via `next/font/google` (self-hosted no build) — nunca `<link>` externo, nunca CDN de terceiros em runtime.

## Arquivos permitidos

`tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx` (só para aplicar a fonte via `next/font`), `src/components/ui/**`, `src/components/auth/**` (refatoração visual, sem mudar comportamento), `src/components/shell/**` (estilização por dentro do contrato da TASK-005A, sem mudar props/contrato), `src/app/admin/**`, `src/app/profissional/**`, `src/app/paciente/**` (conteúdo visual do dashboard, sem alterar a chamada a `requireRole()`), `tests/components/**` (novo), `tests/e2e/**`, `vitest.components.config.ts` (novo), `package.json` (só as dependências justificadas acima).

## Arquivos proibidos

`src/middleware.ts`, `src/lib/supabase/**`, `src/modules/auth/guard.ts`, `src/modules/auth/session.ts`, `src/modules/auth/redirect-safety.ts`, `src/modules/auth/actions.ts`, `src/modules/auth/schema.ts`, `src/modules/auth/role-home.ts`, `supabase/**`, `scripts/**`, `docs/**` (exceto se pedido explicitamente).

## Comandos obrigatórios

```
npm run lint
npx tsc --noEmit
npm run test
npm run test:components
npm run build
npm run bootstrap:test-users
npx playwright test
```

## Critérios de aceite

- Nenhuma cor literal do Tailwind (`teal-*`, `gray-*`, `red-*`, `green-*` etc.) restante em componentes de produto — tudo via tokens semânticos.
- Tipografia dupla aplicada corretamente (serif só em marca/títulos editoriais, sans em toda UI funcional).
- Catálogo de componentes da seção 3 do Design System implementado (na ordem de prioridade documentada — pode ficar incompleto no fim desta rodada se justificado no relatório, mas os itens 1–8 da lista de prioridade são obrigatórios).
- `AppShell` visualmente completo (sidebar, drawer, header) sem alterar o contrato estrutural da TASK-005A.
- Todos os testes (unitários, componente, integração, E2E) passando.
- Contraste AA validado com ferramenta real, não só estimativa.
- Nenhuma dependência não justificada.

## Checklist

- [ ] Tokens implementados e usados por todo componente de produto.
- [ ] Tipografia dupla configurada via `next/font`.
- [ ] `Button`/`Input`/`FormMessage` refatorados sem quebrar comportamento (testes da TASK-004B continuam passando).
- [ ] Catálogo de componentes fundamentais (pelo menos itens 1–8 da ordem de prioridade) implementado.
- [ ] `AppShell` visual completo, respeitando o contrato da TASK-005A.
- [ ] Acessibilidade e responsividade conforme seções 9–10 do Design System.
- [ ] Contraste validado com ferramenta real.
- [ ] Nenhum arquivo da lista de proibidos tocado.
- [ ] Commit local, sem push.
- [ ] Relatório no formato de `docs/WORKFLOW.md`.

## Riscos

- Escopo grande — se não for possível concluir 100% do catálogo nesta rodada, priorizar exatamente a ordem da seção 3 do Design System e documentar o que ficou para uma rodada seguinte, em vez de entregar tudo pela metade.
- Refatoração visual das telas de autenticação pode quebrar os testes E2E existentes (TASK-004B/005A) se o comportamento (não só a aparência) mudar sem querer — rodar `npx playwright test` completo, não só os testes novos.
- Tons de sucesso/aviso/erro do Design System são provisórios — não finalizar sem checagem de contraste real.

## Git

Commit local ao final, sem push.

## Relatório obrigatório

Objetivo; causa raiz; alterações realizadas (por fase do sequenciamento); arquivos modificados; comandos executados com resultado; testes (unitário/componente/integração/E2E, resultado de cada); validação de contraste (pares e ferramenta usada); dependências novas e justificativa; riscos; pendências (itens do catálogo não concluídos, se houver); hash do commit local.
