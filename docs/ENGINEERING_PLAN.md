# Plano de Engenharia v1 — aliviar-conexao

Este documento é o plano técnico de referência para a construção do `aliviar-conexao`. Ele se apoia em duas decisões de negócio/arquitetura já registradas: ADR-004 (domínio e escopo do MVP) e ADR-005 (stack tecnológica), em `docs/DECISIONS.md`. Este plano detalha a execução dessas decisões; não repete o protocolo de governança, que está em `docs/AGENTS.md`.

Este é um documento vivo. Revisões de escopo relevantes devem ser refletidas aqui e, quando envolverem decisão de arquitetura ou de negócio, registradas também como ADR em `docs/DECISIONS.md`.

## 1. Visão geral

O Aliviar Conexão é uma plataforma de **conexão humana e cuidado**: conecta pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar.

O sistema é **modular e evolutivo por definição** (ADR-004). O **MVP** tem escopo restrito a **descoberta e conexão entre pacientes e profissionais**: um paciente busca profissionais por especialidade/modalidade, vê o perfil público de um profissional e solicita contato/conexão. Tudo além disso (comunidade, instituições, benefícios, programas, IA, parceiros) é módulo futuro, previsto na arquitetura mas fora do MVP.

## 2. Arquitetura proposta

**Monólito modular** construído em Next.js (App Router), com Supabase como plataforma de dados/autenticação. "Monólito modular" significa: uma única aplicação implantável, mas organizada internamente em módulos de domínio isolados (`src/modules/*`), cada um com suas próprias regras, tipos, acesso a dados e UI. Módulos não acessam dados uns dos outros diretamente — a comunicação entre módulos é feita por contratos explícitos (funções/tipos exportados do módulo), nunca por acoplamento implícito de tabelas ou estado.

Essa escolha permite:

- Evoluir rápido no MVP sem a complexidade operacional de microsserviços.
- Extrair um módulo para um serviço separado no futuro (ex.: um motor de IA/recomendação) sem reescrever o resto, porque o módulo já é isolado por contrato.
- Adicionar comunidade, instituições, benefícios, programas, parceiros como novos módulos, sem alterar os módulos existentes.

A autorização real dos dados **não depende da aplicação** — é reforçada no banco via Row Level Security (RLS) do Postgres/Supabase. A aplicação nunca é a última linha de defesa de acesso a dados.

Camadas:

1. **Apresentação** — rotas e componentes Next.js (App Router), Server Components por padrão, Client Components só onde há interatividade.
2. **Domínio/módulos** — regras de negócio, validação (Zod), acesso a dados por módulo.
3. **Dados** — Supabase (Postgres + Auth + Storage), RLS como fronteira de autorização.
4. **Infraestrutura** — Vercel (deploy/hospedagem), Supabase Cloud (banco/auth/storage gerenciados).

## 3. Stack tecnológica

Definida em ADR-005:

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend/SSR | Next.js (App Router) | Roteamento, Server Components, Server Actions |
| Linguagem | TypeScript (strict) | Tipagem forte em todo o código |
| Estilo | Tailwind CSS | Estilização utilitária, sem CSS-in-JS |
| Backend/dados | Supabase (Postgres) | Banco relacional, Auth, Storage |
| Autorização | RLS (Postgres) | Fronteira real de acesso a dados |
| Validação | Zod | Validação de entrada em toda fronteira (forms, server actions) |
| Formulários | React Hook Form | Estado e validação de formulários no cliente |
| Testes unitários/integração | Vitest | Regras de domínio, schemas, funções puras |
| Testes end-to-end | Playwright | Fluxos críticos de usuário |
| Controle de versão | GitHub | Repositório-fonte único; dispara deploys via integração com a Vercel |
| Deploy | Vercel | Hospedagem, preview deployments, produção |
| Dados/Auth (ambientes) | Supabase (dev + prod separados) | Um projeto por ambiente, nunca compartilhado (ADR-003) |

Não há, nesta fase, nenhuma outra dependência de infraestrutura (fila, cache, serviço de e-mail externo, etc.). Qualquer nova integração é uma decisão própria, com ADR antes de implementar.

