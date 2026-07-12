# Registro de decisões — aliviar-conexao

Log de decisões arquiteturais e de produto, formato ADR simplificado. Todas as decisões abaixo são **reversíveis até a aprovação de um scaffold técnico** — podem ser revisitadas sem processo formal enquanto não houver código de aplicação implementado.

---

## ADR-001 — Separação entre `aliviar-conexao` e `aliviar-app`

- **Status:** Provisória / reversível
- **Contexto:** `aliviar-conexao` é um novo produto relacionado ao ecossistema Aliviar, mas sua relação exata com o `aliviar-app` (integração, dados compartilhados, autenticação) ainda não foi definida em detalhe.
- **Decisão:** tratar `aliviar-conexao` como produto separado do `aliviar-app`. Nenhuma sessão de usuário, tabela de banco de dados ou credencial é compartilhada entre os dois projetos nesta etapa.
- **Consequência:** reduz risco de acoplamento indevido e de vazamento de dados/credenciais entre produtos enquanto a relação real não está definida. Qualquer integração futura será feita por contrato de API documentado, não por acesso direto a banco ou sessão.
- **Revisitar quando:** houver decisão explícita do usuário sobre como os dois produtos devem se relacionar.

---

## ADR-002 — `docs/AGENTS.md` como documento canônico de governança

- **Status:** Definitiva (formato), conteúdo pode evoluir
- **Contexto:** múltiplos arquivos (`CLAUDE.md`, `.cursor/rules/project-governance.mdc`, documentos futuros) precisam referenciar o mesmo protocolo de trabalho dos agentes, sem duplicar texto que ficaria desatualizado em vários lugares.
- **Decisão:** `docs/AGENTS.md` é o único documento canônico do protocolo de governança. `CLAUDE.md` e `.cursor/rules/project-governance.mdc` contêm apenas resumos curtos e apontam para ele; nenhuma regra de fundo deve ser escrita exclusivamente em outro lugar.
- **Consequência:** atualizações de regra são feitas em um único ponto, evitando divergência entre o que o Claude Code, o Cursor e o usuário entendem como protocolo vigente.
- **Revisitar quando:** a estrutura de documentação do projeto crescer a ponto de justificar múltiplos documentos canônicos por área (ex.: segurança separada de fluxo de trabalho).

---

## ADR-003 — Infraestrutura desta fase limitada a desenvolvimento, sem cobrança

- **Status:** Provisória
- **Contexto:** o projeto ainda não tem stack, banco ou hospedagem definidos; qualquer recurso de infraestrutura criado nesta fase é experimental.
- **Decisão:** qualquer recurso de infraestrutura provisionado nesta fase (ex.: projeto de banco de dados de desenvolvimento) deve ser de tier gratuito, sem cobrança, e nunca um recurso de produção.
- **Consequência:** evita custo e compromisso antes de uma decisão formal de arquitetura e de produção.
- **Revisitar quando:** houver decisão de negócio para produção/deploy real, que exige autorização explícita separada do usuário.

---

## ADR-004 — Domínio de negócio e escopo do MVP

- **Status:** Definitiva (escopo do MVP), evolutiva (módulos futuros)
- **Contexto:** até este ponto o repositório não descrevia o que o `aliviar-conexao` faz nem para quem. Era necessária uma decisão de negócio do usuário antes de qualquer planejamento técnico ter sentido.
- **Decisão:** `aliviar-conexao` é uma **plataforma de conexão humana e cuidado**, cujo objetivo é conectar pessoas que buscam apoio emocional, acolhimento e saúde a profissionais, instituições, grupos, serviços e recursos do ecossistema Aliviar. O sistema é **modular e evolutivo por definição**. O **MVP** tem escopo restrito a **descoberta e conexão entre pacientes e profissionais** (busca de profissionais, perfil público, solicitação de contato). Comunidade, instituições, benefícios, programas, IA e parceiros são módulos **previstos na arquitetura, mas não implementados no MVP**.
- **Consequência:** o plano técnico (`docs/ENGINEERING_PLAN.md`) e a arquitetura devem tratar esses módulos futuros como pontos de extensão (pastas/contratos reservados), sem construir abstrações ou tabelas para eles antes de terem uma decisão de escopo própria.
- **Revisitar quando:** o usuário decidir priorizar um desses módulos futuros — nesse momento, um novo ADR define o escopo daquele módulo especificamente.

---

## ADR-005 — Adoção formal da stack tecnológica

