# Design System — aliviar-conexao

Documento canônico da identidade visual e dos padrões de interface do produto. Referenciado por `docs/ENGINEERING_PLAN.md` e pelas ADRs de design em `docs/DECISIONS.md` (ADR-008, ADR-009) — não duplicar o conteúdo deste arquivo em outro lugar.

Este documento define **decisões e tokens**. A implementação (CSS, componentes React, `tailwind.config.ts`) é feita pela TASK-005B a partir do que está registrado aqui.

## 0. Contexto e referências

A direção visual parte de três materiais aprovados pelo usuário: a marca "Aliviar — Curadoria Médica Independente" (símbolo com pessoa central, mãos de acolhimento, forma de coração, azul profundo e verde sálvia); materiais institucionais (fundo branco/marfim, azul-marinho/petróleo, verde orgânico discreto, dourado só como pequeno acento, fotografia editorial real, bastante espaço negativo, linhas finas); e a referência pública `aliviar-temp.vercel.app`, tratada **apenas como ponto de partida**.

**Divergência identificada e deliberada:** visitei a referência pública para esta análise. Ela usa turquesa/teal saturado como cor dominante e um avatar ilustrado em estilo cartoon (vídeo de apresentação). Isso **contradiz** a direção aprovada nesta rodada (azul profundo + sálvia discreta, sem ilustração cartoon — ver seção 8). Este documento segue a direção escrita aprovada pelo usuário, não o tratamento visual atual do site de referência. Não copiar a paleta nem o estilo de ilustração de lá.

O placeholder atual do projeto (`public/favicon.svg`, quadrado teal com "AC") também não reflete a marca aprovada — é um placeholder técnico da TASK-001, a ser substituído quando houver asset oficial de logo (nunca recriado/redesenhado por um agente — ver seção 8).

## 1. Princípios

- **Clareza** — hierarquia visual óbvia, uma ação primária por tela, texto direto.
- **Cuidado** — tom acolhedor em toda a interface, inclusive em erros e estados vazios (seção 6).
- **Confiança** — consistência visual estrita; nada "quebra o padrão" sem motivo.
- **Discrição** — a marca comunica por espaço negativo e tipografia, não por cor saturada; dourado é sempre acento, nunca protagonista.
- **Acessibilidade** — WCAG AA como piso, não meta (seção 9).
- **Consistência** — todo componente consome tokens semânticos (seção 2); nenhuma cor de marca é escrita solta no código.
- **Responsividade** — mobile-first em toda a interface autenticada (seção 10).

## 2. Tokens

Implementados como variáveis CSS em `:root` (`src/app/globals.css`) e espelhados em `tailwind.config.ts` (`theme.extend`), para que utilitários Tailwind semânticos (`bg-brand-primary`, `text-ink`, etc.) existam — nunca `bg-blue-800` ou `text-gray-900` soltos pelo código de produto a partir da TASK-005B em diante.

### 2.1 Cores

| Token | Valor de referência | Uso | Contraste validado |
|---|---|---|---|
| `--color-brand-primary` | `#123B67` | Ações primárias, links, elementos de marca | Branco sobre este tom: **11,4:1** (AAA) |
| `--color-brand-primary-deep` | `#0E2F52` | Hover/pressed de primário, fundos escuros pontuais | Branco sobre este tom: **13,6:1** (AAA) |
| `--color-brand-sage` | `#7F9E8C` | Superfície de badges/tags, acentos decorativos | **Não usar como texto sobre branco/marfim** (contraste 2,9:1 — reprova AA). Texto escuro (`--color-ink`) sobre sálvia: **4,6:1** (passa AA texto normal) |
| `--color-brand-sage-light` | `#A8C0AE` | Fundos decorativos leves (faixas, ilustração de fundo) | Só decorativo — contraste 1,9:1 contra branco, nunca para texto |
| `--color-brand-gold` | `#B08D57` (provisório) | Bordas finas, ícones pontuais, pequenos acentos — **nunca** preenchimento grande nem texto corrido | A validar contra o asset oficial de logo quando disponível |
| `--color-bg-canvas` | `#F7F5F1` | Fundo de página (marfim) | — |
| `--color-bg-surface` | `#FFFFFF` | Cards, painéis, inputs | — |
| `--color-ink` | `#1B2733` | Texto principal | Sobre `--color-bg-canvas`: **15,1:1**; sobre branco: **15,9:1** |
| `--color-ink-muted` | `#5B6672` | Texto secundário/legendas | Sobre branco: **5,1:1** (passa AA texto normal) |
| `--color-border` | `#E4E0D8` | Linhas finas, divisores, borda padrão de input | Decorativo — não carrega informação sozinho |
| `--color-focus-ring` | `#123B67` (mesmo que primary) | Anel de foco visível | Usado com offset + espessura suficiente para não depender só de cor (seção 9) |
| `--color-success` / `--color-success-surface` | `#2F6B4F` / `#E7F0EA` | Texto/ícone de sucesso / fundo de alerta de sucesso | Texto sobre surface: a validar em implementação, alvo ≥ 4,5:1 |
| `--color-warning` / `--color-warning-surface` | `#8A5A1F` / `#F5EBDD` | Texto/ícone de aviso / fundo de alerta de aviso | idem |
| `--color-error` / `--color-error-surface` | `#8B2E2E` / `#F6E7E7` | Texto/ícone de erro / fundo de alerta de erro | idem |

