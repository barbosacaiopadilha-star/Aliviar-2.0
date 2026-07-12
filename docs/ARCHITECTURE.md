# Arquitetura — aliviar-conexao

## Estado atual

- Stack, domínio, estrutura e identidade visual formalmente decididos (ADR-004, ADR-005, ADR-008, ADR-009 em `docs/DECISIONS.md`) **e implementados**: scaffold técnico, autenticação (login via Supabase Auth — cadastro/signup ainda não implementado), RLS, papéis, `AppShell` e Design System (TASK-001 a TASK-005B, ver `docs/tasks/`).
- `aliviar-conexao` é uma plataforma de **conexão humana e cuidado**: conecta pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar. O MVP tem escopo restrito a **descoberta e conexão entre pacientes e profissionais** (ADR-004) — ainda não implementado (roadmap Fase 3/4). O sistema é modular e evolutivo por definição.
- Arquitetura adotada: **monólito modular** em Next.js (App Router) + TypeScript, com Supabase (Postgres, Auth, Storage) como plataforma de dados, e Row Level Security (RLS) como fronteira real de autorização — não a aplicação. Rotas por papel (`/admin`, `/profissional`, `/paciente`) são segmentos reais, não route groups (ADR-009). Detalhes completos (stack, estrutura de diretórios, módulos, modelo de dados, autenticação/autorização, testes, deploy, roadmap) estão em **[`docs/ENGINEERING_PLAN.md`](ENGINEERING_PLAN.md)**; identidade visual em **[`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)**; visão e princípios de produto em **[`docs/PRODUCT_VISION.md`](PRODUCT_VISION.md)** e **[`docs/PRODUCT_PRINCIPLES.md`](PRODUCT_PRINCIPLES.md)**.
- `aliviar-conexao` continua tratado **provisoriamente** como um produto separado do `aliviar-app` (ADR-001): não compartilha sessão de usuário, banco de dados nem credenciais com aquele projeto. Qualquer integração futura entre os dois será feita por contrato de API explícito e documentado, nunca por acoplamento direto.

## Natureza reversível

A partir da aprovação do scaffold técnico (Fase 1 do roadmap em `docs/ENGINEERING_PLAN.md`), a stack (ADR-005) deixa de ser reversível "sem processo formal": qualquer mudança de stack depois disso exige um novo ADR. O escopo de negócio do MVP (ADR-004) permanece estável; módulos futuros (comunidade, instituições, benefícios, programas, IA, parceiros) só ganham escopo técnico quando tiverem seu próprio ADR.

## Próxima atualização

Este documento é atualizado a cada decisão estrutural relevante (nova integração, mudança de stack, novo módulo promovido do backlog futuro para escopo ativo). Decisões pontuais e roadmap detalhado vivem em `docs/ENGINEERING_PLAN.md` e `docs/DECISIONS.md`, não aqui.
