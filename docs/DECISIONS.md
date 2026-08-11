# Registro de decisões — aliviar-conexao

Log de decisões arquiteturais e de produto, formato ADR simplificado. Todas as decisões abaixo são **reversíveis até a aprovação de um scaffold técnico** — podem ser revisitadas sem processo formal enquanto não houver código de aplicação implementado.

## Índice de supersessões e emendas (instituído pela ADR-062; manter atualizado a cada supersessão)

O log é append-only: nenhum verbete é reescrito. Este índice é o mapa que os verbetes antigos não podem carregar. Quem lê uma ADR listada aqui deve ler também a ADR que a supersede ou emenda.

| ADR afetada | Afetada por | Natureza |
| --- | --- | --- |
| ADR-004 (MVP busca/conexão direta) | ADR-021 | superseded integral |
| ADR-017 (paleta + vídeo 10min) | ADR-026 (vídeo) · ADR-033 (parcial) · ADR-045 (executa a paleta) | superseded parcial |
| ADR-021 (congelamento V1.0) | ADR-035 (parcial) · ADR-063 (reabertura regularizada pós-fato) | superseded parcial |
| ADR-026 (Vídeo Companheiro) | ADR-033 | superseded parcial |
| ADR-029 (Temporary Access — "Proposta") | ADR-044 (conteúdo aprovado) · ADR-063 (estado regularizado) | emenda de status |
| ADR-039 (Mapa 26/6) | ADR-046 (Catálogo 1.0.0: 28 conceitos, 7 grupos, 5 eixos) | superseded parcial |
| ADR-041 ("nenhum consumidor ligado") · ADR-043 ("incrementos futuros") · ADR-044 ("nada implementado") | ADR-063 | emenda de status (afirmações superadas pela implementação) |
| ADR-003 · ADR-005 · ADR-009 · ADR-011 (divergências de fato) | ADR-063 | nota de status |
| Ontologia §6 ONT-30 (escolha imutável) | ADR-063 §6 | emenda (correção em `DECISAO_REGISTRADA` é desenho vigente) |
| ADR-039 · ADR-040 (Mapas preenchidos por digitação manual) | ADR-066 · ADR-068 | emenda de origem — os Mapas passam a ser confirmação registrada; **as escalas, os estados e a RLS permanecem intactos** |
| **Invariante I-10** (`CONGELAMENTO_ARQUITETURAL.md` §5) | **ADR-066** | **reabertura substancial** — a distinção formal entre as escalas permanece; a ponte versionada reabre a invariante em substância |
| ADR-065 (juízo relacional sem lugar de registro) | ADR-067 | complemento — os três conceitos `humano` passam a registrar-se em `curator_judgments` |
| `MODELO_CURADORIA_V1.md` §7.1–§7.4 e §11 (v2.0) | ADR-067 → **Modelo v3.0** | emenda — remoção de "0–100" e dos percentuais de peso; quitação do achado P17 |
| ADR-060 ("quem avalia não atesta", inexequível) | ADR-068 item 6 | complemento — a incompatibilidade é declarada e a exceção fica visível até a segunda conta existir |
| **MR1.2** do Item 2.2A-MR1 (uma linha `VIGENTE` por regra, índice parcial) | **ADR-069** | **reinterpretação** — o invariante passa a ser garantido sobre a **transição**; conteúdo idêntico, sujeito trocado. MR1.1 e MR1.3 permanecem integralmente preservados |
| **ADR-069** item 3 ("cinco transições permitidas") | **Emenda de 2026-08-05 (DT-01)**, no rodapé do próprio verbete | **emenda aritmética** — leia-se "sete arcos permitidos, incluindo o nascimento em `PROPOSTA`". Enumeração inalterada; nenhuma transição autorizada ou removida |
| **ADR-069** item 5 (garantia declarativa do MR1.2) | **Precisão de 2026-08-05 (DT-01)**, no rodapé do próprio verbete | **precisão, não mudança** — a garantia é do **conjunto** trigger de cadeia + índice único parcial; o índice isolado não prova todo o invariante |
| **ADR-066** §16 (sete condições de existência da ponte) | **Emenda F-2 de 2026-08-05 (DT-01)**, no rodapé do verbete e no §23 do anexo | **acréscimo** — oitava condição: no máximo uma versão de regra vigente por conceito, a cada instante. Complementa MR1.2; **não altera o grafo da ADR-069** |
| **ADR-066** §16 condição 4 (`MOTOR_PARTICIPATION` ≠ `NUNCA`) | **Emenda F-1 de 2026-08-05 (DT-01)** | **aplicação da ADR-047** — a condição não muda de conteúdo; passa a ser **derivável do Catálogo materializado e imposta pelo banco**, em vez de declarada em `Record` TypeScript |

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

---

## ADR-008 — Design System canônico com tokens semânticos e tipografia dupla

- **Status:** Definitiva (fundação visual), tokens de status (sucesso/aviso/erro) e dourado ainda sujeitos a validação de contraste final.
- **Contexto:** até a TASK-004B, a interface usava cores literais do Tailwind (`teal-700`, `gray-*`) sem nenhuma relação com a marca aprovada pelo usuário (símbolo com azul profundo e verde sálvia; materiais institucionais com fundo marfim, dourado como acento discreto, fotografia editorial, bastante espaço negativo). Não havia documento canônico de design nem tokens.
- **Decisão:** `docs/DESIGN_SYSTEM.md` é o documento canônico da identidade visual — detalhes de paleta, tipografia, espaçamento, componentes e estados vivem só lá, não duplicados em ADR. Toda cor, tamanho de fonte, raio, sombra e z-index usado em componentes de produto passa a vir de tokens semânticos (variáveis CSS + `tailwind.config.ts`), nunca de valores literais da paleta padrão do Tailwind. Tipografia usa duas famílias com papéis exclusivos: serif (`Fraunces`) só para marca/títulos editoriais, sans-serif (`Inter`) para toda a interface funcional — ambas via `next/font/google` (self-hosted, sem chamada externa em runtime, suporte nativo a português).
- **Consequência:** `Button`/`Input`/`FormMessage` (TASK-004B) precisam ser refatorados para consumir os tokens (TASK-005B) — comportamento não muda, só a fonte da cor/tamanho. Qualquer componente novo daqui em diante nasce já usando tokens.
- **Revisitar quando:** houver asset oficial de logo/marca do usuário (o dourado e o placeholder de favicon atual são provisórios) ou uma decisão de rebranding.

---

## ADR-009 — AppShell compartilhado e rotas reais por papel

- **Status:** Definitiva.
- **Contexto:** os route groups `(admin)`, `(profissional)`, `(paciente)` (criados na TASK-001, com guard de papel adicionado na TASK-004A) não aparecem na URL — não é possível ter `/admin`, `/profissional`, `/paciente` como endereços reais mantendo essa estrutura, e não havia nenhum layout visual compartilhado entre os três papéis.
- **Decisão:** as três pastas de route group são renomeadas para segmentos reais (`src/app/admin/`, `src/app/profissional/`, `src/app/paciente/`), cada uma com um `page.tsx` de dashboard mínimo. Um único componente `AppShell` (sidebar desktop, drawer mobile, header, área principal) é compartilhado pelos três — nenhuma implementação de layout divergente por papel. Isso não exige nenhuma mudança no middleware: qualquer caminho fora da lista pública já exige sessão por padrão (TASK-004A); a checagem de papel continua em `requireRole()`, chamado pelo `layout.tsx` de cada segmento, exatamente como já era feito nos route groups.
- **Consequência:** navegação inicial é a mesma para os três papéis (Início, Perfil, Configurações, Sair) — não há ainda nenhuma funcionalidade exclusiva de papel que justifique navegação diferente. `requireRole()` passa a redirecionar para uma página `/acesso-negado` (em vez de `/login`) quando o usuário está autenticado mas não tem o papel exigido — refinamento de UX, sem alterar o caso de usuário não autenticado.
- **Revisitar quando:** um papel específico ganhar uma funcionalidade que exija navegação ou layout genuinamente diferente dos outros dois.

---

## ADR-010 — Documentos de marca e produto como fonte única da verdade

- **Status:** Definitiva (formato), conteúdo evolutivo.
- **Contexto:** até a FASE 6A, o projeto tinha decisões técnicas bem documentadas (`docs/ENGINEERING_PLAN.md`, `docs/DESIGN_SYSTEM.md`) mas nenhum documento formal de negócio/marca — missão, visão, princípios de produto, personalidade de marca, estratégia de landing e roteiro de vídeo institucional não existiam em lugar nenhum do repositório.
- **Decisão:** `docs/PRODUCT_VISION.md` (missão, visão, valores, posicionamento, proposta de valor), `docs/PRODUCT_PRINCIPLES.md` (princípios permanentes de decisão), `docs/BRAND_GUIDELINES.md` (personalidade, tom de voz, uso da marca), `docs/LANDING_STRATEGY.md` (estratégia, não implementação, da landing) e `docs/VIDEO_STORYBOARD.md` (roteiro do vídeo institucional) são os documentos canônicos de produto/marca — fonte única da verdade para produto, UX, marketing, comunicação, IA, landing e app. Nenhum outro documento ou comunicação deve redefinir missão, visão, valores, tom de voz ou posicionamento; apenas referenciar estes.
- **Consequência:** toda futura decisão de copy, UX de conteúdo, campanha ou material institucional deve ser consistente com esses cinco documentos, ou justificar formalmente (novo ADR) por que diverge. `docs/VIDEO_STORYBOARD.md` é uma proposta nova desta rodada — não havia roteiro institucional pré-existente no repositório, apesar de referências a um "vídeo de ~80 segundos definido anteriormente"; se tal material existir fora deste repositório, precisa ser reconciliado manualmente com o que foi registrado aqui.
- **Revisitar quando:** houver asset oficial de marca (logo, fotografia própria) que exija atualizar `BRAND_GUIDELINES.md`, ou uma mudança de posicionamento de negócio que exija atualizar `PRODUCT_VISION.md`.

---

## ADR-011 — O Método Aliviar modela decisões, não doenças

- **Status:** Definitiva.
- **Contexto:** ao especificar o P004 do ACE (Aliviar Curation Engine), o artefato até então mencionado informalmente como "Clinical Context" — nunca formalizado em nenhuma `specification.md`, na Ontologia ou em código, apenas citado de passagem no plano original de protocolos — foi reavaliado pelo arquiteto do projeto. O nome sugeria que o método organiza informação em torno de uma condição clínica/doença, o que contradiz o posicionamento já registrado em `docs/PRODUCT_VISION.md` (a Aliviar não diagnostica, não interpreta exame, nunca antecipa hipótese clínica) e `docs/PRODUCT_PRINCIPLES.md` (Princípio 6: "IA como apoio, nunca como decisão final").
- **Decisão:** o artefato passa a se chamar oficialmente **Decision Context** (`DecisionContext`) — nunca "Clinical Context". Mais amplamente: todo protocolo do ACE trabalha sobre abstrações relacionadas à decisão que o cliente precisa tomar, nunca sobre hipóteses diagnósticas ou uma condição de saúde específica. Isso é elevado a princípio arquitetural permanente do Método, registrado em `docs/ace/01-framework/framework.md`.
- **Consequência:** nenhum protocolo, especificação, prompt ou artefato futuro do ACE deve nomear ou modelar um conceito em torno de doença/condição clínica como unidade central — a unidade central é sempre a decisão do cliente. "Clinical Context" nunca foi formalizado em nenhum documento deste repositório antes desta ADR, então não há conteúdo histórico a reconciliar; os changelogs do Framework, da Ontologia e do P004 registram apenas que o nome cogitado inicialmente (em conversa, não em documento) foi descartado antes de qualquer especificação.
- **Revisitar quando:** o escopo de negócio do ACE mudar de forma que a Aliviar passe a operar sobre diagnóstico clínico diretamente — o que hoje contradiz `docs/PRODUCT_VISION.md` (seções "Quem NÃO é o cliente" e "O que nunca faremos") e exigiria uma revisão de posicionamento muito mais ampla do que este ADR sozinho.

---

## ADR-012 — Princípios de Engenharia do ACE (utilitários centrais, tipos fortes, autodeclaração de proveniência)

- **Status:** Definitiva.
- **Contexto:** revisão de arquitetura do Ciclo 5 do ACE (P001-P005 já implementados) identificou três problemas concretos, verificados no código: (1) `findForbiddenFields`, uma regra transversal do Kernel, vivia dentro do módulo do artefato do P002 (`decision-case.ts`), fazendo P003/P004/P005 dependerem do módulo de um protocolo específico para uma checagem genérica; (2) a função `assertNoForbiddenFields` estava duplicada, quase idêntica, em 4 arquivos de artefato; (3) `protocolId` era tipado como `string` solto em toda parte (contratos, erros, funções de validação), sem nenhum tipo central enumerando os protocolos existentes, e nenhum artefato se autodeclarava qual protocolo o produziu.
- **Decisão:** (1) utilitários transversais do Kernel vivem em `src/modules/ace/core/`, nunca no módulo de um artefato específico; (2) `ProtocolId` é um union type central (`src/modules/ace/core/protocol-id.ts`), usado em todo contrato de protocolo, erro e validação — nunca `string` solto; (3) todo artefato do ACE carrega `producedBy: ProtocolId`, estampado pela própria construção, nunca recebido como entrada; (4) referências de proveniência entre artefatos usam um tipo genérico `ArtifactReference<TType>` (`src/modules/ace/core/artifact-reference.ts`), parametrizado por artefato, em vez de tipos redundantes repetidos por arquivo.
- **Consequência:** todo protocolo futuro (P006 em diante) deve seguir este padrão — nenhuma nova duplicação de validação de campos proibidos fora de `core/`, nenhum `protocolId` solto como `string`, todo artefato novo estampa `producedBy` e usa `ArtifactReference<TType>` para suas referências de origem. Nenhuma mudança de comportamento observável para P001-P005 — apenas reorganização.
- **Revisitar quando:** o número de protocolos crescer a ponto de o union type fixo `ProtocolId` se tornar difícil de manter (nesse caso, considerar um template literal type `` `P${number}` `` com validação em runtime); ou um novo tipo de artefato precisar de uma regra de campos proibidos genuinamente distinta da compartilhada em `core/forbidden-fields.ts` (ver nota de projeto sobre o P006 nesse mesmo ciclo — artefatos que legitimamente identificam provedores de cuidado precisarão de uma lista de campos proibidos própria, não a mesma usada por P002-P005).

---

## ADR-013 — O Método Aliviar é desacoplado da estrutura atual da Rede ("Care Provider", não "Specialist")

- **Status:** Definitiva.
- **Contexto:** ao revisar a arquitetura do P006, o arquiteto do projeto identificou que nomear o conceito interno do ACE como "Specialist" acopla o Método à estrutura de rede/negócio atual da Aliviar (profissionais individuais, hoje). Isso compromete a evolução futura do Método — instituições, equipes, programas ou outros formatos de provimento de cuidado que a Aliviar venha a incorporar (`docs/PRODUCT_VISION.md`: "o sistema é modular e evolutivo por definição") exigiriam renomear ou forçar a Ontologia do ACE a cada mudança de modelo de rede.
- **Decisão:** o vocabulário interno do ACE usa **"Care Provider"**, nunca "Specialist", em toda a arquitetura (Ontologia, Framework, especificações de protocolo, código). Isso é puramente uma decisão de desacoplamento arquitetural — **não** altera a experiência do cliente nem a terminologia usada em `aliviar-conexao` (produto) ou em comunicação com o cliente, que podem continuar usando "profissional"/"especialista" livremente; o ACE, como método interno, é que nunca deve presumir que "profissional individual" é a única forma de provimento de cuidado que sempre existirá.
- **Consequência:** todo protocolo do ACE a partir do P006 nomeia esse conceito como Care Provider. Artefatos que envolvem Care Providers conhecem apenas o contrato de um repositório de provedores (Provider Repository) — nunca sua implementação concreta —, preservando a possibilidade de a Rede evoluir sem exigir mudança na Ontologia do Método.
- **Revisitar quando:** houver decisão de negócio explícita de que a Aliviar passa a operar sobre um único formato fixo e permanente de provimento de cuidado (o que pareceria contradizer o modelo modular e evolutivo já registrado em `docs/PRODUCT_VISION.md`).

---

## ADR-014 — Política de campos do ACE em três camadas (Kernel / Estágio / Artefato)

- **Status:** Definitiva.
- **Contexto:** ao especificar o P007 (Compatibility Matrix Builder), identifiquei que a lista universal de campos proibidos (`core/forbidden-fields.ts`) incluía `"compatibility"`/`"compatibilityMatrix"` — campos que o próprio P007 precisa produzir legitimamente. Uma lista única e universal não consegue expressar "proibido antes do P007, legítimo a partir dele". O arquiteto do projeto determinou que a correção não deveria ser remover o campo da lista (o que reabriria a porta para P002-P006 usarem esses campos prematuramente), mas tornar a validação consciente da etapa e do tipo do artefato.
- **Decisão:** a validação de campos passa a operar em três camadas: (1) `KERNEL_FORBIDDEN_FIELDS` — proibidos permanentemente, em qualquer artefato, para sempre (clínico: diagnóstico/tratamento/prescrição/opinião médica; especialidade e confiança; vocabulário descartado da ADR-013; decisório: `selectedProvider`/`finalDecision`, reservados exclusivamente à Curadoria Validada/Final, que não passam por esta validação; comercial: `commercialRanking`/`paidPlacement`); (2) `STAGE_RESERVED_FIELDS` — legítimos somente a partir de um estágio específico do pipeline (ex.: `compatibility`/`compatibilityMatrix` a partir do P007), proibidos em qualquer artefato produzido antes dele; (3) `assertFieldPolicy` — aplica as duas camadas acima dado o protocolo produtor do artefato, centralizada em `src/modules/ace/core/field-policy.ts`.
- **Consequência:** `core/forbidden-fields.ts` foi removido e substituído por `core/field-policy.ts` (mais `core/pipeline-stage.ts`, que define a ordem completa e já conhecida do pipeline — P001 a P010 — apenas para fins de ordenação da política, sem antecipar a especificação de nenhum protocolo além dos já especificados). Todo artefato (P002-P006, já migrados) e todo artefato futuro deve chamar `assertFieldPolicy` informando o protocolo que o produz; nenhuma exceção ad hoc por artefato é permitida. Testes de P002-P006 foram atualizados para comprovar que `compatibility`/`compatibilityMatrix` continuam bloqueados antes do P007, sem nenhuma regressão nos testes já existentes.
- **Revisitar quando:** o número de campos em `STAGE_RESERVED_FIELDS` crescer a ponto de a lista plana se tornar difícil de auditar — nesse caso, considerar agrupar por protocolo produtor em vez de uma lista única de pares campo→estágio.

## ADR-015 — Restrições Obrigatórias propagadas ao Decision Context

- **Status:** Definitiva.
- **Contexto:** o P007 (Compatibility Matrix Builder) tinha `constraintAlignment` estruturalmente sempre `NOT_APPLICABLE`, porque as Restrições Obrigatórias do cliente (`mandatoryConstraints`) vivem no DecisionCase (P002), e o DecisionCase não é entrada do P007 — apenas o DecisionContext (P004), que não as carregava adiante. Isso significava que a dimensão nunca refletia dado real, e o arquiteto do projeto determinou, antes de iniciar o P008 (Shortlist Builder), que a Shortlist não deveria ser construída sobre uma matriz com essa lacuna estrutural.
- **Decisão:** propagar `mandatoryConstraints` do DecisionCase para o DecisionContext, sem adicionar o DecisionCase como entrada direta do P007. O P004 não cria nem interpreta Restrições Obrigatórias — apenas as transporta mecanicamente (nunca via o parâmetro `modeling`, que simula classificação semântica; a cópia é feita pelo próprio código do protocolo, diretamente de `decisionCase.mandatoryConstraints`). O P007 passa a avaliar `constraintAlignment` usando essas restrições: `NOT_APPLICABLE` quando não há nenhuma restrição registrada; `INSUFFICIENT` quando há restrições, mas o `CareProviderProfile` ainda não possui nenhum campo estruturado para verificá-las (preço, convênio, localização, modalidade — nenhum desses atributos foi adicionado ao perfil do provider nesta decisão). Nenhuma verificação é inventada; a lacuna é sempre registrada em `missingInformation`.
- **Consequência:** `DecisionContext` e `CreateDecisionContextInput` ganham o campo `mandatoryConstraints: MandatoryConstraint[]` (mesmo tipo já usado pelo DecisionCase). `P004Modeling` passou a excluir esse campo explicitamente, para que a simulação de classificação semântica nunca o produza. `P007` ganhou uma nova função de avaliação real para `constraintAlignment`, substituindo o retorno fixo `NOT_APPLICABLE`. Nenhum novo atributo de provider (preço, agenda, convênio, localização) foi introduzido — por isso, na prática, toda restrição registrada hoje resulta em `INSUFFICIENT`, até que uma infraestrutura de dados estruturados sobre os providers exista.
- **Revisitar quando:** o `CareProviderProfile` ganhar atributos estruturados capazes de responder a alguma categoria de restrição (ex.: modalidade de atendimento) — nesse momento, `constraintAlignment` poderá produzir `STRONG`/`ADEQUATE`/`PARTIAL` para essas restrições específicas, mantendo `INSUFFICIENT` apenas para as que ainda não têm dado estruturado correspondente.

## ADR-016 — DeliveryArtifact: o P010 comunica, nunca decide

- **Status:** Definitiva.
- **Contexto:** ao especificar o P010 (Final Curadoria Delivery), era preciso decidir se `FinalCuradoria` deveria ser um novo `HumanDecisionArtifact` (como o `HumanReviewResult` do P009) ou algo distinto. O arquiteto do projeto determinou que o P010 não toma uma nova decisão — ele materializa e comunica ao cliente uma decisão humana já registrada no P009. Tratar `FinalCuradoria` como decisória duplicaria a autoridade decisória em dois pontos do pipeline, quando ela deve existir em exatamente um (o P009).
- **Decisão:** criar uma categoria de artefato nova, `DeliveryArtifact` (`src/modules/ace/core/artifact-contract.ts`), distinta de `HumanDecisionArtifact`: `decisional` é sempre `false` — mas, diferente de `AnalysisArtifact` (que representa uma etapa de análise do pipeline), um `DeliveryArtifact` é o produto final entregável, e preserva na própria base a proveniência da decisão humana que ele materializa: `validatedBy`, `validatedAt`, `humanReviewReference`, `methodVersion`. `FinalCuradoria` estende esse contrato. O P010 nunca troca, adiciona ou remove um provider aprovado, nunca altera uma justificativa validada, nunca reabre a análise de compatibilidade — apenas verifica consistência e monta a apresentação.
- **Consequência:** `FinalCuradoria` tem `decisional: false`, não `true` — apesar de ser o artefato final do pipeline. A autoridade decisória do ACE permanece concentrada exclusivamente no P009 (`HumanReviewResult`, `decisional: true`). O P010 valida mecanicamente a ausência de vocabulário de ranking/vencedor em todo texto (nunca a fidelidade semântica fina do conteúdo, que permanece responsabilidade do processo humano/editorial que produz o texto de apresentação).
- **Revisitar quando:** surgir um segundo artefato de entrega no pipeline (não previsto nesta versão) — nesse momento, avaliar se `DeliveryArtifact` precisa de campos adicionais na base, ou se cada entrega deve defini-los por conta própria.

---

## ADR-017 — Logo oficial recebida: paleta confirmada, Direção Criativa da Landing registrada, vídeo institucional da Landing é asset distinto do filme de 80s

- **Status:** Definitiva quanto à paleta e à separação dos dois vídeos; conteúdo da Direção Criativa evolutivo.
- **Contexto:** o usuário forneceu a logo oficial "Aliviar — Curadoria Médica Independente", encerrando o bloqueio da ADR-008/ADR-010 sobre paleta provisória. Paralelamente, o usuário aprovou uma "Direção Criativa Oficial" completa para a Landing Page (auditoria de 7 passos + estrutura de 12 seções + adendo de tom cinematográfico/ordem emocional), que não cabe em nenhum dos cinco documentos de produto/marca já canônicos pela ADR-010 (não é posicionamento, não é princípio permanente, não é personalidade de marca geral, não é a estratégia antiga de `LANDING_STRATEGY.md`, e não é o roteiro do filme de 80s). Além disso, a auditoria revelou uma contradição real entre essa Direção Criativa (vídeo institucional de ~10 minutos, explicativo, como elemento central da Landing) e os documentos já committados da FASE 7 (`docs/VIDEO_STORYBOARD.md`, `docs/FILME_INSTITUCIONAL_ALIVIAR.md`, `docs/FILME_PRODUCTION_PLAN.md`, `docs/CINEMA_BIBLE.md`, `docs/KEYFRAME_GUIDE.md`), que descrevem um filme de marca de 80 segundos (Helena, 11 atos, puramente emocional, sem explicar "como funciona"). Consultado, o usuário confirmou que são **dois vídeos distintos**, não uma contradição a resolver por substituição.
- **Decisão:** (1) A paleta de `docs/DESIGN_SYSTEM.md`/`tailwind.config.ts` (`#0E2F52`/`#123B67` navy, `#7F9E8C` sage, `#B08D57` dourado hairline, `#F7F5F1` canvas) é **confirmada como final**, deixa de ser "provisória" — validada visualmente contra a logo oficial recebida. Amostragem foi visual, não pixel-exata; se surgir arquivo-fonte da marca (Figma/Illustrator/SVG de produção) com hex exatos, ele prevalece sobre esta confirmação sem precisar de novo ADR, apenas atualização direta dos tokens. (2) `docs/LANDING_CREATIVE_DIRECTION.md` é criado como sexto documento canônico de produto/marca (estende a lista da ADR-010), específico da Landing Page — captura objetivo emocional, ordem/beats, papel do vídeo, proibição de parecer site médico, limites de inovação (arte sim, fluxo/clareza não), papel do WhatsApp como extensão e não fuga, e o critério de sucesso da página. `docs/LANDING_STRATEGY.md` (estrutura antiga de 8 seções) é marcado como **superado na estrutura** por este novo documento (a estrutura vigente é a de 12 seções aprovada nesta auditoria), mas seu conteúdo de tom/voz/FAQ/SEO permanece válido como referência. (3) O vídeo institucional da Landing (~10 minutos, explicativo: conceito/por quê/como/quem/papel da Aliviar/o que esperar) é um **asset novo e distinto** do filme de 80 segundos da FASE 7 (Helena) — este último não é alterado, retido nem descontinuado por esta decisão, e continua existindo para outros canais (redes sociais, campanhas). O roteiro/plano do vídeo de ~10min vive em `docs/VIDEO_INSTITUCIONAL_LANDING.md`, novo documento, sem tocar nos arquivos da FASE 7.
- **Consequência:** implementação da Landing Page (componentes, copy, ordem das 12 seções) passa a seguir `docs/LANDING_CREATIVE_DIRECTION.md` como fonte primária de tom/estrutura, com `docs/BRAND_GUIDELINES.md`/`docs/DESIGN_SYSTEM.md` como base de identidade visual/voz geral. A seção de vídeo da Landing referencia `docs/VIDEO_INSTITUCIONAL_LANDING.md`, nunca o roteiro de 80s. Nenhum arquivo da FASE 7 é modificado por este ADR.
- **Revisitar quando:** houver arquivo-fonte da logo com hex exatos (atualização direta de tokens, sem novo ADR); ou o usuário decidir unificar os dois vídeos em um único asset (exigiria novo ADR, pois reverteria a decisão (3) acima).

---

## ADR-018 — "Sua História" exige conta de paciente pré-existente; persistência server-side com concorrência otimista

- **Status:** Definitiva.
- **Contexto:** ao auditar o módulo `story` para o Épico 1/Sprint 1, identifiquei que `docs/PRODUCT_ARCHITECTURE.md` §4.2 descrevia a jornada do Concierge como se, ao concluir "sua história", _"a pessoa cria conta (ou associa a uma já existente)"_ — o que contradiz diretamente §21 (correção definitiva, mais recente): _"a equipe Aliviar realiza o cadastro inicial do paciente... não existe, e não deve existir, signup público."_ Levei a contradição ao usuário antes de implementar. Decisão do usuário: a regra de §21 prevalece integralmente — "sua história" nunca cria nem associa conta; passa a exigir sessão autenticada com papel "paciente" desde o primeiro acesso ao wizard.
- **Decisão:** (1) `docs/PRODUCT_ARCHITECTURE.md` §4.2 foi corrigida para refletir que a conta é sempre pré-existente. (2) A rota `/sua-historia` (raiz) permanece pública, só como página explicativa — nunca permite preenchimento anônimo. As seis etapas do wizard (`para-quem`, `motivo`, `historia`, `informacoes`, `preferencias`, `revisao`) passam a exigir sessão + papel "paciente", reforçado em duas camadas: middleware (checagem otimista, via remoção de `/sua-historia/*` de `isPublicPath` — só a rota raiz exata continua pública) e um novo `layout.tsx` de route group `(wizard)` que chama `requireRole("paciente")` (checagem autoritativa, mesmo padrão de `docs/ENGINEERING_PLAN.md` seção 8). Usuário sem sessão é redirecionado a `/login?next=<rota solicitada>`; usuário autenticado sem papel "paciente" vai para `/acesso-negado`. (3) A persistência deixa de depender exclusivamente de `localStorage` — passa a existir server-side (`patient_stories`/`patient_story_versions`, RLS por `profile_id = auth.uid()`), com **concorrência otimista** via uma coluna `revision` (incrementada a cada escrita por trigger; toda escrita da aplicação informa a `revision` que leu, e é rejeitada — não sobrescrita — se a linha já avançou). `localStorage` é reduzido a **cache transitório de segurança**: perda momentânea de conexão, refresh antes da confirmação do autosave, recuperação após erro de rede — nunca mais fonte da verdade; após sincronização confirmada, é atualizado para espelhar exatamente o estado do servidor. (4) O fluxo de conclusão ("Concluir" na revisão) só marca a história como `enviada` — nunca cria conta, nunca associa conta, nunca redireciona a cadastro, nunca promete envio ao ACE. Uma história `enviada` fica imutável (trigger bloqueia updates de `data` após o envio), preparando — sem implementar — o princípio já usado no ACE de "novo Caso, nunca edição retroativa" para quando múltiplas histórias existirem.
- **Consequência:** nenhuma sessão anônima é criada em nenhum ponto do produto — decisão explícita do usuário, descartando a alternativa (sessão anônima do Supabase Auth) que eu havia inicialmente recomendado antes desta correção. Toda pessoa que preenche "sua história" já tem, obrigatoriamente, uma conta criada pela equipe Aliviar por fora do sistema. O acolhimento anônimo de visitante descrito em versões anteriores da documentação de produto deixa de existir — se o negócio precisar de um funil de captação verdadeiramente anônimo no futuro, isso exige um novo ADR próprio, não uma reinterpretação silenciosa deste.
- **Revisitar quando:** houver decisão de negócio explícita para permitir preenchimento anônimo (ex.: como parte de uma campanha de captação) — exigiria reabrir esta decisão com ADR próprio, incluindo como reconciliar com §21.

---

## ADR-020 — Notas internas do Caso: histórico append-only, nunca um campo sobrescrevível

- **Status:** Definitiva.
- **Contexto:** o campo `cases.notes` (ADR-019) era um texto único, sobrescrito a cada salvamento — uma segunda pessoa editando notas apagava silenciosamente o que a primeira escreveu, sem qualquer registro de autoria por trecho. O usuário pediu o ajuste antes de iniciar a Sprint 3.
- **Decisão:** `cases.notes` é removido; `case_notes` (append-only, sem policy de UPDATE/DELETE) passa a registrar cada nota como uma linha própria — autor, timestamp e conteúdo, nunca editável ou removível depois de criada. A interface (`CaseNotesLog`) permanece simples: um campo para escrever uma nota nova + a lista cronológica das anteriores — deliberadamente não é uma thread de comentários/mensagens (menções, respostas, edição, reações).
- **Consequência:** nenhuma escrita anterior existia em ambiente real (Docker local nunca esteve disponível nesta sessão) — não há dado de produção a migrar. `case_events` deixa de registrar o tipo `note_updated` (redundante: `case_notes` já é o próprio histórico com autoria e timestamp); o valor permanece no enum do banco por não haver necessidade de removê-lo, só deixa de ser emitido pela aplicação.
- **Revisitar quando:** houver necessidade real de uma nota referenciar/responder outra, ou de edição colaborativa — nesse momento avaliar se ainda cabe como "nota simples" ou se precisa de um modelo próprio, com ADR específico.

---

## ADR-019 — Entidade Case: taxonomia operacional própria, distinta (e mais estreita) do modelo completo de `docs/PRODUCT_ARCHITECTURE.md` §14

