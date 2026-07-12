# Convenções de Código — aliviar-conexao

Documenta padrões **já em vigor** no código existente — não introduz nenhum padrão novo. Serve para que qualquer pessoa (ou agente) que adicione código ao produto siga o que já está estabelecido, em vez de introduzir uma segunda convenção concorrente.

Não duplica: `docs/DESIGN_SYSTEM.md` (tokens visuais, componentes), `docs/ENGINEERING_PLAN.md` (arquitetura, stack, módulos), `docs/AGENTS.md`/`docs/WORKFLOW.md` (processo de trabalho, não convenção de código).

## Componentes React

- **Function components simples**, não `forwardRef` — nenhum componente em `src/components/ui/` usa `forwardRef` hoje; siga o padrão existente a menos que uma necessidade real de `ref` apareça.
- **Variantes por objeto de lookup**, não `class-variance-authority` (não é dependência do projeto) — ver `button.tsx`/`card.tsx`: um objeto `Record<Variant, string>` mapeado pela prop, combinado com `cn()`.
- **`cn()`** (`src/components/ui/cn.ts`, `clsx` + `tailwind-merge`) é o único combinador de classes — nunca concatenar strings de classe manualmente quando há possibilidade de conflito de utilitário.
- **Server Components por padrão.** `"use client"` só onde há estado, efeito ou evento (`AppShell`, formulários, `ToastViewport`) — nunca "por via das dúvidas".
- **Nenhuma biblioteca de primitivos de UI (Radix, etc.)** é usada — `Dialog`/`Drawer`/`Tooltip`/`DropdownMenu` são implementações próprias. Não introduzir uma segunda forma de resolver o mesmo problema sem necessidade comprovada.

## Módulos de domínio (`src/modules/*`)

- Padrão interno por módulo (quando o módulo tem lógica, não apenas placeholder): `schema.ts` (Zod), `types.ts`, `actions.ts` (Server Actions), e arquivos de responsabilidade única quando o módulo cresce (ex.: `auth/` tem `session.ts`, `guard.ts`, `role-home.ts`, `redirect-safety.ts`, `public-paths.ts` em vez de um único arquivo grande).
- Módulos **nunca** acessam dado de outro módulo diretamente — só por contrato explícito (função/tipo exportado). Ver `docs/ENGINEERING_PLAN.md`, seção 2.
- Módulos reservados para o futuro (`community`, `institutions`, `benefits`, `programs`, `ai`, `partners`) permanecem como `README.md` de uma linha — nenhum código, tipo ou tabela antecipado sem ADR de escopo próprio.

## Rotas (App Router)

- Áreas por papel (`/admin`, `/profissional`, `/paciente`) são **segmentos reais**, nunca route groups — ADR-009. Route groups (`(public)`, `(auth)`) são usados só para compartilhar layout sem aparecer na URL.
- Toda página de área autenticada chama `requireRole(...)` (`src/modules/auth/guard.ts`) antes de renderizar — nunca confia só no `middleware.ts` (que é otimista/UX, não a fronteira de segurança real; essa é o RLS no Postgres).
- Toda rota nova decide explicitamente sua indexação (`export const metadata = { robots: {...} }`) — áreas autenticadas são sempre `noindex`.

## Autorização e segurança

- **RLS é a fronteira real.** Nenhuma checagem de papel no código da aplicação substitui uma policy de RLS — é conveniência de UX (redirecionamento), nunca a garantia de segurança (`docs/ENGINEERING_PLAN.md`, seção 8).
- Papéis são um catálogo + associação N:N (`roles`/`user_roles`), nunca um enum fixo — ADR-006. Checagem de papel sempre via helper genérico, nunca `if (role === "x")` espalhado.

## Validação

- **Zod em toda fronteira** (formulário, Server Action) — nunca confiar em dado de entrada sem `safeParse`/schema.

## Testes

Quatro camadas, cada uma com seu próprio config Vitest/Playwright — não misturar responsabilidade entre elas:

- `tests/unit/` (`vitest.config.ts`, ambiente `node`) — regras de domínio e funções puras (schemas, helpers). Toda regra de negócio nova ganha teste aqui.
- `tests/components/` (`vitest.components.config.ts`, `jsdom` + Testing Library) — comportamento de componente isolado.
- `tests/integration/` (`vitest.integration.config.ts`, `node`) — fluxos que tocam Supabase local de verdade.
- `tests/e2e/` (`playwright.config.ts`) — fluxos críticos de usuário ponta a ponta.

## Nomenclatura

- Arquivos: `kebab-case.ts(x)`.
- Componentes: `PascalCase`.
- Funções/variáveis: `camelCase`.
- Schemas Zod: sufixo `Schema` (ex.: `signInSchema`).
- Tabelas de banco: `snake_case`, plural (`docs/ENGINEERING_PLAN.md`, seção 9).

## Comentários

Comentário só quando o **porquê** não é óbvio (uma restrição escondida, uma decisão que parece arbitrária mas não é, um workaround). Nunca comentário que repete o que o código já diz — mesma regra já aplicada durante a construção do ACE (`docs/ace/`).

## Voz e mensagens ao usuário

Todo texto visível (erro, vazio, sucesso) segue `docs/BRAND_GUIDELINES.md` — nunca mensagem técnica crua ("Erro 500", "Usuário inválido") exposta à pessoa.