**Pendência explícita**: os tons de sucesso/aviso/erro acima são ponto de partida, não finais — a TASK-005B deve rodar um checador de contraste real (ex.: `axe`, WebAIM) contra os pares texto/fundo antes de finalizar. Os hexadecimais de marca (`#123B67`, `#0E2F52`, `#7F9E8C`, `#A8C0AE`, `#F7F5F1`) são os fornecidos pelo usuário nesta rodada — meus cálculos de contraste (fórmula WCAG de luminância relativa) confirmam que são utilizáveis nos papéis acima, mas o dourado ainda não tem valor final aprovado.

### 2.2 Tipografia

Duas famílias, papéis distintos (nunca misturar):

- **Serif editorial** (`--font-serif`): só para nome de marca, títulos institucionais/editoriais, destaques de página pública. **Nunca em UI funcional** (formulários, tabelas, navegação, botões).
- **Sans-serif funcional** (`--font-sans`): toda a interface autenticada — formulários, tabelas, navegação, textos de corpo, botões.

**Recomendação e justificativa:**

| Papel | Fonte recomendada | Por quê |
|---|---|---|
| Serif editorial | **Fraunces** (Google Fonts) | Serifa contemporânea com caráter editorial/premium sem ser clássica-corporativa; suporte completo a diacríticos do português (subset `latin`); alternativa mais conservadora: **Lora** |
| Sans-serif funcional | **Inter** (Google Fonts) | Altíssima legibilidade em tamanhos pequenos (tabelas, formulários), hinting excelente, suporte completo a português, adotada amplamente em produtos "premium/consultivo" sem parecer genérica; alternativa mais "humana": **Public Sans** |

Ambas via `next/font/google`, **nunca** `<link>` externo ou `@import` de CSS: isso resolve simultaneamente os quatro critérios pedidos — **desempenho** (self-hosted no build, sem requisição externa em runtime), **privacidade** (nenhum IP do usuário é enviado ao Google Fonts em runtime), **offline/local** (arquivos ficam embutidos no build, funcionam sem rede), e **suporte a português** (subset `latin` do Google Fonts cobre todos os diacríticos usados em pt-BR). Carregar **só os pesos usados** (400/500/600 para ambas as famílias) — nunca a família inteira.

Escala (mobile-first, aplicada via classes Tailwind mapeadas aos tokens):

| Token | Tamanho / line-height | Uso |
|---|---|---|
| `--text-xs` | 12px / 16px | Legendas, metadados |
| `--text-sm` | 14px / 20px | Texto secundário, tabelas |
| `--text-base` | 16px / 24px | Corpo padrão, formulários |
| `--text-lg` | 18px / 28px | Destaque de corpo |
| `--text-xl` | 20px / 28px | Subtítulo de seção |
| `--text-2xl` | 24px / 32px | Título de página (sans, funcional) |
| `--text-3xl` | 30px / 38px | Título editorial (serif) |
| `--text-4xl` | 36px / 44px | Destaque institucional (serif, só páginas públicas) |