**Inconsistência identificada (FASE 6A):** os formulários implementados até agora (TASK-004B — login, recuperação de senha, nova senha) usam `useActionState` + `zod.safeParse()` manual, **não React Hook Form**, apesar de ADR-005 ter decidido React Hook Form como parte da stack. Isso funcionou bem na prática e não foi corrigido ainda. Fica como pendência de decisão explícita: manter React Hook Form como decisão formal (e migrar os formulários existentes) ou emendar ADR-005 reconhecendo o padrão `useActionState`/Zod como o adotado de fato. Nenhuma das duas ações foi tomada nesta rodada — é documentação, não decisão de arquitetura.

## 4. Estrutura de diretórios

```
aliviar-conexao/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/                # landing, busca pública, perfil público de profissional
│   │   ├── (auth)/                  # login, recuperação de senha (cadastro/signup: pendente)
│   │   ├── admin/                   # painel administrativo (segmento real, não route group — ADR-009)
│   │   ├── profissional/            # área autenticada do profissional (segmento real — ADR-009)
│   │   ├── paciente/                # área autenticada do paciente (segmento real — ADR-009)
│   │   └── acesso-negado/           # autenticado, mas sem o papel exigido pela rota
│   ├── modules/                     # módulos de domínio, isolados por pasta
│   │   ├── auth/
│   │   ├── profiles/                 # perfil base + perfil paciente + perfil profissional
│   │   ├── discovery/                # busca/listagem de profissionais
│   │   ├── connection/               # solicitação de contato paciente → profissional
│   │   ├── community/                # reservado (futuro, fora do MVP)
│   │   ├── institutions/             # reservado (futuro, fora do MVP)
│   │   ├── benefits/                 # reservado (futuro, fora do MVP)
│   │   ├── programs/                 # reservado (futuro, fora do MVP)
│   │   ├── ai/                       # reservado (futuro, fora do MVP)
│   │   └── partners/                 # reservado (futuro, fora do MVP)
│   ├── components/                  # componentes de UI compartilhados (design system leve)
│   ├── lib/
│   │   └── supabase/                 # factories de client Supabase (browser/server)
│   └── types/                        # tipos compartilhados (incl. tipos gerados do Supabase)
├── supabase/
│   ├── migrations/                   # migrations SQL versionadas
│   └── config.toml
├── tests/
│   ├── unit/                         # Vitest
│   └── e2e/                          # Playwright
├── docs/                              # já existente — governança e planejamento
└── .cursor/                           # já existente — regras do Cursor
```

Cada módulo em `src/modules/*` segue o mesmo padrão interno: `schema.ts` (Zod), `types.ts`, `repository.ts` (acesso a dados), `actions.ts` (server actions), `components/`. Módulos "reservados" (futuros) começam como pasta vazia com um `README.md` de uma linha explicando que aguardam escopo próprio — sem código, sem tabela, sem abstração antecipada.

## 5. Módulos do sistema

**No MVP:**

- **auth** — cadastro, login, sessão, proteção de rotas por papel.
- **profiles** — perfil base (nome, avatar, papel), perfil de paciente, perfil de profissional (especialidades, bio, formação, modalidade de atendimento, cidade).
- **discovery** — busca e listagem pública de profissionais, filtros por especialidade/modalidade/cidade.
- **connection** — solicitação de contato/conexão do paciente para um profissional; painel do profissional para ver/responder solicitações recebidas.

**Fora do MVP, reservados na arquitetura:**

- **community** — grupos de apoio, fóruns entre pacientes.
- **institutions** — parceria com clínicas, ONGs, instituições.
- **benefits** — programas de benefício/desconto.
- **programs** — programas estruturados de cuidado.
- **ai** — recomendação/triagem assistida por IA.
- **partners** — parceiros comerciais/institucionais.

Nenhum desses seis módulos ganha tabela, endpoint ou tela antes de ter seu próprio ADR de escopo.

## 6. Domínio do negócio (linguagem ubíqua)

