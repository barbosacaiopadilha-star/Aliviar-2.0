# UX Stabilization & Interaction Hardening — Relatório

**2026-07-24.** Nada commitado, nada em push, nada em deploy.

## 1. Diagnóstico geral

A camada de interação está **mais saudável do que a missão supunha**. A auditoria comprovou (não supôs):

| Camada | Estado comprovado |
|---|---|
| Z-index | Sistema tokenizado (`--z-dropdown 20 → --z-toast 60`); **zero** `z-[arbitrário]` no código |
| Overlays decorativos | `immersive-backdrop` e `patient-ambient-layer` com `pointer-events-none` + `aria-hidden` na raiz |
| Dialog/Drawer | Escape fecha · foco entra ao abrir · foco **volta ao gatilho** ao fechar · `role="dialog"` + `aria-modal` · scroll do body travado |
| Button | hover, active, disabled (`cursor-not-allowed`), `aria-busy` no loading, `focus-visible:ring`, área mínima |
| Hit-testing real (DevTools) | Landing desktop: 35 elementos, **0 bloqueados** · Landing mobile: 42, **0 bloqueados**, **0 overflow** · Login: 4/4 respondem |
| Portais (Fase 5) | Nenhum menu depende do stacking do header: o único menu flutuante ancora no próprio gatilho com token `z-dropdown` acima do `z-sticky-header` — comprovado em uso real |

## 2. Causa raiz de cada problema encontrado e corrigido

**P1 — Backdrop focável nos dois primitivos modais** (`dialog.tsx`, `drawer.tsx`)
Causa raiz: o backdrop clique-para-fechar era um `<button aria-label="Fechar">` de tela cheia **na ordem de tabulação**. TAB alcançava um botão invisível; leitor de tela anunciava dois "Fechar".
Correção: `tabIndex={-1}` + `aria-hidden` + `cursor-default`. Mouse/touch continuam fechando pelo backdrop; teclado fecha por Escape ou pelo botão nomeado.

**P2 — Alvo de toque de 17px no link mais crítico da autenticação** (`login-form.tsx`)
Causa raiz: "Esqueci minha senha" sem altura mínima — 17px, abaixo até do mínimo AA de 24px (WCAG 2.5.8), e **sem anel de foco visível**.
Correção: `min-h-11` + `focus-visible:ring`, convenção da plataforma.

**P3 — Componentes órfãos convidando duplicação** (`ui/dropdown-menu.tsx`, `ui/tooltip.tsx`)
Causa raiz: primitivos criados e nunca usados (0 referências, comprovado). Implementação morta é a semente da "segunda implementação" que a Fase 11 proíbe.
Correção: removidos.

**P4 — Menu de usuário com nome de módulo** (`PortalUserMenu`)
Causa raiz: o componente único nasceu dentro de `curadoria/`, com nome de portal — convite para outro módulo criar o seu.
Correção: renomeado **`AuthenticatedUserMenu`**, movido para `components/auth/`, todos os 5 consumidores atualizados. Zero variações por módulo.

## 3. Componentes unificados (Fases 6 e 11)

| Peça | Implementação única |
|---|---|
| Menu de usuário | `auth/authenticated-user-menu.tsx` — Admin, Atendente, Curador, Concierge, Paciente, CRM/COA |
| Logout | `auth/logout-button.tsx` (loading "Saindo…", disabled durante envio) sobre `signOutAction` |
| Avatar | `ui/avatar.tsx` (já era único) |
| Modais | `ui/dialog.tsx` + `ui/drawer.tsx` (já eram únicos; agora corrigidos) |
| Dropdown | apenas o do menu de usuário — o primitivo órfão saiu |

Logout, comportamento comprovado no navegador nesta sessão: encerra a sessão no servidor (revogação **global** do Supabase — o logout local derrubou até a sessão de produção do mesmo usuário, comportamento correto de segurança), redireciona a `/login`, e `/admin` direto **ou** botão voltar pós-logout caem no login (revalidação server-side por request — não há cache de página autenticada).

## 4. Arquivos alterados

`ui/dialog.tsx` · `ui/drawer.tsx` · `auth/login-form.tsx` · `auth/authenticated-user-menu.tsx` (renomeado de `curadoria/portal-user-menu.tsx`) · `curadoria/portal-shell-container.tsx` · `shell/app-shell.tsx` · `paciente/patient-shell.tsx` · `app/paciente/layout.tsx` · **removidos**: `ui/dropdown-menu.tsx`, `ui/tooltip.tsx` · testes: `authenticated-user-menu.test.tsx` (renomeado), `overlay-primitives.test.tsx` (novo).

## 5. Testes

**Adicionados** — `overlay-primitives.test.tsx` (5): Dialog e Drawer — abre como modal com título acessível, foco entra e **volta ao gatilho**, Escape fecha, botão nomeado fecha. Somam-se aos 4 do menu (Escape devolve foco, operação só-teclado, roles ARIA) e 4 do logout (sucesso/falha/expirada/já-deslogado) da correção anterior.

**Executados**: 938 unit · **201 components** (+5) · lint e tsc limpos · build compila. Integração inalterada (140/140 na última rodada; nenhuma mudança de servidor nesta missão além do já testado).

Nota de medição: uma rodada anterior registrou 940 unit; as rodadas atuais registram 938 estáveis, com os mesmos 76 arquivos e zero falhas — discrepância de leitura, sem evidência de teste perdido.

## 6. Validações realizadas

- Hit-testing com `elementFromPoint` (página inteira, com scroll) em Landing desktop/mobile e Login
- Overflow horizontal mobile: zero
- Menu de usuário aberto/fechado/Sair no `/admin` real (sessão autenticada, antes do logout de teste)
- Pós-logout: navegação direta e histórico bloqueados

## 7. Problemas restantes (honestos)

1. **Varredura autenticada por navegador incompleta**: o teste de logout revogou globalmente as sessões (correto), e eu não insiro credenciais. CRM (contatos/funil/tarefas/agenda), COA e Área do Paciente ficaram cobertos por análise de código + testes de componente, não por hit-testing vivo. Um login seu destrava a varredura completa em minutos.
2. **Leitor de tela real** (NVDA/VoiceOver) não executado — garantias via roles ARIA testados em JSDOM.
3. Links do rodapé da Landing: 28px de altura — **conformes AA** (≥24px) por calibração deliberada documentada em fase anterior; upgrade a 44px (AAA) fica como decisão de design, não bug.
4. AliCIA: fora deste repositório; não auditável daqui.

## 8. Recomendações futuras

1. Adicionar o hit-testing de `elementFromPoint` como teste E2E (Playwright já está no projeto) rodando pós-deploy nas rotas autenticadas
2. Focus-trap completo (ciclar TAB dentro do modal) em Dialog/Drawer — hoje o foco entra e restaura, mas não cicla
3. `scope: "local"` como opção no logout se um dia "sair só deste dispositivo" virar requisito de produto — hoje a revogação global é a escolha certa