- **Status:** Definitiva quanto à taxonomia e ao modelo de acesso; evolutiva quanto aos estados ligados ao ACE (ainda não implementados).
- **Contexto:** `docs/PRODUCT_ARCHITECTURE.md` §14 já descreve um modelo de estados do Caso ("Aberto", "Enviado", "Em Processamento", "Aguardando Revisão Humana", "Bloqueado — ...", "Em Revisão", "Validado/Rejeitado/Aguardando Mais Informação", "Entregue") — mas esse modelo pressupõe o pipeline ACE (P001-P010) rodando de ponta a ponta, o que esta sprint explicitamente não implementa. "Aberto"/"Enviado" também colidiriam com o vocabulário já usado por `patient_stories.status` (`rascunho`/`enviada`, ADR-018) — o Caso começa depois que a História já está "enviada", nunca antes.
- **Decisão:** o Caso usa uma taxonomia própria, operacional, em inglês (consistente com o estilo de enum já usado no ACE — `VALIDATED`/`REJECTED`/`BLOCKED`): `NEW`, `IN_REVIEW`, `WAITING_FOR_INFORMATION`, `READY_FOR_CURATION`, `IN_CURATION`, `HUMAN_REVIEW`, `DELIVERED`, `CLOSED`, `CANCELLED`. Mapeamento conceitual com §14/§15 (não uma renomeação de §14, uma camada honesta do que existe hoje): `NEW` = Caso criado, ainda não triado (não existe em §14, é anterior ao "Em Processamento"); `IN_REVIEW` = equipe organizando manualmente (hoje sem ACE); `WAITING_FOR_INFORMATION` = mesmo conceito de "Aguardando Mais Informação"/P009 `REQUEST_MORE_INFORMATION`, mas acionado manualmente enquanto o P009 não roda; `READY_FOR_CURATION`/`IN_CURATION` = precede/corresponde a "Em Processamento" (P001-P008, ainda não implementado — estado reservado); `HUMAN_REVIEW` = "Aguardando Revisão Humana"/"Em Revisão" (P009, ainda não implementado); `DELIVERED` = "Entregue" (P010, ainda não implementado); `CLOSED`/`CANCELLED` = encerramento normal (§12, ciclo de 12 meses) ou encerramento sem curadoria viável (análogo aos "Bloqueado" de §14, sem modelar os motivos específicos do ACE ainda). Transições válidas (máquina de estados, reforçada por trigger no banco, não só na aplicação): `NEW→{IN_REVIEW,CANCELLED}`, `IN_REVIEW→{WAITING_FOR_INFORMATION,READY_FOR_CURATION,CANCELLED}`, `WAITING_FOR_INFORMATION→{IN_REVIEW,CANCELLED}`, `READY_FOR_CURATION→{IN_CURATION,CANCELLED}`, `IN_CURATION→{HUMAN_REVIEW,CANCELLED}`, `HUMAN_REVIEW→{DELIVERED,WAITING_FOR_INFORMATION,CANCELLED}`, `DELIVERED→{CLOSED}`; `CLOSED`/`CANCELLED` são terminais.
- **Modelo de acesso** (reconciliado com §16/§17): Administrador cria Caso, atribui/reatribui Curador Médico, e altera status — leitura de todos os Casos (oversight operacional). Curador Médico só lê/atua nos Casos com `assigned_curator_id = auth.uid()` — nunca todos. Isso não contradiz §16 ("acesso a Casos individuais não é automático só por ser Administrador — precisa também do papel de Curador Médico para revisar curadorias"): a leitura de §16 é sobre **revisar a curadoria** (o ato do P009, ainda não implementado); a operação administrativa desta sprint (criar/atribuir/mudar status/anotar) é gestão operacional, não revisão de curadoria, e é exatamente o que o usuário pediu explicitamente no escopo desta sprint ("Somente Administrador ou Curador Médico pode criar um Caso"). Paciente nunca lê a tabela `cases` diretamente — só uma view (`patient_case_overview`) com status traduzido para linguagem humana, sem nenhuma coluna de nota, protocolo ou artefato do ACE — a tradução acontece em SQL (`case` expression na própria view), nunca em código de aplicação, para que o valor bruto do enum nunca trafegue para o paciente.
- **Consequência:** um único log unificado (`case_events`) registra criação, mudança de status e reatribuição de curador — cobre "logs de criação, atribuição e mudança de status" e a "linha do tempo operacional" pedida para a tela de detalhe, sem duas tabelas de auditoria se sobrepondo. `patient_stories`/`patient_documents`/`patient_story_attachments` ganham policies aditivas (nunca substituindo as já existentes) para o Curador Médico ler apenas o que pertence a um Caso atribuído a ele, via função `is_case_curator_for_story`.
- **Revisitar quando:** a Fase 5 do roadmap (módulo `concierge`) conectar de fato o ACE — nesse momento, `IN_CURATION`/`HUMAN_REVIEW`/`DELIVERED` passam a ser dirigidos por eventos reais do pipeline (não mais transições manuais), e `docs/PRODUCT_ARCHITECTURE.md` §14 pode ser reconciliado formalmente com esta taxonomia operacional.

---

## ADR-021 — Encerramento formal da Versão 1 (V1.0): produto e ACE congelados, próxima fase é operação

- **Status:** Definitiva.
- **Contexto:** com o módulo `concierge` conectando de fato o ACE (P001–P010) ao pipeline do Caso (`IN_CURATION`→`HUMAN_REVIEW`→`DELIVERED`, antecipado como pendência na ADR-019), com a proteção de ambiente do modelo de linguagem em produção implementada (nunca cai silenciosamente no modelo fake fora de desenvolvimento/teste) e com o endurecimento mínimo de produção (cabeçalhos de segurança HTTP) concluído, o usuário declarou formalmente — em duas rodadas sucessivas ("MARCO OFICIAL — GO LIVE" e, em seguida, "FASE FINAL — ATIVAÇÃO") — que o desenvolvimento da Versão 1 está encerrado e que a próxima fase do projeto é exclusivamente a operação da plataforma em produção, não mais desenvolvimento de produto ou arquitetura.
- **Decisão:** a partir desta ADR, **Produto: versão 1.0**, **ACE: versão 1.0**, **Status: Frozen**, **Desenvolvimento: Encerrado**, **Próxima fase: Operação**. Nenhum novo módulo, tela, API, protocolo do ACE, migration ou alteração de UX/fluxo/arquitetura é criado a partir daqui sem uma decisão explícita e documentada de iniciar uma V2. A única categoria de trabalho permitida sobre o código existente é **correção de bugs** — nunca melhoria, refatoração sem necessidade ou expansão de escopo. O escopo de trabalho operacional (configuração de produção, deploy, ambiente, domínio, segurança, monitoramento, logs, backups, variáveis de ambiente, validações, scripts operacionais, runbooks, documentação operacional, smoke tests) permanece explicitamente permitido e não constitui "desenvolvimento" para os fins desta ADR.
- **Consequência:** `docs/ENGINEERING_PLAN.md` (plano original de MVP restrito a descoberta/conexão direta, nunca implementado) e as seções de `docs/PRODUCT_ARCHITECTURE.md` que ainda descreviam partes do ACE como "não implementado" foram corrigidas para refletir a realidade entregue — o produto que chegou à V1.0 é a Curadoria Médica Aliviar (jornada do Concierge, ACE P001-P010, Revisão Humana, Entrega Final), não o MVP original de busca direta. `CHANGELOG.md` (novo) passa a ser a fonte única do histórico de entregas por sprint. `README.md` e `docs/ARCHITECTURE.md` foram atualizados para declarar o status Frozen.
- **Revisitar quando:** houver decisão de negócio explícita para iniciar uma V2 — nesse momento, uma nova ADR reabre desenvolvimento de produto/arquitetura, definindo escopo e critérios próprios, sem reverter esta decisão retroativamente.

---

## ADR-022 — Golden Set (`tests/golden/`) é requisito obrigatório de governança para mudanças de prompt/modelo/SDK/provider do ACE

- **Status:** Definitiva quanto ao papel de governança da suíte; evolutiva quanto à sua cobertura (lacunas conhecidas registradas abaixo, nenhuma bloqueia esta ADR).
- **Contexto:** a auditoria de GO LIVE desta sessão adicionou validação Zod em runtime (`anthropic-language-model.ts`) que garante a **forma** da resposta do modelo, mas não que o **conteúdo** obedece às regras de cada `specification.md` (Kernel, `docs/ace/03-kernel/kernel.md`, seção 4 — "variação de estilo é aceitável, variação de regra não é"). Toda a suíte de testes existente roda contra `FakeAceLanguageModel`, determinístico por construção — nenhum teste automatizado exercitava o modelo Anthropic real. Foi construída uma suíte golden-set (`tests/golden/`) para P002/P003/P004/P010 (os únicos protocolos do ACE que chamam o modelo — P005–P008 são determinísticos), reaproveitando os exemplos já curados em `docs/ace/04-specs/*/examples.md` e as regras de `tests.md`. Uma revisão crítica subsequente (nesta mesma sessão) concluiu que a suíte protege bem o que é estruturalmente enumerável (schema, enum, chave de campo, contagem/ordem, rastreabilidade, vocabulário de ranking do P010) mas ainda não protege o "discurso" da filosofia do Método (diagnóstico/certeza absoluta/linguagem comercial ou alarmista em texto livre) em nenhum dos quatro protocolos, e nunca foi executada contra a API real (sem `CLAUDE_API_KEY` disponível no ambiente até o momento desta ADR). O usuário aprovou explicitamente o relatório e a conclusão dessa revisão — não autorizou, nesta etapa, nenhuma fixture nova, mudança em Kernel/artifacts, ou parametrização de provider.
- **Decisão:** a suíte Golden Set (`tests/golden/`, `npm run test:golden`) passa a ser parte da **Governança do ACE**: requisito obrigatório (gate) para qualquer mudança futura de `prompt.md`, versão do modelo, SDK do fornecedor ou provider dos protocolos P002/P003/P004/P010 — nenhuma dessas mudanças é considerada concluída sem a suíte rodando e passando contra o modelo real primeiro. Isto é tratado como trabalho operacional/observabilidade, permitido por ADR-021 (mesma categoria de runbooks/smoke tests), nunca como reabertura de desenvolvimento de produto/arquitetura — não altera Constituição, Framework, Ontologia, Kernel, `specification.md` ou `prompt.md` de nenhum protocolo, e não constitui início de uma V2. A suíte permanece separada, manual, fora de `npm test`/CI automática, e pula explicitamente sem `CLAUDE_API_KEY` (ver `docs/ace/05-knowledge/golden-set-testing.md`). É um **gate de calibração** — evidência de que o Método se sustenta contra o modelo real — nunca um teste unitário determinístico: o modelo é estocástico, uma fixture pode variar de amostra a amostra, e uma falha exige investigação de deriva de regra antes de qualquer ajuste de asserção.
- **Proteção contra chamadas reais não autorizadas:** a presença de `CLAUDE_API_KEY` sozinha **nunca** autoriza uma execução real — é sempre exigida também `ALLOW_REAL_MODEL_CALLS=true`, comparação estrita (só a string exata `"true"`; qualquer variação de capitalização, espaço, ou outro valor é tratada como ausência de autorização). A checagem (`tests/golden/real-model-call-guard.ts`, função pura) roda antes de qualquer `AnthropicAceLanguageModel` ser instanciado — sem ela, a suíte fica bloqueada por padrão. Essa exigência nasceu de dois incidentes reais desta sessão (`docs/ace/05-knowledge/golden-set-testing.md`, seção "Incidente"): tentativas de desabilitar a chave via `unset`/valor vazio no shell não impediram chamadas reais, porque `tests/golden/setup-env.ts` recarrega `.env.local` independentemente. Em ambos os casos nenhum segredo foi exposto e **nenhum resultado dessas chamadas não autorizadas foi usado como evidência de calibração** — nem para alterar fixture, prompt ou código, nem para reescrever o histórico de `docs/ace/CALIBRATION_REPORT.md`; resultado de uma execução só conta como evidência quando obtido com autorização explícita e deliberada. Resultados de qualquer execução real (autorizada ou não) nunca são versionados — `.golden-results/` está no `.gitignore` — e todo artefato de diagnóstico gravado localmente passa por sanitização (`tests/golden/sanitize-for-log.ts`: redige por nome qualquer campo com chave/token/segredo/senha/prompt/header/cookie, nunca grava a chave, o `systemPrompt` ou o prompt integral). Uma execução real tem custo de API e deve ser deliberada, nunca rotineira ou por curiosidade — ver `docs/ace/05-knowledge/golden-set-testing.md`, seção "Quando rodar".
- **Consequência:** o gate é obrigatório, mas explicitamente **não é suficiente sozinho** como garantia completa da filosofia do Método — lacunas conhecidas ficam registradas, não bloqueiam esta ADR, e cada uma exige aprovação própria antes de ser fechada: (1) suíte nunca executada contra o modelo real de forma autorizada (as únicas execuções reais até esta ADR foram os dois incidentes não autorizados acima); (2) ausência de verificação determinística de texto livre (diagnóstico/certeza absoluta/linguagem comercial/alarmista) em P002/P003/P004/P010 — proposta de vocabulário proibido generalizado documentada, não implementada, exigiria ADR própria por alterar Kernel/`core`/`artifacts`; (3) cenário ADJUST e "preservação de limitação relevante" do P010 sem fixture; (4) perguntas não indutivas do P003 (T09) sem fixture; (5) o runner está acoplado a um único provider concreto (`AnthropicAceLanguageModel`), apesar do ACE ser desenhado como LLM-agnostic — parametrização por provider fica para quando um segundo provider existir de fato.
- **Revisitar quando:** (a) a primeira execução real **autorizada** (`ALLOW_REAL_MODEL_CALLS=true`) acontecer — registrar o resultado; (b) qualquer um dos itens pendentes acima for aprovado individualmente pelo arquiteto do projeto.

---

## ADR-023 — Method Invariants: reconhecimento formal de um padrão arquitetural já existente no ACE

- **Status:** Definitiva quanto ao reconhecimento do padrão; não introduz nenhuma implementação nova.
- **Contexto:** uma auditoria transversal desta sessão, cobrindo os artefatos e protocolos dos 10 estágios do ACE (P001–P010), encontrou pelo menos 15 funções de validação distintas (`assertFieldPolicy`, `assertNullFieldsAreRegisteredAsMissing`, `assertNoForbiddenLanguage`, `assertObjectiveMatchesCase`, `assertNotBlocked`, `assertComposedInvariants`, `assertEvidenceForValidatedActions`, `assertStableOrder`, `assertEligibleIdsConsistency`, `assertNoDuplicateProviders`, `assertStatusConsistency`, `assertQuestionsMatchIssues`, `assertStatusMatchesAction`, `assertApprovedProviderIdsConsistency`, `assertChangesConsistency`, `assertReturnToProtocolConsistency`, entre outras), presentes em 9 dos 10 protocolos, todas com a mesma assinatura estrutural: recebem a saída já validada estruturalmente (schema), verificam se ela obedece a uma regra fechada do Método, e **rejeitam** (lançando `ProtocolError`) quando não obedecem — nunca corrigem, nunca reinterpretam, nunca substituem o conteúdo. Esse padrão foi reinventado de forma independente, protocolo a protocolo, ao longo da evolução do ACE, sem nunca ter sido nomeado como um conceito único — o mesmo padrão histórico que precedeu a formalização da Política de Campos em Três Camadas (ADR-014). Uma calibração pontual do P003 (CAL-002, `docs/ace/CALIBRATION_REPORT.md`) foi o que motivou a investigação inicial, mas a auditoria que sustenta esta ADR é a varredura transversal dos 10 protocolos, não o caso isolado do P003 — esta ADR documenta um padrão geral já existente no ACE, não uma solução para CAL-002.
- **Decisão:** o ACE reconhece formalmente a existência de **Method Invariants** como um padrão arquitetural já presente no Método — não uma camada nova, uma nomenclatura para o que já existe.
  - **Definição:** um Method Invariant é uma verificação determinística, aplicada à saída já validada estruturalmente (Response Schema) de um protocolo, antes da construção do artefato (`create*` em `artifacts/`), que garante que uma regra fechada do Método (Constituição, Kernel ou `specification.md`) se sustenta — e que **rejeita** a execução quando não se sustenta.
  - **Por que existem:** porque Response Schema garante apenas _forma_ (tipo, enum, presença), nunca a _relação_ entre o conteúdo de um campo e uma regra de negócio do Método (ex.: "esta categoria de achado nunca pode ter esta severidade", "esta ordem nunca pode representar preferência"). Essa lacuna entre forma válida e conteúdo metodologicamente correto é o espaço que os Method Invariants preenchem.
  - **O que protegem:** princípios da Constituição (ex.: Princípio 9 — nenhuma ordem representa preferência, em P006/P008/P010; ausência de vocabulário de ranking, em P010), regras do Kernel (ex.: §2 — nunca omitir lacuna silenciosamente, em P002; §4 — auditabilidade/consistência interna, em P003/P009) e regras explícitas de `specification.md` que dependem de uma relação de conteúdo, não apenas de um valor isolado.
  - **O que NÃO fazem, em nenhuma circunstância:** nunca corrigem a saída do modelo. Nunca reinterpretam um valor para torná-lo aceitável. Nunca substituem o julgamento do protocolo ou do modelo pelo seu próprio. Nunca tomam uma decisão em nome do modelo ou de um humano. Apenas **validam** (confirmam que o invariante se sustenta) ou **rejeitam** (lançam erro estruturado, sinalizando falha da execução) — o mesmo princípio já aplicado ao P009 (Kernel, seção 6: "a IA nunca decide... o software apenas... valida a consistência estrutural").
  - **Classificação formal — duas categorias:**
    - **Content Invariants**: protegem um princípio da Constituição/Kernel diretamente, independentemente de qualquer outro artefato (ex.: `assertFieldPolicy`, `assertNoForbiddenLanguage`, `assertStableOrder`, `assertComposedInvariants`, `assertEvidenceForValidatedActions`, `assertNullFieldsAreRegisteredAsMissing`). Devem existir sempre que uma regra fechada da Constituição/Kernel/`specification.md` recai sobre o _conteúdo_ de um campo (não apenas sua forma), e nenhum outro mecanismo (schema, field policy) já a cobre.
    - **Consistency Invariants**: protegem a consistência/rastreabilidade entre dois ou mais artefatos ou campos do mesmo artefato (ex.: `assertObjectiveMatchesCase`, `assertNotBlocked`, `assertStatusConsistency`, `assertQuestionsMatchIssues`, `assertEligibleIdsConsistency`, `assertNoDuplicateProviders`, `assertStatusMatchesAction`, `assertApprovedProviderIdsConsistency`, `assertChangesConsistency`, `assertReturnToProtocolConsistency`). Devem existir sempre que a especificação exige que um campo derive de, corresponda a, ou seja rastreável a outro já estabelecido — mecanizando o Kernel, seção 4 (auditabilidade e reprodutibilidade).
  - **Mapeamento das instâncias existentes (nenhuma alterada por esta ADR):** ver auditoria completa registrada nesta sessão — resumo: Field Policy existe em 9/10 protocolos (ausente em P001, gap registrado, não uma violação desta ADR); Content/Consistency Invariants adicionais existem em P002 (1), P003 (2, mais o Content Invariant que fecha a CAL-002 — formalizado e implementado em ADR-024), P004 (3, mais um candidato condicional — CAL-003), P006 (2), P007 (2), P008 (5), P009 (5), P010 (2, mais um gap residual conhecido — CAL-001). P005 não precisa de nenhum além de Field Policy (protocolo 100% determinístico, sem julgamento livre de modelo a proteger).
- **Relação com os demais mecanismos do ACE:**
  - **Response Schema** (`anthropic-language-model.ts`): camada anterior — garante forma. Um Method Invariant só faz sentido rodar depois que a forma já foi aceita; nunca a substitui.
  - **Artifact Builders** (`artifacts/*.ts`): é onde os Method Invariants vivem — chamados dentro de cada `create*`, antes da construção do artefato. Se rejeitarem, o artefato nunca chega a existir.
  - **Golden Set** (`tests/golden/`, ADR-022): não implementa Method Invariants — é a ferramenta que **detecta** empiricamente a necessidade de um novo invariante (evidência real de violação contra o modelo) e depois **valida** que um invariante implementado funciona (mesma fixture, múltiplas execuções).
  - **Human Review** (P009): tem seus próprios Consistency/Content Invariants (`assertStatusMatchesAction` e outros) protegendo a integridade da decisão humana registrada — mas o P009 em si nunca é substituído por um Method Invariant; a autoridade decisória humana (Kernel, seção 6) permanece intocada, os invariantes só protegem a consistência estrutural do registro dessa decisão.
  - **Calibration Report** (`docs/ace/CALIBRATION_REPORT.md`): é onde se registra, caso a caso, a descoberta de um gap ou candidato a Method Invariant (ex.: CAL-002, CAL-003) — o Calibration Report documenta o histórico da calibração; esta ADR documenta o padrão arquitetural permanente que essas calibrações, quando aprovadas, passam a instanciar.
- **Consequência:** nenhuma mudança de comportamento do ACE nesta etapa. Nenhum invariante novo foi criado, nenhum protocolo foi alterado, nenhum Kernel/Framework/Constituição foi tocado. Esta ADR não resolve CAL-002, CAL-003 ou o gap residual de CAL-001 — cada um continua exigindo sua própria aprovação e implementação específica, agora com um vocabulário e uma classificação formal (Content vs. Consistency) para se apoiar.
- **Revisitar quando:** um novo Method Invariant for aprovado para implementação (ex.: a resolução de CAL-002/CAL-003/CAL-001) — nesse momento, a implementação segue o padrão aqui reconhecido, sem precisar de nova justificativa arquitetural para o padrão em si.

---

## ADR-024 — Content Invariant no P003: rejeitar `severity: "blocking"` para restrição prática opcional (formalização de CAL-002)

- **Status:** Definitiva. **Correção factual (auditoria de documentação pendente, 2026-07-15):** as seções 7 e 8 abaixo foram escritas como plano ainda não autorizado, mas a implementação foi de fato autorizada e concluída no mesmo commit que introduziu esta ADR (`502c9a4 feat(ace): enforce P003 content invariant`) — `assertNoInvalidPracticalBlocking` já está em produção em `src/modules/ace/protocols/p003-case-audit.ts`, com `relatedField` no schema/prompt e cobertura unitária/integração (seção 8). Texto original das seções 7/8 preservado como registro do desenho aprovado; ver nota de status em cada uma.

### 1. Contexto

`p003-case-audit.ts` (`applyAdditionalFindings`, `computeStatus`) é um repasse fiel do que o modelo retorna: lê `finding.severity` sem nenhuma transformação e deriva `status` (`BLOCKED`/`READY_WITH_WARNINGS`/`READY`) só contando os arrays resultantes. A validação Zod (`P003_RESPONSE_SCHEMA`, `anthropic-language-model.ts`) garante a forma da resposta (enum fechado de `category`/`severity`), mas não garante que a **combinação** categoria+severidade obedece a uma regra de conteúdo do Método — Zod não expressa "esta categoria, dado este conteúdo, nunca pode ter esta severidade".

CAL-002 (`docs/ace/CALIBRATION_REPORT.md`, entrada 2026-07-14) documentou a violação: para um `DecisionCase` com decisão e objetivo claros, o modelo classificou a ausência de uma restrição prática opcional (localização/modalidade/horário/orçamento) como `severity: "blocking"`, contrariando `specification.md` (Casos de Exceção: restrição/preferência opcional ausente é sempre `Warning`, nunca bloqueante). Um reforço de prompt (Opção B — regra explícita e redundante em duas seções de `prompt.md`) foi implementado e testado, mas **não estabilizou o comportamento**: quatro execuções reais subsequentes contra a API Anthropic reproduziram a mesma classificação incorreta. Uma investigação de código (traço completo de `p003-case-audit.ts`) confirmou que nenhuma transformação toca `severity` — o problema é comprovadamente de comportamento do modelo, não de código, especificação ou prompt.

**Nota sobre evidência:** o payload exato da execução real do Caso de produção "Curisco1" (`ace_artifacts`/`ace_execution_events`) não existe mais — foi removido durante a limpeza de dados de teste autorizada nesta mesma sessão (Etapa 3 do Go-Live). A evidência que sustenta esta ADR é composta pelas quatro execuções equivalentes já documentadas na calibração (Golden Set + reexecuções reais), estruturalmente idênticas ao que ocorreu no Caso de produção, nunca o payload específico já apagado.

**Impacto operacional:** cada vez que isso ocorre, `orchestrator.ts` (linhas ~297-315) marca a execução como `BLOCKED`, `failureCode: CASE_AUDIT_BLOCKED`, e move o Caso para `WAITING_FOR_INFORMATION` — devolvendo ao paciente um pedido de informação desnecessária, para um Caso que a própria especificação já considera pronto para prosseguir.

### 2. Decisão

Um **Content Invariant** (categoria já formalizada em ADR-023) é criado para o P003: uma verificação determinística, aplicada à saída já validada estruturalmente pelo schema, antes de `applyAdditionalFindings()`/`computeStatus()`, que **rejeita** (nunca corrige) uma resposta do modelo que classifique como `blocking` um achado que a especificação já determina que nunca pode ser bloqueante.

- Vive em `src/modules/ace/protocols/p003-case-audit.ts`, entre a validação Zod (que ocorre antes, em `anthropic-language-model.ts`) e `applyAdditionalFindings()`.
- É determinístico — nunca "IA validando IA" (alternativa já descartada no design aprovado de `METHOD_INVARIANTS_DESIGN.md`).
- Escopo desta ADR: **somente P003**. Não se estende a P002/P004/P010 — cada protocolo que precisar de um Content Invariant próprio exige sua própria calibração e, se aplicável, sua própria ADR de extensão.
- Preserva a separação já estabelecida: o modelo continua exercendo julgamento semântico livre; o protocolo continua sendo o único lugar que decide se uma resposta é aceitável; o orquestrador continua desconhecendo os detalhes do Método.

### 3. Taxonomia

| Conceito                                    | Definição                                                                                                           | Pode ser `blocking`?                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ausência (`category: "ausencia"`)           | Informação que deveria existir mas não foi relatada                                                                 | Depende do que se refere — ver abaixo                                                                                                                       |
| Insuficiência (`category: "insuficiencia"`) | Informação existe mas está incompleta para avaliação responsável                                                    | Depende do que se refere — ver abaixo                                                                                                                       |
| Contradição (`category: "contradicao"`)     | Dois elementos do Caso logicamente incompatíveis                                                                    | **Sim, sempre**                                                                                                                                             |
| Ambiguidade (`category: "ambiguidade"`)     | Elemento presente, mas sem leitura única                                                                            | Sim — `specification.md` já deixa a critério de "a ambiguidade impedir ou não uma análise responsável"; **fora do escopo deste invariant**                  |
| Ausência de decisão                         | `decisionStatement.decision === null`                                                                               | **Sim, sempre** — já garantido deterministicamente por `auditDecisionStatement()`/`missingInformation` (`relatedField: "decision"`), sem depender do modelo |
| Ausência de objetivo                        | `decisionStatement.goal === null`                                                                                   | **Sim, sempre** — mesma garantia determinística, `relatedField: "goal"`                                                                                     |
| Restrição/preferência prática opcional      | Ausência ou insuficiência não relacionada a decisão nem objetivo (ex.: localização, modalidade, horário, orçamento) | **Nunca** — é exatamente a regra que este invariant mecaniza                                                                                                |

**Achado crítico da auditoria de schema:** o `P003_RESPONSE_SCHEMA` atual não tem nenhum campo que distinga "esta ausência/insuficiência é sobre decisão/objetivo" de "é sobre uma restrição prática" — só existem `category` (enum fechado) e `description` (texto livre). Diferenciar essas duas coisas hoje exigiria inspecionar `description` por palavra-chave — um hardcode textual frágil, rejeitado como alternativa (seção 5).

**Pré-condição de implementação:** o schema de `additionalFindings` precisa de um campo estruturado novo — proposta mínima: `relatedField: "decision" | "goal" | "other"`, espelhando exatamente `MissingInformationField` já existente em `src/modules/ace/artifacts/decision-case.ts` (usado por `DecisionCase.missingInformation`). Com esse campo, o invariant se torna uma comparação de enums, nunca uma busca textual:

```
rejeitar quando:
  finding.severity === "blocking"
  E finding.category em ("ausencia", "insuficiencia")
  E finding.relatedField === "other"
```

Sem esse campo, a implementação não pode prosseguir com segurança — é uma dependência explícita, não uma sugestão opcional.

### 4. Comportamento em caso de violação

- **Erro tipado:** novo valor em `ProtocolErrorCode` (`src/modules/ace/core/error-contract.ts`) — `"CONTENT_INVARIANT_VIOLATION"`. Reutiliza a classe `ProtocolError` já existente (mesmo padrão de todo o resto do ACE), sem nova classe de erro.
- **Dados de diagnóstico permitidos:** o achado específico que violou (`category`, `severity`, `relatedField`) — nunca prompt, chave, ou dado de paciente além do que já está no Caso.
- **Distinção dos três desfechos possíveis do P003:**
  - Resposta malformada (schema Zod falha) → `ACE_MODEL_INVALID_RESPONSE` (já existente, inalterado).
  - Caso legitimamente bloqueado (decisão/objetivo ausente, contradição real, ambiguidade que impede análise) → `CASE_AUDIT_BLOCKED` (branch existente em `orchestrator.ts`, inalterado).
  - Violação do Content Invariant (resposta bem formada, mas semanticamente inválida por classificar restrição prática como bloqueante) → `CONTENT_INVARIANT_VIOLATION` (novo).
- **Por que nunca vira `CASE_AUDIT_BLOCKED`:** o branch de `orchestrator.ts` (linhas ~297-315) só é alcançado se `p003CaseAudit.execute()` **retornar com sucesso**. O Content Invariant lança uma exceção **antes** disso (antes de `computeStatus()` rodar) — a execução nunca chega a produzir um `CaseAudit` com `status: "BLOCKED"`; ela lança `ProtocolError("CONTENT_INVARIANT_VIOLATION")`, que cai no `catch` genérico já existente em `orchestrator.ts` (linhas ~401-433), que trata qualquer `ProtocolError` usando `error.code` como `failureCode`. **Nenhuma alteração em `orchestrator.ts` é necessária** — o catch genérico já produz o comportamento correto.
- **Impacto no status do Caso:** o catch genérico não chama `changeCaseStatus` (diferente do branch `CASE_AUDIT_BLOCKED`, que move explicitamente para `WAITING_FOR_INFORMATION`) — o Caso **permanece no status atual**, nunca é redirecionado para pedir informação ao paciente por um problema que não é dele.
- **Retry:** manual, como toda outra falha de execução hoje (`ACE_MODEL_TIMEOUT`, `ACE_MODEL_RATE_LIMITED` etc. também não têm retry automático — `docs/DEBUGGING.md`/`docs/RUNBOOK.md` já documentam reexecução manual como segura e idempotente). Esta ADR **não introduz** contagem de tentativas nem limite de retries — não existe esse mecanismo hoje em nenhum outro `failureCode`, e criá-lo agora seria escopo novo, não coberto por esta calibração.

### 5. Alternativas consideradas

| Alternativa                                             | Vantagem                                                | Risco                                                                                                                                | Decisão                                            |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Confiar só no prompt                                    | Simples, sem código novo                                | Já provado insuficiente (CAL-002, 4 execuções reais)                                                                                 | Rejeitada, com evidência                           |
| Corrigir silenciosamente `blocking` → `warning`         | Resolveria o sintoma imediatamente                      | Mascara o julgamento do modelo; viola Constituição (Princípio 3) e o próprio conceito de Method Invariant (ADR-023: "nunca corrige") | Rejeitada por princípio                            |
| Validar no Concierge (`orchestrator.ts`)                | Um único lugar para regras futuras                      | Vaza regra de negócio do Método para a camada de orquestração, que hoje não conhece nenhuma regra do ACE                             | Rejeitada — quebra separação já estabelecida       |
| Validar dentro do P003                                  | Mantém a regra onde a especificação já vive             | Nenhum risco relevante identificado                                                                                                  | **Aceita**                                         |
| Mecanismo genérico de invariants em `core/`             | Reutilizável desde já                                   | Abstração prematura sem um segundo caso de uso concreto ainda                                                                        | Rejeitada nesta ADR — só a instância do P003 agora |
| Hardcode textual por palavra-chave em `description`     | Não exige mudança de schema                             | Frágil, sujeito a falso positivo/negativo por variação de fraseado — exatamente o que esta investigação rejeita                      | Rejeitada                                          |
| Evoluir o schema estruturado do achado (`relatedField`) | Torna a distinção determinística, sem depender de texto | Exige tocar `anthropic-language-model.ts`, `prompt.md`, `specification.md` e o tipo `P003AdditionalFinding`                          | **Aceita como pré-condição**                       |

### 6. Consequências

