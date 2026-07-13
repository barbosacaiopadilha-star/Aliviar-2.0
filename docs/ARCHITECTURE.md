# Arquitetura — Aliviar Curadoria Médica (aliviar-conexao)

## Status: V1.0 — Frozen (encerramento formal em ADR-021, `docs/DECISIONS.md`)

O desenvolvimento da Versão 1 está oficialmente encerrado. Arquitetura, ACE e produto estão congelados — apenas correção de bugs é permitida a partir daqui. A próxima fase é **operação**, não desenvolvimento. Ver `CHANGELOG.md` para o histórico completo de entregas.

## Estado atual (V1.0)

- Stack, domínio, estrutura e identidade visual formalmente decididos (ADR-004, ADR-005, ADR-008, ADR-009 em `docs/DECISIONS.md`) **e implementados**: scaffold técnico, autenticação (login via Supabase Auth — contas de paciente/profissional são criadas pela equipe Aliviar, nunca por autocadastro público, ADR-018), RLS, papéis, `AppShell` e Design System (TASK-001 a TASK-005B, ver `docs/tasks/`).
- O produto entregue na V1.0 é a **Curadoria Médica Aliviar** (`docs/PRODUCT_ARCHITECTURE.md`): a pessoa conta sua história (`sua-historia`), um Caso é aberto (`src/modules/cases`), o **ACE — Aliviar Curation Engine** (`src/modules/ace/`, protocolos P001–P010, `docs/ace/`) executa a análise via o módulo de orquestração `src/modules/concierge/`, um Curador Médico faz a Revisão Humana (P009) e a Curadoria Final é entregue ao paciente (P010) — nunca uma lista de médicos, sempre uma curadoria explicada e validada por humano. O plano original de MVP restrito a "descoberta e conexão direta" (ADR-004, detalhado em `docs/ENGINEERING_PLAN.md`) **não foi o caminho de entrega real** — os módulos `discovery`/`connection` seguem reservados, vazios, sem implementação; ver a nota de encerramento no topo de `docs/ENGINEERING_PLAN.md`. O sistema continua modular e evolutivo por definição.
- Arquitetura adotada: **monólito modular** em Next.js (App Router) + TypeScript, com Supabase (Postgres, Auth, Storage) como plataforma de dados, e Row Level Security (RLS) como fronteira real de autorização — não a aplicação. Rotas por papel (`/admin`, `/profissional`, `/paciente`, `/curador`) são segmentos reais, não route groups (ADR-009). O modelo de linguagem do ACE (`AceLanguageModel`) usa a API da Anthropic em produção e nunca cai silenciosamente em um modelo fake fora de desenvolvimento/teste — proteção explícita de ambiente implementada na sprint de ativação de produção. Detalhes completos de stack/módulos/modelo de dados no plano histórico (`docs/ENGINEERING_PLAN.md`, ver nota de encerramento), modelagem funcional atual em **[`docs/PRODUCT_ARCHITECTURE.md`](PRODUCT_ARCHITECTURE.md)**, identidade visual em **[`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)**, visão e princípios de produto em **[`docs/PRODUCT_VISION.md`](PRODUCT_VISION.md)** e **[`docs/PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)**, e o Método ACE em **[`docs/ace/06-governance/governance.md`](ace/06-governance/governance.md)**.
- `aliviar-conexao` continua tratado **provisoriamente** como um produto separado do `aliviar-app` (ADR-001): não compartilha sessão de usuário, banco de dados nem credenciais com aquele projeto. Qualquer integração futura entre os dois será feita por contrato de API explícito e documentado, nunca por acoplamento direto.

## Natureza reversível

A partir da aprovação do scaffold técnico (Fase 1 do roadmap histórico em `docs/ENGINEERING_PLAN.md`), a stack (ADR-005) deixou de ser reversível "sem processo formal": qualquer mudança de stack exige um novo ADR. Com o encerramento da V1 (ADR-021), toda a arquitetura, o ACE e o produto estão congelados — qualquer alteração estrutural, novo módulo ou novo protocolo do ACE passa a exigir uma decisão explícita de iniciar uma V2, não uma correção incremental desta fase.

## Próxima atualização

Este documento é atualizado a cada decisão estrutural relevante — o que, com a V1 congelada, significa: correções de bugs que alterem a descrição do estado atual, ou o início formal de uma V2. Decisões pontuais vivem em `docs/DECISIONS.md`; o histórico de entregas, em `CHANGELOG.md`.