- **Pessoa/Conta** — identidade base autenticada (Supabase `auth.users`), sem papel fixo embutido na própria identidade.
- **Perfil** — dados complementares de uma pessoa, vinculado 1:1 à conta.
- **Papel** (`role`) — papel que uma pessoa exerce no sistema. Papéis iniciais (nesta ordem de prioridade): **Administrador**, **Profissional**, **Paciente**. O modelo é um **catálogo de papéis + associação pessoa-papel (N:N)** (ADR-006), não um valor fixo de enum — isso permite adicionar papéis futuros (ex.: quando os módulos de instituições ou parceiros entrarem em escopo) como um novo dado no catálogo, sem alterar a estrutura da tabela de identidade nem refatorar o mecanismo de autorização (ver seção 8).
- **Administrador** — papel operacional interno, responsável por moderação/verificação de profissionais.
- **Profissional** — pessoa (ou, futuramente, entidade) que oferece cuidado; possui uma ou mais **especialidades**.
- **Paciente** — pessoa buscando apoio.
- **Especialidade** — categoria de atuação de um profissional (ex.: psicologia, terapia ocupacional).
- **Conexão** (solicitação de contato) — registro da intenção de um paciente de entrar em contato com um profissional; tem um estado (`pendente`, `aceita`, `recusada`).

Modelo conceitual de dados para o MVP (descrição, não schema executável — a implementação real ocorre em migration na Fase 2):

- `profiles`: identidade base (nome, avatar, contato), vinculado 1:1 a `auth.users` — **sem coluna fixa de papel**.
- `roles`: catálogo de papéis (`slug`, nome) — semeado inicialmente com `administrador`, `profissional`, `paciente`.
- `user_roles`: associação N:N entre `profiles` e `roles` — permite múltiplos papéis por pessoa e adição de papéis novos por dado, não por migration estrutural.
- `professional_profiles`: dados específicos do profissional (bio, formação, modalidades, cidade, status de verificação), vinculado 1:1 a `profiles`.
- `specialties`: catálogo de especialidades.
- `professional_specialties`: relação N:N entre profissional e especialidade.
- `connection_requests`: paciente, profissional, mensagem, status, timestamps.

## 7. Autenticação

Supabase Auth, com e-mail/senha como método inicial (login social é extensão futura, não MVP). Sessão gerenciada via helpers SSR do Supabase para Next.js, com middleware responsável por renovar sessão e proteger as rotas de `(admin)`, `(profissional)` e `(paciente)` — usuário sem sessão válida é redirecionado ao login; usuário sem o papel exigido pela rota é bloqueado antes de renderizar (checagem via `has_role`, ver seção 8).

## 8. Autorização

Baseada em papéis (`roles`) associados à pessoa via `user_roles` (ADR-006), mas **reforçada por RLS em cada tabela** — a checagem de papel no código da aplicação é conveniência de UX, nunca a garantia de segurança. O modelo é extensível por definição: as policies de RLS verificam posse de papel através de uma função/helper genérica (ex.: `has_role(auth.uid(), 'profissional')`), não por um enum fixo espalhado pelas policies — adicionar um papel novo não exige alterar a forma da tabela de identidade nem o mecanismo central de checagem, apenas o dado no catálogo e as policies específicas do novo domínio que aquele papel passa a acessar.

Diretrizes:

- Toda tabela nova é criada com RLS habilitada antes de qualquer dado real entrar nela. Não existe tabela "temporariamente aberta".
- Paciente só lê/escreve seu próprio perfil e suas próprias solicitações de conexão.
- Profissional só lê/escreve seu próprio perfil profissional e lê as solicitações de conexão recebidas por ele.
- Perfis públicos de profissionais (para descoberta) têm política de leitura pública explícita, limitada aos campos destinados à vitrine pública — não à tabela inteira.
- Administrador opera sob política própria vinculada à posse do papel `administrador` na própria sessão autenticada; a **service role key nunca é usada em código que roda no cliente/navegador**, e seu uso no servidor é limitado a scripts administrativos/migrations, nunca ao runtime normal da aplicação (regra de segurança de `docs/AGENTS.md`).

## 9. Banco de dados