Pesos: `400` (regular), `500` (medium — labels, ênfase leve), `600` (semibold — títulos, botões). Não usar pesos além desses três nesta fase.

### 2.3 Espaçamento, raios, sombras, bordas

- **Espaçamento**: reutilizar a escala padrão do Tailwind (base 4px) — já suficientemente granular; não redefinir. Convenção de uso: `gap-4` entre campos de formulário, `p-6`/`p-8` em cards e seções, `px-4` (mobile) / `px-8` (desktop) de margem de página.
- **Raios**: `--radius-sm: 6px` (badges, inputs), `--radius-md: 10px` (botões, cards), `--radius-lg: 16px` (modais, superfícies grandes). Consistente com "linhas finas e elegantes" — nada muito arredondado (não é um app de consumo lúdico).
- **Sombras**: `--shadow-sm` (elevação sutil de card), `--shadow-md` (dropdown/popover), `--shadow-lg` (modal/dialog) — sempre suaves e de baixo contraste; nunca sombras escuras/pesadas.
- **Bordas**: `1px solid var(--color-border)` como padrão; dourado (`--color-brand-gold`) só em acentos deliberados e pontuais (ex.: uma borda superior fina num card de destaque), nunca como borda padrão de todo componente.
- **Largura máxima**: `--content-max-width: 72rem` (1152px) para área de conteúdo do AppShell; `--reading-max-width: 40rem` (640px) para blocos de texto longo/editorial.
- **Breakpoints**: padrão do Tailwind (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536) — sem customização. O AppShell colapsa sidebar → drawer abaixo de `lg`.
- **Transições**: `--duration-fast: 150ms` (hover/focus), `--duration-base: 200ms` (maioria das transições de UI), `--duration-slow: 300ms` (abrir/fechar drawer/dialog); easing único `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`. Respeitar `prefers-reduced-motion` globalmente (seção 9).
- **Z-index**: escala explícita e única — `--z-dropdown: 20`, `--z-sticky-header: 30`, `--z-drawer: 40`, `--z-modal-overlay: 50`, `--z-modal: 51`, `--z-toast: 60`. Nunca usar valores arbitrários fora desta escala.

## 3. Componentes fundamentais

Catálogo desta fase (nada além disso — sem Data Grid complexo nem abstrações especulativas):

**Já existem (TASK-004B), a refatorar para tokens semânticos na TASK-005B** — hoje usam cores literais do Tailwind (`teal-700`, `gray-*`, `red-*`, `green-*`), que é exatamente o tipo de "cor de marca espalhada" que os tokens acima substituem:
- `Button` (`src/components/ui/button.tsx`)
- `Input` (`src/components/ui/input.tsx`)
- `FormMessage` (`src/components/ui/form-message.tsx`)

**Novos, nesta ordem de prioridade** (fundamentais para o AppShell e formulários primeiro; navegação/overlay depois; dados por último):

1. `FormField` (agrupa label + controle + mensagem de erro — hoje cada formulário de auth repete esse padrão manualmente; ver "duplicações" na seção 11)
2. `Textarea`, `Select`, `Checkbox`, `Radio`
3. `Card`
4. `Badge` (usado para exibir o papel ativo no AppShell)
5. `Alert` (variantes success/warning/error, reaproveitando os tokens de superfície)
6. `Avatar`
7. `Spinner`, `Skeleton`
8. `EmptyState`
9. `Dropdown/Menu`, `Tooltip`
10. `Tabs`, `Breadcrumb`
11. `Dialog`, `Drawer` (drawer é o mecanismo de navegação mobile do AppShell — prioridade alta apesar de estar nesta posição na lista de dependência técnica)
12. `Toast`
13. `Table` básica, `Pagination`, `SearchField`

## 4. Estados

Todo componente interativo aplicável considera: `default`, `hover`, `focus-visible` (anel visível, nunca só mudança de cor), `active`, `disabled` (cursor + opacidade reduzida, nunca some do layout), `loading` (spinner/skeleton, nunca layout shift), e, quando aplicável, `success`/`warning`/`error` via os tokens de superfície da seção 2.1.

## 5. Layout autenticado — AppShell

Um único componente `AppShell` compartilhado pelos três papéis (não três implementações divergentes) — recebe o papel ativo e o estado de sessão já resolvidos (via `requireRole()`/`getAuthState()`, que já existem desde a TASK-004A) e renderiza:

- **Header**: identidade do usuário (nome, avatar), badge do papel ativo, botão de menu mobile (abre o Drawer), espaço para breadcrumb quando a página precisar.
- **Sidebar (desktop, ≥ `lg`)**: navegação principal + logout.
- **Drawer (mobile, < `lg`)**: mesma navegação da sidebar, em overlay.
- **Área principal**: `max-width` do token `--content-max-width`, padding consistente (seção 2.3).

Navegação inicial (única, igual para os três papéis nesta fase — nenhuma feature exclusiva por papel existe ainda para justificar itens diferentes):

- Início
- Perfil
- Configurações
- Sair

Itens futuros (comunidade, instituições, benefícios, agenda, etc.) ficam **documentados como reservados** neste arquivo, não como links inativos na interface — um link que não leva a lugar nenhum é pior do que a ausência do link.

## 6. Workspaces por papel

**Achado arquitetural desta análise**: as rotas `(admin)`, `(profissional)`, `(paciente)` hoje são *route groups* do Next.js (parênteses) — eles não aparecem na URL. Isso significa que colocar um `page.tsx` dentro de qualquer um deles hoje resolveria para `/`, colidindo com `(public)/page.tsx`. Não há como ter `/admin`, `/profissional`, `/paciente` como URLs reais mantendo a estrutura atual.

**Decisão** (TASK-005A executa isto): renomear as três pastas de route group para segmentos reais — `src/app/admin/`, `src/app/profissional/`, `src/app/paciente/` — movendo o `layout.tsx` existente (que já chama `requireRole()`, sem alteração de comportamento) e adicionando um `page.tsx` mínimo em cada. Isso **não exige nenhuma mudança no middleware**: qualquer caminho fora da lista pública já exige sessão por padrão (comportamento já existente da TASK-004A), então `/admin`, `/profissional`, `/paciente` já ficam protegidos automaticamente assim que deixam de ser route groups invisíveis.

Cada dashboard inicial contém, no mínimo: saudação com o nome do usuário (`profile.displayName`), rótulo do papel ativo, um `EmptyState` (nenhum dado de negócio inventado) e atalhos **apenas** para "Perfil"/"Configurações" (únicas áreas que vão existir de fato nesta fase).

## 7. Estados globais

| Estado | Mecanismo | Tom |
|---|---|---|
| Loading | `loading.tsx` do Next.js por segmento (`admin/`, `profissional/`, `paciente/`, `(auth)/`) usando `Spinner`/`Skeleton` | — |
| Error boundary | `error.tsx` por segmento | "Não foi possível concluir esta etapa agora. Tente novamente." — nunca stack trace nem detalhe técnico |
| Not found | `not-found.tsx` global | "Esta página não existe ou foi movida." + link para a área do usuário |
| Acesso negado (autenticado, papel errado) | **Refinamento de `requireRole()`** (TASK-005A): hoje redireciona direto para `/login` quando o papel não bate — confuso para quem já está logado. Passa a redirecionar para uma página `/acesso-negado` dedicada. Se **não** houver sessão, continua indo para `/login` (comportamento correto, sem alteração) | "Você não tem acesso a esta área com o seu perfil atual." |
| Empty state | Componente `EmptyState` | "Ainda não há informações para exibir." |
| Sessão expirada | Reaproveita o redirect padrão do middleware para `/login?next=...`; a página de login mostra uma mensagem neutra quando chega via redirect | "Você precisa entrar para continuar." |
| Indisponibilidade temporária | Padrão de uso do `Alert` (variant warning), sem rota dedicada — não há gatilho concreto para isso ainda | "Alguns recursos estão indisponíveis no momento. Tente novamente em instantes." |

Nenhuma mensagem de erro (em nenhum estado acima) revela detalhe técnico, stack trace, nome de tabela/coluna, ou qualquer informação que ajude alguém a mapear a infraestrutura.

## 8. Ícones e imagens