- **Status:** Definitiva (habilita a criação do scaffold técnico)
- **Contexto:** `docs/ARCHITECTURE.md` registrava que nenhuma stack havia sido adotada. O usuário determinou que o `aliviar-conexao` deve usar a mesma base tecnológica do ecossistema Aliviar.
- **Decisão:** a stack adotada é: **Next.js (App Router)** + **TypeScript** + **Tailwind CSS** no frontend; **Supabase** (Postgres, Auth, Storage) com **Row Level Security (RLS)** como camada de autorização no backend; **Zod** para validação de dados; **React Hook Form** para formulários; **Vitest** para testes unitários/integração; **Playwright** para testes end-to-end; **Vercel** para deploy e hospedagem. Detalhes de estrutura, módulos e uso de cada peça estão em `docs/ENGINEERING_PLAN.md`.
- **Consequência:** a partir desta decisão, mudanças de stack deixam de ser reversíveis "sem processo formal" (conforme a nota geral deste documento) — qualquer alteração de stack depois do scaffold criado exige um novo ADR justificando a mudança e sua migração.
- **Revisitar quando:** surgir uma limitação técnica concreta da stack que justifique reabrir a decisão, sempre com ADR próprio.

---

## ADR-006 — Modelo de papéis extensível (catálogo + associação N:N)

- **Status:** Definitiva
- **Contexto:** o MVP começa com três papéis (Administrador, Profissional, Paciente), mas o usuário determinou que a arquitetura deve permitir novos papéis no futuro **sem refatoração estrutural** — por exemplo, quando módulos como instituições ou parceiros (ADR-004) entrarem em escopo e trouxerem papéis próprios.
- **Decisão:** o papel de uma pessoa não é uma coluna fixa (enum) em `profiles`. É modelado como um **catálogo de papéis** (`roles`) associado à pessoa por uma tabela de junção N:N (`user_roles`). A checagem de posse de papel, tanto na aplicação quanto nas policies de RLS, passa por uma função/helper genérica, não por valores de enum espalhados pelo código.
- **Consequência:** adicionar um papel novo é uma operação de dado (inserir uma linha em `roles` e criar as policies específicas do novo domínio), não uma migração estrutural da tabela de identidade nem uma reescrita do mecanismo central de autorização. Uma pessoa também pode acumular mais de um papel, sem redesenho do modelo.
- **Revisitar quando:** a necessidade de papéis compostos ou hierárquicos (permissões granulares dentro de um papel) exigir um modelo mais expressivo do que catálogo + associação simples — nesse caso, um novo ADR avalia um RBAC mais completo.

---

## ADR-007 — Supabase local (CLI + Docker) como ambiente provisório de desenvolvimento

- **Status:** Definitiva quanto ao mecanismo; provisória quanto à duração.
- **Contexto:** a criação de um novo projeto Supabase hospedado está bloqueada pelo limite do tier gratuito da conta/organização atual. O desenvolvimento do MVP não deve ficar parado por causa dessa limitação de infraestrutura.
- **Decisão:** enquanto não houver capacidade para um projeto Supabase hospedado de desenvolvimento separado, o desenvolvimento e os testes usam **Supabase local**, executado via **Supabase CLI + Docker** na máquina de desenvolvimento. Esse ambiente é: estritamente local; reproduzível a partir de `supabase/config.toml` e das migrations versionadas; descartável (dados locais não têm valor de longo prazo e podem ser resetados a qualquer momento); sem cobrança; sem qualquer ligação com o projeto Supabase do `aliviar-app`; sem compartilhamento de credenciais com ele. Migrations versionadas em `supabase/migrations/` são a fonte da verdade do schema — o futuro projeto hospedado (quando houver capacidade) é provisionado aplicando essas mesmas migrations, nunca recriando o schema manualmente pelo painel. Produção continua exigindo autorização explícita do usuário (ADR-003, `docs/AGENTS.md`), independente deste ambiente local.
- **Consequência:** o roadmap da Fase 2 passa a depender de Docker + Supabase CLI instalados na máquina de desenvolvimento, não de um projeto Supabase hospedado. Isso introduz um pré-requisito de ambiente local (Docker Desktop) que não existia antes.
- **Revisitar quando:** houver capacidade de projeto Supabase hospedado de desenvolvimento (nova conta/organização, upgrade autorizado, ou liberação de cota) — nesse momento, o hospedado é provisionado a partir das migrations já existentes, sem perda de trabalho.
