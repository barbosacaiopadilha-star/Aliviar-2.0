# Aliviar Conexão

Plataforma de conexão humana e cuidado: conecta pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar. O MVP tem escopo restrito a descoberta e conexão entre pacientes e profissionais; o sistema é modular e evolutivo por definição.

## Fase atual

Domínio, escopo do MVP, stack e identidade visual já foram formalmente decididos ([`docs/DECISIONS.md`](docs/DECISIONS.md) — ADR-004, ADR-005, ADR-008, ADR-009) e detalhados em [`docs/ENGINEERING_PLAN.md`](docs/ENGINEERING_PLAN.md) e [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). O scaffold técnico, a fundação de autenticação (Supabase Auth, RLS, papéis) e o `AppShell`/Design System já estão implementados (TASK-001 a TASK-005B — ver [`docs/tasks/`](docs/tasks/)). A base documental de marca e produto está em [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md), [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md) e [`docs/BRAND_GUIDELINES.md`](docs/BRAND_GUIDELINES.md). Próximas funcionalidades de negócio (descoberta, conexão) seguem o roadmap de `docs/ENGINEERING_PLAN.md`.

## Relação com o `aliviar-app`

`aliviar-conexao` é tratado, **provisoriamente**, como um produto separado do `aliviar-app` — sem compartilhar sessão, banco de dados ou credenciais. Essa decisão é reversível e está registrada em `docs/DECISIONS.md` (ADR-001); qualquer integração futura entre os dois produtos deverá ser definida por contrato de API explícito, não por acoplamento direto.

## Onde está a documentação

- [`docs/AGENTS.md`](docs/AGENTS.md) — documento canônico de governança dos agentes (papéis, fluxo obrigatório, segurança).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — estado atual da arquitetura.
- [`docs/ENGINEERING_PLAN.md`](docs/ENGINEERING_PLAN.md) — plano de engenharia: stack, estrutura, módulos, domínio, autenticação/autorização, banco, testes, deploy, roadmap e backlog.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — identidade visual canônica: tokens, tipografia, componentes, AppShell, acessibilidade.
- [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) — missão, visão, valores, posicionamento, proposta de valor.
- [`docs/PRODUCT_PRINCIPLES.md`](docs/PRODUCT_PRINCIPLES.md) — princípios permanentes de produto.
- [`docs/BRAND_GUIDELINES.md`](docs/BRAND_GUIDELINES.md) — personalidade, tom de voz, vocabulário, uso da marca.
- [`docs/LANDING_STRATEGY.md`](docs/LANDING_STRATEGY.md) — estratégia (não implementação) da landing institucional.
- [`docs/VIDEO_STORYBOARD.md`](docs/VIDEO_STORYBOARD.md) — roteiro do vídeo institucional (~80s).
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — fluxo de trabalho detalhado.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — histórico de decisões (ADRs).
- [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md) — inventário de credenciais (nunca com valores).
- [`docs/tasks/`](docs/tasks/) — tarefas delegadas ao Cursor.
- [`CLAUDE.md`](CLAUDE.md) e [`.cursor/rules/project-governance.mdc`](.cursor/rules/project-governance.mdc) — ponteiros curtos para o documento canônico, usados pelas ferramentas de IA.

## Regras de segurança (resumo)

Nunca commitar segredos (senhas, tokens, chaves, service role keys), nunca usar credenciais administrativas no cliente/frontend, nunca registrar segredos em logs. Credenciais temporárias de desenvolvimento ficam apenas em arquivos locais ignorados pelo Git. Alterações em produção exigem autorização explícita do responsável pelo projeto. Detalhes completos em `docs/AGENTS.md`.

## Próximos passos

Com scaffold, autenticação (login) e Design System/AppShell implementados, as próximas etapas seguem o roadmap de `docs/ENGINEERING_PLAN.md`: fluxo de cadastro (signup) — ainda não implementado, só login —, perfis de paciente/profissional, descoberta e conexão. Ver Fase 2/3/4 do roadmap e o backlog priorizado.