- **Biblioteca de ícones recomendada**: `lucide-react` — traço fino consistente (alinhado com "linhas finas e elegantes"), tree-shakeable (só importa o ícone usado), TypeScript nativo, license MIT. Justificativa técnica: nenhuma outra biblioteca de ícones está instalada hoje; esta é a única adição proposta, e resolve a exigência de "uma única biblioteca consistente" sem ambiguidade de estilo (evita misturar contornos finos com ícones sólidos).
- Dourado só como acento pontual em ícones/linhas — nunca preenchimento grande.
- Fotografia editorial real: reservada a páginas institucionais/públicas (`(public)`), **nunca** dentro do AppShell/dashboard — o painel autenticado é funcional, não uma página institucional (requisito explícito do usuário).
- **Nenhuma ilustração cartoon** — diferente do tratamento visto na referência pública `aliviar-temp.vercel.app` (ver seção 0).
- Logo e variações são ativos oficiais da marca — o `public/favicon.svg` atual é um placeholder técnico da TASK-001 (quadrado teal "AC"), não a marca aprovada. Nenhum agente deve desenhar, recriar ou "interpretar" um logo — isso aguarda o asset oficial do usuário.

## 9. Acessibilidade

Piso mínimo (WCAG AA), já parcialmente estabelecido pela TASK-004A/B e a estender:

- Contraste AA validado para todo par texto/fundo antes de qualquer componente ir para produção (ver ressalva na seção 2.1 sobre sucesso/aviso/erro).
- Foco visível sempre (`--color-focus-ring` + espessura/offset suficientes) — nunca `outline: none` sem substituto.
- Navegação completa por teclado, incluindo `Dialog`/`Drawer` com *focus trap* e retorno de foco ao fechar (padrão de acessibilidade de modal).
- Labels e descrições associados corretamente (`htmlFor`/`id`, `aria-describedby` para erros) — já é o padrão em `Input` desde a TASK-004B; manter.
- Alvos de toque mínimos de 44×44px, especialmente na navegação mobile (Drawer).
- Respeitar `prefers-reduced-motion`: transições reduzidas/removidas globalmente via media query — não por componente.
- Nunca depender só de cor: estados de erro/sucesso sempre acompanhados de texto/ícone.
- HTML semântico (`<nav>`, `<main>`, `<aside>`, `<header>` no AppShell; `role="alert"` em mensagens, já usado desde a TASK-004B).
- Toasts e mensagens dinâmicas anunciáveis por leitor de tela (`aria-live="polite"`).

## 10. Responsividade

Mobile-first em toda a interface autenticada (já é o padrão herdado da TASK-004B). AppShell colapsa em `lg` (1024px). Tabelas usam contêiner com rolagem horizontal própria abaixo de `md`, nunca espremendo colunas. Espaçamento e alvos de toque maiores em mobile.

## 11. Duplicações e inconsistências encontradas nesta auditoria

- `AuthCard`, `LoginForm`, `RequestPasswordResetForm` e `UpdatePasswordForm` repetem manualmente o padrão "label + input + mensagem de erro" — candidato natural ao futuro `FormField` (seção 3, item 1), evitando repetição quando novos formulários (perfil, configurações) forem criados.
- `Button`/`Input`/`FormMessage` usam cores literais do Tailwind (`teal-700`, `gray-*`, `red-*`, `green-*`) em vez de tokens — a ser corrigido na TASK-005B (seção 3).
- Não há utilitário de composição de classes (`clsx`/`tailwind-merge`) — os componentes atuais concatenam string manualmente (`` `${variantClasses[variant]} ${className}` ``); função sozinha e barata, mas vai ficar frágil conforme mais variantes forem adicionadas. Proposta: adicionar um pequeno `cn()` (clsx + tailwind-merge) como utilitário único, não mais que isso.
- `layout.tsx` raiz (`src/app/layout.tsx`) tem `bg-white text-gray-900` direto no `<body>` — deveria usar os tokens de canvas/ink assim que existirem.
- Nenhuma fonte customizada configurada ainda (`next/font` não está em uso) — o app roda com a fonte padrão do navegador.
- `tailwind.config.ts` está no estado default (`theme: { extend: {} }`) — nenhuma configuração de tema ainda, ou seja, não há nada para "desfazer": esta é uma folha em branco, sem risco de quebra ao introduzir os tokens.

Nenhuma duplicação estrutural grave encontrada além dessas — a base de código é pequena o suficiente para que a introdução de tokens/componentes seja direta, sem necessidade de uma migração complexa.