- Postgres via Supabase, schema versionado por migrations em `supabase/migrations/`, aplicadas via Supabase CLI — nunca editadas ad-hoc direto no painel em ambiente compartilhado.
- **Ambientes de banco sempre separados.** Enquanto a criação de um projeto Supabase hospedado de desenvolvimento estiver bloqueada pelo limite do tier gratuito, o desenvolvimento usa **Supabase local (CLI + Docker)** — estritamente local, descartável, sem cobrança e sem qualquer ligação com o `aliviar-app` (ADR-007). O projeto Supabase de produção só é criado mediante autorização explícita do usuário (`docs/AGENTS.md`), e quando houver capacidade de um projeto hospedado de desenvolvimento, ele é provisionado a partir das mesmas migrations versionadas — nunca recriando schema manualmente. Nenhum dado ou credencial circula entre ambientes.
- Modelo de papéis via catálogo (`roles`) + associação N:N (`user_roles`), não enum fixo — ver seção 6 e ADR-006. Isso evita que adicionar um papel novo exija alterar o tipo da coluna de papel ou migrar dados existentes.
- Nomenclatura de tabelas em `snake_case`, no plural (`profiles`, `roles`, `user_roles`, `professional_profiles`, `specialties`, `connection_requests`).
- Toda tabela tem RLS habilitada desde a migration que a cria — não é um passo posterior.

## 10. Integrações

Nenhuma integração externa além do próprio Supabase (Auth, Postgres, Storage) está confirmada nesta fase. Pontos de extensão previstos, mas não implementados no MVP e cada um exigindo seu próprio ADR antes de ser construído:

- Envio de e-mail transacional além do provedor padrão do Supabase Auth.
- Notificações (push/WhatsApp) para o módulo de conexão.
- Provedor de IA/LLM para o módulo `ai` (recomendação/triagem).
- Meios de pagamento/benefícios para o módulo `benefits`.
- Calendário/agendamento, caso o MVP evolua de "solicitação de contato" para agendamento real.

## 11. Estratégia de testes

- **Vitest** — testes unitários de schemas Zod e regras de domínio puras; testes de integração de `repository.ts`/`actions.ts` de cada módulo contra um Supabase local (via Supabase CLI) ou projeto de desenvolvimento.
- **Playwright** — testes end-to-end dos fluxos críticos do MVP: cadastro (paciente e profissional), login, busca/listagem de profissionais, envio de solicitação de conexão, resposta do profissional à solicitação.
- Nenhuma fase do roadmap (seção 13) é considerada concluída sem os testes correspondentes passando — consistente com o critério de validação de `docs/AGENTS.md` e `docs/WORKFLOW.md`.
- Meta de cobertura nesta fase: cobrir regras de domínio e fluxos críticos, sem gate percentual rígido ainda — revisitar quando houver massa crítica de código.

## 12. Estratégia de deploy

- **GitHub** é a fonte única do código-fonte; todo deploy (preview ou produção) é disparado a partir de um push/PR no GitHub — nunca por upload manual.
- **Vercel** hospeda o Next.js: preview deployment automático por PR/branch, produção apenas a partir de `main`.
- **Supabase**: **ambientes de desenvolvimento e produção sempre separados**. Desenvolvimento roda hoje em **Supabase local (CLI + Docker)**, enquanto a criação de um projeto hospedado de desenvolvimento estiver bloqueada pelo limite do tier gratuito (ADR-007); quando houver capacidade, o projeto hospedado de desenvolvimento é provisionado a partir das migrations versionadas. Produção só é criada mediante autorização explícita do usuário, quando o produto estiver pronto para isso (regra de `docs/AGENTS.md`: nenhuma automação cria recursos com cobrança ou altera produção sem confirmação explícita). Nenhuma credencial ou dado de um ambiente é reutilizado no outro.
- Variáveis de ambiente vivem na configuração do projeto na Vercel (uma configuração por ambiente: produção/preview) e em `.env.local` (ignorado pelo Git) localmente — nunca em `.env.example`, que só lista nomes de variáveis.
- Migrations de banco são aplicadas de forma controlada (CLI/CI) a cada ambiente separadamente, nunca diretamente no painel em ambiente compartilhado.
- CI (lint, typecheck, testes) roda antes de qualquer merge — pipeline concreto (ex.: GitHub Actions) é uma tarefa própria do backlog (item 13 da seção 14), ainda não implementada.

## 13. Roadmap em fases

