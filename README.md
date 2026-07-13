# Aliviar Curadoria Médica

Curadoria médica humana e independente: uma pessoa conta sua história, o **Método ACE (Aliviar Curation Engine)** analisa o caso, e um **Curador Médico** valida a proposta antes de qualquer entrega. O paciente nunca recebe uma lista de profissionais — recebe uma Curadoria, sempre explicada, sempre validada por humano, nunca por posição paga.

## Status: Versão 1.0 — Frozen

**O desenvolvimento da Versão 1 está oficialmente encerrado** (ADR-021, [`docs/DECISIONS.md`](docs/DECISIONS.md)). Arquitetura, o Método ACE e o produto estão congelados: nenhuma funcionalidade nova, tela, API, protocolo do ACE ou mudança estrutural é aceita sem uma decisão explícita de iniciar uma V2. **Correções de bugs continuam permitidas.** O projeto está em fase de implantação em produção em [`www.aliviarcuradoriamedica.com.br`](https://www.aliviarcuradoriamedica.com.br); a próxima fase é exclusivamente **operação**, não desenvolvimento. Histórico completo de entregas em [`CHANGELOG.md`](CHANGELOG.md).

## O que existe hoje

- **Sua História** — acolhimento em etapas, persistido no servidor, para pacientes com conta já criada pela equipe Aliviar (nunca autocadastro público).
- **Caso** — conecta a história da pessoa ao pipeline do ACE, com máquina de estados e histórico auditável.
- **ACE (P001–P010)** — protocolo congelado que estrutura, audita, contextualiza e compõe a curadoria, sempre com um Curador Médico revisando (P009) antes de qualquer entrega (P010).
- **Portais** — Administrador, Curador Médico, Profissional e Paciente, cada um com seu próprio segmento real (`/admin`, `/curador`, `/profissional`, `/paciente`).
- **Observabilidade do ACE** — dashboard, timeline, health check, métricas e histórico de execuções, para a equipe acompanhar o Método em operação.

## Onde está a documentação

**[`docs/INDEX.md`](docs/INDEX.md) é o índice completo** — comece por lá se não souber onde procurar algo. Novo no projeto? Vá direto para **[`docs/ONBOARDING.md`](docs/ONBOARDING.md)**. Os documentos mais consultados no dia a dia:

- [`docs/AGENTS.md`](docs/AGENTS.md) — documento canônico de governança dos agentes de IA (papéis, fluxo obrigatório, segurança).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — estado atual da arquitetura, incluindo o status Frozen da V1.0.
- [`docs/CODEBASE_MAP.md`](docs/CODEBASE_MAP.md) — onde cada módulo/rota/componente vive em `src/`.
- [`docs/PRODUCT_ARCHITECTURE.md`](docs/PRODUCT_ARCHITECTURE.md) — modelagem funcional do produto (jornadas do paciente e da equipe Aliviar).
- [`docs/ace/README.md`](docs/ace/README.md) — índice do Método ACE: os 10 protocolos, hierarquia de autoridade, vocabulário.
- [`docs/DATABASE.md`](docs/DATABASE.md) — catálogo de tabelas e migrations.
- [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) — toda variável de ambiente, propósito e comportamento por ambiente.
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — runbook de deploy/ativação de produção.
- [`docs/DEBUGGING.md`](docs/DEBUGGING.md) — por onde começar a diagnosticar um problema.
- [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) — convenções de código adotadas no repositório.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — histórico de decisões (ADRs), incluindo o encerramento formal da V1 (ADR-021).
- [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md) — inventário de credenciais (nunca com valores).
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de entregas por sprint.
- [`CLAUDE.md`](CLAUDE.md) e [`.cursor/rules/project-governance.mdc`](.cursor/rules/project-governance.mdc) — ponteiros curtos para o documento canônico de governança, usados pelas ferramentas de IA.

## Rodando localmente

Requer Node (versão fixada em `.nvmrc`), Docker (para o Supabase local) e as variáveis de `.env.example` preenchidas em `.env.local`.

```bash
npm install
npm run supabase:start   # Supabase local via CLI + Docker
npm run supabase:env     # gera .env.local a partir do Supabase local
npm run dev
```

Testes: `npm run test` (unitários), `npm run test:components` (componentes), `npm run test:integration` (requer Supabase local rodando), `npm run test:e2e` (Playwright, requer Supabase local rodando).

## Regras de segurança (resumo)

Nunca commitar segredos (senhas, tokens, chaves, service role keys), nunca usar credenciais administrativas no cliente/frontend, nunca registrar segredos em logs. Credenciais de desenvolvimento ficam apenas em arquivos locais ignorados pelo Git. Alterações em produção exigem autorização explícita do responsável pelo projeto. Detalhes completos em [`docs/AGENTS.md`](docs/AGENTS.md).

## Relação com o `aliviar-app`

`aliviar-conexao` é tratado, **provisoriamente**, como um produto separado do `aliviar-app` — sem compartilhar sessão, banco de dados ou credenciais. Essa decisão é reversível e está registrada em `docs/DECISIONS.md` (ADR-001); qualquer integração futura entre os dois produtos deverá ser definida por contrato de API explícito, não por acoplamento direto.
