# TASK-001 — Scaffold técnico inicial

**Status:** Aprovada. Delegada formalmente pelo Claude Code (Engenheiro Líder) ao Cursor (Engenheiro de Implementação), conforme `docs/AGENTS.md` e `docs/WORKFLOW.md`. Este documento é a versão pronta para envio — pode ser colado diretamente no Cursor sem adaptação.

---

## Objetivo

Criar o scaffold técnico inicial do `aliviar-conexao`: um projeto Next.js (App Router) + TypeScript + Tailwind CSS executável, com a estrutura de diretórios modular do plano de engenharia, ferramentas de qualidade (ESLint/Prettier), testes configurados (Vitest + Playwright) com pelo menos um smoke test cada, e um client Supabase preparado via variáveis de ambiente.

**Sem projeto Supabase real ainda e sem nenhuma lógica de negócio.** Isto é infraestrutura de projeto, não uma funcionalidade.

## Escopo

Dentro do escopo:

- Inicialização do projeto Next.js (App Router) com TypeScript em modo `strict` e Tailwind CSS.
- Estrutura de diretórios modular:
  - `src/app/` com os route groups `(public)`, `(auth)`, `(admin)`, `(profissional)`, `(paciente)`.
  - `src/modules/` com pastas para os módulos do MVP (`auth`, `profiles`, `discovery`, `connection`) contendo apenas estrutura mínima vazia (sem regra de negócio).
  - `src/modules/` com pastas reservadas para módulos futuros (`community`, `institutions`, `benefits`, `programs`, `ai`, `partners`), cada uma apenas com um `README.md` de uma linha explicando que aguarda escopo próprio.
  - `src/components/`, `src/lib/`, `src/types/`.
