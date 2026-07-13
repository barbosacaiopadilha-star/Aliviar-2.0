# Onboarding

Para uma pessoa ou um agente de IA (Cursor, Claude Code, Codex, Copilot ou similar) chegando a este repositório pela primeira vez. Leia nesta ordem — cada passo pressupõe o anterior.

## 0. O essencial em 3 frases

Uma pessoa conta sua história (`sua-historia`); o **Método ACE** analisa o caso em 8 etapas automáticas (P001–P008); um **Curador Médico** humano revisa e valida (P009) antes de qualquer entrega (P010). O paciente nunca recebe uma lista de médicos — recebe uma Curadoria, sempre explicada, sempre validada por humano.

## 1. Status do projeto (leia antes de tudo)

**A Versão 1.0 está congelada** (ADR-021, `docs/DECISIONS.md`). Isso muda o que "contribuir" significa aqui:

- Se você é um agente de IA lendo `CLAUDE.md`: a regra operante é "isto é correção de bug?" — se não for, não implemente sem uma decisão explícita do responsável pelo projeto de abrir uma V2.
- Se você é uma pessoa avaliando o código pela primeira vez: o que existe é deliberado e estável, não um work-in-progress — trate qualquer coisa que pareça "faltando" como possivelmente proposital (ver `docs/ace/06-governance/governance.md` e as ADRs antes de assumir que é uma lacuna).

## 2. Ordem de leitura recomendada

1. **[README.md](../README.md)** — o que o produto é, status da versão.
2. **[docs/PRODUCT_ARCHITECTURE.md](PRODUCT_ARCHITECTURE.md)** — a jornada do paciente e da equipe, em linguagem de produto.
3. **[docs/ace/README.md](ace/README.md)** — o Método ACE: os 10 protocolos, o que cada um faz e não faz.
4. **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** — arquitetura técnica (monólito modular, RLS, stack).
5. **[docs/CODEBASE_MAP.md](CODEBASE_MAP.md)** — onde cada coisa vive em `src/`.
6. **[docs/CONVENTIONS.md](CONVENTIONS.md)** — como o código já é escrito; siga o padrão existente.
7. **[docs/DATABASE.md](DATABASE.md)** — catálogo de tabelas, o que é append-only.
8. **[docs/DECISIONS.md](DECISIONS.md)** — só quando precisar entender **por que** algo é do jeito que é (ADRs).

`docs/INDEX.md` lista todo o resto por propósito, caso precise de algo mais específico (marca, landing, filme institucional).

## 3. Rodando o projeto localmente

Pré-requisitos: Node (versão em `.nvmrc`), Docker Desktop (Supabase local).

```bash
npm install
npm run supabase:start   # sobe Postgres/Auth/Storage local via Docker
npm run supabase:env     # gera .env.local a partir do Supabase local
npm run bootstrap:test-users   # cria admin/profissional/paciente de teste
npm run dev
```

Sem Docker: `npm run dev` funciona para UI, mas nada que toque o banco funciona, e `test:integration`/`test:e2e` não podem rodar — isso é uma limitação de ambiente conhecida (`docs/DEBUGGING.md`, seção 5), não um sinal de projeto quebrado.

## 4. Rodando os testes

```bash
npm run test              # unitário — sempre deve passar, sem dependências externas
npm run test:components   # componentes (jsdom) — sempre deve passar
npm run lint
npx tsc --noEmit
npm run test:integration  # requer Supabase local rodando
npm run test:e2e          # requer Supabase local rodando
npm run build              # build de produção
```

## 5. Fazendo uma mudança seguindo o padrão do projeto

1. Entenda em qual módulo a mudança vive (`docs/CODEBASE_MAP.md`).
2. Se for no ACE (`src/modules/ace/`): pare. O ACE está congelado — releia `docs/ace/06-governance/governance.md` antes de tocar qualquer arquivo ali. Uma correção de bug legítima é feita no protocolo/artefato específico, respeitando a hierarquia Constituição→Framework→Ontologia→Kernel→Especificação.
3. Se for em qualquer outro módulo: siga `docs/CONVENTIONS.md` (padrão de arquivo, nomenclatura, onde valida com Zod, como RLS é a fronteira real).
4. Escreva/rode os testes correspondentes (camada certa — `docs/CONVENTIONS.md`, seção Testes).
5. `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run test:components` antes de considerar concluído. `npm run build` se a mudança afeta rotas, config ou algo que só se manifesta no build de produção.
6. Nunca commit/push sem autorização explícita, se você é um agente de IA operando sob `docs/AGENTS.md`.

## 6. Se você é um agente de IA

`CLAUDE.md` (e `.cursor/rules/project-governance.mdc`) apontam para `docs/AGENTS.md` — o protocolo canônico de governança. Leia-o por completo antes de qualquer alteração. Resumo do que ele estabelece: papéis (quem decide o quê), fluxo obrigatório de 8 etapas por tarefa, regras de segurança (nunca segredo em código/log/commit, produção só com autorização explícita), e o critério de conclusão de projeto.

## 7. Perguntas frequentes de quem chega agora

- **"Por que `discovery`/`connection`/`community`/... estão vazios?"** — São módulos reservados de um plano de MVP anterior, nunca implementado (ver a nota no topo de `docs/ENGINEERING_PLAN.md`). O produto real é o Concierge/ACE.
- **"Por que P001 não tem um arquivo de protocolo em `src/modules/ace/protocols/`?"** — Porque é implementado como transcrição determinística da história do paciente, sem chamada a modelo de linguagem — ver `docs/CODEBASE_MAP.md`.
- **"Por que o paciente nunca vê um score ou ranking?"** — Decisão de produto permanente (`docs/PRODUCT_PRINCIPLES.md`, `docs/ace/00-constitution/constitution.md`) — nunca reintroduza isso "para dar mais transparência".
- **"O que fazer se o Docker não sobe?"** — `docs/DEBUGGING.md`, seção 5. Não é bug do projeto.
