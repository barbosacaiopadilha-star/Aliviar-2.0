# Aliviar Curadoria Médica

Curadoria médica humana e independente: uma pessoa conta sua história, e um **Curador Médico** conduz a Curadoria na Mesa até entregar três caminhos explicados. O paciente nunca recebe uma lista de profissionais — recebe uma Curadoria, sempre explicada, sempre de autoria humana, nunca por posição paga.

**A Curadoria tem uma única autoridade decisória: o Curador** (ADR-035). A decisão sobre qual dos três caminhos seguir é, e continua sendo, exclusivamente do paciente.

## Status: arquitetura canônica publicada

A migração para a arquitetura canônica foi **publicada em produção em 2026-07-27** (ADR-035, ADR-036, ADR-037). A referência oficial do estado atual é
[`docs/BASELINE_CANONICAL_ARCHITECTURE.md`](docs/BASELINE_CANONICAL_ARCHITECTURE.md) — comece por ela antes de propor qualquer mudança estrutural.

A ADR-021 congelou a V1.0 e registrou o ACE como motor de Curadoria daquela versão; a ADR-035 **supersede esse ponto específico**, por decisão explícita do responsável. O restante da ADR-021 permanece vigente. Daqui em diante, toda mudança é tratada como **evolução de produto**, não como parte da migração arquitetural. Histórico completo de entregas em [`CHANGELOG.md`](CHANGELOG.md).

## O que existe hoje

- **Sua História** — acolhimento em etapas, persistido no servidor, para pacientes com conta já criada pela equipe Aliviar (nunca autocadastro público).
- **Caso** — o registro único que atravessa toda a jornada, com máquina de estados, responsabilidade auditada e histórico.
- **Curadoria do Método** — Perfil de Prioridades, Mesa, seleção humana e Relatório entregue com exatamente três opções distintas. É a **entrega canônica**, reconhecida pelo contrato em `src/modules/curadoria/delivery-contract.ts`.
- **Connection e Relationship** — a escolha da pessoa nasce ancorada no Relatório entregue (`connection_records.curadoria_report_id`) e evolui até o acompanhamento.
- **Portais** — Administrador, Curador Médico, Profissional e Paciente, mais o Centro de Operações (`/coa/*`) por onde a Curadoria é conduzida.
- **ACE (P001–P008)** — preservado como **motor histórico sob observação** (ADR-037): sem rota, sem Server Action, sem painel operacional. Não seleciona profissionais, não aprova Curadoria e não produz entrega. `/admin/ace` observa ferramentas da Plataforma, nunca uma segunda Curadoria.

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
