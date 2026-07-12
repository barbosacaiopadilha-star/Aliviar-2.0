# TASK-001 — Scaffold técnico inicial

Delegação do Claude Code (Engenheiro Líder) para o Cursor (Engenheiro de Implementação), no formato exigido por `docs/WORKFLOW.md`.

## Objetivo da tarefa

Criar o scaffold técnico inicial do `aliviar-conexao`: projeto Next.js (App Router) + TypeScript + Tailwind CSS executável, com a estrutura de diretórios modular definida em `docs/ENGINEERING_PLAN.md` (seção 4), ferramentas de qualidade (ESLint/Prettier), testes configurados (Vitest + Playwright) com pelo menos um smoke test cada, e um client Supabase preparado via variáveis de ambiente — **sem projeto Supabase real ainda e sem nenhuma lógica de negócio**.

## Causa raiz identificada

O repositório está em fase de planejamento — só existe documentação e governança, nenhum código de aplicação. Antes de implementar qualquer funcionalidade de negócio (autenticação, perfis, busca, conexão), é preciso um projeto técnico executável, tipado, testável e com a estrutura modular já definida, para não acumular decisões estruturais ad-hoc durante o desenvolvimento das features reais.

## Arquivos permitidos

Criação de arquivos novos, na raiz do repositório e conforme a estrutura de `docs/ENGINEERING_PLAN.md` (seção 4):

- `package.json` e lockfile (usar `npm`; `package-lock.json`)
- `tsconfig.json`, `next.config.ts`
- `tailwind.config.ts`, `postcss.config.js`
- Configuração de ESLint e Prettier (`eslint.config.*` ou `.eslintrc*`, `.prettierrc*`)
- `vitest.config.ts`, `playwright.config.ts`
- `src/**` (`app/`, `modules/`, `components/`, `lib/`, `types/`, conforme a estrutura do plano)
- `tests/**` (`unit/`, `e2e/`)
- `supabase/config.toml` (apenas configuração local do Supabase CLI, sem qualquer credencial)
- `public/**` (assets estáticos mínimos)
- `.env.example` (somente nomes de variáveis, nunca valores reais)
- `.nvmrc` (opcional)

Adições (não remoções) de linhas em `.gitignore`, apenas se necessário para artefatos de build/dependências (ex.: `node_modules/`, `.next/`).

## Arquivos proibidos

- Qualquer arquivo em `docs/**`, `CLAUDE.md`, `README.md`, `.cursor/**` — não editar, não apagar.
- Qualquer arquivo `.env` ou `.env.local`, ou qualquer arquivo com valor real de credencial.
- Migrations reais de banco em `supabase/migrations/` (isso é tarefa futura, após o provisionamento do Supabase de desenvolvimento).
- Qualquer tela ou lógica de negócio (autenticação, perfis, busca, conexão). Cada módulo em `src/modules/*` do MVP (`auth`, `profiles`, `discovery`, `connection`) é criado como pasta com estrutura mínima vazia, sem regra de negócio implementada. Módulos futuros (`community`, `institutions`, `benefits`, `programs`, `ai`, `partners`) são criados apenas como pasta com um `README.md` de uma linha — sem código.
- Remoção ou reescrita de conteúdo existente em `.gitignore` além de adições necessárias.

## Instruções de implementação

- Seguir exatamente a estrutura de diretórios de `docs/ENGINEERING_PLAN.md` (seção 4).
- TypeScript em modo `strict`, sem `any` implícito.
- Tailwind com configuração padrão (sem design system customizado nesta tarefa).
- ESLint + Prettier com as regras padrão do Next.js.
- Vitest configurado, com pelo menos um teste de exemplo (smoke) em `tests/unit` passando.
- Playwright configurado, com pelo menos um teste de exemplo (smoke, ex.: a página inicial carrega e responde) em `tests/e2e` passando.
- Criar `src/lib/supabase/` com factories de client Supabase (browser e server), lendo `process.env.NEXT_PUBLIC_SUPABASE_URL` e `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, com tipos explícitos — sem valores reais e sem uso de service role key.
- Criar `.env.example` listando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sem valores.
- Página inicial mínima (status/hello), sem lógica de negócio.
- Não commitar nenhum segredo.

## Critérios objetivos de aceite

- `npm install` conclui sem erro.
- `npm run build` conclui sem erro.
- `npm run lint` sem erros.
- `npx tsc --noEmit` sem erros de tipagem.
- `npm run test` (Vitest) passa.
- `npx playwright test` passa.
- Estrutura de diretórios corresponde à definida em `docs/ENGINEERING_PLAN.md` (seção 4).
- Nenhum arquivo fora da lista de "arquivos permitidos" foi criado, editado ou removido.
- Nenhum segredo foi commitado.

## Comandos de validação a executar

```
git status
npm install
npm run lint
npx tsc --noEmit
npm run build
npm run test
npx playwright test
```

## Testes obrigatórios

- Pelo menos 1 teste unitário (Vitest) de smoke.
- Pelo menos 1 teste end-to-end (Playwright) de smoke.

## Riscos conhecidos

- Divergência de versões de dependências em relação ao restante do ecossistema Aliviar — mitigar usando versões estáveis mais recentes (LTS) e registrando as versões escolhidas no relatório de conclusão.
- Sem projeto Supabase real nesta etapa, não é possível testar integração de fato — mitigado por manter o client Supabase sem lógica de negócio nesta tarefa (a integração real entra na Fase 2, após provisionamento do Supabase de desenvolvimento).
- Risco de over-engineering da estrutura modular antes de existirem features reais — mitigado por manter os módulos futuros como pastas vazias com `README.md` mínimo, sem abstrações antecipadas.

## Resultado esperado

Repositório com projeto Next.js executável localmente (`npm run dev`), tipado, lintado e testável, com a estrutura modular do plano criada (módulos do MVP com estrutura mínima vazia; módulos futuros como pasta reservada), pronto para receber a próxima tarefa: provisionamento do Supabase de desenvolvimento e autenticação/perfis (Fase 2 de `docs/ENGINEERING_PLAN.md`).