- Fecha definitivamente CAL-002 sem depender de o modelo "aprender" — a garantia passa a ser determinística.
- Custo de manutenção: uma função nova e pequena, testada; mais um valor no enum de erro; um campo novo no schema/prompt/especificação do P003.
- Risco de falso positivo (rejeitar uma resposta que era aceitável): baixo, se a taxonomia da seção 3 for seguida à risca — decisão/objetivo ausentes e contradições continuam podendo bloquear.
- Risco de falso negativo (deixar passar uma violação real): baixo — depende do modelo preencher `relatedField` corretamente, mas Zod já torna esse campo obrigatório, então uma resposta sem ele falha na validação de forma antes mesmo do invariant rodar.
- Observabilidade: novo código de falha pesquisável (`CONTENT_INVARIANT_VIOLATION`), distinto de `CASE_AUDIT_BLOCKED` — melhora, não piora, a distinção entre "Caso com pendência real" e "resposta do modelo inválida".
- Custo de API: uma violação exige nova chamada manual ao modelo, mesmo custo de qualquer outra falha hoje — não introduz custo recorrente automático.
- Adoção futura por outros protocolos é possível (P010 já tem um Content Invariant equivalente, `assertNoForbiddenLanguage`; P004 tem um candidato condicional a CAL-003), mas cada um exige sua própria calibração e evidência — esta ADR não generaliza automaticamente.
- **Limites explícitos:** esta ADR não resolve CAL-001 nem CAL-003; não introduz um framework genérico de invariants; não adiciona retry automático; não implementa o invariant.

### 7. Estratégia de implementação (executada — commit `502c9a4`)

1. `src/modules/ace/core/error-contract.ts` — adicionar `"CONTENT_INVARIANT_VIOLATION"` a `ProtocolErrorCode`.
2. `src/modules/concierge/anthropic-language-model.ts` — adicionar `relatedField: z.enum(["decision", "goal", "other"])` ao item de `P003_RESPONSE_SCHEMA.additionalFindings` (e ao JSON Schema correspondente enviado ao modelo).
3. `docs/ace/04-specs/P003-case-audit/prompt.md` — instruir o modelo a preencher `relatedField` para cada achado adicional.
4. `docs/ace/04-specs/P003-case-audit/specification.md` — registrar `relatedField` como parte da saída de `additionalFindings` (a especificação sempre vence o prompt).
5. `src/modules/ace/protocols/p003-case-audit.ts`:
   - Atualizar o tipo `P003AdditionalFinding` com `relatedField`.
   - Nova função (nome provisório `assertNoInvalidPracticalBlocking`), chamada no início de `execute()`, antes de `applyAdditionalFindings()`.
   - Lança `ProtocolError({ code: "CONTENT_INVARIANT_VIOLATION", protocolId: "P003", message: "..." })` quando a condição da seção 3 for violada.
6. Ordem de execução dentro de `execute()`: validação Zod (já ocorre antes, em `anthropic-language-model.ts`) → Content Invariant (novo) → `applyAdditionalFindings()` → `computeStatus()`.
7. `orchestrator.ts`: nenhuma alteração necessária (seção 4).

### 8. Estratégia de testes (unitários e integração executados no commit `502c9a4`; Golden Set ainda pendente — ver nota abaixo)

**Unitários** (`tests/unit/ace-p003-case-audit.test.ts`, mesmo arquivo/padrão existente):

- Ausência de restrição prática (`relatedField: "other"`) + `warning` → aceita, vira `Warning`.
- Ausência de restrição prática + `blocking` → rejeita, lança `ProtocolError("CONTENT_INVARIANT_VIOLATION")`.
- Insuficiência de restrição prática + `blocking` → rejeita.
- Contradição real + `blocking` → aceita (comportamento inalterado).
- Ausência de decisão/objetivo (via `missingInformation`, caminho já determinístico) + `blocking` → aceita (comportamento inalterado).
- Múltiplos achados, um inválido entre achados válidos → toda a resposta é rejeitada (nunca aceitação parcial).
- Achado rejeitado não sofre nenhuma mutação — só é descartado com exceção.

**Integração:**

- P003 recebe resposta válida → produz `READY`/`READY_WITH_WARNINGS` normalmente.
- P003 recebe violação → produz `ProtocolError` tipado, nunca um `CaseAudit` malformado.
- Concierge não move o Caso para `WAITING_FOR_INFORMATION` quando a falha é do invariant — confirma `ace_executions.status: "FAILED"`, `failureCode: "CONTENT_INVARIANT_VIOLATION"`, Caso no status anterior inalterado.

**Regressão:**

- Fixture de contradição real (`tests/golden/fixtures/p003-case-audit.ts`, já existente) continua bloqueando.
- Fixture de "caso limpo" (mesma suíte) não sofre bloqueio falso.
- Warnings legítimos preservados (`READY_WITH_WARNINGS`, teste já existente).
- Suíte completa (`npm test`) permanece 100% verde — nenhuma mudança de comportamento em P001, P002, P004-P010.

**Golden Set** (critério de aprovação — ainda pendente; nenhuma execução real autorizada ocorreu contra esta implementação até a data desta correção):

- Mínimo 3 execuções reais (`ALLOW_REAL_MODEL_CALLS=true`, ADR-022) da fixture de "caso limpo" pós-implementação: todas `status: "READY"`, nenhuma com achado `category` em (`ausencia`, `insuficiencia`) + `relatedField: "other"` + `severity: "blocking"`.
- Fixture de contradição real deve continuar `BLOCKED` nas mesmas execuções (checagem negativa, já existente).

### Documentos afetados por esta ADR

- `docs/ace/CALIBRATION_REPORT.md` — entrada CAL-002 recebeu um adendo referenciando esta ADR (evidência histórica preservada, não reescrita); esse adendo ainda descreve a implementação como pendente e não foi corrigido nesta rodada — fora do escopo desta auditoria de documentação (arquivo não listado como pendente), registrado aqui para autorização futura.
- `docs/ace/METHOD_INVARIANTS_DESIGN.md` — mapeamento do P003 corrigido nesta mesma auditoria para refletir a implementação já concluída.

- **Revisitar quando:** as 3 execuções reais autorizadas do Golden Set (seção 8) forem realizadas e registradas — até lá, o critério de aprovação por Golden Set desta calibração permanece em aberto, embora a implementação em código já esteja em produção.

---

## ADR-025 — Human Review: no máximo um `HumanReviewResult` `VALIDATED` por Caso, garantido por índice único parcial no banco

- **Status:** Definitiva. Formaliza uma proteção já implementada e agora coberta por testes (migration `20260714000000_human_review_results_one_validated_per_case.sql`, `src/modules/concierge/human-review-repository.ts`) — nenhum código ou schema foi alterado por esta ADR.

### Contexto

`human_review_results` (ADR/migration `20260712140000`) é append-only por natureza — cada linha é uma decisão humana completa e imutável, e um Caso pode acumular várias ao longo do tempo (ex.: `REJECTED` hoje, `VALIDATED` depois de nova informação). Isso é correto e desejado: o histórico de decisões rejeitadas e de solicitações de mais informação nunca deve ser apagado ou substituído.

Mas `reviewStatus: VALIDATED` é qualitativamente diferente das demais: é o único status que autoriza uma Curadoria Final (P010, `docs/ace/04-specs/P009-human-review/specification.md`, "somente VALIDATED pode originar uma Curadoria Validada"). Se duas linhas VALIDATED existissem para o mesmo Caso — por exemplo, um Administrador e um Curador Médico agindo quase simultaneamente sobre o mesmo Caso — o sistema teria duas curadorias simultaneamente consideradas "aprovadas", sem nenhum critério para saber qual prevalece.

`submitHumanReview` (`human-review-repository.ts`) já fazia um pre-check em memória (`listHumanReviewResultsForCase` seguido de um `some(reviewStatus === "VALIDATED")`) antes de inserir. Esse pre-check tem uma janela clássica de corrida (TOCTOU — time-of-check to time-of-use): entre o `SELECT` e o `INSERT` de duas requisições concorrentes, nenhuma trava impede que ambas leiam "ainda não há VALIDATED" antes de qualquer uma commitar, ambas prossigam, e — sem uma proteção no próprio banco — ambas teriam sucesso. A garantia definitiva de unicidade só pode pertencer ao banco, nunca só à aplicação.

**Auditoria desta sessão** confirmou, com evidência real (testes de integração contra Supabase local): o índice único parcial já implementado impede corretamente a colisão, o pre-check continua útil como resposta antecipada e amigável (evita uma viagem ao banco na maioria dos casos), e o tratamento do código `23505` do Postgres converte a colisão real na mesma mensagem pública do pre-check, sem vazar nenhum detalhe interno. Não foi encontrado nenhum defeito na migration nem no repositório — só faltavam os testes, agora adicionados.

### Decisão

- Índice único **parcial** sobre `case_id`, com predicado `where (review_status = 'VALIDATED')`:
  ```sql
  create unique index human_review_results_one_validated_per_case_idx
    on public.human_review_results (case_id)
    where (review_status = 'VALIDATED');
  ```
- O histórico dos demais estados (`REJECTED`, `INFORMATION_REQUESTED`) permanece livre — o índice, por ser parcial, nunca os restringe; um Caso pode ter quantas linhas `REJECTED`/`INFORMATION_REQUESTED` forem necessárias.
- O pre-check em `submitHumanReview` é mantido — não como a garantia (que é do banco), mas como resposta antecipada e mais amigável antes de tentar o `INSERT`.
- O código `23505` (unique_violation) do Postgres é convertido para o mesmo erro de domínio e a mesma mensagem pública do pre-check (`"Este caso já tem uma curadoria validada — não é possível registrar uma nova decisão."`) — nunca o nome da constraint, o código SQL, ou qualquer outro detalhe interno do Postgres chega ao chamador.

### Consequências

- Exatamente uma validação final por Caso é garantida deterministicamente pelo banco, independentemente de quantas requisições concorrentes cheguem simultaneamente (confirmado por teste de concorrência real via `Promise.all`, não simulação sequencial).
- Múltiplos resultados não validados (`REJECTED`/`INFORMATION_REQUESTED`) continuam plenamente permitidos e preservados — nenhuma mudança ao histórico append-only já estabelecido.
- **Fora do escopo desta ADR**: revalidar um Caso que já tem uma decisão `VALIDATED` (ex.: reabrir uma curadoria já aprovada) continua não suportado — isso exigiria uma decisão normativa adicional própria (sobre revogação, supersessão, ou nova versão da decisão), que esta ADR não cria nem antecipa.
- Nenhuma mudança de comportamento em produção — a migration já estava aplicada e o código já implementava exatamente este desenho; esta ADR formaliza e documenta uma proteção que já existia, agora com cobertura de teste.

### Alternativas consideradas

| Alternativa                                                       | Por que foi descartada                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Somente pre-check em memória                                      | Janela TOCTOU real — comprovada nesta auditoria; nunca fecha a corrida sozinha                                                           |
| Lock explícito (`SELECT ... FOR UPDATE` ou advisory lock)         | Mais complexo, exige disciplina em todo caminho de escrita futuro; um índice único é mais simples e à prova de esquecimento              |
| Serialização na aplicação (fila, mutex em memória)                | Não funciona entre múltiplas instâncias/processos do servidor; a garantia precisa ser no banco, não no processo                          |
| Unique constraint não parcial (`case_id` único na tabela inteira) | Quebraria o histórico append-only intencional — impediria até `REJECTED`/`INFORMATION_REQUESTED` repetidos, que são esperados e corretos |
| Sobrescrever a decisão anterior em vez de rejeitar a nova         | Violaria a imutabilidade do histórico humano (Kernel, seção 6) e apagaria a auditoria de quem decidiu o quê                              |
| **Índice único parcial sobre `case_id`, predicado `VALIDATED`**   | **Aceita** — fecha a corrida no banco, preserva o histórico dos demais estados, sem exigir nenhuma disciplina adicional de aplicação     |

### Dependências

- `docs/ace/04-specs/P009-human-review/specification.md` — define `reviewStatus`/`VALIDATED`, mas não formalizava (antes desta ADR) a multiplicidade por Caso; esta ADR preenche essa lacuna normativa.
- Migration `20260712140000_human_review_results.sql` (tabela base, append-only, sem UPDATE/DELETE) e `20260714000000_human_review_results_one_validated_per_case.sql` (o índice desta ADR).
- `src/modules/concierge/human-review-repository.ts` (`submitHumanReview`) — pre-check e tratamento de `23505`.

- **Revisitar quando:** houver uma decisão de produto explícita para permitir revalidar um Caso já validado (revogação ou supersessão) — nesse momento, uma nova ADR define esse fluxo, sem alterar retroativamente a garantia de unicidade aqui estabelecida.

---

## ADR-026 — Vídeo Companheiro (ambiente) é o vídeo de lançamento da Landing; supersede parcialmente a ADR-017

- **Status:** Definitiva. Supersede especificamente a decisão (3) da ADR-017 — as demais decisões daquela ADR (paleta confirmada, `LANDING_CREATIVE_DIRECTION.md` como documento canônico, distinção do filme de 80s de Helena) permanecem integralmente válidas e não são tocadas por esta ADR.
- **Contexto:** a ADR-017 decidiu que o vídeo institucional da Landing seria um asset novo de ~10 minutos, explicativo, com voz condutora, roteirizado em `docs/VIDEO_INSTITUCIONAL_LANDING.md` — descrito em `docs/LANDING_CREATIVE_DIRECTION.md` §4 como "o centro da Landing", ao redor do qual toda a página se organiza. Esse vídeo nunca foi produzido. A implementação real da Landing (construída ao longo do arco LAND DO PACIENTE, Etapas 0-9 de `docs/LANDING_IMPLEMENTATION_PLAYBOOK.md`) usa um mecanismo estruturalmente diferente: um Vídeo Companheiro ambiente, silencioso, sem controles nativos, incorporado dentro de `PortalExperience` (`src/components/landing/portal-experience.tsx`), presente da Chegada ao início da Curadoria e conduzido pelo scroll real (GSAP ScrollTrigger) até se despedir aos poucos. Essa divergência entre documento canônico e implementação foi registrada repetidamente sem nunca virar decisão — em `docs/LANDING_UX_WRITING.md`, `docs/LANDING_FUNCTIONAL_SPEC.md` (Parte 3, item 4) e `docs/LANDING_IMPLEMENTATION_AUDIT.md` — o padrão que `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` §1 usa como motivação para a regra "a terceira menção obriga uma decisão". O responsável do produto autorizou explicitamente, no início da Fase 10 (LAND DO PACIENTE), a aprovação do vídeo ambiente como comportamento de lançamento, sem autorizar a produção do vídeo de 10 minutos nesta fase.
- **Decisão:** o **Vídeo Companheiro** (ambiente, silencioso, companhia visual — não tutorial, não peça institucional longa) é o vídeo de lançamento aprovado da Landing. Ele não é "o centro" ao redor do qual a página se organiza — é presença que acompanha parte da caminhada e desaparece antes da continuidade da experiência (Biblioteca de FAQ), exatamente como já implementado. `docs/LANDING_CREATIVE_DIRECTION.md` §3 (ordem emocional, passo 3) e §4 foram atualizados para descrever esse papel real, substituindo a descrição do vídeo de 10 minutos como centro. O roteiro de ~10 minutos (`docs/VIDEO_INSTITUCIONAL_LANDING.md`) não é implementado nesta versão — o documento passa a Histórico (não-normativo), preservado por rastreabilidade, não apagado; permanece disponível como referência caso um vídeo explicativo longo seja produzido no futuro, para outro canal ou uma versão futura da Landing, com decisão própria. Nenhuma física, timing, saída ou configuração do Vídeo Companheiro já implementado foi alterada por esta ADR — a decisão é editorial/documental, não técnica.
- **O que NÃO muda**: o filme de marca de 80 segundos da FASE 7 (Helena — `docs/FILME_INSTITUCIONAL_ALIVIAR.md`, `docs/VIDEO_STORYBOARD.md`, `docs/CINEMA_BIBLE.md`, `docs/KEYFRAME_GUIDE.md`) continua existindo para outros canais, sem nenhuma alteração; a paleta e o restante da ADR-017 permanecem definitivos; a arquitetura de motores da Landing (`docs/LANDING_IMPLEMENTATION_ARCHITECTURE.md`, motor 5 — Vídeo Companheiro) não é alterada, só formalmente aprovada como comportamento de lançamento em vez de comportamento provisório.
- **Consequência:** `docs/LANDING_CREATIVE_DIRECTION.md` §3/§4/§6 (nome do item 4 da estrutura de 12 seções) atualizados; `docs/VIDEO_INSTITUCIONAL_LANDING.md` marcado Histórico; `docs/INDEX.md` atualizado para refletir que nenhum dos dois roteiros de vídeo descreve o vídeo hoje em produção; `docs/LANDING_FUNCTIONAL_SPEC.md` (Parte 3, item 4) e `docs/LANDING_IMPLEMENTATION_AUDIT.md` (Parte 1) marcados como resolvidos, com histórico preservado. Nenhum arquivo de código foi alterado por esta ADR.
- **Revisitar quando:** houver decisão de negócio explícita para produzir um vídeo explicativo longo para a Landing — nesse momento, uma nova ADR reabre essa direção, podendo reaproveitar `docs/VIDEO_INSTITUCIONAL_LANDING.md` como ponto de partida, sem reverter automaticamente esta decisão.

---

## ADR-027 — Connection: de domínio conceitual para Implementação em Auditoria

- **Status:** Transição de governança — habilita auditoria técnica formal do código já existente; **não é aprovação automática** desse código. O estado seguinte (`Implementado`, no mesmo padrão de ACE/Curadoria em `docs/architecture/ARCHITECTURE_BLUEPRINT.md`) só é alcançado depois que a auditoria autorizada por esta ADR confirmar aderência, sem violação crítica pendente.
- **Contexto:** `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` e `docs/architecture/ARCHITECTURE_BLUEPRINT.md` — ambos datados de 2026-07-15, o mesmo dia desta ADR — descreviam o domínio Connection & Relationship Engine como **"Conceitual (Fase 0 concluída). Nenhuma lógica está implementada... `src/modules/connection/` existe apenas como pasta reservada."** `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` (Etapa 9) registrava o mesmo: `[MODELO — não implementado]`. Nenhum desses documentos foi contradito por decisão própria — eles simplesmente pararam de refletir a realidade em algum ponto não documentado.

  No mesmo período, e sem que nenhum ADR tivesse sido aberto para autorizar isso, uma implementação completa do domínio Connection (pontual — decisão do paciente e primeiro contato, nunca o Relationship longitudinal) apareceu no working tree, não commitada: domínio puro (`state-machine.ts`, `commands.ts`, `errors.ts`, `types.ts`), persistência (`repository.ts` + `ports/connection-repository.ts`, duas migrations com funções de transição atômica e RLS completo), `schema.ts`, cinco Server Actions (`actions.ts`), dois componentes (`ConnectionChoicePanel`, `ConnectionProgressPanel`) já consumidos por `paciente/curadoria/page.tsx`, e seis arquivos de teste (unitário, componente, integração contra Supabase local, e2e) — cerca de 1.700 linhas de código e ~1.270 linhas de teste.

  O responsável do projeto, consultado sobre o conflito antes de qualquer consolidação (LAND DO PACIENTE / PRODUTO DO PACIENTE, Fase 3), autorizou explicitamente a continuidade — não como aprovação retroativa silenciosa, mas como abertura formal de um estado de auditoria.