- Configuração de ESLint + Prettier (regras padrão do Next.js).
- Configuração de Vitest (`tests/unit/`) com 1 smoke test passando.
- Configuração de Playwright (`tests/e2e/`) com 1 smoke test passando (ex.: página inicial carrega e responde).
- `src/lib/supabase/` com factories de client Supabase (browser e server), lendo `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `process.env`, com tipos explícitos — sem valores reais e sem uso de service role key.
- `.env.example` listando apenas os nomes dessas duas variáveis, sem valores.
- `supabase/config.toml` (configuração local do Supabase CLI, sem credenciais).
- Página inicial mínima (status/hello), sem lógica de negócio.

Fora do escopo (não implementar nesta tarefa):

- Qualquer tela ou regra de negócio: autenticação real, cadastro, login, perfis, busca, conexão.
- Qualquer migration real de banco de dados.
- Qualquer projeto Supabase real (criação de projeto, chaves reais).
- Qualquer design system customizado além do Tailwind padrão.
- Qualquer pipeline de CI (isso é tarefa futura do backlog).

## Arquivos permitidos

Criação de arquivos novos, na raiz do repositório:

- `package.json` e `package-lock.json` (usar `npm`)
- `tsconfig.json`, `next.config.ts`
- `tailwind.config.ts`, `postcss.config.js`
- Configuração de ESLint e Prettier (`eslint.config.*` ou `.eslintrc*`, `.prettierrc*`)
- `vitest.config.ts`, `playwright.config.ts`
- `src/**` (`app/`, `modules/`, `components/`, `lib/`, `types/`, conforme a estrutura descrita acima)
- `tests/**` (`unit/`, `e2e/`)
- `supabase/config.toml`
- `public/**` (assets estáticos mínimos)
- `.env.example`
- `.nvmrc` (opcional)

Permitido também: **adicionar** linhas a `.gitignore` (nunca remover as existentes), apenas para artefatos de build/dependências (`node_modules/`, `.next/`, etc.).

## Arquivos proibidos

- Qualquer arquivo em `docs/**`, `CLAUDE.md`, `README.md`, `.cursor/**` — não editar, não apagar.
- Qualquer arquivo `.env`, `.env.local`, ou qualquer arquivo contendo valor real de credencial.
- Migrations em `supabase/migrations/`.
- Qualquer código de lógica de negócio dentro de `src/modules/auth`, `src/modules/profiles`, `src/modules/discovery`, `src/modules/connection` — essas pastas só podem conter estrutura mínima vazia (ex.: arquivo de índice vazio ou placeholder), nunca implementação de regra de negócio.
- Qualquer código dentro de `src/modules/community`, `src/modules/institutions`, `src/modules/benefits`, `src/modules/programs`, `src/modules/ai`, `src/modules/partners` além de um `README.md` de uma linha.
- Remoção ou reescrita de conteúdo existente em `.gitignore` além de adições necessárias.

## Comandos obrigatórios

Executar e confirmar sucesso de todos, nesta ordem:

```
git status
npm install
npm run lint
npx tsc --noEmit
npm run build
npm run test
npx playwright test
```

## Critérios de aceite

- `npm install` conclui sem erro.
- `npm run build` conclui sem erro.
- `npm run lint` sem erros.
- `npx tsc --noEmit` sem erros de tipagem.
- `npm run test` (Vitest) passa, com ao menos 1 teste de smoke.
- `npx playwright test` passa, com ao menos 1 teste de smoke.
- Estrutura de diretórios corresponde exatamente à descrita na seção "Escopo".
- Nenhum arquivo fora da lista de "Arquivos permitidos" foi criado, editado ou removido.
- Nenhum segredo (chave, token, senha) foi commitado em nenhum arquivo.

## Validações

Antes de reportar a tarefa como concluída, confirmar e registrar no relatório de conclusão:

- Saída de cada um dos comandos obrigatórios (sucesso/falha).
- `git status` mostrando exatamente os arquivos esperados como novos/alterados — nenhum arquivo fora do escopo.
- Verificação manual de que nenhum arquivo `.env`/`.env.local` foi criado ou commitado.
- Verificação manual de que `src/modules/*` do MVP não contém lógica de negócio (apenas estrutura vazia).
- Versões de Node/npm e das principais dependências (Next.js, React, TypeScript, Tailwind) usadas, para registro.

## Riscos conhecidos

- Divergência de versões de dependências em relação ao restante do ecossistema Aliviar — mitigar usando versões estáveis mais recentes (LTS) e registrando as versões escolhidas no relatório de conclusão.
- Sem projeto Supabase real nesta etapa, não é possível testar integração de fato — mitigado por manter o client Supabase sem lógica de negócio (a integração real entra na próxima fase, após provisionamento do Supabase de desenvolvimento).
- Risco de over-engineering da estrutura modular antes de existirem features reais — mitigado por manter os módulos futuros como pastas vazias com `README.md` mínimo, sem abstrações antecipadas.

## Checklist de revisão

A ser preenchida pelo Cursor antes de submeter o relatório de conclusão ao Claude Code:

- [ ] Todos os comandos obrigatórios executados e com saída de sucesso anexada ao relatório.
- [ ] Estrutura de diretórios confere exatamente com a seção "Escopo".
- [ ] Nenhum arquivo fora da lista de "Arquivos permitidos" foi tocado (`git status` conferido).
- [ ] Nenhum arquivo de segredo (`.env`, `.env.local`, chaves) criado ou commitado.
- [ ] Módulos do MVP (`auth`, `profiles`, `discovery`, `connection`) sem lógica de negócio implementada.
- [ ] Módulos futuros (`community`, `institutions`, `benefits`, `programs`, `ai`, `partners`) contêm apenas `README.md` de uma linha.
- [ ] `src/lib/supabase/` não contém nenhuma chave/valor real, apenas leitura de `process.env`.
- [ ] Relatório de conclusão redigido com: objetivo, alterações realizadas, arquivos modificados, comandos executados, validações realizadas, riscos identificados, pendências e próximos passos (formato de `docs/WORKFLOW.md`).

## Resultado esperado

Repositório com projeto Next.js executável localmente (`npm run dev`), tipado, lintado e testável, com a estrutura modular do plano criada (módulos do MVP com estrutura mínima vazia; módulos futuros como pasta reservada), pronto para receber a próxima tarefa: provisionamento do Supabase de desenvolvimento e implementação de autenticação/perfis.
