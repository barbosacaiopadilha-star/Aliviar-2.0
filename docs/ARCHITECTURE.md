# Arquitetura — aliviar-conexao

## Estado atual

- O repositório está em **fase de planejamento técnico** — stack, domínio e estrutura formalmente decididos (ADR-004 e ADR-005 em `docs/DECISIONS.md`), mas **ainda sem código de aplicação**. O scaffold é a próxima tarefa (ver `docs/tasks/TASK-001-scaffold-inicial.md`).
- `aliviar-conexao` é uma plataforma de **conexão humana e cuidado**: conecta pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar. O MVP tem escopo restrito a **descoberta e conexão entre pacientes e profissionais** (ADR-004). O sistema é modular e evolutivo por definição.
- Arquitetura adotada: **monólito modular** em Next.js (App Router) + TypeScript, com Supabase (Postgres, Auth, Storage) como plataforma de dados, e Row Level Security (RLS) como fronteira real de autorização — não a aplicação. Detalhes completos (stack, estrutura de diretórios, módulos, modelo de dados, autenticação/autorização, testes, deploy, roadmap) estão em **[`docs/ENGINEERING_PLAN.md`](ENGINEERING_PLAN.md)**, que é o documento de referência técnica a partir de agora.
- `aliviar-conexao` continua tratado **provisoriamente** como um produto separado do `aliviar-app` (ADR-001): não compartilha sessão de usuário, banco de dados nem credenciais com aquele projeto. Qualquer integração futura entre os dois será feita por contrato de API explícito e documentado, nunca por acoplamento direto.

## Natureza reversível

A partir da aprovação do scaffold técnico (Fase 1 do roadmap em `docs/ENGINEERING_PLAN.md`), a stack (ADR-005) deixa de ser reversível "sem processo formal": qualquer mudança de stack depois disso exige um novo ADR. O escopo de negócio do MVP (ADR-004) permanece estável; módulos futuros (comunidade, instituições, benefícios, programas, IA, parceiros) só ganham escopo técnico quando tiverem seu próprio ADR.

## Próxima atualização

Este documento é atualizado a cada decisão estrutural relevante (nova integração, mudança de stack, novo módulo promovido do backlog futuro para escopo ativo). Decisões pontuais e roadmap detalhado vivem em `docs/ENGINEERING_PLAN.md` e `docs/DECISIONS.md`, não aqui.
