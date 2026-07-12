# Aliviar Conexão

Plataforma de conexão humana e cuidado: conecta pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar. O MVP tem escopo restrito a descoberta e conexão entre pacientes e profissionais; o sistema é modular e evolutivo por definição.

## Fase atual

Este repositório está em **fase de planejamento técnico**. Domínio, escopo do MVP e stack já foram formalmente decididos ([`docs/DECISIONS.md`](docs/DECISIONS.md) — ADR-004 e ADR-005) e detalhados em [`docs/ENGINEERING_PLAN.md`](docs/ENGINEERING_PLAN.md). Ainda não há código de aplicação: a primeira tarefa (scaffold técnico) está delegada em [`docs/tasks/TASK-001-scaffold-inicial.md`](docs/tasks/TASK-001-scaffold-inicial.md).

## Relação com o `aliviar-app`

`aliviar-conexao` é tratado, **provisoriamente**, como um produto separado do `aliviar-app` — sem compartilhar sessão, banco de dados ou credenciais. Essa decisão é reversível e está registrada em `docs/DECISIONS.md` (ADR-001); qualquer integração futura entre os dois produtos deverá ser definida por contrato de API explícito, não por acoplamento direto.

## Onde está a documentação

- [`docs/AGENTS.md`](docs/AGENTS.md) — documento canônico de governança dos agentes (papéis, fluxo obrigatório, segurança).
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — estado atual da arquitetura.
- [`docs/ENGINEERING_PLAN.md`](docs/ENGINEERING_PLAN.md) — plano de engenharia: stack, estrutura, módulos, domínio, autenticação/autorização, banco, testes, deploy, roadmap e backlog.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — identidade visual canônica: tokens, tipografia, componentes, AppShell, acessibilidade.
- [`docs/WORKFLOW.md`](docs/WORKFLOW.md) — fluxo de trabalho detalhado.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — histórico de decisões (ADRs).
- [`docs/CREDENTIALS.md`](docs/CREDENTIALS.md) — inventário de credenciais (nunca com valores).
- [`docs/tasks/`](docs/tasks/) — tarefas delegadas ao Cursor.
- [`CLAUDE.md`](CLAUDE.md) e [`.cursor/rules/project-governance.mdc`](.cursor/rules/project-governance.mdc) — ponteiros curtos para o documento canônico, usados pelas ferramentas de IA.

## Regras de segurança (resumo)

Nunca commitar segredos (senhas, tokens, chaves, service role keys), nunca usar credenciais administrativas no cliente/frontend, nunca registrar segredos em logs. Credenciais temporárias de desenvolvimento ficam apenas em arquivos locais ignorados pelo Git. Alterações em produção exigem autorização explícita do responsável pelo projeto. Detalhes completos em `docs/AGENTS.md`.

## Próximos passos

A próxima etapa é o scaffold técnico do projeto (Next.js + TypeScript + Tailwind + Supabase), delegado ao Cursor em `docs/tasks/TASK-001-scaffold-inicial.md`. Depois do scaffold, a primeira funcionalidade de negócio é autenticação e cadastro de perfil (paciente e profissional) — ver roadmap completo em `docs/ENGINEERING_PLAN.md`.