- **Decisão:** o domínio Connection & Relationship Engine deixa de estar classificado como `Conceitual (Fase 0)` e passa para **`Implementação em Auditoria`** — um estado formal, intermediário, que `docs/architecture/ARCHITECTURE_BLUEPRINT.md` não previa antes desta ADR (os sete domínios só tinham os estados `Conceitual`/`Implementado`/`Protocolo ativo`). Neste estado: o código existente é reconhecido como real e pode ser lido, testado e auditado — mas não é, só por existir, considerado correto ou aprovado. A consolidação/commit definitivo do módulo depende da auditoria técnica completa (arquitetura de domínio, máquina de estados, migrations, autorização/RLS, idempotência, testes) confirmar aderência aos documentos de domínio e aos invariantes consolidados (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`), registrada separadamente no relatório desta fase.
- **Preservação de histórico (exigência explícita do responsável)**: até 2026-07-15, o domínio era oficialmente conceitual — isso não é apagado nem reescrito. A implementação existente surgiu **antes** da formalização documental, não depois dela; esta ADR não afirma, e não deve ser lida como afirmando, que a autorização já existia quando o código foi escrito. `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` e `docs/architecture/ARCHITECTURE_BLUEPRINT.md` são atualizados para descrever o novo estado, com nota explícita apontando para esta ADR e preservando a descrição anterior como histórico, nunca removida.
- **O que esta ADR não autoriza**: implementar o domínio Relationship (longitudinal — continuidade de atendimento, encerramento, reabertura); antecipar Compatibility Intelligence; alterar ACE, Curadoria, Landing, PatientShell ou o wizard "Sua História"; criar funcionalidade nova além da já existente no working tree; decidir sozinha qual lado prevalece em qualquer divergência de conteúdo entre documentos — cada divergência encontrada pela auditoria é registrada, nunca resolvida por escolha unilateral.
- **Consequência:** `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`, `docs/architecture/ARCHITECTURE_BLUEPRINT.md` e `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` atualizados para refletir `Implementação em Auditoria`, cada um preservando a nota histórica anterior. `docs/INDEX.md` atualizado se referenciar o estado do domínio. A Fase 3 de consolidação (inventário, auditoria técnica, testes, estratégia de commits) prossegue com base nesta ADR.
- **Revisitar quando:** a auditoria técnica desta fase concluir sem violação crítica pendente — nesse momento, uma atualização direta (não necessariamente nova ADR, se nenhuma escolha nova estiver em jogo) move o estado de `Implementação em Auditoria` para `Implementado`, no mesmo padrão dos demais domínios já implementados. Se a auditoria encontrar violação crítica não corrigível nesta fase, o estado permanece `Implementação em Auditoria` até resolução própria, registrada à parte.

- **Atualização (Fase 4 — Validação de Integração e Promoção, 2026-07-15, mesmo dia):** condição de "Revisitar quando" cumprida. A auditoria de integração contra banco real (Supabase local, migrations aplicadas em banco limpo por duas vezes nesta fase) validou: criação, unicidade, concorrência otimista tanto na criação (23505) quanto em transições subsequentes (55000, gap encontrado e fechado nesta fase — só a criação tinha cobertura de concorrência antes), máquina de estados completa (todas as transições permitidas e proibidas, incluindo defesa em profundidade do banco para os dois triggers do PR1), RLS (leitura/escrita cruzada entre pacientes, inserção com paciente/Caso alheio, curador/admin somente-leitura), append-only de eventos, atomicidade evento+estado, e ausência de qualquer efeito sobre `cases`/`final_curadoria_deliveries`/artefatos do ACE — 14/14 testes de integração, 100% contra banco real, nenhum mock no caminho crítico. TypeScript, ESLint, Prettier, suíte unitária (591 testes) e de componentes (170 testes) e `next build` permanecem limpos. Nenhuma violação crítica encontrada. Estado promovido de `Implementação em Auditoria` para **`Implementado`**, exatamente como esta ADR previu — sem necessidade de nova ADR, nenhuma escolha nova estando em jogo. Ressalvas não bloqueantes, registradas à parte no relatório da Fase 4: (1) os testes E2E de Connection existem mas não puderam ser executados — falha de temporização pré-existente na página `/login` sob automação, não relacionada a Connection; (2) a camada de Server Action não é testável neste ambiente (`next/headers` ausente no Vitest), limitação transversal a todo o projeto, mitigada pela cobertura redundante de RLS e pelos testes de componente que validam o contrato de chamada de cada action.

---

## ADR-028 — Relationship: de domínio conceitual para Implementação em Auditoria

- **Status:** Transição de governança — habilita o reconhecimento formal do código já existente e corrigido; **não é promoção a Implementado**. Mesmo padrão de ADR-027, aplicado agora à parte Relationship do domínio 4.
- **Contexto:** exatamente como em ADR-027, uma implementação completa do domínio Relationship (longitudinal — continuidade, encerramento, reabertura) apareceu no working tree, não commitada, produzida por uma sessão paralela não auditada, enquanto `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` e `docs/architecture/ARCHITECTURE_BLUEPRINT.md` continuavam descrevendo Relationship como "não existe, nem mesmo como pasta reservada". Diferente de Connection, desta vez a auditoria técnica (Fase 6) e a correção de divergências críticas contra a teoria formal já aprovada (`docs/architecture/DOMAIN_RELATIONSHIP.md`, Veredito A, Fase 4.1 — Fase 6.1) **aconteceram antes do primeiro commit**: a implementação paralela usava um modelo de quatro estados (ATIVO/PAUSADO/ENCERRADO_PLANEJADO/ENCERRADO_POR_INTERRUPCAO) que a teoria aprovada rejeita explicitamente (PAUSADO nunca teve consequência de domínio própria comprovada; o terminal é único, com o motivo vivendo no evento, nunca no estado). Essa divergência foi corrigida de ponta a ponta — domínio, migrations, RPCs (incluindo um bug real de guard de reabertura), componente e testes — antes de qualquer commit existir (Fase 6.1). Em seguida (Fase 6.2), a integração de nascimento atômico com Connection (`confirmFirstAppointmentAndBirthRelationship`) e a apresentação na página do paciente (`RelationshipStatusPanel`) foram auditadas e commitadas.
- **Decisão:** o domínio Relationship deixa de estar classificado como `Conceitual` e passa para **`Implementação em Auditoria`** — mesmo estado formal intermediário criado pela ADR-027, agora também aplicado à parte Relationship do domínio 4. Neste estado: o código commitado (`src/modules/relationship/`, migrations, `RelationshipStatusPanel`, integração em `connection/actions.ts`/`repository.ts`, `paciente/curadoria/page.tsx`) é reconhecido como real, testado e alinhado à teoria aprovada — mas a matriz de capacidades (relatório da Fase 6.2) mostra seis capacidades previstas pela arquitetura técnica aprovada (`RELATIONSHIP_TECHNICAL_ARCHITECTURE.md`) e ainda ausentes: Correção de Registro, Contestação, Resolução de Efeito Operacional, Provenance completo (Value Object distinto de `actorId`), Encerramento por Falecimento (subtipo específico) e Troca de Profissional. Nenhuma delas é uma lacuna nova — todas já estavam registradas como "lacunas conhecidas, não defeitos" desde a Fase 6.1. A ausência delas, e não qualquer dúvida sobre a correção do que já existe, é o único motivo desta ADR não promover diretamente a `Implementado`.
- **Diferença estrutural em relação a Connection (ADR-027)**: lá, a auditoria (Fase 4) ocorreu **depois** da promoção a `Implementação em Auditoria`, e a promoção final a `Implementado` veio da ausência de violação crítica. Aqui, a auditoria e a correção de uma violação crítica real (o modelo de quatro estados) já ocorreram **antes** desta ADR — o que resta não é corrigir uma divergência, é completar capacidades ainda não construídas. Por isso a condição de "Revisitar quando" desta ADR é diferente da de ADR-027: não é "a auditoria não encontrar violação crítica", é "as seis capacidades da matriz forem implementadas e testadas, ou formalmente aceitas como fora do escopo do MVP por decisão do responsável do projeto".
- **Preservação de histórico (mesma exigência da ADR-027)**: até 2026-07-15, o domínio era oficialmente conceitual — isso não é apagado nem reescrito. A implementação existente surgiu **antes** de qualquer autorização documental para a parte Relationship; esta ADR não afirma que essa autorização já existia quando o código foi escrito. `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`, `docs/architecture/ARCHITECTURE_BLUEPRINT.md` e `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` são atualizados para descrever o novo estado, cada um preservando a descrição anterior como histórico, nunca removida. Nenhuma aprovação retroativa do modelo de quatro estados (PAUSADO, terminal duplo) é feita ou implícita — essa versão nunca existiu em nenhum commit deste repositório.
- **Relationship é distinto de Connection**: esta ADR não altera o estado de Connection (`Implementado`, ADR-027) nem presume que os dois amadurecem juntos daqui em diante — são dois domínios com maturidade própria, unidos apenas pelo mesmo documento de domínio (`DOMAIN_CONNECTION_RELATIONSHIP.md`) por razões de organização, não de acoplamento técnico.
- **O que esta ADR não autoriza**: implementar qualquer uma das seis capacidades ausentes da matriz; promover Relationship a `Implementado`; alterar ACE, Curadoria, Landing, Compatibility Intelligence ou qualquer outro domínio; resolver a tensão Curador/Atendente vs. ADR-006 (já citada pela quinta vez em `DOMAIN_RELATIONSHIP.md`, Etapa 11 — permanece registrada, não decidida aqui, já que decidi-la não é o propósito desta ADR de transição de estado).
- **Consequência:** `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md`, `docs/architecture/ARCHITECTURE_BLUEPRINT.md` e `docs/PATIENT_EXPERIENCE_BLUEPRINT.md` atualizados para refletir `Implementação em Auditoria`, cada um preservando a nota histórica anterior. `docs/architecture/DOMAIN_RELATIONSHIP.md` (teoria, Veredito A) passa a referenciar esta ADR na sua nota de duplicação, em vez de deixá-la "registrada e não resolvida" — `DOMAIN_CONNECTION_RELATIONSHIP.md` permanece a entrada oficial do domínio 4; `DOMAIN_RELATIONSHIP.md` passa a ser a fonte detalhada referenciada por ela, nunca uma segunda autoridade paralela. `docs/INDEX.md` atualizado para registrar todos os documentos de Relationship ainda não indexados.
- **Revisitar quando:** as seis capacidades da matriz (Correção, Contestação, Resolução de Efeito Operacional, Provenance completo, Falecimento, Troca de Profissional) estiverem implementadas e testadas contra banco real — ou o responsável do projeto decidir formalmente que alguma delas fica fora do escopo do MVP, o que também conta como fechamento da lacuna (decisão explícita, não silêncio). Nesse momento, uma atualização direta (não necessariamente nova ADR) move o estado para `Implementado`, no mesmo padrão de Connection.

---

## ADR-029 — Temporary Access: capacidade transversal de acesso temporário a recurso protegido (Proposta)

- **Status:** **Proposta — aguardando aprovação do responsável do projeto.** Não autoriza nenhum código, módulo, migration, tela ou alteração de comportamento. Registrar a proposta neste log segue o precedente documental já existente no repositório — a consolidação arquitetural de 2026-07-15 (`docs/architecture/ARCHITECTURE_BLUEPRINT.md` e documentos de domínio associados), produzida sob o congelamento da ADR-021 como trabalho puramente documental — e a governança efetivamente vigente: `docs/DECISIONS.md` é o log append-only de decisões, e a aprovação final é sempre do responsável do projeto (`docs/AGENTS.md`, papel do Usuário). Esta ADR só passa a valer como decisão quando este Status for atualizado explicitamente pelo responsável.
- **Contexto:** auditoria de arquitetura de 2026-07-21 (branch `main`, HEAD `452e073`, working tree limpo) confirmou que o modelo de acesso do sistema inteiro é uniforme: acesso **permanente enquanto durar o papel**, garantido por RLS — nenhuma das 31 migrations em `supabase/migrations/` contém qualquer noção de expiração, revogação ou consumo único de acesso. Duas consequências reais desse modelo: (1) `docs/architecture/DOMAIN_CURATION.md` declara que a Curadoria "termina no `DELIVERED`, sem visibilidade sobre o que acontece depois", e as policies de `final_curadoria_deliveries` (migration `20260712150000`) liberam leitura apenas para o próprio paciente, administrador e curador do caso — o **profissional escolhido pelo paciente não possui hoje nenhum caminho de acesso a qualquer contexto da Curadoria que o apresenta**; (2) qualquer compartilhamento futuro de documento do paciente (`patient_documents`) com terceiros seria, no modelo atual, permanente ou inexistente — não há meio-termo. Com Connection `Implementado` (ADR-027) e Relationship em `Implementação em Auditoria` (ADR-028), a fronteira pós-`DELIVERED` onde essa lacuna vive já tem domínio responsável. "Temporary Access" designa a capacidade de **conceder acesso limitado no tempo, revogável e consumível, a um recurso protegido já existente**, sempre a um usuário autenticado.
- **Decisão (proposta):**
  1. Temporary Access é uma **capacidade transversal** — nunca um oitavo domínio. A regra de governança de 2026-07-15 (`docs/architecture/ARCHITECTURAL_INVARIANTS.md`, invariante 3) exige que os sete domínios absorvam responsabilidades novas, e o Domínio 4 absorve esta: a Curadoria é dona do conteúdo entregue; o Domínio 4 é dono da ponte entre paciente e profissional — acesso temporário é ponte, não conteúdo. É o análogo estrutural do `auth`: serve a vários domínios sem ser um.
  2. Governança formal: a capacidade vive **sob o Domínio 4** (Connection & Relationship Engine), documentada como extensão em `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` quando implementada.
  3. Independência de módulo: Temporary Access conhece o recurso protegido **apenas por referência opaca** (tipo + id) — nunca importa `concierge`, `profiles` ou `cases`. A fronteira com os donos dos recursos é de contrato, nunca de dependência direta.
  4. Fronteira de autoridade: o módulo governa o **ciclo de vida** da concessão; a **RLS permanece o enforcement final de leitura** — as policies consultam o estado da concessão, nunca são substituídas por lógica de aplicação. Não nascem duas fontes de verdade de acesso.
  5. Restrição de segurança permanente: concessão **sempre a usuário autenticado**. Nunca existirá link anônimo portador de token para dado clínico — isso criaria o primeiro caminho não-autenticado do sistema e é vedado em qualquer fase.
  6. Restrição de imutabilidade: conceder acesso jamais altera, re-renderiza ou reapresenta o artefato entregue (ADR-016; invariante 14) — a entrega permanece imutável; só a visibilidade dela é temporariamente estendida.
  7. Nomenclatura de incrementos: **TA-1, TA-2, TA-3, TA-4** — nunca "P00x", numeração que pertence exclusivamente aos protocolos do ACE (P001–P010).
- **Direção de referência para TA-1 (orientação técnica, não decisão arquitetural — ajustável durante TA-1 sem nova ADR, desde que nenhum item da Decisão seja violado):** localização em `src/modules/temporary-access/`, no layout já provado por `connection`/`relationship` (`types`, `errors`, `schema`, `state-machine`, `commands`, `ports/`, `repository`, `actions`, `index`); referência opaca no espírito de `src/modules/ace/core/artifact-reference.ts`; ciclo de vida de partida `GRANTED → CONSUMED | EXPIRED | REVOKED`; histórico de concessões/revogações append-only (mesmo padrão de `case_notes`, ADR-020) e concorrência otimista (mesmo padrão de ADR-018 e das funções de transição de `connection_records`/`relationship_records`).
- **O que esta ADR não autoriza (mesmo depois de aprovada):** escrever qualquer código ou migration; criar `src/modules/temporary-access/`; alterar `connection`, `relationship`, `concierge`, `profiles`, ACE ou qualquer RLS existente; criar superfície de UI; e, sobretudo, iniciar TA-1 antes de os critérios objetivos abaixo estarem todos cumpridos.
- **Impacto:** nulo sobre o código nesta ADR (documental por definição). Quando implementada, a capacidade adiciona: 1 módulo novo em `src/modules/`, 1 migration (tabela de concessões + policies + função de transição), extensão documental do Domínio 4, e o primeiro mecanismo de acesso com prazo do sistema — mudança conceitual relevante no modelo de autorização, ainda que pequena em código. Consumidores previstos, verificados contra o código real: `connection` (origem do evento de concessão), `concierge`/`final_curadoria_deliveries` (primeiro recurso protegido plausível), `profiles`/`patient_documents` (segundo recurso plausível), rotas `paciente/curadoria` e a futura superfície `profissional/`.
- **Riscos:** (1) **governança — dominante**: implementar sem evidência viola o invariante 19 (nenhuma evolução por especulação) e a ADR-021 (V1.0 congelada) — mitigado pelos critérios objetivos abaixo, que condicionam TA-1 a evidência ou decisão de negócio explícita; (2) **segurança**: qualquer atalho do tipo "link compartilhável" quebraria o modelo autenticado+RLS — vedado permanentemente pelo item 5 da Decisão; (3) **dupla autoridade**: lógica de autorização na aplicação duplicaria a RLS — vedado pelo item 4; (4) **imutabilidade da entrega**: acesso virar porta de edição/reapresentação — vedado pelo item 6; (5) **colisão de nomenclatura** com os protocolos do ACE — resolvido pelo item 7.
- **Relação com ADR-021:** esta ADR **não constitui reabertura de desenvolvimento** e não cria exceção ao congelamento. Registrar uma decisão arquitetural é trabalho puramente documental — o mesmo enquadramento do precedente já existente no repositório: a consolidação arquitetural de 2026-07-15 (`docs/architecture/ARCHITECTURE_BLUEPRINT.md` e documentos de domínio associados), produzida sob o congelamento da ADR-021 e autodeclarada "consolidação puramente documental", sem alterar nenhum código. A implementação (TA-1 em diante) permanece proibida pela ADR-021 até que exista a "decisão explícita e documentada" que a própria ADR-021 exige — decisão essa que é o critério 2 abaixo, e que esta ADR não substitui nem antecipa.
- **Relação com o Domínio 4:** Temporary Access opera exatamente na fronteira que o Domínio 4 governa — depois do `DELIVERED`, entre a escolha do paciente (Connection) e o vínculo longitudinal (Relationship). Esta ADR não altera o estado de Connection (`Implementado`, ADR-027) nem de Relationship (`Implementação em Auditoria`, ADR-028), não interfere na matriz de seis capacidades pendentes da ADR-028, e não integra Temporary Access às state machines existentes — qualquer integração futura respeita essas máquinas, nunca as contorna. A extensão documental de `DOMAIN_CONNECTION_RELATIONSHIP.md` só ocorre após aprovação desta ADR.
- **Critérios objetivos para iniciar TA-1 (todos, sem exceção):**
  1. Status desta ADR atualizado de `Proposta` para aprovada, explicitamente, pelo responsável do projeto.
  2. Decisão explícita e documentada de reabertura de desenvolvimento (a condição de "Revisitar quando" da ADR-021 — V1.1/V2 ou enquadramento formal equivalente), registrada em ADR própria ou em atualização da ADR-021.
  3. Justificativa material registrada, satisfazendo o invariante 19: **ou** evidência real do Observatório da Experiência (pós-início do Shadow Launch), **ou** decisão de negócio explícita do responsável nomeando o caso de uso concreto — registrada por escrito neste repositório, nunca presumida.
  4. Primeiro recurso protegido e primeiro beneficiário definidos e registrados (candidato natural verificado no código: `final_curadoria_deliveries` → profissional escolhido via Connection; a escolha final é do responsável).
  5. Baseline de partida sadio: branch `main`, working tree limpo, suítes unitária e de componentes verdes, `next build` limpo — verificados no ato, não presumidos.
- **Consequência:** `docs/DECISIONS.md` passa a registrar formalmente a proposta, encerrando a fase em que Temporary Access existia apenas em conversa, sem lastro no repositório. Nenhum outro documento é alterado enquanto o Status for `Proposta`. Se aprovada, o fechamento de TA-0 inclui a extensão de `docs/architecture/DOMAIN_CONNECTION_RELATIONSHIP.md` e o registro em `docs/INDEX.md` conforme a política de `docs/DOCUMENTATION_GOVERNANCE_POLICY.md`.
- **Revisitar quando:** o responsável do projeto aprovar (atualizar o Status e, quando cumpridos os critérios, habilitar TA-1) ou rejeitar esta proposta — se rejeitada, a ADR permanece no log como registro histórico da avaliação, com o Status atualizado para rejeitada, nunca removida.

---

## ADR-030 — Camada `platform/`: fundação técnica transversal (registro formal)

- **Status:** Definitiva — registro pós-fato de uma decisão já tomada pelo responsável do projeto em 2026-07-21 (ver Contexto). Esta ADR **documenta exatamente o que existe**; não autoriza capacidade futura nenhuma.
- **Contexto:** o commit `ef8415a` (WP3 — EPIC-PLATFORM-02, 2026-07-21) introduziu `src/platform/runtime/` — ciclo de vida de runtime (`RuntimeLifecycle`, `RuntimeBootstrap`, `ShutdownPolicy`, eventos internos, máquina de estados `CREATED→INITIALIZING→READY→STOPPING→STOPPED` + `FAILED`), 8 arquivos de código e 27 testes unitários, sem nenhum import de/para código preexistente. Antes da execução, um bloqueador arquitetural foi formalmente reportado (a camada não existia; gate de maturidade dos 7 domínios; congelamento da ADR-021); o responsável do projeto reenviou o WP na íntegra após ler o bloqueio — tratado, conforme `docs/AGENTS.md` (papel do Usuário como aprovador final), como decisão explícita de prosseguir. Esta ADR fecha a lacuna de governança resultante: nenhuma camada estrutural nova existe sem decisão registrada.
- **Motivação:** separar fundação puramente técnica (orquestração de ciclo de vida e composição de dependências abstratas) do código de produto. Esse comportamento não pertence a nenhum dos 7 domínios de negócio nem a `src/modules/*` (que carregam regra de negócio) — sem uma camada própria, ou seria espalhado, ou contaminaria um domínio com responsabilidade que não é dele.
- **Responsabilidades:** `platform/` contém somente comportamento técnico transversal, hoje exatamente um submódulo: `runtime` (ciclo de vida com bootstrap, rollback, shutdown gracioso idempotente, relatório de encerramento e eventos internos). **`platform/` não contém regras de negócio — nunca.**
- **Fronteiras e dependências:**
  - **Permitido:** TypeScript puro e APIs padrão da linguagem; testes unitários em `tests/unit/`.
  - **Proibido:** importar `modules/*` dentro de `platform/*`; qualquer conhecimento de domínio (paciente, curadoria, connection, etc.); HTTP, Express, Next.js, React; signals do SO e `process.exit`; Docker/Kubernetes/deploy; dependência externa nova.
  - **`modules/*` nunca dependem de `platform/*`**, e `platform/*` nunca depende do domínio — no estado atual a independência é mútua e total (zero imports em qualquer direção, verificado no commit `ef8415a`). `platform/` é **transversal**: quando (e se) integrada, serve à aplicação inteira, nunca a um domínio específico.
- **Relação com `modules/*`:** nenhuma, por construção. Qualquer integração futura entre as camadas exige decisão registrada — nunca nasce de um import casual.
- **Relação com infraestrutura:** nenhuma — `platform/` não conhece Vercel, Supabase, sistema operacional ou processo.
- **Relação com framework:** nenhuma — `platform/` não importa Next.js/React. O ciclo de vida real da aplicação em produção continua pertencendo ao Next.js/Vercel; `src/platform/runtime/` **não está integrado a nenhum caminho de execução do produto V1.0** — é fundação presente e testada, não comportamento ativo. Integrá-la ao produto exigirá ADR própria, não apenas um WP.
- **Organização dos submódulos:** um diretório por capacidade técnica em `src/platform/<nome>/`, seguindo o idioma já provado de `modules/*` (`types`, `errors`, `state-machine`, arquivos por responsabilidade, `index.ts` como superfície pública; internos — como o log de eventos — fora do `index`). Hoje existe exatamente um submódulo: `runtime`. Os nomes citados no enunciado do WP3 (`config`, `health`, `observability`) **não existem e não são autorizados por esta ADR** — se vierem, cada um exige WP próprio.
- **Regras para futuros WPs sobre `platform/`:** (1) todo submódulo novo nasce por WP explícito do responsável e atualiza esta seção da documentação; (2) as proibições de dependência acima valem sem exceção; (3) cobertura de testes unitários obrigatória no padrão do WP3 (transições, idempotência, concorrência, imutabilidade, ausência de estado parcial, quando aplicável); (4) nenhuma dependência externa nova sem ADR; (5) integração de qualquer parte de `platform/` ao caminho de execução do produto exige ADR própria.
- **Relação com a ADR-021 e o gate de maturidade:** `platform/` **não é um oitavo domínio** — o gate dos 7 domínios trata de domínios de produto e permanece intacto. A execução do WP3 sob o congelamento foi exceção operacional decidida pelo responsável; esta ADR a registra, não a amplia — o congelamento da ADR-021 segue valendo para o produto.
- **Consequência:** a camada `platform/` passa a existir formalmente na arquitetura registrada. Nenhum outro documento é alterado por esta ADR; o reflexo em `docs/ARCHITECTURE.md`/`docs/INDEX.md` segue o ciclo normal de manutenção documental (`docs/DOCUMENTATION_GOVERNANCE_POLICY.md`).
- **Revisitar quando:** surgir o primeiro WP propondo novo submódulo de `platform/`, ou qualquer proposta de integração do `runtime` ao caminho de execução do produto — ambos exigem retorno a esta ADR.

---

## ADR-031 — Experience Continuity v1.1: descongelamento temporário e escopado da ADR-021

- **Status:** Aprovada pelo responsável do projeto. Registra a decisão que o responsável rotulou "ADR-022 — Experience Continuity v1.1"; o número **022 já estava ocupado** neste log (Golden Set), então a decisão é registrada aqui como **ADR-031**, sem sobrescrever nada (log append-only).
- **Contexto:** a ADR-021 congelou o produto V1.0 ("nunca melhoria"). Os blueprints PROGRAM-20/21 apontaram que a continuidade de experiência entre PortalExperience → Login → Sua História depende de melhorias de UX vedadas pelo congelamento. O responsável decidiu explicitamente autorizá-las para o lançamento da V1.
- **Decisão:** a ADR-021 é **descongelada temporária e exclusivamente** para melhorias de experiência necessárias ao lançamento. **Escopo permitido:** continuidade visual, tipográfica, de animações; performance; acessibilidade; correções de UX; ajustes de copy. **Escopo proibido (inalterado da ADR-021):** novas funcionalidades, novos fluxos, alteração de domínio, mudança arquitetural, novos módulos, mudança de regra de negócio.
- **Consequência:** trabalho de continuidade sobre `PortalExperience`, `(auth)` e `sua-historia` passa a ser permitido dentro do escopo acima, editando componentes existentes — nunca criando segunda Landing, navegação, Design System ou componente paralelo.
- **Revisitar quando:** **ao término do lançamento da V1, o congelamento da ADR-021 volta a vigorar automaticamente** — sem necessidade de nova ADR para re-congelar; qualquer trabalho fora do escopo desta ADR permanece vedado mesmo durante a vigência dela.

## ADR-032 — Golden Set Calibration: descongelamento escopado para executar as decisões do Calibration Board

- **Status:** Aprovada pelo responsável do projeto.
- **Contexto:** a execução oficial do Golden Set (`2026-07-23`, `claude-sonnet-5`) produziu 3 reprovações (P003, P004, P010). O Calibration Board (registro em `docs/ace/CALIBRATION_REPORT.md`) emitiu decisões oficiais: P003 = robustez aceitável (sem mudança); **P004 = Alternativa A** (prazo relatado gera `urgency`, afirmando a intenção já vigente na `specification.md` linha 15 + `tests.md` T03); **P010 = "melhor opção" passa de ABSOLUTE para CONTEXTUAL** (paridade com CAL-001/CAL-004). Implementá-las toca o `prompt.md` do Método (P004) e uma regra de validação (P010) — vedado pela ADR-021 e fora do escopo da ADR-031.
- **Decisão:** a ADR-021 é **descongelada temporária e exclusivamente** para executar as decisões do Calibration Board. **Escopo permitido:** alterar o `prompt.md` do P004 (e sua cópia fiel `P004_SYSTEM_PROMPT` em `anthropic-language-model.ts`); alterar o guard do P010 (`final-curadoria.ts`) e seus testes de regressão; registrar entradas em `CALIBRATION_REPORT`; reexecutar o Golden Set; atualizar documentação de calibração. **Escopo proibido:** novas funcionalidades; alterações arquiteturais; alterações de domínio; mudanças de UX; mudanças de `PortalExperience`; mudanças em qualquer protocolo diferente de P004 e P010.
- **Consequência:** nenhuma `specification.md`/`tests.md`/`examples.md` é alterada (a decisão A afirma a intenção já vigente; a fixture já a valida). A recalibração do P010 preserva os testes existentes (uso afirmado de "melhor opção" continua rejeitado).
- **Revisitar quando:** **ao término desta calibração, o congelamento da ADR-021 volta a vigorar imediatamente** — sem nova ADR para re-congelar.

## ADR-033 — Landing 2.0: o vídeo passa a ser protagonista (supersede parcialmente a ADR-026)

- **Status:** Aprovada pelo responsável do projeto (MISSÃO 201 — "LANDING 2.0", 2026-07-23: "O vídeo passa a ser protagonista. Não um elemento decorativo. O vídeo conduz toda a experiência. A Landing deverá ser construída ao redor dele.").
- **Contexto:** a ADR-026 definiu o vídeo da Landing como **Vídeo Companheiro** — presença ambiente dentro do `PortalExperience`, nunca o centro. A MISSÃO 201 inverte explicitamente esse papel e define nova estrutura de 11 seções (Hero → Problema → Método → Como funciona → Perfil de Prioridades → Curadoria Compartilhada → Relatório → Portal do Paciente → Quem somos → FAQ → Contato), mais a seção inédita "Como tomamos decisões". A comunicação abandona qualquer discurso baseado em IA — a mensagem é Método, Curadoria, Critério, Decisão Compartilhada.
- **Decisão:** a Landing 2.0 é construída ao redor do vídeo (Hero: marca, mensagem, vídeo, duas ações — nada além), com a estrutura de seções da MISSÃO 201 substituindo a estrutura de 12 seções da ADR-017/`docs/LANDING_CREATIVE_DIRECTION.md` §6. Os princípios não-estruturais da direção criativa permanecem íntegros: sigilo do Método (§2), nunca parecer site médico (§5), linguagem (§10), nenhum canal de contato fabricado (§8). A implementação anterior (`PortalExperience`) permanece no repositório como histórico até a 2.0 ser aprovada em revisão.
- **Consequência:** `docs/LANDING_CREATIVE_DIRECTION.md` §4 e §6 ficam supersedidos por esta ADR; o restante do documento permanece válido. A Landing 2.0 compõe os primitivos existentes (SectionReveal, SectionEyebrow, LinkButton, SectionContainer) — nenhum design system paralelo.
- **Revisitar quando:** a revisão da Landing 2.0 pelo responsável decidir o destino definitivo do `PortalExperience` (remoção ou arquivamento).

## ADR-034 — Aliviar 3.0: a Landing como sede institucional, com Design System proprietário

- **Status:** Aprovada pelo responsável do projeto (MISSÃO ÉPICA — "ALIVIAR 3.0", 2026-07-24: "deixar de ter uma landing inspirada em uma referência e construir uma identidade própria, atemporal e memorável").
- **Contexto:** a Landing editorial (pós-ADR-033) ainda carregava traços de biblioteca pronta (pílulas de SaaS, divisor gráfico entre seções, cards empilhados) e a referência externa (`aliviar-temp.vercel.app`) deixa de valer como norte. A MISSÃO 3.0 define a metáfora governante: a página é a sede institucional da Aliviar — não existem seções, existem **ambientes**; a luz conduz o visitante; os materiais são reais (papel algodão, pedra clara, latão escovado).
- **Decisão:** o Design System proprietário da Landing (escopado em `.landing-editorial`, `src/app/landing-editorial.css`) passa a implementar: (1) textura de papel algodão via SVG inline no canvas e nos cards; (2) **limiar de luz** entre ambientes no lugar de qualquer divisor gráfico, suprimido nas fronteiras da faixa verde institucional; (3) tipografia de publicação editorial — Fraunces peso 400 em títulos, mais respiro vertical (12rem em desktop); (4) revelação por luz via `RevealGroup` (IntersectionObserver; sem JS ou com `prefers-reduced-motion`, todo o conteúdo permanece visível desde o primeiro paint); (5) vídeo do Hero em moldura arquitetônica (matte de pedra + fio de latão), com fundo da recepção em presença real (opacidade 62, véu aberto no terço médio); (6) botões com arredondamento suave (0.875rem) em vez de pílula — `LinkButton` é compartilhado, então a forma vale também para as superfícies do paciente; (7) "Como funciona" como lista editorial de algarismos serifados, sem cards; (8) FAQ com virar de página (`landing-faq-answer`). Paleta, linguagem e estrutura de conteúdo da ADR-033 permanecem intactas — esta ADR é forma, não conteúdo.
- **Consequência:** a referência visual citada em `docs/LANDING_CREATIVE_DIRECTION.md` §6 deixa de ser consultada para decisões futuras — o critério passa a ser exclusivamente a identidade própria descrita aqui. **Pendência de ativo (fora do alcance de código):** `public/videos/video-institucional-aliviar.webm` ainda exibe a identidade antiga (avatar cartoon, verde-água vibrante — estética já rejeitada em `docs/DESIGN_SYSTEM.md` seção 0); a moldura e o ambiente já estão prontos para receber o vídeo definitivo com a direção de arte 3.0, nos mesmos nomes de arquivo.
- **Revisitar quando:** o vídeo institucional definitivo for produzido, ou quando fotografias reais da sede substituírem as cenas de banco em `public/scenes/`.

## ADR-035 — Autoridade única de Curadoria: o ACE deixa de ser motor independente e a entrega canônica passa a ser a do Método

- **Data:** 2026-07-25
- **Status:** Aprovada pelo responsável do projeto (DECISÃO DE FUNDADOR, MISSÃO "Desativação controlada do ACE como motor de Curadoria": "A Curadoria da Aliviar possui uma única autoridade decisória. Essa autoridade é o Curador").
- **Contexto:** a plataforma manteve, em paralelo, dois caminhos capazes de produzir uma Curadoria entregável: o do Método (Perfil de Prioridades → Mesa → Relatório → entrega, em `curadoria.curated_selections` / `curadoria.curadoria_reports`) e o do ACE (P008 Shortlist → P009 HumanReviewResult → P010 FinalCuradoria, em `curadoria.final_curadoria_deliveries`). Dois caminhos operacionais significam duas autoridades possíveis sobre a mesma pergunta — quem são os três profissionais deste paciente —, e o inventário registrado em `docs/ACE_CAPABILITIES_V2.md` mostrou que o segundo caminho exercia autoridade decisória (P008 selecionava; P009 aprovava ou rejeitava) sem que nenhuma regra do Método o exigisse. O Concierge, o Connection e o Portal do Paciente aceitavam **apenas** a entrega do ACE como prova de que a Curadoria havia sido entregue.
- **Decisão:**
  1. Existe **uma única autoridade decisória** na Curadoria da Aliviar. Essa autoridade é o **Curador**, exercida na Mesa. A decisão do paciente sobre qual das três opções seguir permanece ato exclusivo do paciente.
  2. O ACE **deixa de ser motor independente de Curadoria**. Não seleciona profissionais, não produz shortlist definitiva, não aprova Curadoria, não produz entrega concorrente e não desencadeia o Concierge por caminho paralelo.
  3. Suas **capacidades técnicas e cognitivas são preservadas** — nenhuma some. As de engenharia foram absorvidas em `src/platform/` (erro codificado, congelamento profundo, estado de informação, política de campos, vocabulário proibido com consciência de negação, registro versionado, proveniência e invalidação em cascata, contrato de validação).
  4. A **entrega canônica** passa a ser a do Método: Relatório entregue sobre seleção entregue, com exatamente três opções distintas, vinculadas ao mesmo Case.
  5. O jusante (Connection, Concierge, Relationship) depende **exclusivamente** do contrato canônico de entrega (`src/modules/curadoria/delivery-contract.ts`), que responde "existe uma Curadoria validamente entregue para este Case?" e não expõe P008, P009, P010, ACE, `curated_selections`, `curadoria_reports` nem detalhes de persistência.
  6. Durante a janela de compatibilidade, o contrato reconhece as duas fontes com **precedência explícita**: entrega do Método primeiro; entrega legada do ACE **somente** quando não existir entrega canônica para o Case. Nunca combinar opções das duas fontes; nunca mais de uma entrega reconhecida por Case.
  7. **P008, P009 e P010 ficam descontinuados como cadeia decisória.** O desligamento efetivo obedece à ordem de segurança (mapear → substituir → testar → trocar consumidores → observar → desligar) e **não** foi concluído nesta missão: ver Consequência.
  8. **Observabilidade, Golden Set, governança do modelo, logs e métricas permanecem** — passam a acompanhar capacidades de IA e infraestrutura, nunca um motor decisório independente. O painel administrativo deve deixar claro que observa ferramentas da Plataforma, e não uma segunda Curadoria oficial.
  9. **Artefatos históricos não são reescritos.** `final_curadoria_deliveries`, `human_review_results`, `ace_artifacts` e `ace_executions` permanecem íntegros e legíveis.
  10. Esta decisão **não autoriza exclusão indiscriminada de dados**, remoção de tabelas nem de `src/modules/ace`.
- **Consequência — desativação interrompida por dependência de banco:** o desligamento de P010 **não pôde ser concluído** porque `curadoria.connection_records.final_curadoria_delivery_id` é `NOT NULL` com FK para `curadoria.final_curadoria_deliveries (id)`, reforçado pelo trigger de coerência de profissional apresentado e pela policy `connection_records_insert_own_patient` (migration `20260723164933_curadoria_stage5_connection_relationship.sql`). Enquanto essa invariante existir, **uma Curadoria entregue pelo Método é válida para o paciente ler e incapaz de gerar Connection** — não por regra do Método, mas por herança do motor antigo. O contrato canônico expõe esse limite explicitamente (`connectionAnchorId`), em vez de degradar para um "ainda não entregue" enganoso. A migration que torna a coluna anulável e adiciona a referência canônica é pré-requisito do próximo ciclo e não foi executada aqui.
- **Relação com ADR-021:** a ADR-021 congelou a V1.0 e registrou o ACE como motor de Curadoria da versão. Esta ADR **supersede parcialmente** a ADR-021 **nesse ponto específico** — o papel do ACE como motor independente —, por decisão explícita do responsável. Tudo o mais da ADR-021 permanece vigente, inclusive o congelamento do produto e o enquadramento de trabalho operacional/observabilidade. A ADR-021 **não foi editada**; a supersessão é registrada aqui, de forma explícita e append-only.
- **Relação com ADR-030:** reforça `src/platform/` como camada puramente técnica que nunca importa `modules/*` — as capacidades absorvidas do ACE respeitam essa fronteira e não conhecem Curadoria, Mesa, Briefing, paciente, Concierge nem Administrador.
- **Revisitar quando:** a migration da âncora canônica de Connection for executada e observada por ao menos um ciclo completo; nesse momento P008/P009/P010 podem ter o desligamento efetivo avaliado contra o critério "zero escritores ativos, zero leitores operacionais ativos, zero rotas ativas, zero actions sem chamador legítimo, zero efeitos no Concierge".

## ADR-036 — Descontinuação das superfícies de autoridade do ACE (complementa e executa a ADR-035)

- **Data:** 2026-07-26
- **Status:** Aprovada pelo responsável do projeto (MISSÃO "Desativação final do ACE — retomada na Etapa 2").
- **Contexto:** a ADR-035 decidiu que o ACE deixa de ser motor independente de Curadoria, mas o desligamento efetivo ficou condicionado ao desacoplamento do jusante. Esse desacoplamento foi concluído e certificado: Connection nasce pela âncora canônica (`connection_records.curadoria_report_id`), o CRM reconhece a entrega pelo contrato canônico, e o Concierge recebe o Case pelo repasse oficial e executa acompanhamento sem P010.
- **Decisão:** ficam **descontinuadas as superfícies pelas quais o ACE exercia autoridade**:
  1. rotas `/admin/casos/[id]/revisao` e `/curador/casos/[id]/revisao` (revisão P009 + entrega P010);
  2. `FinalCuradoriaDeliveryPanel` — único ponto de entrada operacional de P010;
  3. `HumanReviewForm` — único ponto de aprovação/rejeição de P009;
  4. `AceExecutionPanel` — único ponto de disparo do orquestrador;
  5. as Server Actions `deliverFinalCuradoriaAction`, `submitHumanReviewAction` e `runAceExecutionAction`.
  Sem esses pontos de entrada, **nenhum caso novo pode produzir entrega, revisão, shortlist ou execução do ACE pela aplicação**.
- **Preservado:** `final_curadoria_deliveries`, `human_review_results`, `ace_artifacts` e `ace_executions` intactos, com leitura histórica; `/admin/ace` como observabilidade; Golden Set; governança de modelos; a leitura legada encapsulada em `delivery-contract.ts`. Nenhum dado foi apagado, nenhuma tabela removida, nenhuma migration antiga editada.
- **Consequência — o que NÃO foi feito nesta etapa:** os repositórios `deliverFinalCuradoria`, `submitHumanReview` e `runAceExecution` permanecem no código, sem chamador de produção, porque cinco arquivos de teste de integração os usam para montar cenários **legados** — a regressão histórica que a própria missão manda preservar. Migrar essas fixtures para inserção controlada de dados históricos é pré-requisito da remoção física. Também não foram feitos: bloqueio de escrita no banco (grants/revoke), Etapa 4 (P008), Etapa 6 (retorno a protocolo), matriz RLS completa e auditoria do ciclo canônico final.
- **Relação com ADR-035:** executa parcialmente sua Decisão 7. Não a supersede — a complementa. A ADR-021 permanece supersedida apenas no ponto já registrado pela ADR-035.
- **Revisitar quando:** as fixtures legadas forem migradas; nesse momento os repositórios e o orquestrador podem ser removidos fisicamente e as tabelas passam a modo histórico com grants revogados.

## ADR-037 — ACE sem autoridade operacional: `runAceExecution` preservado como motor histórico sob observação

- **Data:** 2026-07-26
- **Status:** Aprovada pelo responsável do projeto (MISSÃO "Fase 2 — dividir o antigo `concierge.integration.test.ts`", decisão arquitetural declarada na própria missão).
- **Contexto:** a ADR-036 condicionou a remoção física de `runAceExecution`, `submitHumanReview` e `deliverFinalCuradoria` à migração das fixtures legadas de teste. A migração foi feita, e ao classificar o último arquivo (`concierge.integration.test.ts`) apareceu uma assimetria real entre os três: `submitHumanReview` e `deliverFinalCuradoria` só sustentavam cenários de montagem — todo o valor observável das suas suítes é dado persistido (grants, RLS, índices, proveniência), reproduzível por inserção controlada. Já `runAceExecution` sustenta dez certificações cujo objeto **é o que o motor produz**: a cadeia P001→P008, o log estruturado por protocolo, idempotência, retomada, métricas, health check, a classificação de falha do fornecedor e o Content Invariant do P003 (ADR-024). Substituí-las por fixture seria a fixture testando a fixture — a certificação deixaria de certificar.
- **Decisão:**
  1. O ACE **não tem autoridade operacional**. `runAceExecution` não pode possuir rota, Server Action, painel operacional, botão, fluxo de paciente, fluxo de Curador nem qualquer dependência da Curadoria canônica. Essa proibição é permanente enquanto esta ADR estiver vigente e não admite exceção "temporária".
  2. `runAceExecution` **é preservado** exclusivamente para certificação histórica, Golden Set, governança do modelo, métricas e observabilidade — coerente com a ADR-035, Decisão 8, que já manda preservar exatamente essas capacidades.
  3. `submitHumanReview` e `deliverFinalCuradoria` **não são necessários** a nenhuma dessas capacidades. Após esta missão, nenhum arquivo de produção ou de teste os invoca, e eles podem ser removidos fisicamente no bloco seguinte.
  4. A separação passa a ser explícita na suíte de integração: `tests/integration/ace-observabilidade.integration.test.ts` executa o motor histórico e certifica o que ele produz; `tests/integration/ace-historico.integration.test.ts` observa apenas o que o banco garante sobre o dado já persistido, sem nenhum escritor. O antigo `concierge.integration.test.ts` foi removido — o nome sugeria que ali se testava o Concierge canônico, o que nunca foi verdade.
- **Consequência:** a "Revisitar quando" da ADR-036 fica refinada. O critério "zero escritores ativos" é atingido por `submitHumanReview` e `deliverFinalCuradoria`, mas **não** por `runAceExecution`, que permanece vivo sem ponto de entrada. Três guards operacionais do orquestrador (papel incorreto, Caso em estado inválido, Curador não designado) deixaram de ser testados: eram evidências do retorno do escritor, e a RLS que os sustentava continua coberta por `ace-historico.integration.test.ts` e `cases.integration.test.ts`.
- **Relação com ADR-035 e ADR-036:** complementa as duas; não supersede nenhuma. A ADR-035 já previa (Decisão 8) que observabilidade e governança do modelo acompanhassem capacidades de IA, nunca um motor decisório independente — esta ADR nomeia o que isso significa na prática para o código do orquestrador.
- **Revisitar quando:** a certificação do motor migrar para um harness próprio (Golden Set executável fora da suíte de integração), ou quando as tabelas do ACE passarem a modo histórico com grants revogados — nesse momento `runAceExecution` perde o último motivo de existir.

## ADR-038 — Retenção e descarte de Cases: a imutabilidade protege o histórico, não a existência do Case

- **Data:** 2026-07-27
- **Status:** **Aprovada e implementada** — aprovação declarada pelo responsável na missão "Implementação da ADR-038" (2026-07-27). Migration `20260727140000_descarte_administrativo_de_case`, certificada por `tests/integration/descarte-de-case.integration.test.ts` (14 cenários).
- **Documento completo:** [`docs/RETENCAO_E_DESCARTE_DE_CASES.md`](RETENCAO_E_DESCARTE_DE_CASES.md) — cenários, riscos, plano de implementação, migração, rollback e impacto na suíte.
- **Contexto:** a migration `20260724192608` declara `case_id ... on delete cascade` na linha 6 e, logo abaixo, um gatilho `BEFORE UPDATE OR DELETE FOR EACH ROW` que recusa qualquer DELETE sem distinguir a origem. O gatilho recusa a própria cascata que a tabela declara. Consequência não escolhida: **um Case que trocou de responsável é indestrutível**, e com ele ficam a conta do paciente e a história de origem. Verificado no banco: `authenticated` não tem `GRANT DELETE` em `curadoria.cases` nem política de `DELETE` — nenhum usuário humano jamais pôde apagar um Case pela aplicação. O gatilho, portanto, não acrescenta proteção contra usuário; ele bloqueia apenas a operação administrativa autorizada e a limpeza de teste, que são justamente os casos legítimos. O mais grave: uma solicitação válida de eliminação de dados hoje **não tem como ser atendida**.
- **Decisão recomendada:** Alternativa C — função administrativa de descarte integral, auditada e sem exposição HTTP. Explicita a garantia pretendida (o histórico de um Case existente nunca é reescrito) e recusa a garantia acidental (Case imortal em qualquer hipótese). O gatilho passa a recusar `UPDATE` incondicionalmente e `DELETE` exceto quando a transação corrente carrega autorização local para aquele `case_id`. Comportamento **idêntico** em local e em produção — recusada por isso a Alternativa A, que faria a suíte deixar de provar produção no caminho que ela exercita.
- **Consequência:** produção não muda para nenhum usuário; passa a existir uma porta administrativa que hoje não existe. A cascata declarada em 2026-07-24 volta a funcionar como escrita. A suíte de integração fica plenamente idempotente (hoje: 3 Cases residuais por execução, declarados e conferidos pelo sentinela). Auditoria não é desligada em ponto nenhum: o descarte grava antes de apagar, e o registro sobrevive ao Case porque `audit_logs` não pertence à sua cascata.
- **Fora de escopo, e recomendado em seguida:** anonimização (Alternativa B) não é substituta do descarte — responde a outro pedido ("não quero ser identificável" ≠ "apaguem meus dados"). Merece ADR própria, com quem responde por LGPD na Aliviar e definição de prazos de retenção por tipo de dado.
- **Revisitar quando:** a ADR de anonimização for decidida, ou quando surgir exigência regulatória de retenção mínima que torne o descarte integral inadmissível para alguma classe de Case — nesse momento a política vira retenção obrigatória com desidentificação, e esta ADR é superseded.

## ADR-039 — Mapa de Prioridades do Case: subcritérios canônicos substituem o critério de texto livre

- **Data:** 2026-07-28
- **Status:** Aprovada pelo responsável do projeto (missão "Evolução do Modelo da Curadoria — catálogo canônico de subcritérios + Mapa de Prioridades do Caso"). Fundação implementada; integração com Mesa, motor e Relatório fica para as próximas missões.
- **Relação com o Congelamento do Domínio (Modelo v1.0 §13):** esta ADR é o descongelamento escopado que o §13 exige. Escopo: catálogo de subcritérios, escala de importância e persistência por Case. **Nada do motor muda:** os dois cruzamentos de 100 pontos, os seis critérios, a escala de quatro estados da avaliação e a regra dos três caminhos seguem intocados.
- **Contexto:** a auditoria encontrou **dois vocabulários de critério convivendo**. O legado `PRIORITY_CRITERIA` (`EXPERIENCIA, AREA_DE_ATUACAO, DISPONIBILIDADE, CONTINUIDADE, ABORDAGEM_INICIAL, LOCALIZACAO`, em `types.ts`) alimenta `priority_weights`, onde o Curador escolhe um critério e digita `target_value` e `evidence` em texto livre — é o "Definir Critérios"/"Validar Critérios". O canônico `CruzamentoCriterion` (`FORMACAO, EXPERIENCIA, HISTORICO, ACESSO, CONTINUIDADE_DO_CUIDADO, MODELO_DE_ATENDIMENTO`, Modelo v1.0) alimenta `cruzamento_weights`. A premissa de "criação livre de critérios" era parcialmente falsa: o critério já era fechado, mas na lista errada, e o que era livre eram o alvo e a evidência.
- **Decisão:**
  1. **O grupo de um subcritério É um critério do Modelo v1.0.** Nenhum tipo novo de grupo: criar `historico_profissional` ao lado de `HISTORICO` produziria um terceiro vocabulário para a mesma coisa.
  2. **Catálogo canônico** (`curadoria.method_subcriteria`), 26 subcritérios nos seis grupos, com código estável independente do texto visível. Em FORMAÇÃO os códigos espelham `curadoria.education_kind`, taxonomia oficial já usada no cadastro do profissional.
  3. **Escala fechada de cinco níveis** (`curadoria.importance_level`). O dado é o nível; o ordinal 5/4/3/2/0 é derivado em `importanceOrdinal()` e **não é persistido** — número guardado vira fonte, e fonte numérica é o caminho mais curto para alguém somar o que o Método não manda somar.
  4. **Mapa de Prioridades** (`curadoria.case_priority_map`): `(case, subcritério) → nível`, único, sem justificativa, evidência, fonte, anexo ou score. Cada campo livre reabriria a porta que este modelo fechou.
  5. **Não existe "Validar Critérios" no novo domínio.** A completude é calculada (`priorityMapCompletion`): validar era um ato manual que dizia, em outro lugar, o que os próprios dados já dizem.
  6. **O Curador não cria, não renomeia, não descreve.** O catálogo é somente leitura pela aplicação; mudança de catálogo é migration.
- **Compatibilidade:** migration **aditiva**. `priority_weights`, `priority_profiles`, `priority_profile_filters` e `cruzamento_weights` seguem lidos e escritos exatamente como antes, com dados históricos intactos. **Nenhuma conversão automática foi feita** — não existe correspondência inequívoca entre os dois vocabulários (`AREA_DE_ATUACAO` e `ABORDAGEM_INICIAL` não têm equivalente entre os seis, e `CONTINUIDADE` casaria com um grupo inteiro, não com um subcritério). Inventar o mapeamento seria pior que não migrar.
- **Consequência:** por ora existem **duas representações de "quanto importa"** — o orçamento de 100 pontos por bloco (Modelo v1.0, ativo no motor) e o Mapa de cinco níveis por subcritério (novo, ainda sem consumidor). Isso é convivência deliberada e **precisa terminar**: quando a Mesa passar a consumir o Mapa, uma das duas deixa de ser autoridade, e isso exige ADR própria.
- **Revisitar quando:** a missão que substituir a Mesa definir qual das duas representações alimenta o cruzamento — nesse momento o modelo livre é marcado como legado e as gravações novas param.

## ADR-040 — Mapa do Profissional: estados fechados sobre o mesmo catálogo canônico

- **Data:** 2026-07-28
- **Status:** Aprovada pelo responsável do projeto (missão "Mapa do Profissional — declaração estruturada dos 26 subcritérios canônicos"). Fundação implementada; o cruzamento Case × profissional fica para a próxima missão.
- **Contexto:** a ADR-039 criou o lado do Case (importância por subcritério) sem o lado correspondente do profissional. Sem ele o Mapa de Prioridades não tem com o que conversar, e o cruzamento futuro voltaria a depender de interpretação de texto livre.
- **Decisão:**
  1. **Mesmo catálogo, mesma identidade.** `professional_subcriterion_map.subcriterion_id` aponta para `curadoria.method_subcriteria` — a mesma tabela do Case. Nenhum catálogo paralelo, nenhum enum com os mesmos nomes em outro lugar, nenhuma conversão por rótulo visível. É essa identidade compartilhada que torna o cruzamento uma comparação, e não uma inferência.
  2. **Três estados, sem intermediário:** `CONFIRMADO`, `NAO_CONFIRMADO`, `NAO_INFORMADO`. Nada de "parcial", "provável" ou "evidência forte" — cada um deles seria uma decisão disfarçada de medida. E nada de adjetivo de qualidade ("excelente", "especialista de alto nível"): seria a Aliviar opinando sobre gente.
  3. **O profissional não recebe peso, nota nem importância.** Importância é do Case; presença é do profissional.
  4. **Ausência de registro ≠ `NAO_INFORMADO`.** A primeira é item não trabalhado; a segunda é item analisado sem informação suficiente. O banco preserva a diferença, nada é preenchido automaticamente, e o resumo visível diz "ainda não avaliado" para não colidir com o nome do estado.
  5. **Completude significa tratados, não atendidos.** `NAO_INFORMADO` conta como tratado.
  6. **Dado operacional interno.** Escrita: `administrador`, o mesmo recorte de quem edita profissional. Leitura: `administrador` e `curador_medico` (que vai precisar dele na Mesa). **Não** o paciente, **não** o público, **não** o próprio profissional — é um registro da operação *sobre* ele, não um campo do perfil dele. Registrar o Mapa não publica ninguém e não altera `publication_status`, com teste garantindo.
  7. **Nenhuma inferência automática de dado legado.** `education_kind = residencia` não marca "Residência médica" como confirmada; endereço não confirma "Localização". A semântica de cada subcritério precisa ser consolidada antes de qualquer automação — e um estado inferido errado é pior que um estado ausente.
- **Consequência:** o preenchimento é explícito e custa tempo da operação: 26 subcritérios por profissional. É o preço de não inventar estado. Oportunidades de preenchimento assistido ficam registradas para uma decisão futura, com confirmação humana obrigatória.
- **Revisitar quando:** a missão do cruzamento definir como `importância × estado` produz leitura — e, aí sim, se algum preenchimento assistido vale o risco.

## ADR-041 — Motor de Compatibilidade: quatro resultados por subcritério, nenhum score

- **Data:** 2026-07-28
- **Status:** Aprovada pelo responsável do projeto (missão "Motor de Compatibilidade"). Motor implementado e certificado; nenhum consumidor ligado ainda — Mesa, Relatório e Dashboard do Paciente seguem intocados.
- **Contexto:** as ADR-039 e ADR-040 criaram os dois lados (importância no Case, estado no profissional) apontando para o mesmo `method_subcriteria.id`. Faltava a função que os compara.
- **Decisão:**
  1. **Quatro resultados por subcritério:** `ALTA_COMPATIBILIDADE`, `MEDIA_COMPATIBILIDADE`, `LACUNA_DE_INFORMACAO`, `NAO_RELEVANTE`. **Nenhum score, nota, porcentagem, ranking ou soma.** O resumo conta ocorrências e nada mais.
  2. **A comparação é por identidade de subcritério, nunca por nome.** O módulo puro não conhece rótulo algum.
  3. **Ausência nunca elimina.** `NAO_CONFIRMADO` no topo da escala é MÉDIA, não incompatível — a falta de uma característica reduz aderência naquele subcritério e mais nada. O julgamento continua sendo do Curador (Fundamentos §13, P14).
  4. **O Motor não ordena.** `crossCaseWithProfessionals` devolve na ordem de entrada. Ordenar por resultado produziria colocação, e colocação é decisão (Ontologia §3.13).
  5. **O Motor não escreve.** Cruzar é leitura, com teste garantindo que nenhuma linha é criada ou alterada.
- **As seis combinações derivadas:** a definição da missão fixou 9 das 15 células. As outras 6 foram preenchidas por três princípios, declarados no código e cobertos por teste — (1) `NAO_INFLUENCIA` devolve `NAO_RELEVANTE` nos três estados; (2) `NAO_CONFIRMADO` nunca passa de MÉDIA em nenhuma importância; (3) `NAO_INFORMADO` devolve LACUNA em toda importância que conta, inclusive `POUCO_IMPORTANTE` — deixar a importância baixa silenciar um "não sei" seria o Motor decidindo o que o Curador precisa saber. **Se alguma dessas seis contrariar a intenção, corrige-se na matriz, num lugar só.**
- **Ausência de registro × `NAO_INFORMADO`:** as duas caem em `LACUNA_DE_INFORMACAO`, como a ADR-040 previu — mas seguem distinguíveis: cada linha carrega o `status` original (`null` = ninguém tratou) e o resumo expõe `gapsWithoutAnyRecord`. O Curador precisa saber se alguém olhou e não soube, ou se ninguém olhou ainda.
- **Subcritério não declarado pelo Case:** fica **fora** do cruzamento e é contado à parte (`notDeclaredByCase`). Sem importância declarada não existe pergunta a fazer, e isso é um fato sobre o Case — não pode virar "compatibilidade" de espécie nenhuma.
- **Consequência:** continuam existindo **duas representações de "quanto importa"** — o orçamento de 100 pontos (ADR-039 já registrou) e o Mapa. O Motor novo consome o Mapa; o motor antigo (`cruzamento.ts`) segue intocado e ainda é o que a Mesa usa. **A missão que ligar a Mesa ao Motor novo precisa decidir qual das duas é autoridade** — e isso exige ADR própria.
- **Revisitar quando:** a Mesa passar a consumir esta leitura, ou quando a experiência real mostrar que quatro estados são poucos ou demais.

## ADR-042 — Virada de autoridade: o Mapa de Prioridades substitui o orçamento de 100 pontos

- **Data:** 2026-07-28
- **Status:** Aprovada pelo responsável do projeto, por decisão explícita ("Escolho o caminho A… Vamos fazer uma única virada de autoridade… Não utilizar adaptadores temporários. Não manter duas fontes de verdade.").
- **Contexto:** a auditoria da missão "Nova Mesa Premium" encontrou um conflito arquitetural, não um problema de implementação. Duas representações de "quanto importa" coexistiam desde a ADR-039: o orçamento de dois blocos de 100 pontos sobre os seis critérios, e o Mapa de Prioridades (cinco níveis sobre 26 subcritérios). O orçamento tinha **três consumidores**, e dois deles — o ProfileCard do Dashboard do Paciente e o Relatório Inteligente — estavam fora do escopo daquela missão. Aposentar o orçamento só na Mesa quebraria os outros dois; mantê-lo faria o Curador ver duas respostas para a mesma pergunta.
- **Decisão — a autoridade oficial passa a ser:**

  `Método → Catálogo Canônico → Mapa de Prioridades → Mapa do Profissional → Motor de Compatibilidade`

  1. **O orçamento de 100 pontos deixa de ser fonte de verdade.** `cruzamento_weights` não recebe gravação nova por nenhuma superfície.
  2. **Virada única.** Mesa, ProfileCard e Relatório Inteligente migram na mesma entrega. **Nenhum adaptador**, nenhuma derivação de pesos a partir do Mapa, nenhuma sincronização entre os dois modelos — convivência temporária vira permanente.
  3. **O paciente deixa de ver pontuação.** O cartão muda de conceito: em vez de distribuição ("40 pts / 35 pts / 25 pts"), passa a responder **"O que mais importa para o seu caso"**, agrupado pelos cinco níveis, em linguagem dela. Ela precisa compreender **quais fatores foram considerados prioritários**, não como foram ponderados internamente.
  4. **Dados históricos preservados.** `cruzamento_weights` e `priority_weights` continuam existindo e legíveis. Nenhuma conversão automática: os dois vocabulários não têm correspondência inequívoca (ADR-039), e Cases antigos ficam sem Mapa até alguém preenchê-lo.

- **O que NÃO muda, e por quê — a validação do Perfil pela pessoa permanece.** A missão pedia remover "Validar Critérios". Removi o conceito de *validar critérios construídos*; **preservei o ato do paciente reconhecer o Perfil como seu** (`priority_profiles.status = 'VALIDATED'`). São coisas diferentes que dividiam o mesmo nome: a primeira é etapa de um modelo aposentado; a segunda é a garantia de que *"a Curadoria só abre depois que ela reconhece o Perfil como seu — sem o critério dela, qualquer análise seria a Aliviar decidindo com aparência de método"*. Apagar isso junto seria remover o consentimento dela por efeito colateral de uma refatoração. A completude do Mapa continua **calculada**, nunca declarada — não existe etapa manual de validação de critérios.

- **Consequência:** deixa de existir qualquer duplicidade de autoridade. O preço é operacional: um Case só produz leitura depois que o Mapa é preenchido (26 subcritérios), e Cases anteriores à virada aparecem com Mapa vazio até serem retomados — o que é honesto, e melhor que herdar uma tradução inventada.
- **Revisitar quando:** a operação real mostrar que 26 subcritérios são muitos para a conversa, ou que a escala de cinco níveis não distingue o que precisa distinguir.

## ADR-043 — A Aliviar intermedeia a transição entre a decisão da paciente e o primeiro contato

- **Data:** 2026-08-01
- **Status:** Aprovada pelo responsável do projeto (missão "Fase 9C — Decisão de domínio sobre a intermediação"). **Decisão de direção do serviço; nada implementado.** Nenhuma migration, RLS, tela ou código nesta ADR.
- **Resolve:** a divergência **D1** registrada em [`docs/experiencia/CONTRATO_OPERACIONAL_DA_DECISAO.md`](experiencia/CONTRATO_OPERACIONAL_DA_DECISAO.md) §0.2, e a derivada **D2** (§10 do mesmo documento).
- **Relação com ADRs vigentes:** **não altera** ADR-027 (Connection `Implementado`), ADR-028 (Relationship) nem ADR-029 (Temporary Access). **Amplia o escopo do Domínio 4** dentro da fronteira que a ADR-029 já reconhece como sua: *"depois do `DELIVERED`, entre a escolha do paciente (Connection) e o vínculo longitudinal (Relationship)."*

### 1. Contexto — o que foi verificado no código

**Fatos observados** (não interpretações), com referência precisa:

| # | Fato | Onde |
|---|---|---|
| F1 | `CONTATO_INICIADO` é **declaração da paciente**, e o próprio código o afirma: *"sempre uma declaração do paciente, nunca verificada externamente"*. A superfície diz *"Você registrou que iniciou o contato com [nome]"* | `src/modules/connection/commands.ts` (`registerContactIntent`); `src/components/patient/connection-progress-panel.tsx` |
| F2 | **Só a paciente produz** qualquer evento pós-decisão: `assertOwner` no domínio e RLS no banco. Curador e administrador têm **somente leitura** | `commands.ts`; policies `connection_records_*`, `connection_events_insert_own_patient` em `supabase/migrations/20260723164933_curadoria_stage5_connection_relationship.sql` |
| F3 | **Nenhuma notificação existe.** `registerPatientDecision` insere a linha e chama `revalidatePath` das rotas da paciente; não há e-mail, webhook ou fila. O Curador tem **visibilidade por RLS, não aviso** | `src/modules/curadoria/repository.ts` (`registerPatientDecision`); `src/modules/curadoria/actions.ts` |
| F4 | **Não existe evento de contato realizado pela equipe.** Os tipos são `DECISAO_REGISTRADA`, `CORRECAO_ESCOLHA`, `CONTATO_INICIADO`, `PRIMEIRO_ATENDIMENTO_REALIZADO`, `ENCERRADO_SEM_RELACIONAMENTO` | `connection_events_type_check`, migration citada; `src/modules/connection/types.ts` |
| F5 | **Não existe verificação de disponibilidade, reserva, horário ou agenda** — nenhuma tabela, coluna ou evento em 61 migrations. `PRIMEIRO_ATENDIMENTO_REALIZADO` é registro *a posteriori*, também declarado por ela | busca em `supabase/migrations/` |
| F6 | **A correção da escolha só é permitida enquanto `status = DECISAO_REGISTRADA`**, garantido por *trigger* — e nunca sobrescreve a escolha anterior: gera `CORRECAO_ESCOLHA` em sequência temporal | `assert_connection_valid_transition`; `commands.ts` (`correctChoice`) |
| F7 | O profissional escolhido **precisa pertencer à entrega** — *trigger* impede escolher fora dos três | `assert_connection_professional_in_delivery` |
| F8 | **O profissional não tem hoje nenhum caminho de acesso** a qualquer contexto da Curadoria que o apresenta | constatado na ADR-029 |

**Interpretação** (não é fato): os documentos de experiência das Fases 7–9 descrevem continuidade e mediação que esses fatos não sustentam. [`A_DECISAO.md`](experiencia/A_DECISAO.md) §5.2 afirma que a paciente sabe *"que o Curador foi avisado e o que ele fará em seguida"* (contra F3); §10 promete que, na indisponibilidade, a Aliviar *"avisa imediatamente"* e põe *"deixá-la descobrir"* entre o que **nunca** se faz (contra F4 e F5); [`A_SALA_DA_DECISAO.md`](experiencia/A_SALA_DA_DECISAO.md) §8 modela `profissional_contatado` sob autoridade de *"pessoa da Aliviar"* (contra F1).

**O modelo implementado é auto-serviço:** a paciente decide, contata, e informa que contatou. **É um modelo legítimo e tecnicamente íntegro** — e não é o modelo escolhido para a Aliviar.

### 2. Decisão

> **A Aliviar é responsável pela continuidade operacional entre a confirmação da decisão e o início da relação da paciente com o profissional escolhido.**

A responsabilidade inclui: (1) registrar a decisão; (2) produzir **notificação verificável** ao papel responsável; (3) atribuir responsabilidade operacional ao **Concierge**; (4) registrar **quem iniciará o contato**; (5) realizar ou acompanhar a aproximação; (6) tornar o **estado real** dessa transição visível à paciente; (7) tratar **indisponibilidade como evento do processo**, não como descoberta dela; (8) devolver à Curadoria o que exigir nova avaliação.

**A decisão não implica** — e nenhuma superfície poderá afirmar: reserva de horário · consulta marcada · disponibilidade garantida · transmissão da formulação do trade-off · contratação · atendimento clínico · substituição automática por outro profissional · **qualquer redução da autonomia da paciente**.

**Fundamento.** Não é preferência de produto: é um princípio já escrito sendo violado pela operação. A_DECISAO §10 proíbe *"deixá-la descobrir"* a indisponibilidade — e é exatamente o que o sistema faz hoje (F4, F5). E o Concierge, papel mais presente nas Fases 7–9, **não tem hoje nenhuma autoridade operacional** (F2).

### 3. Dois modos de início do contato

**Ambos preservam a autoria da paciente. Nenhum é selecionado silenciosamente pelo sistema; nenhum é padrão pré-marcado.**

**Modo A — Aproximação intermediada.** Ela autoriza a Aliviar a iniciar ou coordenar a aproximação. A Aliviar contata, registra o despacho, recebe a resposta e lhe informa o estado real.

**Modo B — Contato direto acompanhado.** Ela prefere contatar por conta própria — **e a Aliviar não desaparece**: registra a escolha do modo, diz com clareza o que depende dela, permanece alcançável, acompanha o resultado, **recebe eventual indisponibilidade** e **nunca trata ausência de retorno como encerramento silencioso**. É o modelo atual **acrescido de acompanhamento real** — o que hoje não existe.

**O modo integra o ato de confirmação ou exige manifestação separada?** **Questão em aberto, deliberadamente** (§15, Q-C1). O argumento de experiência favorece integrar — `SD-P3` de A_SALA fixa "uma decisão, um ato", e uma segunda confirmação faria a paciente desconfiar de si. O argumento de consentimento pode exigir separar, porque no Modo A ela autoriza contato com terceiro em seu nome, e consentimento presumido por conveniência de fluxo é frágil. **Nenhuma conclusão jurídica é emitida aqui.** Enquanto não decidido, o modo é manifestação **explícita** dela, integrada ou não ao ato.

### 4. Fronteiras de responsabilidade

| Marco | Papel responsável a partir dele |
|---|---|
| Antes da confirmação | **Curador do caso** — entender, buscar, verificar, apresentar |
| `decisao_registrada` | **começa a responsabilidade operacional da Aliviar** |
| `concierge_atribuido` | **Concierge nominal** — é o evento que atribui responsabilidade; até ele existir, **o Curador do caso permanece responsável**, sem lacuna |
| Aproximação (A ou B) | **Concierge** conduz (A) ou acompanha (B) |
| Resposta do profissional | **o profissional** passa a participar — antes disso ele não é parte |
| Questão sobre o caso, os três ou a informação | **volta ao Curador**, sempre |
| Nova avaliação do Perfil | **Curador** — reabertura da Curadoria |
| `aproximacao_concluida` | termina a Sala da Decisão; **começa o futuro Espaço de Acompanhamento** |

**Sob responsabilidade da paciente, sempre:** decidir · corrigir enquanto for direto · escolher o modo · decidir se e quando começa · declarar piora clínica.

**Proibido:** a expressão *"a equipe acompanha"*. Todo estado nomeia um papel, e o Concierge é uma pessoa com nome.

### 5. O significado de "comunicada"

> **O termo "decisão comunicada" é abolido como evento único.** Designava coisas diferentes em documentos diferentes, e essa ambiguidade produziu D1.

Passam a existir eventos distintos e não fundíveis: `decisao_registrada` · `curador_notificado` · `concierge_atribuido` · `modo_de_contato_escolhido` · `contato_solicitado` · `contato_despachado` · `contato_recebido` *(quando verificável)* · `disponibilidade_respondida` · `aproximacao_concluida`.

**O evento que fecha a correção direta pela paciente é `contato_despachado` no Modo A, e a declaração dela no Modo B** — ver §6.

**Uma comunicação recebida não é desfazível.** O que existe depois dela é **explicação a uma pessoa**, que é trabalho humano — nunca funcionalidade.

### 6. Reversibilidade

A regra atual (F6) permanece **correta em espírito e insuficiente em alcance**: acerta ao ancorar a irreversibilidade num fato do mundo, e erra ao supor que só a paciente produz esse fato.

**Regra que a implementação futura deverá realizar:**

| Situação | Correção direta pela paciente | Alteração mediada |
|---|---|---|
| Antes de qualquer contato (A ou B) | **sim**, sozinha, sem justificar, entre os três | desnecessária |
| **Modo A**, depois de `contato_despachado` | **não** | **sim** — via Concierge |
| **Modo B**, depois de ela declarar contato | **não** | **sim** — via Concierge |

**Quem executa a alteração mediada:** o **Concierge**, a pedido dela — **e a decisão continua sendo dela**; o Concierge executa o que ela decidiu e trata a explicação ao profissional preterido. **Isto exige autoridade de escrita que hoje não existe** (F2) e cruza com a capacidade *"Troca de Profissional"* já pendente na **ADR-028**.

**Histórico sem culpa:** `CORRECAO_ESCOLHA` nunca sobrescreve (F6) e **não é falha**. Nenhuma superfície pode contar correções, exibi-las como hesitação ou rotular a paciente.

**Formulação que substitui a promessa absoluta.** A frase *"a decisão é reversível"* fica **proibida sem condição**. Verdade condicionada e verificável: ***"enquanto não tivermos falado com [nome], você pode trocar aqui mesmo. Depois disso, é só me dizer que eu cuido disso com você."*** — a segunda metade só se torna emitível quando o Concierge existir operacionalmente (§15, Q-C4).

### 7. Disponibilidade

**Esta ADR não afirma que existe agenda integrada. Não existe** (F5), e nada aqui a cria.

Sete graus, distintos e não fundíveis: **disponibilidade conhecida na Curadoria** (declaração datada do profissional, na Base de Evidências — **existe hoje**) · **ainda não confirmada** (o estado normal) · **consulta de disponibilidade** (perguntar) · **resposta do profissional** · **disponibilidade para receber contato** · **disponibilidade para horário específico** · **reserva** · **consulta marcada**.

**Obrigação que esta ADR cria:** **verificar, acompanhar e comunicar honestamente o estado real** — nada além. Permanecem proibidas, sem exceção e independentemente de qualquer decisão futura: *"seu profissional está garantido"* · *"sua consulta está reservada"* · *"está tudo certo"* · *"ele está te esperando"*.

**E permanece obrigatório dizer a data:** *"ele declarou, em [data], que atende de manhã"* — a Política de Fontes trata acesso/agenda como volátil, com revisão de três meses.

### 8. Indisponibilidade

A indisponibilidade posterior: **não invalida a compreensão da paciente** · **não transforma sua escolha em erro** — a falha é de atualidade da informação, e é da Aliviar · **não promove automaticamente outra opção** · **não cria "segunda colocada"** (não há colocação: os três são caminhos legítimos sem ordem, ADR-041) · **exige avaliação sobre preservar as alternativas** · **pode exigir retorno à Mesa ou à Curadoria** · **é comunicada por uma pessoa com autoridade definida — o Concierge** — e nunca descoberta por ela sozinha.

**Decisão adicional necessária** para o fluxo completo: o que caracteriza indisponibilidade **definitiva** *versus* temporária, e quanto se espera antes de tratar como definitiva (§15, Q-C6).

### 9. Notificação da decisão

**Requisito de domínio:** uma decisão registrada **produz um evento verificável destinado ao papel responsável**. Visibilidade por RLS não é notificação (F3).

Cinco estados distintos, e a frase permitida em cada um:

| Estado | Frase permitida |
|---|---|
| **evento criado** | *"sua decisão está registrada"* |
| **notificação despachada** | *"avisamos [nome] às [hora]"* |
| **notificação recebida** | *"chegou a [nome]"* — só se houver acuse técnico |
| **notificação lida** | *"[nome] já viu"* |
| **responsabilidade assumida** | *"[nome] está cuidando disso"* |

> **A interface não pode dizer "o Curador foi avisado" apenas porque um registro foi criado.** É o erro que F3 revelou, e esta ADR o proíbe explicitamente.

### 10. Autoridades e permissões — proposta conceitual

**Nenhuma política RLS é definida ou alterada nesta fase.** Mudanças que a implementação futura precisará avaliar:

| Capacidade | Hoje | Proposta conceitual |
|---|---|---|
| paciente confirmar | ✅ ela | inalterado |
| paciente corrigir diretamente | ✅ ela, até `DECISAO_REGISTRADA` | **janela redefinida** por §6 |
| paciente escolher o modo | ⛔ inexistente | **ela, sempre — nunca o sistema** |
| Curador consultar | ✅ leitura | inalterado |
| **Concierge assumir** | ⛔ **sem papel algum** | **nova autoridade** — atribuição e leitura do caso |
| **Concierge registrar aproximação** | ⛔ | **nova autoridade de escrita** — a mais sensível desta ADR |
| **profissional responder disponibilidade** | ⛔ (F8) | **nova** — e a **ADR-029 (Temporary Access)** já é o mecanismo autorizado para dar-lhe contexto limitado, revogável e no tempo. **Nenhum mecanismo novo deve ser inventado para isso.** |
| operação corrigir falhas | via service role | **precisa de trilha auditável**, não privilégio silencioso |
| Curador reabrir a Curadoria | ✅ | inalterado |
| administrador auditar | ✅ leitura | **auditar sem decidir pela paciente** — nunca escrita em nome dela |

**Invariante que nenhuma implementação pode violar:** **ninguém decide, corrige ou confirma em nome da paciente.** O Concierge executa o que ela pediu; não escolhe por ela.

### 11. Privacidade e consentimento — questões para validação especializada

**Nenhuma conclusão jurídica é emitida.** Exigem validação: autorização para a Aliviar contatar o profissional · dados que acompanham o contato · **exposição da identidade da paciente** (é possível consultar disponibilidade sem identificá-la, e essa alternativa merece exame prioritário) · acesso do Concierge à decisão · **acesso à formulação do trade-off** · registro do modo escolhido · retenção do histórico *(cruza com o append-only já implementado)* · **revogação da autorização**.

> **Princípio provisório adotado:** **o profissional recebe apenas o contexto necessário para responder ou iniciar a aproximação.**
> **Esta ADR não determina que a formulação do trade-off será transmitida — e registra a recomendação de que nunca seja.** É reflexão privada sobre uma escolha entre pessoas, e uma delas é ele; transmiti-la seria mostrar-lhe o que ela abriu mão ao escolhê-lo.
> **Divergência D3 permanece aberta:** a nota é hoje legível pelo Curador e pelo administrador (`patient_decisions_select_own_or_team`), enquanto A_SALA §3 afirma "ela, e só ela". Ou o documento passa a dizer a verdade, ou o acesso é restringido — **e o que não pode acontecer é ela não saber.**

### 12. Consequências para o domínio

*Conceituais. **Nada implementado nesta ADR.***

| Consequência | Por que é necessária | Promessa que sustenta | O que ainda bloqueia |
|---|---|---|---|
| Evento de **notificação verificável** | visibilidade ≠ aviso (F3) | *"avisamos [nome]"* | canal e prazo (Q-C4) |
| **Atribuição de responsabilidade** (`concierge_atribuido`) | o Concierge não tem papel (F2) | *"[nome] está cuidando disso"* | escala e cobertura (Q-C4) |
| **Escolha do modo de contato** | os dois modos precisam existir sem padrão silencioso | *"você decide como quer começar"* | consentimento (Q-C1) |
| **Aproximação intermediada** (`contato_solicitado`/`despachado`) | não existe contato pela equipe (F4) | *"falamos com ele"* | prazo, canal, dados (Q-C2, Q-C3) |
| **Acompanhamento do contato direto** | hoje o Modo B é abandono com registro | *"me diga como foi; se ele não responder, eu entro"* | Q-C4 |
| **Resposta de disponibilidade** | não existe (F5) | *"ele pode receber você"* | acesso do profissional (ADR-029), Q-C3 |
| **Indisponibilidade como evento** | hoje ela descobre sozinha (D2) | *"ele não está disponível — a falha é nossa"* | Q-C6 |
| **Solicitação e alteração mediada** | correção impossível após contato (F6) | *"é só me dizer que eu cuido disso"* | Q-C5; cruza com ADR-028 (*Troca de Profissional*) |
| **Retorno à Curadoria** | existe como desfecho, não como fluxo | *"vamos entender melhor"* | Q-C6 |
| **Transição para acompanhamento** | `aproximacao_concluida` não existe | *"a partir daqui é outro cuidado"* | desenho do Espaço de Acompanhamento |

### 13. Impacto sobre o domínio congelado

Verificado contra [`docs/curadoria/CONGELAMENTO_ARQUITETURAL.md`](curadoria/CONGELAMENTO_ARQUITETURAL.md) §2 e §4:

**Esta decisão altera conceitos congelados?** **Não.** Nenhum dos oito itens congelados é tocado. O ciclo pós-decisão (`connection_records`) **não consta da lista de congelados** — é governado pela ADR-027, e esta ADR o amplia sem contradizê-la.

**Exige nova ADR?** **É esta.** A regra do *trigger* de correção (F6) é regra implementada, e alterá-la exige decisão registrada — o que esta ADR faz, sem executá-la.

**Substitui alguma regra anterior?** **Não substitui; amplia.** A ADR-027 declarou Connection "pontual — decisão do paciente e primeiro contato". Esta ADR mantém o escopo pontual e acrescenta **quem participa dele**.

**Amplia o serviço sem alterar o Motor?** **Sim, e integralmente.**

> **Declaração explícita: não são alterados por esta decisão — critérios · pesos · filtros · lógica de compatibilidade · ordenação interna · seleção dos três.** O Motor (ADR-041), o Catálogo Canônico 1.0.0, a escala de cinco níveis (ADR-039), os três estados do Mapa do Profissional (ADR-040), a Base append-only e a separação Base × Case **permanecem intocados**. Esta ADR trata exclusivamente do que acontece **depois** que a leitura foi produzida e a paciente decidiu.

**Migrations e contratos futuramente afetados** (nenhum agora): `connection_records` e `connection_events` (novos estados/eventos, novos atores); RLS de `connection_*` (autoridade do Concierge); notificação (não existe); `patient_curadoria_decisions` (registro do modo); Temporary Access (ADR-029) para o acesso do profissional.

**O que permanece intocado:** todo o congelado de §2, a jornada até a entrega, o Protocolo da Pessoa e o do Profissional, o Relatório, a Mesa e a Sala **como projetos de experiência** — esta ADR muda o que a Sala pode prometer, não o que ela é.

### 14. Alternativa rejeitada — manter o autosserviço e corrigir os documentos

**Consistia em:** aceitar o modelo implementado como definitivo e reescrever as Fases 7–9 para prometer apenas o que ele sustenta.

**Rejeitada porque:** contradiz a continuidade que a experiência promete · não sustenta o papel do Concierge após a decisão · **deixa a paciente descobrir sozinha uma indisponibilidade**, que A_DECISAO §10 proíbe expressamente · impede a Aliviar de conhecer o estado real da transição · reduziria o futuro Espaço de Acompanhamento a acompanhamento declarado pela própria paciente · exigiria remover ou enfraquecer partes centrais das Fases 7–9.

> **O autosserviço não é tecnicamente inválido.** É um modelo possível, íntegro e coerente consigo mesmo — com a virtude real de deixar a paciente controlar seu próprio ponto de não-retorno. **Não é o modelo escolhido para a Aliviar**, porque a Aliviar promete não deixá-la sozinha depois de decidir.

### 15. Questões ainda abertas

| # | Questão | Bloqueia |
|---|---|---|
| **Q-C1** | o modo integra o ato de confirmação ou exige manifestação separada? *(consentimento)* | modelagem · implementação |
| **Q-C2** | quem realiza a primeira aproximação em cada modo | implementação |
| **Q-C3** | dados transmitidos ao profissional; identificar ou não a paciente na consulta | modelagem · implementação |
| **Q-C4** | **prazo operacional, canais, regras fora do horário, contingência** | **reconciliação documental** · implementação |
| **Q-C5** | autoridade para alteração mediada *(cruza com ADR-028)* | modelagem · implementação |
| **Q-C6** | processo diante de indisponibilidade; definitiva × temporária | implementação · Espaço de Acompanhamento |
| **Q-C7** | evento exato que fecha a correção direta em cada modo | modelagem |
| **Q-C8** | momento em que o Concierge assume | reconciliação documental · implementação |
| **Q-C9** | **política de urgência** *(clínica — independente das demais)* | **reconciliação documental** |
| **Q-C10** | consentimentos necessários *(jurídico/privacidade)* | implementação |
| **Q-C11** | eventual integração futura de agenda | Espaço de Acompanhamento |

**Bloqueiam a reconciliação documental:** Q-C4, Q-C8, Q-C9. **A modelagem de domínio:** Q-C1, Q-C3, Q-C5, Q-C7. **A implementação:** todas, exceto Q-C11. **O Espaço de Acompanhamento:** Q-C6, Q-C11.

**Q-C9 não deve esperar a ordem de dependência das demais — é a única cujo risco é a segurança de uma pessoa.**

### 16. Patches documentais

Referentes a [`CONTRATO_OPERACIONAL_DA_DECISAO.md`](experiencia/CONTRATO_OPERACIONAL_DA_DECISAO.md) §17. **Nenhum é aplicado aqui; a reconciliação é fase separada.**

| Patch | Situação |
|---|---|
| **P-1** *(remover "o Curador foi avisado")* | **AUTORIZADO** — §9 |
| **P-2** *(condicionar a reversibilidade)* | **REESCREVER** — a condição agora é a de §6, não a do *trigger* atual |
| **P-3** *(Concierge alcançável × assume)* | **AUTORIZADO** — §4 |
| **P-4** *(indisponibilidade não cumprível)* | **OBSOLETO** — a decisão torna a promessa cumprível; §8 |
| **P-5** *(ancorar "a alternativa sai de cena")* | **REESCREVER** — ancorar em `aproximacao_concluida` |
| **P-6** *(A_MESA pode ser precisa)* | **REESCREVER** — pela regra de §6 |
| **P-7** *(quem lê a formulação)* | **BLOQUEADO** — Q-C10 / D3 |
| **P-8** *(falta `ENCERRADO_SEM_RELACIONAMENTO`)* | **AUTORIZADO** — independe desta decisão |
| **P-9** *(§8 da Sala descreve serviço inexistente)* | **AUTORIZADO como direção** — o serviço passa a ser o desta ADR; a redação depende de Q-C4 |
| **P-10** *(Q1..Q4 já decididas)* | **REESCREVER** — substituídas pelas Q-C desta ADR |
| **P-11** *("uma pessoa, com nome")* | **REESCREVER** — passa a ser verdade no Modo A; depende de Q-C8 |

- **Consequência:** a Aliviar assume carga operacional que hoje não tem — alguém precisa ser notificado, atribuído, e efetivamente contatar ou acompanhar. **É o preço de não deixar a paciente sozinha depois de decidir**, e nenhuma promessa nova pode ser feita a ela antes que essa capacidade exista. Até lá, as frases bloqueadas em §20 do Contrato permanecem bloqueadas: **decidir a direção não autoriza prometê-la.**
- **Revisitar quando:** Q-C1, Q-C4 e Q-C8 estiverem decididas — momento em que a reconciliação documental pode ocorrer e a modelagem de domínio pode começar; ou se a operação real mostrar que a intermediação não é sustentável na escala da Aliviar, o que exigiria nova ADR e não silêncio.

## ADR-044 — Tentativa, trabalho e notificação são três coisas distintas na continuidade pós-decisão

- **Data:** 2026-08-01
- **Status:** Aprovada pelo responsável do projeto (missão "ADR-044 — Tentativas de aproximação, trabalho operacional e notificação interna"). **Decisão de modelagem; nada implementado.** Nenhuma migration, RLS, tela ou código nesta ADR.
- **Decorre de:** [ADR-043](#adr-043--a-aliviar-intermedeia-a-transição-entre-a-decisão-da-paciente-e-o-primeiro-contato) (direção do serviço) · [`DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md`](architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md) §16, que previu esta ADR como precondição do Incremento 2.
- **Não altera:** ADR-027 (Connection), ADR-028 (Relationship), ADR-029 (Temporary Access). **Não toca** Motor, critérios, pesos, filtros nem seleção dos três.

> ### A decisão, em uma frase
> **O fato cria trabalho; o trabalho pode gerar notificação; a notificação nunca cria o fato nem a responsabilidade.**

### 1. Contexto

**Fatos verificados no código e nas migrations:**

| # | Fato | Onde |
|---|---|---|
| F1 | `connection_records` registra a decisão e, desde o Incremento 1, o **modo de contato** (`contact_mode`, nullable, sem default, sem backfill) | migration `20260801180000` |
| F2 | O Case tem **responsável atual auditável** — `cases.responsible_id/_role`, mudado só por `transfer_case_responsibility()`, com motivo obrigatório e histórico em `case_responsibility_changes`, cuja exclusão a ADR-038 proíbe fora do descarte autorizado | migrations `202607241925*`, `20260724193459` |
| F3 | A caixa do Concierge é **projeção**, não entidade — leitura sobre Cases e Connections, autorizada por `can_access_case` | `src/modules/connection/continuity-worklist.ts` |
| F4 | **`approach_attempts` não existe** | busca no repositório |
| F5 | **`team_notifications` não existe** | idem |
| F6 | `patient_notifications` existe e é **paciente-facing por construção**: `profile_id` é a paciente destinatária, `select_own_or_admin`, `insert` restrito a `administrador`, e um *trigger* protege o conteúdo | `20260723164543` |
| F7 | **Não há canal interno formalizado, horário operacional, SLA, escalonamento nem detecção automática de inércia** | Fase 9C.1, §1 e §6 |
| F8 | **Temporary Access está aprovado e não implementado** — nem módulo nem migration | ADR-029; busca no repositório |
| F9 | **A aproximação intermediada não existe**: nenhum evento de contato feito pela Aliviar; `CONTATO_INICIADO` é declaração da própria paciente | `connection/commands.ts` |
| F10 | O Incremento 1 provou, contra banco real, que o Concierge responsável lê a Connection e **não** lê a formulação do trade-off | `tests/integration/connection-contact-mode.integration.test.ts` |

**Proposta, não fato:** que silêncio não seja tratado como sucesso. É regra estabelecida na Fase 9C.1 (D-C4) e **ainda não tem mecanismo** — nada hoje distingue um Case que avançou de um que parou.

### 2. Problema

O que temos representa bem **uma decisão**. Não representa **um trabalho em andamento**.

| O que precisa ser representado | Por que não cabe hoje |
|---|---|
| múltiplas tentativas de aproximação | `connection_records` é **um por Case** (índice único); uma segunda tentativa sobrescreveria a primeira |
| tentativa falhada · nova tentativa | sem cardinalidade N, registrar a segunda **apaga a evidência da primeira** |
| profissional indisponível | não é estado do vínculo — é desfecho **de uma tentativa** |
| ausência de resposta | **não é fato**: é ausência dele, e distingui-la de indisponibilidade exige regra temporal que não existe |
| ação pendente · atribuída · executada | três momentos distintos, hoje todos invisíveis |
| quem precisa **agir** × quem precisa **saber** | o Case tem um responsável; não tem lista de quem foi avisado |
| leitura de uma notificação | não existe notificação a ler |
| responsabilidade pelo Case | **existe e funciona** — e é justamente o que não se pode confundir com o resto |

**Por que empilhar tudo em `connection_records.status` seria incorreto** — três razões, todas estruturais:

**Cardinalidade errada.** Status é um valor por linha, e há **uma linha por Case**. Tentativas são N. Um status não guarda duas.

**Naturezas diferentes no mesmo campo.** `DECISAO_REGISTRADA` é um fato **da paciente**; "despachamos uma tentativa" é um fato **nosso**; "ele não respondeu" é ausência de fato **de terceiro**. Fundi-los faz o campo responder a três perguntas e a nenhuma com precisão.

**Perda de evidência.** Transição sobrescreve; tentativa precisa de histórico. Registrar a terceira tentativa não pode apagar que houve duas antes — é exatamente o que a ADR-043 exige provar quando a paciente perguntar o que foi feito.

### 3. Alternativas consideradas

| | **A** expandir `connection_records` | **B** só `connection_events` | **C** só `approach_attempts` | **D** `approach_attempts` + `team_notifications` | **E** D + tarefa persistida | **F** reusar `patient_notifications` |
|---|---|---|---|---|---|---|
| **Fonte de verdade** | confusa: 3 naturezas num campo | dispersa: estado corrente vira consulta | clara p/ tentativa; trabalho derivado | **clara nas três** | clara, com um a mais | **inválida**: destinatário é paciente |
| **Auditabilidade** | perde histórico | ótima | boa | **boa** | boa | irrelevante |
| **Idempotência** | difícil | difícil (evento é sempre novo) | por tentativa aberta | **por tentativa e por notificação** | idem | — |
| **Segurança / RLS** | herda a do vínculo | herda | por Case | **por Case, em ambas** | mais superfície | **risco real de vazamento** |
| **Risco de vazamento** | baixo | baixo | baixo | baixo | médio | **alto** — uma policy mal escrita mostra à paciente texto interno |
| **Detecção de inércia** | impossível | cara (varrer eventos) | parcial | **possível** (tentativa aberta + notificação não lida) | possível | — |
| **Complexidade** | baixa agora, alta depois | média | baixa | **média** | **alta** | baixa |
| **Compatibilidade** | quebra a máquina de estados | aditiva | aditiva | **aditiva** | aditiva | aditiva |
| **Rollback** | difícil (enum vivo) | fácil | fácil | **fácil** (tabelas novas, sem consumidor legado) | fácil | fácil |
| **Impacto transversal** | alto — *trigger*, espelho, UI, 14 suítes | médio | baixo | **baixo** | médio | baixo |

**Escolhida: D.** **C** é insuficiente — sem notificação, a lacuna B-3 da Fase 9C.1 (nenhuma falha é detectada por mecanismo) permanece, e o trabalho continua dependendo de alguém lembrar de olhar. **E** foi rejeitada pela Fase 10A (NT-4) e nada mudou: nenhuma ação concorrente existe ainda, e uma entidade de tarefa criaria um segundo dono do Case.

### 4. Decisão — `approach_attempts` é agregado próprio

**Relação:** pertence a **Connection**, referenciando `connection_records`. **Cardinalidade 1:N** — é a razão de existir.

**Conteúdo conceitual:** a Connection · o profissional · o **modo** sob o qual nasceu · o **ator** que a criou e despachou (o Concierge responsável) · momentos de criação, despacho e resposta · o desfecho · a origem da resposta (o profissional, ou o Concierge relatando).

**Estados — apenas o verificável:**

| Estado | Adotado? | Razão |
|---|---|---|
| **`CRIADA`** | ✅ | alguém a criou; é ato |
| *pronta para envio* | ⛔ | **intenção, não fato** |
| **`DESPACHADA`** | ✅ | nós enviamos; é ato nosso, datável |
| *recebimento verificável* | ⛔ **como estado** | inverificável na maioria dos canais. Vira **atributo opcional**, preenchido só quando houver evidência |
| *aguardando resposta* | ⛔ | **derivável** de `DESPACHADA` sem resposta |
| **`RESPONDIDA`** | ✅ | com desfecho `PODE_RECEBER_CONTATO` \| `INDISPONIVEL` |
| *disponível / indisponível* | ⛔ **como estados** | são **desfecho** da resposta, não estados da tentativa |
| *sem resposta* | ⛔ | é **ausência**; exigiria regra temporal que não existe (§15) |
| **`CANCELADA`** | ✅ | alguém cancelou; é ato |
| *encerrada* | ⛔ | duplicaria `RESPONDIDA`/`CANCELADA` |

**Ciclo:** `CRIADA → DESPACHADA → RESPONDIDA | CANCELADA`; `CANCELADA` também a partir de `CRIADA`.

**Nova tentativa é linha nova.** Nunca reabertura da anterior — o histórico das tentativas é a evidência do que foi feito.

**Auditoria:** append-only, no padrão do projeto. Nenhuma transição apaga registro anterior.

**Indisponibilidade** é desfecho de tentativa. **Não altera `professional_profile_id`** e **não seleciona substituto**.

**Ausência de resposta ≠ indisponibilidade.** A primeira é silêncio de terceiro; a segunda é fato declarado com origem. Confundi-las produziria a pior falha possível: declarar alguém indisponível porque não respondeu.

### 5. Decisão — o trabalho operacional permanece **projeção**

**Nenhuma tabela de tarefa é criada.** Ratifica NT-4 da Fase 10A.

**Responsável:** sempre `cases.responsible_id/_role`. **Fonte única, e não ganha concorrente.**

**Ação pendente é derivada de fatos:** decisão registrada sem transferência · Case sob minha responsabilidade sem modo definido · **tentativa aberta sem resposta** · notificação não lida. São consultas, não registros.

**Deixa de estar pendente** quando o fato correspondente existe — não quando alguém marca como feito. **Não há caixa de "concluir".**

**Reatribuição** é a transferência auditada; o acesso acompanha automaticamente, porque `can_access_case` lê o responsável corrente (provado no Incremento 1).

**Dois donos concorrentes são impossíveis por construção:** nenhum artefato desta ADR grava responsabilidade. `approach_attempts.actor_id` diz **quem executou uma ação**, nunca **de quem é o Case**.

**Inércia detectável:** a estrutura de §4 e §6 dá os marcos temporais; **a regra que os interpreta é decisão de operação** (§15).

### 6. Decisão — `team_notifications` é mecanismo de atenção e evidência

**O que a notificação é:** um chamado de atenção sobre trabalho que já existe, e o registro de que houve chamado.

**O que a notificação não é, e nenhuma implementação pode fazê-la ser:**

- **não é fonte de verdade do fato** — o fato vive em `connection_records`, `approach_attempts` ou `cases`;
- **não cria responsabilidade** — apagar toda a tabela **não muda quem responde pelo Case**;
- **não substitui atribuição** — atribuir é transferir, com motivo e auditoria;
- **não prova execução** — lida ≠ feita;
- **não desaparece com a obrigação** — o trabalho sobrevive à notificação, e o inverso não é verdade.

**Conceitos definidos:** destinatário (o responsável atual; **na ausência de responsável individual, o papel**, numa caixa coletiva) · evento de origem (o fato que a motivou, sempre referenciado) · **deduplicação** por (fato, destinatário) — um mesmo fato não gera duas · leitura (quem e quando) · arquivamento (some da caixa, permanece no registro) · falha (o despacho falhou; **não é o mesmo que não lida**) · **vínculo com Case e Connection**, para a RLS ancorar no mesmo `can_access_case`.

**Expiração, retenção e escalonamento ficam pendentes** — os três pressupõem regra temporal (§15).

> **Assunção não é estado da notificação.** É a transferência de responsabilidade, que já existe e é auditada. Duplicá-la aqui criaria a segunda fonte que esta ADR existe para impedir.

### 7. O canal permanece pendente — e isso não enfraquece a decisão

**A distinção que sustenta esta ADR:** *notificação interna existe como conceito sem depender de e-mail, WhatsApp ou push.* Uma notificação **persistida na plataforma**, visível na caixa de quem responde, já é notificação — e já resolve a maior parte da lacuna B-3.

Cinco momentos, deliberadamente separados:

| Momento | Depende de canal? |
|---|---|
| **persistida na plataforma** | **não** — implementável agora |
| **entregue por canal** | **sim** — pendente |
| **lida** | não, se a leitura for na plataforma |
| **assumida** | não — é a transferência |
| **executada** | não — é o fato |

**O que fica pendente de operação:** canal interno · horário · SLA · escalonamento · retenção · despacho externo.
**A ausência de canal bloqueia apenas o despacho externo.** Não bloqueia o conceito, a estrutura, a caixa nem a leitura.

### 8. Fontes de verdade

| Fato | Fonte | Tipo |
|---|---|---|
| decisão da paciente | `connection_records` (+ `patient_curadoria_decisions`) | tabela |
| modo de contato | `connection_records.contact_mode` | tabela |
| responsável pelo Case | `cases.responsible_id/_role` | **tabela — única** |
| histórico de responsabilidade | `case_responsibility_changes` | tabela |
| **tentativa de aproximação** | **`approach_attempts`** | tabela **(nova)** |
| histórico da tentativa | as próprias linhas + `connection_events` | tabela |
| **trabalho pendente** | — | **PROJEÇÃO** |
| **notificação e leitura** | **`team_notifications`** | tabela **(nova)** |
| quem executou uma ação | `approach_attempts.actor_id` / ator do evento | tabela |
| primeiro atendimento | `connection_records.status` terminal | tabela |
| Relationship | `relationship_records` | tabela |

**Nenhum fato tem duas fontes concorrentes.** O único derivado está marcado como projeção e não é persistido.

### 9. Invariantes

**I-1.** Responsabilidade não depende de notificação. **I-2.** Notificação não cria responsabilidade. **I-3.** Leitura não equivale a execução. **I-4.** Tentativa não altera a escolha da paciente. **I-5.** Indisponibilidade não seleciona outro profissional. **I-6.** Múltiplas tentativas preservam histórico; nova tentativa é linha nova. **I-7.** Silêncio não é sucesso. **I-8.** Ausência de resposta não é indisponibilidade. **I-9.** `patient_notifications` **nunca** é reutilizada para a equipe. **I-10.** Concierge sem vínculo com o Case não acessa a tentativa. **I-11.** O Case tem exatamente um responsável atual. **I-12.** Nenhuma ação operacional apaga fatos anteriores.

### 10. Segurança e RLS — conceitual

**Ancoragem única:** ambas as tabelas novas autorizam por **`curadoria.can_access_case`**, o helper canônico — o mesmo do Incremento 1. **Nenhum predicado novo, nenhum acesso por papel sem vínculo.**

A paciente vê o que lhe diz respeito · o Concierge **responsável** vê as tentativas do seu Case · **outro Concierge não vê** · o Curador mantém exatamente o que `can_access_case` autoriza · o administrador audita · **o profissional não acessa sem mecanismo autorizado** (§11).

**A formulação do trade-off não integra `approach_attempts` por padrão, e a recomendação é que nunca integre.**

### 11. Relação com Temporary Access (ADR-029)

Aprovada e **não implementada**. **`approach_attempts` pode existir antes dela** — registrar que tentamos não exige dar acesso a ninguém. O acesso do profissional à plataforma **depende** dela. A aproximação pode inicialmente ocorrer **fora da plataforma**, se operação e jurídico autorizarem. **Os dados transmitidos permanecem pendentes**, e nenhuma formulação íntima entra por padrão.

### 12. Relação com Connection e Relationship

`approach_attempts` **pertence a Connection** · Relationship continua nascendo em `PRIMEIRO_ATENDIMENTO_REALIZADO`, inalterado · **uma tentativa pode terminar sem Relationship** · **primeiro contato ≠ primeiro atendimento** · indisponibilidade encerra **a tentativa**, não necessariamente a Connection · nova tentativa **não cria nova decisão** · **Troca de Profissional continua sendo a capacidade prevista na ADR-028**, e esta ADR não a antecipa.

### 12-A. Correção factual após o Incremento 2 — autoridade de escrita em `connection_events`

*Acrescentado em 2026-08-01, depois da implementação. **Corrige um fato que esta ADR não previu; não altera nenhuma decisão.***

**O que a implementação revelou:** `connection_events` tinha **uma única porta de escrita** — `connection_events_insert_own_patient`. Só a paciente inseria eventos. Esta ADR modelou os fatos da tentativa como eventos sem verificar quem poderia gravá-los.

**Por que a porta única não era acidente:** os cinco tipos existentes são **declarações da paciente sobre a própria vida**, e ninguém as faz por ela.

**A correção, do tamanho exato do problema:** uma segunda policy de inserção, restrita **por enumeração fechada** aos tipos operacionais da tentativa — `TENTATIVA_CRIADA`, `TENTATIVA_DESPACHADA`, `PROFISSIONAL_DISPONIVEL`, `PROFISSIONAL_INDISPONIVEL`, `TENTATIVA_CANCELADA` — exigindo ainda `actor_id = auth.uid()` e vínculo com o Case por `can_access_case`.

**Permanecem exclusivos da paciente, e nenhuma cláusula da nova policy os alcança:**
`DECISAO_REGISTRADA` · `CORRECAO_ESCOLHA` · `CONTATO_INICIADO` · `PRIMEIRO_ATENDIMENTO_REALIZADO` · `ENCERRADO_SEM_RELACIONAMENTO`.

> **A enumeração é fechada.** Acrescentar qualquer tipo gravável pela equipe **exige revisão explícita**, e **uma policy genérica de inserção por acesso ao Case é proibida** — ela permitiria à equipe declarar, em nome da paciente, que ela iniciou o contato ou que foi atendida.

**Invariante que isto acrescenta:** **I-13.** Os eventos autorais da paciente têm um único escritor: ela. A equipe escreve apenas os fatos que são dela — os que a Aliviar executou.

### 13. Consequências

Novo agregado `approach_attempts` · nova estrutura `team_notifications` · projeção de trabalho ampliada · novas policies ancoradas em `can_access_case` · novos eventos de tentativa · observabilidade de tentativa aberta e notificação não lida · migrations futuras aditivas · serviço de Connection ganha comandos de tentativa · **a área do Concierge ganha a tentativa dentro da seção de continuidade já criada** — sem se misturar à fila de CRM · **a área da paciente não muda neste incremento**, e nenhuma promessa nova lhe é feita · dependências de operação (§15), de privacidade (dados ao profissional) e jurídicas (consentimento para contato).

### 14. Alternativas rejeitadas

**Expandir `connection_records` indefinidamente** — cardinalidade errada e perda de evidência (§2).
**Usar `patient_notifications` para a equipe** — a estrutura é paciente-facing por construção, e o custo do erro é mostrar a uma paciente texto escrito para a equipe.
**Tratar notificação como tarefa** — some quando lida; trabalho não some quando alguém olha.
**Tratar tarefa como responsabilidade** — criaria dois donos do Case.
**Workflow genérico** — plataforma sem necessidade atual (NT-4).
**Inferir "sem resposta" por tempo** — sem SLA, seria inventar prazo, que a Fase 9C.1 proibiu.
**Fundir tentativa e Relationship** — tentativa é da Connection; Relationship nasce de outro marco.

### 15. Decisões pendentes

| # | Pendência | Autoridade | Bloqueia |
|---|---|---|---|
| P1 | canal interno de despacho | Operação | **despacho externo** |
| P2 | horário operacional | Direção + Operação | despacho externo · escalonamento |
| P3 | SLA | Operação | escalonamento · qualquer frase com "quando" |
| P4 | escalonamento | Operação | detecção completa de inércia |
| P5 | retenção de notificações | Privacidade | migration da retenção |
| P6 | destinatário individual × papel | Operação | **migration** de `team_notifications` |
| P7 | dados enviados ao profissional | Privacidade + Jurídico | **contato real** |
| P8 | consentimento para contato | Jurídico | **contato real · produção** |
| P9 | Temporary Access | Engenharia (ADR-029) | acesso do profissional |
| P10 | ausência de resposta | Operação | encerramento automático de tentativa |
| P11 | critérios de encerramento | Operação | interface de encerramento |
| P12 | pausa por segurança | **Clínica** | mecanismo de bloqueio |
| P13 | urgência | **Clínica** | qualquer orientação à paciente |

**Bloqueiam migration:** P6. **Interface:** P11. **Despacho externo:** P1–P4. **Contato real:** P7, P8, P9. **Produção/publicação:** P8 — e, independentemente, a reconciliação do ledger.

### 16. Incremento 2 — escopo

**Inclui:** criar `approach_attempts` · registrar tentativa (criar, despachar, responder, cancelar) pelo Concierge responsável · expor a tentativa na seção de continuidade **já existente** · ampliar a projeção de trabalho pendente com "tentativa aberta sem resposta" · criar `team_notifications` **como estrutura interna, sem despacho externo**, com leitura na plataforma · policies ancoradas em `can_access_case` · testes com negativos.

**Fica de fora, explicitamente:** despacho por canal externo · Temporary Access · **contato real com profissional** · dados transmitidos · SLA, prazo, escalonamento e expiração · pausa por segurança · urgência · troca de profissional · qualquer alteração na área da paciente · **qualquer promessa nova a ela**.

**Condição para começar:** **P6 decidida** (destinatário individual ou papel) — é o único item que bloqueia a migration.

- **Consequência:** a continuidade passa a ter três estruturas com papéis distintos, e a distinção precisa sobreviver a toda evolução futura: **o fato cria trabalho; o trabalho pode gerar notificação; a notificação nunca cria o fato nem a responsabilidade.** O preço é mais superfície para manter e proteger — e o ganho é que, pela primeira vez, será possível saber que alguém parou de olhar.
- **Revisitar quando:** P6 for decidida (libera o Incremento 2); ou quando existir canal interno e horário, que transformam a notificação persistida em notificação entregue e permitem escalonamento; ou se a operação real mostrar que tentativa e notificação podem viver na mesma estrutura sem perder a distinção — o que esta ADR considera improvável, e exigiria nova ADR, não silêncio.

---

## ADR-045 — Reconvergência cromática: o azul institucional volta, o verde permanece como evolução

- **Data:** 2026-08-01
- **Status:** Definitiva quanto à estrutura (camada interna, camada semântica, atmosfera por ambiente) e às regras R19/R20/R16'. Os hexadecimais permanecem sob a mesma ressalva da ADR-017: um arquivo-fonte oficial da marca prevalece sem exigir nova ADR.
- **Não é rebranding.** É correção de deriva, por decisão explícita do usuário na aprovação desta proposta.

- **Contexto:** a ADR-008 estabeleceu tokens semânticos como única fonte de cor e a ADR-017 confirmou a paleta contra a logo oficial, fixando `#123B67` como `--color-brand-primary`. Entre aquela confirmação e a auditoria de 2026-08-01, a implementação derivou: `globals.css`, `patient-dashboard.css` e `landing-editorial.css` passaram a declarar **três paletas concorrentes**, todas com um verde como cor de marca (`#556b5d`, `#1a2e26`, `#556b5d`), e **nenhuma ocorrência do azul institucional restou em `src/`**. `--color-brand-sage` chegou a ser declarado idêntico ao primary, colapsando duas cores de identidade em uma; o dourado assumiu o papel de contraponto cromático — inclusive como borda padrão de todo o produto —, contra a regra "dourado nunca protagonista" de `docs/BRAND_GUIDELINES.md`. Nenhuma decisão causou isso: foi acumulação de decisões locais razoáveis, cada ambiente declarando a própria paleta porque nenhum herdava de uma camada única. A auditoria da experiência visual já nomeava o sintoma ("três paletas concorrentes") como dívida da Onda 6 não quitada.

- **Decisão:**
  1. **O azul da ADR-017 volta ao papel de cor institucional.** A implementação reconverge ao documento canônico, não o contrário.
  2. **Os aprendizados do verde entram na paleta oficial**, em vez de serem descartados: `#556b5d` como `sage-700` (o degrau em que o verde passa AA — 5,43:1, coisa que o sálvia canônico `#7F9E8C` nunca fez), `#1a2e26` como `sage-900`, e os neutros quentes como base da rampa neutra.
  3. **Duas camadas de token.** Uma camada interna de escalas (`--scale-indigo/sage/neutro`, 50–900) como infraestrutura privada, e a camada semântica pública **inalterada em nome** (`--color-brand-primary`, `--color-ink`, …) — os ~505 usos existentes continuam válidos por construção. Nenhuma convenção de nomenclatura nova. Nenhum componente lê a camada interna, e um teste de fonte impede que passe a ler.
  4. **A cor participa da narrativa da jornada** (R20): cada ambiente redefine no máximo quatro tokens de atmosfera, declarados num bloco só em `globals.css`. Fachada em equilíbrio · Paciente azul com verde de evolução · Curadoria verde · Sala da Decisão em equilíbrio · Concierge azul com verde de continuidade · Administração neutra com azul. O mesmo componente muda de cor sem uma linha de código por cômodo.
  5. **R19** — azul e verde nunca são alternativas do mesmo campo: o azul diz o que a Aliviar comunica, o verde diz o que avançou no tempo. É o que impede a nova paleta de reintroduzir o semáforo que a R2 proíbe.
  6. **R16' e emenda ao §12** do Sistema Visual: progresso de *jornada* (sem número) é distinto da espera de *sistema* (dita em palavras, sempre); badge numérico e barra seguem banidos nas superfícies da pessoa atendida e são legítimos nos fundos operacionais. Alterações mínimas, nomeadas; **nada mais foi revogado**.
  7. **A divergência da R18 fica registrada, não oculta** (`SISTEMA_VISUAL.md` §13.2): a camada semântica nomeia por papel, não por material. O que a R18 protege — impedir um vocabulário de semáforo — é honrado pela ausência declarada de qualquer token ou escala `success`/`danger`/`error` novo.
  8. **Acessibilidade prevalece sobre estética.** Corrigidos 15 usos do sálvia de marca como cor de **texto** (2,76:1, reprovação de AA que a própria ADR-017 já proibia) e a argila ajustada de `#A9663F` para `#955530`, que reprovava AA sobre a própria superfície.

- **O que NÃO muda:** regras de negócio, APIs, Actions, Repository, estado, banco, Curadoria, fluxos, navegação e **textos**. Nenhum comportamento do sistema foi alterado. A ADR-008 e a ADR-017 permanecem integralmente válidas — esta ADR as executa, não as supera. As demais regras permanentes do Sistema Visual (R1–R15, R17, R18) seguem intactas.

- **Consequência:** a plataforma passa a ter uma origem única de cor, elevação, raio, tipografia e movimento, com a narrativa cromática legível num bloco só — e a deriva que motivou esta ADR fica impedida por teste de fonte (`tests/unit/paleta-unica.test.ts`), não por disciplina. O preço é que qualquer cômodo novo precisa declarar sua atmosfera de forma explícita e visível em revisão, em vez de escolher cores livremente. Era exatamente essa liberdade que produziu três identidades.

- **Revisitar quando:** surgir arquivo-fonte oficial da marca com hexadecimais divergentes (prevalece sem nova ADR, só atualização dos degraus âncora); ou quando houver motivo independente para tocar a camada semântica, ocasião em que a divergência da R18 pode ser resolvida; ou se a operação real mostrar que a atmosfera por ambiente confunde em vez de orientar — o que exigiria nova ADR, não silêncio.

---

## ADR-046 — Aprovação formal do Catálogo Canônico 1.0.0

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (sessão de decisões do Bloco A do `MASTER_REMEDIATION_PLAN`, decisão D-01: "Aprovo todas as recomendações").
- **Contexto:** o Catálogo Canônico 1.0.0 (28 conceitos ativos, 7 grupos, 5 eixos, 166 opções) foi implementado pelas migrations `20260802100000/110000` sob a ordem explícita do responsável na sessão de trabalho de 2026-08-02 — mas o cabeçalho de `CATALOGO_CANONICO_PROPOSTA.md` dizia "proposta não aprovada; não implementar antes de decisão registrada em ADR", e a "decisão de Método de 2026-07-31" citada 8× pelos protocolos nunca tinha registro no log. A Auditoria Geral classificou a lacuna como crítica (achado CAT-02/H-C2).
- **Decisão:** o Catálogo Canônico **1.0.0 está formalmente aprovado** como fonte de autoridade do Método, com o conteúdo exato das migrations `20260802100000/110000` e dos documentos `CATALOGO_CANONICO_PROPOSTA.md`/`CATALOGO_CANONICO_OPERACAO.md` (congelamento de 2026-07-31). Esta ADR é o registro que a ADR-039 exigia para a evolução 26/6 → 28/7+eixos, e supersede a ADR-039 nesse ponto (registrado no índice). Os cabeçalhos "não aprovada" dos documentos do Catálogo serão atualizados no Bloco K citando esta ADR.
- **Consequência:** a cadeia de autoridade citada pela ADR-042 (Método → Catálogo → Mapa → …) passa a ter o elo registrado; o dossiê de migração remota pode ser reescrito sobre uma decisão rastreável (Bloco J).
- **Revisitar quando:** qualquer mudança de conteúdo do Catálogo — que, por esta ADR, volta a exigir migration **e** ADR, sem exceções.

---

## ADR-047 — Fonte única do Catálogo: o banco é autoritativo

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-05).
- **Contexto:** a Auditoria encontrou quatro fontes da verdade para o Catálogo (tabela `method_subcriteria` + 3 arrays TypeScript), já divergentes em 36 códigos de opção e 16 pontos (D1–D16 da Fase 1); as 166 opções do banco têm zero leituras em código; `practice_evidence.subcriterion_code` não tem FK; o catálogo não tem imutabilidade nem autoria — "a norma é menos protegida que o dado que ela normatiza" (achado CAT-01).
- **Decisão:** **fica estabelecido que o banco é a única fonte do Catálogo.** O Bloco E deverá implementar: FK de `practice_evidence.subcriterion_code` para o catálogo; validação de `options[]` contra `method_subcriterion_options`; imutabilidade e autoria do catálogo por trigger; o TypeScript passará a ler do banco ou será verificado por teste de paridade que falhe em qualquer divergência (incluindo códigos de opção, ordem e eixos). As divergências D1–D16 serão resolvidas a favor do banco/doc aprovados pela ADR-046.
- **Consequência:** com a execução do Bloco E, encerra-se o estado "dois donos divergentes graváveis em silêncio"; mudanças de Catálogo passarão a ter um único lugar de escrita, protegido e auditado.
- **Revisitar quando:** o custo do teste de paridade se mostrar impraticável — a alternativa registrada (e rejeitada) foi o TS como fonte com o banco rebaixado a depósito.

---

## ADR-048 — Política de guarda: toda imutabilidade prometida ao usuário mora no banco

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-06).
- **Contexto:** as cinco imutabilidades que definem a confiança do produto (história enviada, Perfil reconhecido, Mapa reconhecido, seleção entregue, relatório emitido/entregue) existiam como comportamento de interface, não como objetos de banco — reversíveis em silêncio por qualquer credencial legítima via PostgREST (Fases 3–4; família IM do Registro). O repositório já contém o gabarito (domínio Connection/Relationship, onde "final" é final por trigger).
- **Decisão:** **fica estabelecida a regra permanente — nenhuma superfície pode prometer permanência que o banco não garanta.** O Bloco C deverá aplicar trigger/constraint aos oito furos da matriz da Fase 3 (§5, itens 2, 3, 5, 6, 8, 9, 11, 14): status da história enviada; `priority_profiles` VALIDATED; `case_priority_map` pós-reconhecimento; seleção DELIVERED (incluindo INSERT já-entregue); carimbos `emitted_at`/`delivered_at` na lista congelada; entrega exige relatório emitido; idempotência da entrega; competências protegidas contra substituição vazia. Cada trigger deverá nascer com par de testes (recusa e permissão).
- **Consequência:** com a execução do Bloco C, o congelamento deixará de ser loteria por objeto e a Política de Promessas (ADR-064) terá base material.
- **Revisitar quando:** um trigger provar-se operacionalmente incorreto — a correção é calibrar o trigger, nunca voltar a guarda para a interface.

---

## ADR-049 — Supersessão do Perfil de Prioridades (ciclo SUPERSEDED)

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-07).
- **Contexto:** o estado `SUPERSEDED` existe no enum e nada o escreve; o índice `one_active_per_case` bloqueia o caminho certo (criar novo Perfil) e não bloqueia o errado (reverter o reconhecido sem rastro) — a Invariante 28 era inexequível ou contraditória (achado IM-05/C5).
- **Decisão:** **fica estabelecido o ciclo de supersessão, a ser implementado no Bloco C**: corrigir um Perfil reconhecido significará criar novo Perfil ativo que marca o anterior como `SUPERSEDED`, numa operação atômica com autor, motivo e realimentação do reconhecimento (o novo Perfil exigirá novo reconhecimento da paciente). Reverter um Perfil reconhecido passará a ser proibido pelo banco (ADR-048, Bloco C).
- **Consequência:** após o Bloco C, a correção de erro real voltará a ser possível sem violar a imutabilidade, com o histórico completo legível.
- **Revisitar quando:** a operação real mostrar necessidade de supersessão parcial (por subcritério) — hoje explicitamente fora.

---

## ADR-050 — Retratação pós-entrega por errata versionada

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-16).
- **Contexto:** um Relatório entregue com erro factual não tinha nenhum caminho de correção: reemissão bloqueada, sem errata, sem versionamento — e a alternativa manual apagaria o histórico (achado OPS-04; agravado por IM-03).
- **Decisão:** o documento entregue **permanece imutável para sempre**. A correção passa a vigorar como **errata**: novo relatório versionado, vinculado ao anterior, com motivo registrado e autor, entregue pelo mesmo fluxo de duas etapas; a paciente verá a versão vigente com acesso à anterior e à explicação. Deverá ser implementada no Bloco C (modelo de dados), com a superfície mínima correspondente.
- **Consequência:** erro entregue passará a ter resposta legítima sem reescrever o passado; a promessa "depois disso o documento não muda mais" permanecerá verdadeira (o documento não muda — ganhará sucessor declarado).
- **Revisitar quando:** o primeiro uso real da errata mostrar atrito no texto à paciente.

---

## ADR-051 — Iniciar nova história é ato explícito da paciente

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-21).
- **Contexto:** STORY-GET-WRITE-001/STORY-NOVA-001 registravam que a criação de rascunho podia acontecer por efeito de rota (GET que grava), fechada provisoriamente pelo índice único; "começar de novo" nunca foi um ato nomeado.
- **Decisão:** criar rascunho de história é sempre consequência de **um ato explícito da paciente** ("Iniciar nova história" ou o envio do primeiro passo) — nunca de navegação. A regra de uma-história-em-rascunho por paciente (migration `20260802120000`) permanece.
- **Consequência:** resolve, no plano da decisão, as duas dívidas do backlog; o ajuste de código, se necessário, será executado nos Blocos D/K.
- **Revisitar quando:** surgir caso de uso real de múltiplos rascunhos simultâneos.

---

## ADR-052 — Papel do Profissional: fora desta remediação

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-03, com ajuste explícito: "fora desta remediação, não 'fora da v1'").
- **Contexto:** o Profissional não tem canal nenhum no produto (não sabe que foi selecionado; nenhuma tabela de notificação a ele; `profile_id` NULL em 100% dos perfis). A Fase 8 corrigiu a premissa: não há promessa explícita descumprida — há ausência declarada de canal (`OPERATIONAL_ROLES_MODEL.md:242-243`); o contato real é intermediado pelo Concierge humano.
- **Decisão:** o desenho do papel do Profissional (vínculo de contas, notificações, canal) **fica fora do escopo desta remediação** — sem juízo sobre a v1 do produto, que decidirá em ciclo próprio com o rito de ideia nova. O achado PAP-02 fica **aceito por escrito** como P1 postergado, com gatilho de revisão: antes do primeiro profissional real operar o próprio portal.
- **Consequência:** a release de remediação não criará superfícies novas para o papel; o vazio do portal deverá ganhar apenas texto honesto (Bloco K).
- **Revisitar quando:** o gatilho acima disparar, ou a decisão de produto da v1 for aberta.

---

## ADR-053 — Destino das superfícies órfãs (decisão item a item)

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-04, com ajuste explícito sobre `MandatoryFilters`).
- **Contexto:** a Fase 2 inventariou 14 Server Actions órfãs e componentes nunca renderizados — capacidade pronta no banco sem superfície, decidida até aqui por omissão (causa raiz CR-7).
- **Decisão, item a item:**
  1. **Aproximação intermediada (C6): publicar superfície** no Bloco F — é promessa feita à paciente na tela de escolha; o banco (RPCs, carimbos, CHECKs) está pronto.
  2. **Notificações internas (`read`/`archive`): publicar** no Bloco F — a worklist do Concierge depende delas.
  3. **Pedidos de atualização (`resolveUpdateRequest`): publicar superfície simples** no Bloco F — pedidos hoje nunca fecham.
  4. **Painel de divergências do Admin: publicar mínimo** no Bloco F — a porta de publicação aponta para ele.
  5. **Concessão de papéis (`atendente`/`concierge`) na Equipe + permissões COA/CRM do Atendente: publicar** no Bloco F — destrava a segunda pessoa da operação (OPS-01).
  6. **Avaliação técnica 6×4 (`declareCriterionAction`): a pendência perpétua e a leitura vazia da paciente deverão ser removidas nesta release (Bloco F)** — a avaliação por critério não é exigida pelo fluxo certificado; fica registrada como candidata a ciclo futuro. O domínio e os testes permanecem.
  7. **`MandatoryFilters`: NÃO remover.** Permanece no código, não renderizado, marcado **"aguardando decisão arquitetural"** — a relação entre filtros obrigatórios e a Porta de área pós-ADR-042 precisa de desenho próprio antes de publicar ou apagar. A pendência deverá sair das telas (Bloco F); a decisão entra no registro de dívidas com dono.
  8. **6 seções da Landing v2 (ADR-033): fora desta release** — decisão de Landing, com prazo a definir no ciclo de produto.
  9. **Deprecadas (`saveCruzamentoWeightsAction`, `setProfessionalPublicationStatusAction` duplicada): deverão ser removidas** no Bloco K.
- **Consequência:** cada órfã tem destino registrado; nenhuma decisão por omissão sobrevive.
- **Revisitar quando:** item 7 — na decisão arquitetural dedicada; item 8 — no ciclo da Landing.

---

## ADR-054 — Política de documentos clínicos

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-08).
- **Contexto:** upload sem validação em nenhuma camada (buckets NULL/NULL; actions checando só `size===0`; teto acidental de 1MB do framework); "excluir" não elimina (cascata nunca alcança o storage; `remove()` sem verificação; lixeira sem confirmação); a paciente pode deletar documento anexado a Case em curadoria ativa (F2-RLS) — achados PRIV-04 e FUN-02, ambos P0/P1.
- **Decisão:**
  1. **Aceite de upload:** MIME allowlist (PDF, JPG, PNG, WEBP) e teto de **20 MB**, que deverão ser aplicados nas três camadas (bucket, action com mensagem própria, config do framework).
  2. **Leitura pela equipe:** fica estabelecido o download/visualização de documento pela equipe do Case (com registro de download — ADR-055).
  3. **Exclusão responsável:** deverá exigir confirmação explícita + tombstone/trilha de auditoria + remoção do objeto no storage **verificada** (falha na remoção será erro, não silêncio); o descarte de Case passará a tratar os objetos do bucket.
  4. **Documento anexado a Case ativo deixará de ser deletável pela paciente** (fechamento do F2 no Bloco H); a exclusão nesse estado será ato da equipe, auditado.
- **Consequência:** o laudo passará a ter o mesmo regime de cuidado que o texto da história; pedidos de eliminação tornar-se-ão atendíveis de fato. A implementação será executada no Bloco H.
- **Revisitar quando:** o primeiro tipo de arquivo legítimo fora da allowlist aparecer na operação real.
- **Registro de implementação (D-12.3, 2026-08-11) — não altera esta decisão.** O item 1 está cumprido nas **três camadas** para `patient-documents`: action (`document-file-policy`, com conferência da assinatura real dos bytes), bucket (`file_size_limit` 20 MB + `allowed_mime_types`) e framework (`next.config.ts`). No framework foram **dois** limites, não um: `serverActions.bodySizeLimit` (default 1 MB) e `middlewareClientMaxBodySize` (default 10 MB, aplicável porque o projeto tem middleware) — com só o primeiro corrigido, um arquivo de 19,5 MB ainda chegava truncado e a action estourava com "Unexpected end of form". **HEIC/HEIF chegou a ser implementado por engenharia e foi removido**: não consta desta ADR, e ampliá-la é ato de revisitá-la, conforme a linha acima. **Pendências que esta ADR não cobre e que seguem abertas:** os itens 2, 3 e 4; e o achado FUN-02 sobre a action de documentos do **profissional**, cujo bucket permanece sem limite e sem allowlist — esta ADR trata de documentos *clínicos* e não o nomeia.

---

## ADR-055 — Responsável por LGPD e retenção mínima da v1

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-09).
- **Contexto:** a ADR-038 deixou retenção/anonimização explicitamente para "ADR própria com quem responde por LGPD na Aliviar" — que nunca existiu; nenhuma entidade tem prazo; não há log de leitura de dado clínico (achados PRIV-03, AU-03).
- **Decisão:**
  1. **O Fundador é nomeado responsável por LGPD, interino**, até designação formal de outra pessoa.
  2. **Retenção v1:** dados pessoais e clínicos retidos enquanto a relação de cuidado estiver ativa; eliminação sob pedido do titular por procedimento operacional (que inclui storage — ADR-054); logs de auditoria retidos indefinidamente (são a prova dos atos).
  3. **Log de leitura, escopo mínimo v1:** registrar **download de documento clínico** (quem, qual, quando). Log de leitura ampla (histórias, telas) fica **postergado com risco aceito** e gatilho: primeiro incidente de acesso questionado, ou entrada de um segundo operador com acesso amplo.
- **Consequência:** a lacuna declarada pela ADR-038 fica fechada no nível de decisão; a implementação será executada nos Blocos H e I.
- **Revisitar quando:** houver parecer jurídico formal, ou o gatilho do item 3 disparar.

---

## ADR-056 — Suboperadores: Anthropic documentada, analytics fora das rotas autenticadas

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-10).
- **Contexto:** o texto clínico da paciente sai para a API da Anthropic (rascunho assistido/ACE) sem que nenhum documento a trate como suboperadora; `@vercel/analytics` roda em todas as rotas — inclusive `/paciente/*` — sem consentimento, e a URL visitada é indício de condição de saúde (achado PRIV-02).
- **Decisão:** (1) **Anthropic permanece** como suboperadora e **deverá ser documentada** na política de privacidade (Bloco H), com a mitigação existente mantida (prompt nunca logado); (2) **o analytics deverá ser removido das rotas autenticadas (Bloco H)** — permanecerá apenas na landing pública, preservando a métrica de aquisição sem tocar dado de quem já é paciente.
- **Consequência:** os três processadores reais (Supabase, Vercel, Anthropic) ficarão declarados com a publicação da política (Bloco H); o rastreamento de navegação clínica deixará de existir.
- **Revisitar quando:** a política de privacidade for publicada (o texto final pode exigir ajustes), ou o assistido for descontinuado.

---

## ADR-057 — Dados de teste em produção

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-20).
- **Contexto:** o playbook RC1 registra 3 contas de paciente em produção, ao menos 2 de teste, com decisão pendente — e o critério NO GO ("algum DEMO publicado") não as detecta; localmente, 158 perfis sintéticos de E2E não participam do esquema de marcação (achados DAD-01/DAD-02).
- **Decisão:** (1) as contas de teste em produção serão **removidas na janela do Bloco J**, antes da abertura, pelo procedimento auditado; (2) "nenhuma conta/perfil de teste sem marcação" entrará como **item do NO GO** do smoke canônico; (3) a categoria de marcação para resíduo de execução automatizada local será definida e aplicada no Bloco G2.
- **Consequência:** produção abrirá sem dado sintético não declarado; o critério de gate passará a detectar o que existir.
- **Revisitar quando:** o G2 definir a mecânica de marcação (a decisão de remover não muda).

---

## ADR-058 — Operar sem staging na v1: aceite formal com mitigações

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-12).
- **Contexto:** não existe staging — produção é o primeiro ambiente remoto real; toda validação remota é validação com pacientes (achado OPS-03). Criar staging agora adicionaria custo e um segundo ambiente a governar no meio da remediação.
- **Decisão:** a v1 **opera sem staging, por aceite formal e registrado**, com as mitigações obrigatórias: smoke canônico com separação estrita entre itens seguros (leitura) e itens que criam dado (com limpeza escrita); alertas mínimos do Bloco I ativos antes da abertura; janela do Bloco J com a ordem segura e rollback escrito. **Revisão obrigatória após o primeiro mês de operação real** — com dados do Observatório, não especulação.
- **Consequência:** o risco deixa de existir por omissão e passa a existir por decisão datada com prazo de revisão.
- **Revisitar quando:** a revisão de 1 mês, ou o primeiro incidente cuja causa raiz seja a ausência de staging — o que vier primeiro.

---

## ADR-059 — Backup mínimo e alvos de recuperação

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-13).
- **Contexto:** a documentação se contradiz sobre a existência de backup; o único ponto de recuperação nomeado é um dump parcial em pasta local; auth e storage (os laudos) estão fora de tudo; RTO/RPO inexistem; nenhuma restauração foi testada (achado REC-01, P0).
- **Decisão:** (1) deverá ser confirmado no painel backup gerenciado — **plano com backup diário (ou PITR)** — ou, se recusado por custo, instituída **rotina de dump verificado** cobrindo `curadoria` + `auth` + storage, com checksum e cópia fora da máquina de desenvolvimento; (2) ficam estabelecidos os alvos da v1: **RPO ≤ 24h, RTO ≤ 4h**; (3) **uma restauração completa deverá ser testada** (em projeto descartável) antes da janela do Bloco J, com tempos medidos e registrados.
- **Consequência:** os critérios 3–4 do checklist Go/No-Go operacional tornam-se satisfazíveis; a execução será feita no Bloco I.
- **Revisitar quando:** o volume real do primeiro trimestre indicar alvos diferentes.

---

## ADR-060 — Segregação de funções

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-14).
- **Contexto:** uma única conta acumula Administrador e Curador Médico — a segregação que o próprio Método exige ("quem avalia não atesta") é inexequível; todas as credenciais têm um único detentor (achado OPS-01).
- **Decisão:** (1) **segunda conta** (Curador, separada da conta Admin) deverá ser criada na janela de rotação de credenciais, com papéis concedidos pela superfície da Equipe (que o Bloco F deverá destravar); (2) passa a vigorar a regra: mutações manuais em produção só em **janela registrada** (dossiê ou incidente); (3) **segundo detentor de credenciais** deverá ser designado quando houver pessoa de confiança — até lá, o risco permanece aceito e datado.
- **Consequência:** o bus factor cairá de 1 para o mínimo estrutural possível hoje; a exigência do Método voltará a ser exequível.
- **Revisitar quando:** entrar a segunda pessoa da operação.

---

## ADR-061 — Incident Commander interino

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-15).
- **Contexto:** o Command Center define o papel de Incident Commander com escala P0–P3 e nunca o nomeou; o único incidente real da história não recebeu classificação; não há procedimento de ausência (achado OBS-03).
- **Decisão:** **o Fundador é o Incident Commander interino**, formalmente e desde já. O Bloco I deverá escrever o procedimento mínimo: classificação obrigatória P0–P3 de todo incidente, registro em `docs/INCIDENT_*.md` no padrão existente, procedimento de credencial comprometida, e o protocolo de ausência ("se eu não responder em X horas, Y").
- **Consequência:** o papel deixa de ser organograma sem ocupante desde já; o critério 7 do checklist operacional poderá ser satisfeito após o Bloco I.
- **Revisitar quando:** houver segunda pessoa apta a assumir plantão.

---

## ADR-062 — Governança de supersessão de ADRs: índice no topo do log

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-18).
- **Contexto:** a supersessão era unidirecional e invisível — zero das ADRs supersedidas carregava marca; quem lia a ADR-017, 021 ou 026 de cima a baixo obtinha uma imagem falsa do vigente (achado DOC-02). O vazio era normativo: nenhuma regra existia.
- **Decisão:** o log permanece **append-only puro** (nenhum verbete é reescrito). A visibilidade vem do **Índice de supersessões e emendas no topo do arquivo**, atualizado no mesmo commit de toda ADR que supersede ou emende outra. O índice inaugural cobre as supersessões e correções de estado conhecidas até esta data.
- **Consequência:** ler o log de cima a baixo volta a produzir a imagem correta; o custo é uma linha de índice por supersessão.
- **Revisitar quando:** o índice crescer a ponto de justificar geração automática.

---

## ADR-063 — Regularizações pós-fato do histórico de decisões

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, regularizações de DOC-04/PAP-03/IM-07).
- **Contexto:** a Fase 8 encontrou decisões materiais executadas sem ADR e verbetes com afirmações superadas. Este verbete regulariza o passado **sem reescrevê-lo** — cada item abaixo registra a decisão que faltou, com a data real do ato.
- **Decisão (registros pós-fato):**
  1. **Papéis `concierge` (2026-07-24) e `atendente` (2026-07-24)** existem por decisão do Fundador registrada nas migrations `20260724054819` e `20260724191858`; ficam formalizados como parte do catálogo de papéis da ADR-006.
  2. **Ampliação do acesso do Curador (migration `20260725230458`)** — fila de Cases sem dono + nome de qualquer paciente com Case — fica **regularizada como vigente**, com a justificativa da própria migration; a restrição literal da ADR-019 está superada nesse ponto (índice atualizado).
  3. **Renomeação dos critérios (2026-07-27, migration `20260727100000`)** — `TRAJETORIA→HISTORICO`, `FORMA_DE_CUIDADO→CONTINUIDADE_DO_CUIDADO`, `COMPATIBILIDADE_PESSOAL→MODELO_DE_ATENDIMENTO` — registrada pós-fato como decisão de Método executada com UPDATE de dados.
  4. **Reabertura do produto pós-ADR-021**: o congelamento da V1.0 foi progressivamente reaberto por descongelamentos escopados a partir de 2026-07-23; fica registrado pós-fato que a ADR-021 vale como marco histórico, não como estado vigente — encerrando a pendência que a própria ADR-029 apontava.
  5. **Notas de status**: ADR-003 (existe produção hospedada — superada pela realidade desde o go-live), ADR-005 (react-hook-form nunca adotado; Server Actions + Zod é o padrão vigente), ADR-009 (três shells/três endereços coexistem — dívida registrada NAV-03, decisão de renomeação no Bloco K), ADR-011 (o vocabulário `clinical_context` existe na camada de Curadoria com a delimitação do comentário da tabela — aceito).
  6. **Correções de estado** (via índice, verbetes intactos): ADR-029 está **aprovada** (pela ADR-044) e o registro de reabertura que ela exigia é o item 4 acima; ADR-041 ("nenhum consumidor ligado"), ADR-043 ("incrementos futuros") e ADR-044 ("nada implementado") descrevem estados **anteriores à Release de Reconstrução** — o motor tem consumidor certificado e o Incremento 2 está implementado. **Emenda à Ontologia §6 (ONT-30):** a correção da escolha da paciente enquanto `DECISAO_REGISTRADA` é desenho vigente e deliberado; a imutabilidade começa na transição seguinte.
- **Consequência:** o log volta a cobrir o conjunto real de decisões; nenhuma divergência de governança da Fase 8 permanece sem registro ou sem dono.
- **Revisitar quando:** item 5/ADR-009 — na decisão de rotas do Bloco K.

---

## ADR-064 — Política de Promessas ao Usuário

- **Data:** 2026-08-02
- **Status:** Aprovada pelo responsável (Bloco A, decisão D-22 — criada por ajuste explícito do responsável na sessão).
- **Contexto:** a Auditoria encontrou, em série, textos afirmando o que o sistema não garante: "registrado e permanente" sobre checkbox reeditável; "cada movimento fica registrado com autor" sobre estado volátil; "a seleção é sempre de uma pessoa, com nome" com `curatorName: null` hardcoded; pendência apontando para painel inexistente; confirmação de salvamento sobre escrita recusada (achados UX-03, FS-02, AU-02). O padrão é estrutural: a promessa nasce no texto e a garantia nunca nasce no sistema.
- **Decisão:** **regra permanente de produto** — nenhuma superfície afirma permanência, autoria, registro ou entrega que o sistema não garanta materialmente naquele momento:
  1. Promessa de **imutabilidade** exige guarda de banco (par com ADR-048).
  2. Promessa de **autoria/registro** exige coluna preenchida e legível (par com a auditoria mínima do Bloco C).
  3. Promessa de **capacidade** ("resolver no painel X") exige a superfície existir.
  4. Confirmações de **sucesso** exigem persistência confirmada — nunca otimismo de cliente.
  5. Todo bloco de correção que criar ou remover uma garantia **deverá revisar os textos correspondentes no mesmo commit**; a varredura inicial completa será executada no Bloco K.
  6. A guarda de regressão deverá ser textual e testável onde possível (ampliação dos meta-testes de vocabulário aos textos de promessa).
- **Consequência:** o contrato entre texto e sistema passa a vigorar como regra desde já; sua verificação mecânica será instituída nos Blocos C/K, dando à classe "promessa sem lastro" critério objetivo de aceitação.
- **Revisitar quando:** nunca — é princípio permanente; ajustes são de mecanismo, não de regra.

---

## ADR-065 — Compatibilidade Relacional: a quarta leitura da Curadoria

- **Data:** 2026-08-03
- **Status:** Aprovada pelo fundador (missão "Fechar o domínio da Compatibilidade Relacional", 2026-08-03).
- **Contexto:** a auditoria de implementação e a revisão de arquitetura de 2026-08-03 constataram que a dimensão relacional da Curadoria existia espalhada e subordinada: os conceitos do eixo `MODELO_DE_ATENDIMENTO` cruzavam como parte da leitura assistencial, sem leitura, superfície ou voz próprias; o lado da pessoa de dois deles operava com listas provisórias fora da fonte única; os conceitos de cruzamento humano não tinham superfície de juízo. O diferencial do produto — "por que este profissional é a melhor combinação para esta pessoa" — não tinha mecanismo dedicado.
- **Decisão:** fica instituída a **Compatibilidade Relacional** como **quarta leitura da Curadoria** (ao lado de Elegibilidade, Avaliação Técnica e Compatibilidade Assistencial), conforme o documento normativo **`docs/curadoria/DOMINIO_COMPATIBILIDADE_RELACIONAL.md`** (anexo canônico desta ADR, aprovado e congelado). Pontos estruturais:
  1. **Nome:** "Compatibilidade Relacional". O termo "Compatibilidade Pessoal" permanece proibido (ADR-063 §3).
  2. **Escopo:** o eixo `MODELO_DE_ATENDIMENTO`, com **exatamente seis conceitos** — os cinco vigentes mantidos integralmente e a única adição `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` (cruzamento humano). Descartados: `MODELO_RITMO_DA_CONSULTA` e `MODELO_CANAL_ENTRE_CONSULTAS` (redundantes com `MODELO_COMUNICACAO` e `CONTINUIDADE_CANAIS`); `MODELO_CONTINUIDADE_DO_VINCULO` (descartado nesta versão, com porta de reavaliação por uso observado).
  3. **Física da leitura:** grau da pessoa (`ESSENCIAL`/`PESA_MUITO`/`DESEJAVEL`/`SEM_PREFERENCIA`) × estado derivado do profissional (`CONFIRMADO`/`NAO_CONFIRMADO`/`NAO_INFORMADO`, derivado da Base de Evidências por correspondência opção-a-opção) → matriz 4×3 escrita célula a célula, herdando os três princípios da ADR-041; os mesmos quatro resultados; resumo que conta ocorrências e nada mais. Conceitos humanos (`MODELO_DECISAO_COMPARTILHADA`, `MODELO_PREFERENCIAS_E_RESTRICOES`, `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`) nunca produzem célula: emitem `AGUARDA_JUIZO_DO_CURADOR`.
  4. **Correspondência na fonte única:** coluna `satisfied_by` nas opções do lado da pessoa (catálogo, migration 1.1.0), com guarda de integridade e cobertura no teste de paridade. A migração 1.1.0 também materializa o lado da pessoa de `MODELO_COMUNICACAO` e `MODELO_ALTERNATIVAS` (fim das listas provisórias relacionais; as assistenciais P3–P7 permanecem escopo do Bloco F, que segue bloqueado).
  5. **A leitura informa** — não pontua, não ranqueia, não elimina, não se soma às demais leituras, não promove profissional; resultado nunca persistido; grau jamais vira importância; nenhuma chave de ordenação (decisão adiada, exigirá ADR própria baseada em uso observado na Mesa).
  6. **Reconhecimento:** mesmo ato da ADR-042, escopo ampliado ao bloco relacional; Perfis já reconhecidos permanecem válidos — o bloco relacional entra por novos Perfis e supersessões (ADR-049).
  7. **Verbalização:** toda frase declara os identificadores canônicos de origem (padrão de rastreabilidade do Relatório); frases de conceitos humanos exigem validação do Curador; formas e proibições fechadas no documento normativo.
  8. **Emenda ao Modelo:** `MODELO_CURADORIA_V1.md` passa a **v2.0** no mesmo commit — §7 passa a três cruzamentos e o §11 é regularizado (dívida de versão das ADR-039/042 quitada).
- **Consequência:** o domínio relacional fica **congelado**: nenhum conceito, opção ou dimensão nova sem nova ADR que referencie o documento normativo e demonstre por que ele não responde. Exclusões conscientes registradas: traços, demografia e reputação (vetos constitucionais permanentes); idioma/acessibilidade e vínculo de longo prazo (evoluções possíveis por ADR futura). A implementação segue a ordem aprovada: migration 1.1.0 → motor relacional → Mesa → Relatório → Dashboard; sem push, deploy ou migration remota sem autorização expressa.
- **Revisitar quando:** primeira operação real da Mesa com a leitura relacional (candidatos: chave de ordenação; vínculo de longo prazo; idioma/acessibilidade).

---

## ADR-066 — Propostas de Derivação e a Ponte entre Declaração e Método (ADR-A da Curadoria 2.0)

- **Data:** 2026-08-04
- **Status:** **Aprovada constitucionalmente com ressalvas** pelo Agente 00 — Guardião, sobre decisões do Fundador de 2026-08-04 (reabertura condicionada de I-10; estrutura da régua de consequência aprovada, com valores pendentes de Rede Real; Autoridade de Método instituída; P-07, P-08 e P-10 promovidos a princípios oficiais de domínio). Lavrada pelo pacote A-01.
- **Conteúdo normativo:** **`docs/curadoria/ADR_A_PROPOSTAS_DE_DERIVACAO.md`** (v1.0) — anexo canônico desta ADR, na íntegra. Este verbete registra; o anexo normatiza.
- **Dependências:** ADR-035 · ADR-039 · ADR-040 · ADR-041 · ADR-048 · `docs/curadoria/MODELO_CURADORIA_V1.md` · `docs/curadoria/CONGELAMENTO_ARQUITETURAL.md` · `docs/curadoria/ARQUITETURA_CURADORIA_2_0.md`
- **Contexto:** a auditoria operacional de 2026-08-04 constatou que as duas entradas do Motor de Compatibilidade são transcrições manuais de dados estruturados que já existem (achados D1 e D2): `case_needs` não alcança o Motor — quem alcança é `case_priority_map`, digitado pelo Curador; e `practice_evidence`, com proveniência completa e regime append-only, não alimenta `professional_subcriterion_map`, digitado por um administrador. As duas tabelas com proveniência não decidem; as duas que decidem não têm proveniência.
- **Decisão:** fica instituída a **Camada de Derivação**, com as seguintes definições de domínio:
  1. **Proposta de derivação é um oferecimento**, não um valor: o registro imutável de que o Método, aplicando regra versionada a declaração identificada, sugeriu um valor a quem tem autoridade para declará-lo. **Autoridade probatória, nunca decisória.**
  2. **A proposta é imutável e o desfecho é fato separado que a referencia** — não há UPDATE em nenhum ponto do ciclo; o append-only passa a ser propriedade da modelagem, não disciplina.
  3. **Cinco estados, lista fechada:** `PROPOSTA` · `CONFIRMADA` · `RECUSADA` · `SUPERADA` · `RETIRADA`. `PENDENTE` é recusado como estado — é ausência de desfecho.
  4. **Somente o Pipeline de Derivação cria**; ninguém altera; confirma e recusa quem tem autoridade sobre o campo alvo (ADR-068).
  5. **Doze itens obrigatórios de proveniência.** Autor-da-proposta não existe; a justificativa vive na regra, referenciada, nunca copiada.
  6. **Cinco causas de supersessão**, e a supersessão **atravessa** para a confirmação: nenhuma confirmação permanece vigente apontando para origem retratada.
  7. **A ponte entre declaração e Método** é correspondência total, declarada, versionada e revogável, com sete condições de existência e quatro exclusões nomeadas — **filtros eliminatórios nunca têm ponte**.
  8. **Reabertura substancial de I-10 declarada** (§18 do anexo): a ponte preserva a distinção formal entre as escalas e reabre a invariante em substância. **Forma e governança decididas agora; valores estáveis só após Cases reais.** Toda versão anterior à evidência operacional nasce `PROVISÓRIA`. O teste `importancia-vs-grau.test.ts` não pode ser afrouxado, renomeado ou ter asserção relaxada; sua finalidade só muda por esta ADR.
  9. **Desligar a ponte é reversível sem perda de dado** — as confirmações feitas permanecem declarações humanas válidas.
- **Consequência:** o domínio de `derivation_proposals` fica fechado; o Implementador pode construí-lo sem tomar decisão de domínio. O `CONGELAMENTO_ARQUITETURAL.md` §5 passa a registrar a reabertura de I-10 e a promoção de P-07/P-08/P-10. **Esta ADR não autoriza implementação:** o pacote F-02 permanece bloqueado por sequenciamento (Onda 1 não iniciada), pela nomeação da Autoridade de Método e pela guarda C-01, que deve continuar ativa.
- **Ressalva de lavratura:** a lista de ressalvas do Guardião **não existe como arquivo** (PA-05/PA-06 do `docs/curadoria/REGISTRO_DOS_PARECERES.md`; pendência DP-11). Este verbete registra a aprovação tal como comunicada e **não reproduz ressalvas que não pôde ler**. Quando o parecer for versionado, este verbete recebe emenda pelo índice do topo.
- **Revisitar quando:** os primeiros Cases reais permitirem calibrar os valores da ponte; ou se o Guardião recusar a reabertura de I-10 — caso em que a ponte não nasce e o restante da 2.0 permanece de pé.
- **Emenda de 2026-08-05 (DT-01) — três achados da verificação do Item 2.2C (`b38cd34`).** Lavrada **por acréscimo** (ADR-062); o texto histórico acima **não foi sobrescrito**. Conteúdo normativo integral no **§23 do anexo**.
  - **F-1 · participação do motor.** Um conceito `MOTOR_PARTICIPATION = NUNCA` conseguia receber correspondência e emitir proposta, porque a classificação vivia em `Record` TypeScript e o banco não a conhecia. Fica aprovada a **aplicação da ADR-047**: a participação é **atributo do conceito**, o **banco é sua fonte autoritativa**, o TypeScript passa a ser **gerado** do Catálogo, conceitos `NUNCA` **não recebem correspondência nem emitem**, a proteção **opera no banco para todo papel** (precedente MR1.1: trigger, não policy), as guardas ficam como **regressão** e o `Record` manual **é eliminado**. **Nenhuma lista duplicada em SQL.** Registro de precisão: a coluna `cruzamento` já existente **não serve** — ela colapsa `NUNCA` e `INDIRETO`, e os 12 conceitos de Prática e Trajetória devem continuar participando.
  - **F-2 · unicidade por conceito** — **oitava condição acrescentada ao §16 do anexo**: *"em qualquer instante, para cada conceito, existe no máximo uma versão de Regra de Derivação vigente que o cobre"*. Vale por **conceito e período de vigência**; independe de `rule_id` e de versão; **não admite desempate alfabético nem prioridade implícita**; é **declarativa** e resistente à concorrência; atua em **duas portas** — promoção/reativação e inclusão de correspondência em regra já vigente. **Uma regra pode cobrir vários conceitos**; a **reativação pode ser legitimamente recusada** quando outra regra já assumiu o conceito; `order by rule_id` **deixa de arbitrar**. **Complementa MR1.2 sem substituí-lo** (um é por regra, outro por conceito) e **não altera o grafo da ADR-069**.
  - **F-3 · `SEM_CORRESPONDENCIA`** — **reserva contratual não operacional** enquanto vigorar a cobertura total dos quatro graus por regra, versão e conceito (§10.3 item 1). **Não é desfecho alcançável**, **não deve ser apresentado como capacidade operacional existente**, e só volta a ser relevante se a totalidade for alterada por decisão arquitetural futura. **Não remover; não alterar o DR3 apenas para torná-lo artificialmente alcançável.**
  - **Destino:** as três correções são implementadas pelo pacote **2.2C-R1**, registrado em [`MAPA_DOS_PACOTES.md`](curadoria/MAPA_DOS_PACOTES.md) §3.3. **O Item 2.2C fica encerrado com uso operacional bloqueado até a verificação do 2.2C-R1.**

---

## ADR-067 — Juízo Humano e o registro dos julgamentos do Curador (ADR-B da Curadoria 2.0)

- **Data:** 2026-08-04
- **Status:** **Aprovada constitucionalmente com ressalvas** pelo Agente 00 — Guardião. Lavrada pelo pacote A-01.
- **Conteúdo normativo:** **`docs/curadoria/ADR_B_JUIZO_HUMANO.md`** (v1.0) — anexo canônico desta ADR, na íntegra.
- **Dependências:** ADR-035 · ADR-040 · ADR-041 · ADR-064 · ADR-065 · ADR-066 · `docs/curadoria/MODELO_CURADORIA_V1.md`
- **Contexto:** a etapa AVALIAÇÃO da Mesa reproduzia à mão, em 6 critérios × 4 estados, o que o Motor já lê em 28 conceitos — metade dela era duplicação declarada (achados D3/R2). Ao mesmo tempo, o juízo relacional instituído pela ADR-065 não tinha lugar de registro, e o juízo técnico convivia em `criterion_declarations` com o que sai da cadeia.
- **Decisão:**
  1. **Juízo Humano é o ato indivisível** pelo qual pessoa nomeada, com autoridade prevista, atribui sentido a fatos que o Método reuniu mas não pode compor, produzindo conclusão não dedutível dos fatos e respondendo por ela. **Critério de irredutibilidade:** há juízo onde duas pessoas competentes podem divergir legitimamente.
  2. **`curator_judgments` registra exatamente duas naturezas — `TECNICO` e `RELACIONAL` — sobre exatamente seis conceitos:** `FORMACAO`, `EXPERIENCIA`, `HISTORICO`; `MODELO_DECISAO_COMPARTILHADA`, `MODELO_PREFERENCIAS_E_RESTRICOES`, `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS`. Lista fechada.
  3. **Quatro exclusões fundamentadas:** **área** (é filtro eliminatório, com quatro estados próprios); **verificação de evidência** e **resolução de divergência** (são governança da informação — I-5 separa governança de compatibilidade); **seleção e autoria** (são decisão e autoria, não juízo).
  4. **Divisão da etapa AVALIAÇÃO:** os três critérios do lado da pessoa (`ACESSO`, `CONTINUIDADE_DO_CUIDADO`, `MODELO_DE_ATENDIMENTO`) **deixam de ser humanos** e passam à leitura do Motor; os três técnicos permanecem juízo do Curador; os três conceitos relacionais `humano` permanecem juízo (ADR-065).
  5. **Nunca existe proposta de julgamento** — o Método não pré-escreve o juízo do Curador, nem como rascunho.
  6. **Julgamento tem versões**, em regime append-only; retificar é gravar versão nova. **Três estados, lista fechada:** `VIGENTE` · `SUPERADO` · `RETIRADO`. **No máximo um `VIGENTE`** por (Case, profissional, conceito).
  7. **Quatro causas de supersessão**, entre elas **evidência nova supersede o juízo** ainda que a conclusão provavelmente não mudasse — nenhuma conclusão vigente pode apoiar-se em fato que ninguém releu.
  8. **`criterion_declarations` é preservada**: os juízos técnicos são **copiados** para `curator_judgments` preservando integralmente a origem — nunca migrados —, e os três critérios do lado da pessoa apenas param de receber escrita nova.
  9. **A Aliviar não aprende com juízos** nesta versão: sem modelo, sem memória, sem sugestão por histórico. Mudar isso é decisão constitucional.
- **Consequência:** o domínio de `curator_judgments` fica fechado. **Emenda ao Modelo:** `MODELO_CURADORIA_V1.md` passa a **v3.0** no mesmo ato — §7.1, §7.2, §7.3 e §7.4 reescritos sem pontuação e sem percentual, e §11 regularizado; é a quitação da dívida P17 da auditoria.
- **Ressalva de lavratura:** idem ADR-066 — a lista de ressalvas do Guardião não existe como arquivo (DP-11).
- **Revisitar quando:** a operação real mostrar que o volume de juízo relacional inviabiliza a Mesa — caso em que a resposta é reduzir o escopo de conceitos `humano` por ADR, nunca automatizá-los.

---

## ADR-068 — Autoridade de Confirmação e Declaração (ADR-D da Curadoria 2.0)

- **Data:** 2026-08-04
- **Status:** **Aprovada constitucionalmente com ressalvas** pelo Agente 00 — Guardião. Lavrada pelo pacote A-01.
- **Conteúdo normativo:** **`docs/curadoria/ADR_D_AUTORIDADE_DE_CONFIRMACAO.md`** (v1.0) — anexo canônico desta ADR, na íntegra.
- **Dependências:** ADR-035 · **ADR-040 item 6** · ADR-042 · ADR-049 · **ADR-060** · ADR-066 · ADR-067
- **Contexto:** as ADR-066 e ADR-067 definiram o oferecimento e o juízo, mas não quem transforma uma proposta em declaração válida. Sem essa definição, `derivation_proposals` não podia ser materializada sem que o Implementador escolhesse domínio (impedimento I-3 do pacote F-02).
- **Decisão:**
  1. **Confirmar é adotar:** quem confirma passa a responder pela formulação **como se a tivesse formulado**. A autoria da declaração resultante é integralmente de quem confirmou; a regra não divide responsabilidade com ninguém.
  2. **Só confirma quem poderia ter declarado.** A proposta não cria autoridade; oferece a quem já a tem.
  3. **Cinco verbos distinguidos formalmente** — declarar, confirmar, reconhecer, validar, revisar. **Reconhecer produz habilitação, nunca valor** (ato exclusivo da paciente); **validar é do sistema e não cria fato**; **"revisar" não é ato de domínio** nesta versão.
  4. **Confirmação sem proposta não existe**; declaração sem confirmação é o caminho majoritário. **Das dezenove categorias de informação, apenas duas são confirmáveis** — a confirmação é a exceção do sistema, não a regra.
  5. **Autoridade não se delega** (substituição em nome próprio é o mecanismo) e **não se compartilha sobre o mesmo fato**. Retira-se prospectivamente, **nunca retroativamente**.
  6. **Incompatibilidade nova:** quem confirma o Mapa de um profissional em um Case **não pode** ser quem julga e seleciona esse profissional nesse Case — aplicação do "quem avalia não atesta" da ADR-060 ao ato novo. **Hoje inexequível** (uma única conta acumula Administrador e Curador): a exceção é aceita, datada, **obrigatoriamente visível na Ficha de Explicação**, e caduca com a segunda conta prevista na ADR-060.
  7. **A RLS da ADR-040 item 6 NÃO é reaberta.** O gargalo G4 é de carga, e a 2.0 já o resolve transformando 28 digitações em 28 confirmações informadas; ampliar o recorte trataria o sintoma e tornaria mais provável a coincidência que o item 6 desta decisão proíbe. Escrita permanece `administrador`; leitura permanece `administrador` e `curador_medico`. **A pendência DP-9 fica respondida com "não ampliar".**
  8. **Não existe confirmação parcial.** **Não existe confirmação automática** — nove formas nomeadas e proibidas, entre elas decurso de prazo, caixa pré-marcada, herança entre Cases e "confiança na regra".
  9. **Confirmar acrescenta; nunca modifica:** não altera a proposta (imutável), não altera a declaração (cria), não altera o histórico (acrescenta), não altera o juízo (atos independentes), não altera a proveniência (estende).
  10. **Assimetria deliberada:** origem retratada supersede a confirmação; **regra revogada não** — o fato não mudou, e quem adotou continua respondendo.
- **Consequência:** com as ADR-066, ADR-067 e ADR-068, **nenhuma decisão de domínio falta** ao pacote F-02. O bloqueio remanescente é de sequenciamento (Onda 1 não iniciada), de nomeação (Autoridade de Método) e de guarda (C-01, que deve permanecer ativa). **Nenhum item congelado foi reaberto por esta ADR.**
- **Ressalva de lavratura:** idem ADR-066 — a lista de ressalvas do Guardião não existe como arquivo (DP-11).
- **Revisitar quando:** a segunda conta da ADR-060 entrar em operação (torna exequível o item 6); ou se a operação real demonstrar que o recorte de escrita de um único papel é inviável — caso em que a ampliação exige o rito completo do §6 do Congelamento.

---

## ADR-069 — Ciclo de vida das regras de derivação: a versão é fato, o estado é leitura

- **Data:** 2026-08-05
- **Status:** **Aprovada pelo DT-01** em 2026-08-05. Lavrada somente após a aprovação, por determinação do próprio DT-01 — **nenhum registro intermediário em estado `PROPOSTA` foi inserido neste log append-only** (ADR-062). O conteúdo aprovado é o do commit documental `4e43b74`.
- **Conteúdo normativo:** **`docs/curadoria/ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md`** (v1.0) — anexo canônico desta ADR, na íntegra. Este verbete registra; o anexo normatiza.
- **Dependências:** ADR-066 · ADR-067 · ADR-068 · `docs/curadoria/ARQUITETURA_CURADORIA_2_0.md` §5.4 e §10.5 · `CONGELAMENTO_ARQUITETURAL.md` (I-7) · invariantes MR1.1, MR1.2 e MR1.3 do Item 2.2A-MR1
- **Contexto:** a verificação independente do Item 2.2A-MR1 encontrou que dois invariantes corretos — **append-only por trigger** (MR1.1, que recusa `UPDATE` e `DELETE` para todo papel, inclusive `service_role`) e **uma única versão `VIGENTE` por regra** (MR1.2, índice único parcial) — produzem juntos um efeito não intencional: **uma regra que alcança `VIGENTE` não pode mais ser suspensa, revogada nem sucedida**. A causa raiz não está em nenhum dos dois: está em `state` ter sido modelado como propriedade de uma linha imutável. Com isso, quatro atos que o §10.5 confere à Autoridade de Método tornam-se inexequíveis, o freio de emergência do Curador (§5.4 condição 7) não existe, e o **rollback mestre da Onda 2** — *"suspender a regra devolve o sistema ao regime de declaração direta sem perder dado"* — deixa de ter caminho.
- **Decisão:**
  1. **A versão da regra é fato imutável; a transição é ato append-only; o estado vigente é leitura derivada.** É a **ADR-066 §5** (*"a proposta nunca muda porque o desfecho não mora nela"*) aplicada ao terceiro objeto da mesma família — depois da proposta (ADR-066) e do julgamento (ADR-067).
  2. **`derivation_rules.state` deixa de ser fonte canônica do estado atual** e permanece **somente como registro imutável do estado de nascimento**. **Não é removido, não é cache, não pode ser atualizado após o nascimento e não constitui segunda fonte de verdade** — porque passa a afirmar *"como a versão nasceu"*, não *"onde ela está"*, e fatos diferentes não divergem (P-07).
  3. **Grafo de transições fechado, com sete arcos permitidos, incluindo o nascimento obrigatório em `PROPOSTA`** *(o texto original desta linha dizia "cinco transições" e enumerava sete; corrigido pela emenda de 2026-08-05 — ver abaixo)*: `inexistente→PROPOSTA` · `PROPOSTA→VIGENTE` · `PROPOSTA→SUSPENSA` · `VIGENTE→SUSPENSA` · `VIGENTE→REVOGADA` · `SUSPENSA→VIGENTE` · `SUSPENSA→REVOGADA`. **`REVOGADA` é terminal.** **`PROPOSTA→REVOGADA` não existe** — não se revoga o que nunca valeu; o ato correto é `PROPOSTA→SUSPENSA`. **Nenhuma versão volta a `PROPOSTA`.** Ciclos sucessivos `VIGENTE ↔ SUSPENSA` são ilimitados, e contá-los é sinal de calibração.
  4. **Reativação é `SUSPENSA→VIGENTE`, e é exclusiva da Autoridade de Método.** O **Curador do Case** exerce apenas o **freio emergencial** `VIGENTE→SUSPENSA` (§5.4 condição 7), com justificativa de emergência — **e não pode reativar**. O freio é deliberadamente assimétrico: quem para uma regra em curso não é quem decide que ela voltou a servir.
  5. **MR1.2 é reinterpretado quanto ao sujeito e preservado quanto ao conteúdo:** de *"no máximo uma linha `VIGENTE` por `rule_id`"* para *"no máximo uma transição de entrada em `VIGENTE` sem transição de saída posterior, por `rule_id`"*. **A garantia deve permanecer declarativa** — nunca verificação em código de aplicação —, e duas transições concorrentes para `VIGENTE` na mesma regra devem colidir. **A forma física não é decidida por esta ADR.**
  6. **Toda versão nasce com transição inicial obrigatória para `PROPOSTA`.** Nenhuma nasce vigente: aprovar é sempre ato posterior e separado, o que torna impossível criar regra vigente sem passar pela Autoridade.
  7. **Toda transição referencia versão previamente existente, não altera o conteúdo da versão e não apaga transição anterior.** Toda transição tem **autor, data e motivo**; entrada em `VIGENTE` e qualquer entrada em `REVOGADA` exigem **ADR**.
  8. **Ordenação monotônica por versão, nunca por carimbo de tempo** — o estado vigente não pode depender de desempate.
  9. **`derivation_proposals` continua referenciando `(rule_id, version)`** (MR1.3 intacta); o estado posterior da versão **não altera a proveniência da proposta**, e nenhuma proposta referencia *"a regra vigente"* de forma flutuante. **Nenhuma proposta ou evidência histórica é reescrita por transição posterior.**
- **Consequência:** **MR1.1 e MR1.3 preservados integralmente, sem exceção**; **MR1.2 reinterpretado** conforme o item 5. Dois `CHECK` (`vigente_exige_autoridade`, `fim_tem_data`) e o índice parcial tornam-se **vacuamente verdadeiros** — o que é diferente de errado; preservá-los como cinto de segurança ou removê-los é decisão do implementador. O **rollback mestre da Onda 2** e o **freio do Curador** tornam-se exequíveis. **Esta ADR não autoriza implementação:** o Item 2.2B exige autorização formal de abertura pelo DT-01, e a forma física do registro, os escritores e o pipeline de aprovação permanecem fora de escopo.
- **Revisitar quando:** a operação real mostrar necessidade de transição hoje proibida — em especial se `PROPOSTA→REVOGADA` se mostrar necessária na prática; ou se a garantia declarativa de unicidade se revelar inviável na forma física escolhida.
- **Emenda de 2026-08-05 (DT-01) — aritmética, sem efeito normativo.** A redação original do item 3 dizia *"cinco transições permitidas"* e **enumerava sete arcos**. A contagem estava errada; a enumeração, não. Leia-se **"sete arcos permitidos, incluindo o nascimento obrigatório em `PROPOSTA`"**. **O conjunto enumerado não mudou; nenhuma transição foi autorizada ou removida; a correção é exclusivamente aritmética; e o commit `1a7ef86` seguiu corretamente a matriz normativa** — a implementação leu a tabela, não o numeral. Detalhamento no §21 do anexo canônico.
- **Precisão de 2026-08-05 (DT-01) — MR1.2, sem alteração da decisão.** A garantia do item 5 é produzida pelo **conjunto** formado pelo **trigger de cadeia** (valida continuidade, sequência e o ordinal de vigência) e pelo **índice único parcial** (arbitra colisões, protege a concorrência, impede duas entradas com a mesma chave de período de vigência). **Não é correto afirmar que o índice, isoladamente, prova todo o invariante.** Detalhamento no §22 do anexo canônico.
- **Encerramento do Item 2.2B (DT-01, 2026-08-05):** **encerrado com ressalvas registradas** — a verificação independente confirmou aderência à ADR-069, preservação de MR1.1 e MR1.3, funcionamento do MR1.2 reinterpretado, concorrência controlada, migração e rollback verificados, e ausência de regressão nova. **Cinco ressalvas registradas**, corrigíveis antes do 2.2C: `PUBLIC` mantém `EXECUTE` nas duas funções de leitura · MR1.2 depende do conjunto trigger+índice · erro aritmético desta ADR (emendado acima) · dívida de prova comportamental sobre proposta histórica após revogação · Autoridade de Método vaga até a DP-4 ser fechada. Detalhamento e escopo do pacote corretivo **2.2B-R1** em [`MAPA_DOS_PACOTES.md`](curadoria/MAPA_DOS_PACOTES.md) §3.1.

---

## ADR-070 — Aprovação da Regra Material 001 · Continuidade / Coordenação

- **Data:** 2026-08-08
- **Status:** **Aprovada pelo DT-01 — Fundador / Autoridade de Método** em 2026-08-08, identidade técnica `54ec5c6a-ed07-4e37-b3dd-c7b1300c2c7b` (vínculo lavrado em [`REGISTRO_DE_GOVERNANCA.md`](curadoria/REGISTRO_DE_GOVERNANCA.md) §1.1). Inscrita **no ato da aprovação**, e não antes: a v1.0 do texto foi deliberadamente mantida fora deste log enquanto era proposta, na forma da determinação do próprio DT-01 registrada na ADR-069 (nenhum registro em estado `PROPOSTA` entra num log append-only, ADR-062).
- **Conteúdo normativo:** **[`docs/curadoria/ADR_070_APROVACAO_DA_REGRA_001.md`](curadoria/ADR_070_APROVACAO_DA_REGRA_001.md)** — anexo canônico desta ADR, na íntegra. Este verbete registra; o anexo normatiza. A **autoridade material da semântica** permanece sendo a ficha [`REGRA_001_CONTINUIDADE_COORDENACAO.md`](curadoria/REGRA_001_CONTINUIDADE_COORDENACAO.md) **v2.0**.
- **Dependências:** ADR-069 (ciclo) · ADR-066 · ADR-067 · ADR-068 · `CONTRATO_1_A` (PA-13) · `CONTRATO_2_C` (PA-17) · Arquitetura §10.5 · `CONGELAMENTO_ARQUITETURAL.md` (P-04, I-5) · DP-4 (2026-08-05).
- **Contexto:** o `CONTRATO_1_A` §10.2 registrou que *"a forma da regra e sua primeira instância exigem lavratura própria"*, e o emissor profissional do `CONTRATO_2_C` nasceu **vazio-honesto** por não existir regra alguma. A ADR-069 **não podia** cumprir esse papel: ela se exclui em texto (*"esta ADR não autoriza implementação… o pipeline de aprovação permanece fora de escopo"*) e, no item 7, **exige uma ADR** na entrada em `VIGENTE` — uma norma não pode ser a ADR que ela mesma exige. Nenhuma ADR anterior aprova conteúdo de regra concreta; a ausência era deliberada.
- **Decisão:**
  1. **Fica aprovado o conteúdo da versão 1** de `CONTINUIDADE_COORDENACAO_CONDUTA_DECLARADA`, sobre o conceito `CONTINUIDADE_COORDENACAO` (Catálogo 1.1.0), lado **profissional**, **por referência normativa integral** à ficha v2.0 — que não é reproduzida aqui.
  2. **Semântica ratificada, cinco desfechos:** `CONFIRMADO` diante de ao menos uma das três condutas **diretas** de coordenação · `NAO_CONFIRMADO` **somente** diante da negativa explícita `ATUA_DE_FORMA_INDEPENDENTE` · `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` **isolada** ⇒ **nenhuma proposta**, acompanhada de conduta direta ⇒ `CONFIRMADO` (governado pela direta, **sem soma**), acompanhada da negativa sem conduta direta ⇒ `NAO_CONFIRMADO` · ausência de evidência ou `options` vazio ⇒ **nenhuma proposta** · conduta direta **e** negativa na mesma versão ⇒ **nenhuma proposta**, `EVIDENCIA_CONTRADITORIA`. **`NAO_INFORMADO` não é derivado na v1** — o conceito não tem opção canônica para ele, e o estado de governança `nao_localizado` não pode ocupar esse lugar (I-5). **Nenhuma opção foi criada; o Catálogo não foi tocado.**
  3. **Princípios preservados:** **P-04** — lacuna nunca vira ausência da característica, e `NAO_CONFIRMADO` exige ausência **verificada**; **I-5** — o estado de verificação da evidência jamais vira estado profissional, e evidência não verificada pode gerar proposta preservando seu estado na proveniência; **CD-1 intacta** — a regra não usa `case_needs`, grau, importância, `satisfied_by`, ponte nem `derivation_rule_degree_map`; **independência do Case**; **sem score, contagem, gradação ou ranking**.
  4. **Fronteira com o Concierge:** o Concierge Aliviar pode facilitar a coordenação operacional — contatos, documentos, fluxo, agenda —, mas **não substitui o médico no ato clínico de coordenação com outros profissionais**. A característica permanece da prática do profissional.
  5. **Maturidade metodológica `PROVISÓRIA`**, e revisão **somente por versão nova** — jamais por atualização silenciosa (MR1.1 recusa `UPDATE` e `DELETE` para todo papel, inclusive `service_role`). **R-1 permanece ABERTA e não iniciada.**
  6. **Fica autorizada a entrada em `VIGENTE` pelo rito da ADR-069, e somente por ele**, com **`approval_adr = 'ADR-070'`** — o valor que a constraint `derivation_rule_transitions_adr_quando_exigida` cobra. **Esta ADR autoriza; não executa.**
- **Separação de autoridades:** a **ADR-070** responde *"esta regra e esta semântica estão aprovadas?"*; a **ADR-069** responde *"como esta versão passa de `PROPOSTA` a `VIGENTE`, `SUSPENSA` ou `REVOGADA`?"*. Não se misturam, e **a ADR-069 não é `approval_adr` de coisa alguma**.
- **Consequência:** a promoção é possível **exclusivamente por `INSERT`** na tabela de transições, **sem nenhum `UPDATE`** em `derivation_rules` — provado: `derivation_rule_state()` lê só as transições. `derivation_rules.approved_by`, `.approval_adr` e `.effective_from` permanecem **nulos permanentemente** e **não são registro vinculante**: o aprovador é `derivation_rule_transitions.actor_id` com `authority = 'AUTORIDADE_DE_METODO'`, e o fato temporal da vigência é o `occurred_at` da transição. **A promoção não emite proposta alguma**: o emissor Case-side exige cobertura em `derivation_rule_degree_map` (zero linhas, e CD-1 proíbe criá-las) e o emissor profissional do 2.C tem `candidatas := 0` por construção, até a **emenda própria** que o próprio contrato previu. **R-1 não começa na promoção.**
- **Revisitar quando:** a observação de R-1 mostrar que a semântica conservadora produz mais silêncio do que informação — em especial se `ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO` isolada for frequente. **A resposta correta será uma versão 2, nunca a edição desta.**

---

## ADR-066 — A decisão da paciente é fato próprio, e a conexão trata do começar

- **Data:** 2026-08-11
- **Status:** Aprovada (contrato `docs/repaginacao/27_B3R_SUPERFICIE_ALCANCAVEL.md`, Arquitetura E). **Supersede parcialmente** a linha da ADR do Bloco A que listava `connection_records (+ patient_curadoria_decisions)` como fonte da decisão, e a afirmação de `DOMAIN_CONNECTION_RELATIONSHIP.md` de que a Connection registra a decisão final. **O histórico permanece**: as ADRs anteriores não são reescritas, apenas superadas neste ponto.
- **Contexto:** a documentação listava **duas fontes concorrentes** para um mesmo fato e, no parágrafo seguinte, afirmava que *"nenhum fato tem duas fontes concorrentes"*. Dessa contradição nasceram duas coisas: `CuradoriaDecisionPanel`, a superfície canônica, ficou **órfã** (nenhuma rota a renderizava — GAP-B3-2), e o `ConnectionChoicePanel` passou a viver sob um `Limiar` chamado **"A decisão"** sem mover a responsabilidade. Não era risco de confusão: era **falso rótulo em produção**.
- **Decisão:**
  1. **A pessoa é nomeada UMA vez, no fato canônico** `patient_curadoria_decisions`. Só ele oferece os três caminhos **+ "nenhuma destas"**.
  2. **Só a decisão move o handoff.** `emittedAt`, `presentedAt`, `deliveredAt`, `meetingHeldAt`, comparação e `connection_records` **não** movem ninguém.
  3. **A conexão deixa de perguntar "com quem"** e trata só do começar. No fluxo canônico recebe **um** profissional — o já decidido (H2). `NONE_OF_THEM` não recebe superfície de conexão (H3). O **caminho legado permanece intacto** (H4).
  4. **Consequência declarada:** corrigir a conexão *para outro profissional* deixa de ser oferecido no caminho canônico — contradiria um fato append-only. Mudar de rumo continua sendo **nova seleção curada**. Trocar o *modo de contato* e encerrar sem relacionamento permanecem.
  5. **Duas guardas complementares**, porque uma não bastou: **grafo de imports** a partir de `src/app` (substitui `actions-have-callers`, que concatenava `src/components` numa string e era satisfeita pelo próprio órfão) **e render da composição real da rota**, que não importa o painel. Import é condição necessária e **não suficiente**: na implementação desta fatia o import entrou sem o JSX, e só a segunda guarda pegou.
  6. **Exceção intencional na guarda ampla:** `src/components/curadoria/mandatory-filters.tsx`, não renderizado por decisão **D-04 item 7**, com caminho exato e teste que impede a lista de crescer em silêncio.
- **Consequência:** a decisão canônica passa a ter porta na rota real; a responsabilidade muda no fato certo; a conexão para de fingir ser decisão.
- **Divergência registrada, não resolvida:** `NONE_OF_THEM` **não** leva ao Concierge — `inferPhaseFromCuradoria` devolve a fase `curadoria` e o Curador permanece. É coerente (ninguém escolhido, ninguém a acompanhar), mas o contrato fala em "decisão" sem distinguir os dois desfechos. **Decisão do Arquiteto**, fixada em teste como está.
- **Revisitar quando:** o Arquiteto decidir o responsável após `NONE_OF_THEM`.