- **Fase 0 — Fundação (concluída).** Governança, documentação, ADRs.
- **Fase 1 — Scaffold técnico.** Projeto Next.js + TS + Tailwind, estrutura modular, ferramentas de qualidade (lint/format), testes (Vitest/Playwright) configurados, client Supabase preparado. *(Primeira tarefa delegada ao Cursor — seção 16.)*
- **Fase 2 — Autenticação e perfis.** Ambiente Supabase local (CLI + Docker) validado (ADR-007; TASK-002), migrations iniciais (`profiles`, `roles`, `user_roles`, `professional_profiles`, `specialties`) com RLS, cadastro/login de paciente e profissional, formulários de perfil. O projeto Supabase hospedado de desenvolvimento é adotado assim que houver capacidade, aplicando as mesmas migrations.
- **Fase 2.5 — Design System e fundação visual.** Tokens semânticos, tipografia dupla, catálogo de componentes fundamentais, `AppShell` compartilhado, rotas reais por papel (`/admin`, `/profissional`, `/paciente`) (ADR-008, ADR-009; `docs/DESIGN_SYSTEM.md`; TASK-005A/TASK-005B). Pré-requisito para qualquer tela de produto além de autenticação.
- **Fase 3 — Descoberta.** Listagem e busca/filtro público de profissionais, página de perfil público.
- **Fase 4 — Conexão.** Solicitação de contato paciente → profissional, painel do profissional para responder.
- **Fase 5 — Admin básico.** Painel para verificação/moderação de profissionais cadastrados.
- **Fase 6+ — Expansão modular.** Comunidade, instituições, benefícios, programas, IA, parceiros — cada um como iniciativa própria, com ADR e planejamento específico antes de implementar.

## 14. Backlog priorizado

1. Scaffold técnico do projeto *(delegado agora — seção 16)*.
2. Ambiente Supabase local (CLI + Docker) para desenvolvimento e testes, com `.env.local` gerado a partir da stack local (ADR-007; TASK-002). Projeto Supabase hospedado de desenvolvimento fica para quando houver capacidade de tier, aplicando as mesmas migrations.
3. Modelagem de banco: `profiles`, papéis, migrations iniciais + RLS base.
4. Fluxo de cadastro/login (paciente e profissional) via Supabase Auth.
4a. Design System e fundação visual: tokens, componentes fundamentais, `AppShell`, rotas reais por papel (ADR-008, ADR-009; TASK-005A/TASK-005B).
5. Formulário e persistência de perfil de profissional (especialidades, bio, modalidade, cidade).
6. Formulário de perfil de paciente (dados básicos).
7. Página pública de busca/listagem de profissionais com filtros.
8. Página de perfil público do profissional.
9. Fluxo de solicitação de conexão (paciente → profissional).
10. Painel do profissional: visualizar/responder solicitações recebidas.
11. Painel admin básico: listar/verificar profissionais cadastrados.
12. Testes e2e dos fluxos críticos (cadastro, busca, conexão).
13. Pipeline de CI (lint, typecheck, testes) antes de merge.
14. Deploy de produção — somente mediante autorização explícita do usuário.

## 15. Critérios de qualidade

- TypeScript em modo `strict`; sem `any` não justificado.
- Toda tabela do banco tem RLS habilitada antes de receber qualquer dado — nunca uma tabela "temporariamente" sem policy.
- Validação de entrada com Zod em toda fronteira (formulários, server actions).
- Nenhuma decisão de autorização confiada só ao cliente — sempre reforçada por RLS.
- Lint e formatação sem erros antes de qualquer merge.
- Testes unitários para regras de domínio/schemas; testes e2e para fluxos críticos, antes de considerar uma fase concluída.
- Nenhum segredo em código, commit ou log (regra de segurança de `docs/AGENTS.md`).
- Módulos de domínio não acessam dados uns dos outros diretamente — comunicação por contrato explícito.
- Acessibilidade básica (labels, contraste, navegação por teclado) em formulários e páginas públicas.

## 16. Primeira funcionalidade a ser implementada

Após o scaffold técnico (Fase 1), a primeira funcionalidade de negócio é **autenticação e cadastro de perfil (paciente e profissional)**. Justificativa: é pré-requisito de tudo o mais no MVP — não há o que buscar em "descoberta" sem profissionais cadastrados, nem quem solicita "conexão" sem paciente autenticado.

A primeira tarefa efetivamente delegada ao Cursor, no entanto, é o **scaffold técnico** (Fase 1), porque não existe projeto executável ainda — ver delegação em `docs/tasks/TASK-001-scaffold-inicial.md`.
