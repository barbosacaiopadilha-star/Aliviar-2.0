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
| ADR-039 · ADR-040 (Mapas preenchidos por digitação manual) | ADR-066 (I) · ADR-068 | emenda de origem — os Mapas passam a ser confirmação registrada; **as escalas, os estados e a RLS permanecem intactos** |
| **Invariante I-10** (`CONGELAMENTO_ARQUITETURAL.md` §5) | **ADR-066 (I)** | **reabertura substancial** — a distinção formal entre as escalas permanece; a ponte versionada reabre a invariante em substância |
| ADR-065 (juízo relacional sem lugar de registro) | ADR-067 | complemento — os três conceitos `humano` passam a registrar-se em `curator_judgments` |
| `MODELO_CURADORIA_V1.md` §7.1–§7.4 e §11 (v2.0) | ADR-067 → **Modelo v3.0** | emenda — remoção de "0–100" e dos percentuais de peso; quitação do achado P17 |
| ADR-060 ("quem avalia não atesta", inexequível) | ADR-068 item 6 | complemento — a incompatibilidade é declarada e a exceção fica visível até a segunda conta existir |
| **MR1.2** do Item 2.2A-MR1 (uma linha `VIGENTE` por regra, índice parcial) | **ADR-069** | **reinterpretação** — o invariante passa a ser garantido sobre a **transição**; conteúdo idêntico, sujeito trocado. MR1.1 e MR1.3 permanecem integralmente preservados |
| **ADR-069** item 3 ("cinco transições permitidas") | **Emenda de 2026-08-05 (DT-01)**, no rodapé do próprio verbete | **emenda aritmética** — leia-se "sete arcos permitidos, incluindo o nascimento em `PROPOSTA`". Enumeração inalterada; nenhuma transição autorizada ou removida |
| **ADR-069** item 5 (garantia declarativa do MR1.2) | **Precisão de 2026-08-05 (DT-01)**, no rodapé do próprio verbete | **precisão, não mudança** — a garantia é do **conjunto** trigger de cadeia + índice único parcial; o índice isolado não prova todo o invariante |
| **ADR-066 (I)** §16 (sete condições de existência da ponte) | **Emenda F-2 de 2026-08-05 (DT-01)**, no rodapé do verbete e no §23 do anexo | **acréscimo** — oitava condição: no máximo uma versão de regra vigente por conceito, a cada instante. Complementa MR1.2; **não altera o grafo da ADR-069** |
| **ADR-066 (I)** §16 condição 4 (`MOTOR_PARTICIPATION` ≠ `NUNCA`) | **Emenda F-1 de 2026-08-05 (DT-01)** | **aplicação da ADR-047** — a condição não muda de conteúdo; passa a ser **derivável do Catálogo materializado e imposta pelo banco**, em vez de declarada em `Record` TypeScript |
| **ADR-079** (o filtro de cuidado contínuo cai para o cadastro quando o levantamento está vazio) | **ADR-088** | **correção pela raiz** — o remendo destravou a Mesa mas deu a uma autodeclaração o poder de eliminar. A queda para o cadastro permanece; o que muda é que autodeclaração não elimina mais, vira ressalva nomeada |
| **FS-02** · **FS-07** (a família "a tela não conta a verdade", tratada caso-a-caso em agosto) | **ADR-090** | **supersessão em substância** — os consertos pontuais permanecem válidos; o que muda é que a garantia deixa de ser por formulário e passa a ser contrato com guarda. A família voltou três vezes porque não havia contrato |


### Números duplicados (colisão de numeração — não é supersessão)

Um número atribuído duas vezes não cabe na tabela acima: nenhuma das duas ADRs supersede ou emenda a outra — elas apenas **colidem**. Registrado aqui porque é exatamente o tipo de coisa que o verbete não pode carregar sobre si mesmo, e porque o log é append-only: renumerar quebraria toda citação já feita.

**ADR-066 — duas decisões distintas com o mesmo número.**

| Qual | Data | Assunto | Como citar sem ambiguidade |
| --- | --- | --- | --- |
| ADR-066 (I) | 2026-08-04 | Propostas de Derivação e a Ponte entre Declaração e Método (ADR-A da Curadoria 2.0). Conteúdo normativo no anexo `docs/curadoria/ADR_A_PROPOSTAS_DE_DERIVACAO.md` | **ADR-066/04-08 (Derivação)** |
| ADR-066 (II) | 2026-08-11 | A decisão da paciente é fato próprio, e a conexão trata do começar | **ADR-066/11-08 (Decisão da paciente)** |

Os domínios não se tocam — uma institui a Camada de Derivação, a outra fixa `patient_curadoria_decisions` como fonte única da decisão —, então uma citação errada não troca uma regra por outra: ela manda o leitor ao lugar errado. O dano é de navegação, não de norma.

**Cuidado ao ler citações antigas.** Referências a "ADR-066" escritas antes de 2026-08-25 não distinguem as duas, e há pelo menos uma dentro do próprio log em que a leitura por número não resolve: a ADR-066 (II) declara superseder parcialmente "a ADR do Bloco A que listava `connection_records (+ patient_curadoria_decisions)` como fonte da decisão" — e o anexo da ADR-066 (I), que também se chama ADR-A, **não menciona `connection_records`**. Verificado em 25/08. Ou seja: a "ADR do Bloco A" citada ali é outro documento, e a coincidência de nome só existe por causa desta colisão. Quem precisar resolver essa referência tem de segui-la pelo conteúdo, nunca pelo número.

**Como não repetir.** Antes de lavrar uma ADR nova, conferir que o número está livre — `grep -c "^## ADR-0NN" docs/DECISIONS.md` deve responder `0`. Esta colisão só apareceu em 25/08, ao conferir a numeração de uma ADR nova, e vinha no repositório desde o commit `2a085e5`.


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
- **Registro de implementação (item 2, 2026-08-26) — não altera esta decisão.** O item 2 está **cumprido**. Até esta data o `<Analytics/>` seguia no **layout raiz** (`src/app/layout.tsx`), isto é, em toda rota do produto — `/paciente/*`, `/portal-curador/*`, `/coa/*`, `/admin/*` e o wizard de `/sua-historia`. A decisão é de 02/08 e a execução estava endereçada ao Bloco H, que não aconteceu: ficou vinte e quatro dias decidida e não aplicada. Agora o componente vive em `src/components/landing/analytics-gate.tsx`, montado só no layout de `(public)`, **sob lista de permissão** — a Landing, `/solicitar-atendimento` e o portal legal (`/privacidade`, `/termos`, `/consentimentos`, `/legal`). **A lista é de permissão, e não de exclusão, de propósito:** o erro simétrico de um gate por exclusão seria rastrear navegação clínica em silêncio, então o padrão passa a ser não medir, e rota nova só é medida se alguém a escrever ali. **`/sua-historia` ficou de fora** embora seja rota pública — é onde a pessoa escreve a própria história de saúde, e a URL do passo já é indício. Trava: `tests/unit/adr056-analytics-fora-da-casa.test.ts` (7 casos), provada mordendo contra o `HEAD` anterior. **Uma ampliação a declarar:** a ADR diz "apenas na landing pública", e a lista inclui o pedido e o portal legal — são Fachada, nenhuma revela condição de saúde pela URL, e sem `/solicitar-atendimento` não há métrica de aquisição. Se o Fundador quiser a leitura literal, tirar as cinco rotas é uma linha. **O item 1 (Anthropic na política) segue aberto:** depende da publicação do texto, que é o `PRIV-01`.
- **Verificado em PRODUÇÃO (2026-08-27).** Commit `452b68e` publicado a partir de `255419e`; deployment `dpl_4kLoMyMgFjncXNucBb9hv7fmVPpJ`, target production, `READY`. Conferência feita pelas requisições de rede reais em `https://aliviar-2-0.vercel.app`, e o par que prova a decisão é este: **`/` carrega** o analytics (`script.js` + `POST /view`) e **`/login` não carrega** — antes desta mudança as duas carregavam, porque a montagem era no layout raiz. Também medidos: **`/sua-historia` → 200 sem analytics** (é a rota que mais importa: está dentro de `(public)` e mesmo assim a lista de permissão a deixou de fora, que é exatamente o desenho) e **`/privacidade` → 200 com analytics**, exibindo corretamente *"O documento ainda não foi publicado"* — coerente com a ADR-096. Nenhum asset quebrado em nenhuma das quatro. Ponto de rollback registrado: `255419e`.
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
- **Divergência RESOLVIDA (2026-08-11, decisão de autoridade do Arquiteto):** `NONE_OF_THEM` **é decisão canônica legítima e também transfere a responsabilidade**. A recusa encerra a etapa decisória; uma nova seleção curada, se vier, é **outro processo** — não a continuação deste sob o Curador. O comportamento anterior (`inferPhaseFromCuradoria` devolvendo a fase `curadoria`, mantendo o Curador para sempre) era **defeito de produção**, corrigido em `resolveCurrentResponsible` por uma guarda simétrica à da ausência de decisão. O handoff **não** depende de haver profissional escolhido nem de existir `connection_record`: depende do fato canônico existir.
- **Revisitar quando:** nada pendente neste ponto.
## ADR-071 — O conceito do MEC na carta da paciente: fato sobre a escola, nunca nota do profissional

- **Data:** 2026-08-19
- **Status:** **A DECISÃO DE MÉRITO PERMANECE; A IMPLEMENTAÇÃO FOI REVERTIDA
  em 2026-08-20.** Aprovada pelo Fundador em 2026-08-19, em conversa direta,
  depois de apresentado o custo (abaixo) e recusada a alternativa de deixá-lo
  fora da carta. A migration `20260819210000_conceito_do_mec_na_graduacao` e o
  código correspondente foram revertidos ao se descobrir que **produção já
  tinha implementação melhor da mesma coisa**: `professional_graduation_facts`
  (migration `20260819040715`), que separa CC de Enamed, guarda o ano de cada
  um, **exige fonte oficial `gov.br`** para qualquer indicador, e registra
  autoria e instante. Duas fontes para o mesmo fato seria o defeito de origem
  que este projeto mais combate — então a nossa saiu, e a de produção fica.
  Por que ninguém viu antes: aquela migration **não está no repositório**;
  existe só no banco. O que resta desta ADR é o *como exibir* (§1 da Decisão),
  ainda não ligado ao `professional_graduation_facts`.
- **Dependências:** ADR-041 (nenhum score) · `formacao-academica.ts` (decisão vinculante: formação é fato, não mérito).
- **Contexto:** o bloco de formação que a paciente lê carregava uma recusa explícita — *não dar à formação nenhuma cor, número ou destaque comparável entre cartas*. O conceito do MEC é exatamente um número comparável, e a carta é, fora ele, toda prosa. A ADR-041 proíbe score, nota, porcentagem e ranking **produzidos pelo sistema**; o conceito do MEC não é produzido aqui, mas passa a ser exibido aqui.
- **A decisão de mérito, e o custo declarado:** um número no meio de três cartas de prosa vira a única coisa comparável da página, e a atenção vai nele mesmo sem cor e sem destaque. Há risco real de a pessoa ler um ranking de três notas onde a Curadoria montou três caminhos diferentes. Contra isso pesou que a informação é pública, ela pode buscá-la sozinha, e omitir para "proteger" é paternalismo. **O Fundador decidiu que entra.**
- **Decisão:**
  1. **O conceito entra DENTRO da frase da instituição**, nunca como linha própria, selo, chip ou número solto: `Universidade Federal de Pernambuco — curso com conceito 4 no MEC (2023)`. Assim ele tem o mesmo peso visual da cidade e do ano.
  2. **Não ordena, não pontua, não entra em cálculo algum.** A ADR-041 permanece intacta: nenhum score é *produzido*. O que existe é um fato externo *exibido*.
  3. **É fato sobre a ESCOLA, não sobre o profissional.** Um médico formado há vinte anos numa escola conceito 3 não é pior para esta paciente que um recém-formado de conceito 5 — e o conceito nada sabe sobre as prioridades dela.
  4. **Somente `graduacao`.** Residência é credenciada pela CNRM; especialização, fellowship, pós e curso não têm conceito do MEC. O campo nem aparece fora da graduação: oferecê-lo convidaria a inventar um número que uma paciente vai ler. Quatro CHECK no banco recusam conceito fora de 1–5, conceito fora da graduação, ano sem conceito e ano implausível.
  5. **Lançado pela equipe, e já revisado no ato.** Nada é importado de base externa nem casado por nome de instituição: casamento aproximado erraria sobre um médico real. O dado nasce onde o julgamento humano acontece.
  6. **Lançar o conceito NÃO rebaixa a verificação** da entrada de formação, ao contrário das demais edições. A equipe verifica o *diploma* daquela pessoa; o conceito é fato sobre a *escola*. Rebaixar teria efeito perverso e silencioso: acrescentar a nota a uma formação já verificada a tiraria da carta.
  7. **Ausência é omissão.** Sem conceito lançado, a linha é a instituição e nada mais — sem "não informado", sem traço.
- **Consequência:** pela primeira vez a carta da paciente carrega um número comparável entre opções. É uma mudança de natureza, não de grau, e está registrada aqui como tal.
- **Revisitar quando:** o Observatório da Experiência mostrar a escolha real das pacientes. **O sinal a procurar:** concentração das escolhas na opção de maior conceito, independentemente das prioridades declaradas por elas. Se aparecer, a resposta é revisitar esta ADR — não ajustar o layout.

---

## ADR-072 — A história vem antes do vínculo: captação anônima na Landing, e a pessoa segue para o WhatsApp

- **Data:** 2026-08-20
- **Status:** **Decisão completa**, tomada pelo Fundador em conversa direta nesta data — mérito, retenção e vínculo. Nada foi implementado ainda. Falta apenas a redação jurídica da frase de retenção, com o advogado; o sentido já está fixado abaixo e não muda.
- **Dependências:** **reabre a ADR-018**, exatamente pelo caminho que ela mesma previu · `docs/PRODUCT_ARCHITECTURE.md` §21 (não existe signup público) · política de privacidade (ainda não publicada) · assistente de história (`use-story-draft`, hoje com defeito de envio registrado abaixo).
- **Contexto:** hoje a história exige conta, por decisão da ADR-018. Quem chega pela Landing, se reconhece no que lê e quer contar o que está vivendo **não tem onde aquilo cair**: ou já é paciente, ou não conta. Na prática, a pessoa se abre no WhatsApp com um atendente e o relato vira mensagem solta — não vira histórico, não chega ao Curador organizado, e se ela demora a decidir, some. A ADR-018 antecipou este momento com todas as letras: *"se o negócio precisar de um funil de captação verdadeiramente anônimo no futuro, isso exige um novo ADR próprio, não uma reinterpretação silenciosa deste."* É este ADR.
- **A reconciliação com o §21 — e por que ela é honesta:** captar história anônima **não é signup público**. Ninguém cria conta; ninguém ganha acesso a nada. A conta continua nascendo pela equipe Aliviar, por fora do sistema, como o §21 exige. O que muda é só isto: o relato pode existir **antes** do vínculo, guardado, e passa a ser "dela" no momento em que a equipe cria a conta e liga as duas pontas. A regra que o §21 protege — nenhuma pessoa entra sozinha na Rede — permanece inteira.
- **Decisão:**
  1. **A história pode ser escrita na Landing, sem conta e sem login.** A pessoa escreve, e o relato é guardado no sistema.
  2. **O conteúdo NUNCA sai para o WhatsApp.** Quem é transferida para o canal de atendimento é a **pessoa**, para falar com gente — a história fica aqui. Esta separação é o coração da decisão: o WhatsApp recebe alguém para conversar, jamais um relato de saúde. Dado sensível não atravessa para a infraestrutura de terceiro.
  3. **Se ela virar paciente, aquela história já é o histórico dela** — nasce ligada, sem recontar nada. É o que o Método promete desde sempre: *o paciente nunca recomeça do zero*.
  4. **Nada disso cria conta, dá acesso, ou promete atendimento.** A transferência para o WhatsApp é o convite para conversar, não a contratação.
- **Retenção — DECIDIDO: 90 dias, e dito na TELA enquanto ela escreve.** Três caminhos foram apresentados ao Fundador — prazo explícito; guardar até ela pedir exclusão; guardar só o não-sensível. Escolhido o primeiro, em 2026-08-20. **A frase pertence à tela, não à política:** a pessoa precisa saber o destino do que vai contar *antes* de contar, não depois, num documento que ela não vai abrir. Sentido a preservar, redação final com o advogado: *guardamos por 90 dias enquanto conversamos; depois apagamos; se você virar paciente nesse período, a história fica com você*. Noventa dias porque é o tempo real de uma decisão de saúde — quem chega em agosto e decide em outubro ainda é a mesma conversa. Guardar indefinidamente tornaria a Aliviar depositária de relatos de saúde de gente que nunca virou paciente: a exposição que mais pesa numa fiscalização, e a que menos serve ao negócio.
- **Vínculo — DECIDIDO: telefone, e só telefone.** O formulário público pede **nome, telefone e a história**. Nada além. Decidido em 2026-08-20. A transferência é para o WhatsApp: o telefone *é* o canal, e é a chave que o atendente já vai usar de qualquer forma. Pedir e-mail junto criaria um segundo identificador que pode divergir do primeiro, e mais um campo entre a pessoa e o ato de contar.
- **Defeito conhecido que este plano herda:** o envio da história hoje **não funciona** — a paciente clica em "Enviar minha história", o botão fica em "Aguarde…" para sempre e **nada chega ao banco**: a história permanece `rascunho`, `submitted_at` vazio. Comprovado em 2026-08-20 consultando o Postgres com a limpeza do teste desligada. A causa provável é a fila de gravação (`saveChainRef` em `use-story-draft.tsx`): o `submit()` força uma última gravação antes de enviar, e um elo que não resolve prende tudo que está atrás — inclusive o envio, que nunca chega a ser chamado. **Se o fluxo novo reaproveitar este assistente, ele nasce com este defeito.**
- **Consequência:** pela primeira vez o produto guarda relato de saúde de quem ainda não é paciente. É mudança de natureza, não de grau — e é por isso que a retenção foi decidida aqui, junto do mérito, e não deixada para a implementação.
- **Revisitar quando:** o Observatório da Experiência mostrar quantas histórias captadas viram Curadoria de verdade. **O sinal a procurar:** volume grande de relatos guardados e conversão baixa — significaria que a Landing está colhendo confidência sem entregar cuidado, e a resposta seria rever o convite, não aumentar o prazo de retenção.

---

## ADR-073 — Congelamento de construção até a primeira Curadoria real

- **Data:** 2026-08-21
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** suspende a implementação da **ADR-072** (captação na Landing) e da **Curadoria 2.0** (`docs/curadoria/ARQUITETURA_CURADORIA_2_0.md`) · não altera nenhuma decisão de Método · nada do que já está no ar é revertido.
- **Contexto — os números que motivaram a decisão:** 87 mil linhas em `src/`, 93 tabelas, 60 telas, 132 migrations, 73 ADRs. **Zero Curadorias reais.** Nenhuma paciente de verdade percorreu o produto até hoje.
- **A prova de que o problema não é falta de projeto, e sim excesso dele:** três construções corretas, prontas e não ligadas a nada.
  1. A **ponte grau→importância** está no banco desde 2026-08-06 (`20260806180000_ponte_grau_importancia`). Nenhuma linha de `src/` a usa.
  2. A **camada de derivação** existe, tem uma regra material VIGENTE (ADR-070) — e, por seus próprios termos, ainda não emite proposta alguma.
  3. Das **nove transcrições** que a Curadoria 2.0 manda desaparecer (§2.5), **duas** desapareceram em quatro meses: o segundo motor e os checkboxes do Acolhimento.
- **O raciocínio:** a arquitetura da 2.0 foi revisada nesta data e está **certa** — a tese, as quatro camadas com regra de corte, os dois pipelines fisicamente separados, o P12 como proibição estrutural. Não há proposta melhor a fazer. O que falta não é desenho: é uso. Construir a 2.0 antes da primeira Curadoria real produziria, no melhor caso, uma ponte maior — correta, completa e desligada, como as três acima.
- **Decisão:**
  1. **Nenhuma construção nova entra** até que uma Curadoria real aconteça de ponta a ponta: paciente real, Curador real, Rede real, relatório entregue.
  2. **Continua permitido, e é obrigação:** corrigir defeito encontrado no uso real, e o que a lei exigir (política de privacidade e termos).
  3. **Fica suspenso:** a captação da ADR-072, a derivação do Mapa (O1), a ponte grau→importância (O3), e as sete transcrições restantes do §2.5.
  4. **A ordem depois do descongelamento é a dor, não o plano.** As fatias da 2.0 entram na sequência que a operação real apontar — e a primeira candidata é a formação derivada do diploma verificado, por não depender de Rede.
- **O que a primeira Curadoria real precisa produzir — e é por isto que ela existe:** não um caso entregue, e sim **observação anotada**. Especificamente: quais das nove transcrições de fato machucam e quais eram teoria; quanto tempo cada ato leva de verdade; onde o Curador improvisa por fora do sistema (papel, planilha, WhatsApp) — porque é ali que o produto não existe; onde a paciente hesita, relê ou pergunta; e o que a equipe precisou explicar por fora da tela.
- **Consequência:** o projeto para de crescer por um período, de propósito. É desconfortável e é o ponto. Toda decisão adiada aqui será tomada depois com evidência, e não com suposição — que é a regra que o Observatório da Experiência já estabelecia e que não vinha sendo cumprida por falta de operação.
- **Revisitar quando:** a primeira Curadoria real for entregue e a observação estiver registrada. **O sinal de que esta ADR falhou:** a primeira Curadoria acontecer e o descongelamento seguir a ordem do plano original, ignorando o que foi observado — seria repetir, com mais dados, o mesmo erro que a motivou.

---

## ADR-074 — A entrevista é o canal do profissional; a Mesa é simétrica por conversa

- **Data:** 2026-08-21
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** complementa a ADR-073 (nada aqui autoriza construção antes do descongelamento — esta ADR registra decisões de fluxo e de método) · alinha-se à tese da Curadoria 2.0 (`ARQUITETURA_CURADORIA_2_0.md`) resolvendo, para o lado do profissional, o problema da transcrição sem fonte · não altera o Catálogo Canônico.
- **Contexto — a assimetria da Mesa:** o lado da paciente chega rico (história nas palavras dela, 29 conceitos com grau, reconhecimento próprio); o lado do profissional chega vazio (publicar exige 2 de 6 etapas; Mapa e Protocolo sem preenchimento em produção). O Método compara uma pessoa bem escutada contra profissionais mal descritos, e a comparação vira coluna de lacuna. O gargalo não é escutar a paciente — é o custo de descrever um médico honestamente.
- **O fato operacional que decide a forma:** **o médico não tem acesso à plataforma.** A Aliviar o entrevista, com questionário, e o administrador transcreve. Esse é o modelo — não uma limitação temporária a "corrigir" com login de médico.
- **Decisões:**
  1. **A entrevista é o canal oficial do profissional.** Os dois lados da Mesa são a mesma coisa: uma conversa conduzida pela Aliviar e registrada com autoria. A paciente é entrevistada e o Curador registra; o médico é entrevistado e o administrador registra. A simetria do Método está na conversa, não no login.
  2. **A entrevista é FONTE, com nome e data.** Cada resposta transcrita registra proveniência: *fonte = entrevista de DD/MM, coletada por quem conduziu* (`practice_evidence` já tem os campos). Com isso a transcrição deixa de ser o defeito que a 2.0 aponta: a declaração original do profissional **é a entrevista**, e ela passa a existir como registro rastreável.
  3. **O Mapa vira roteiro de entrevista, não formulário.** A tela do lado do profissional deve servir a quem está AO TELEFONE com o médico — pergunta por extenso, opções à mão, lugar para a frase que ele disse — como o lado da paciente já faz ("registre durante a conversa, na ordem que ela acontecer"). Mesmos dados, forma do momento real. *(Execução: descongelamento.)*
  4. **Núcleo mínimo para entrar no pool elegível** — a primeira metade do roteiro: área, modalidade, disponibilidade e prazo, local, convênio, limites de atuação. Precisa estar **tratado** (tratado inclui "não informado" honesto; o que não pode é ninguém ter olhado) antes de o perfil entrar na Mesa. O aviso de lacunas da publicação (21/08) vira porta para esse núcleo — e só para ele. *(Execução: descongelamento.)*
  5. **O portal do profissional fica DORMANTE.** `/profissional`, o protocolo próprio por RLS e os termos do profissional pressupõem um médico que faz login — que não existe no modelo. Nada é apagado: fica registrado que o canal é a entrevista, e que ninguém deve "terminar" o portal sem revisitar esta decisão.
  6. **Os 35 subcritérios não mudam agora — deliberadamente.** Mexer no Catálogo antes das primeiras Curadorias reais seria especulação; é a regra do Observatório. O Catálogo emagrece (ou não) por evidência de uso, nunca por palpite.
- **Consequência para a primeira Curadoria real (ADR-073):** a observação anotada deve incluir a entrevista do profissional — quanto tempo leva, o que o médico responde com facilidade, onde a conversa não cabe no questionário. É esse material que calibra o roteiro (decisão 3) e o núcleo (decisão 4) antes de qualquer tela mudar.
- **Revisitar quando:** houver médicos reais entrevistados e o Observatório mostrar o custo e as lacunas do roteiro; ou se o modelo operacional passar a prever acesso do profissional (aí a decisão 5 reabre inteira).

---

## ADR-075 — A operação essencial da primeira rodada: conversa na entrada, papel no meio, cartório no fim

- **Data:** 2026-08-21
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** aplica a régua do essencial (quatro atos, três folhas — entendimento selado nesta data, kit em `docs/rede/`) à operação · espelha a ADR-074 para o lado da paciente · nada aqui constrói (ADR-073 intacta): são decisões de **não usar** e de sequência.
- **A régua:** toda superfície e todo ato operacional responde primeiro — *"qual dos quatro atos você serve?"* (1 ouvir até ela reconhecer · 2 conhecer o profissional pela declaração assinada · 3 cruzar e escolher três com nome · 4 apresentar, e a decisão é dela). O que não serve a nenhum, não entra na primeira rodada.
- **Decisões — a entrada da paciente:**
  1. **O canal dela, na entrada, é a conversa** — a simetria da ADR-074: os dois lados da Mesa começam falando com a Aliviar, nunca com um formulário logado. A cadeia essencial tem dois degraus: Landing → "quero conversar" (nome + telefone) → **Consulta Inicial marcada**. Qualificar É marcar a conversa.
  2. **A conta da paciente nasce na entrega, não na entrada.** Criar login e senha antes de ela ser ouvida não serve a ato nenhum; a conta ganha sentido quando existe uma Curadoria para ela ver e uma decisão para ela registrar (Ato 4).
  3. **Adormecem** (existem, ninguém é obrigado a alimentá-los; mesma figura do portal do profissional na ADR-074): o wizard da história (auto-serviço para escala futura, junto da captação ADR-072 já suspensa), o funil de 18 estágios, tarefas, agenda e a conversão-com-conta como pré-requisito. A Landing editorial **não perde nada** — o corte é atrás dela.
- **Decisões — a burocracia interna:**
  4. **Papel no meio, cartório no fim.** Durante a Curadoria, o instrumento é o kit de papel; o sistema não interrompe conversa nenhuma. Depois da entrega, **uma sessão de transcrição — a "ata da Curadoria"** — registra as três folhas de uma vez, com proveniência (*"Ficha da Consulta de DD/MM"*, *"Formulário assinado de DD/MM"*, *"Mesa de DD/MM"*). Os ~13 atos de tela em tempo real viram um ato de registro.
  5. **O que nunca se corta**, por ser essência e não burocracia: a proveniência na transcrição (fonte, data, quem); a decisão como fato DELA (assinatura na Folha, transcrita como ato dela); o reconhecimento dela assinado na Ficha; e o histórico que a transcrição produz.
- **Consequência para o descongelamento:** o software se reconstrói à imagem do papel que funcionar — e a primeira candidata de tela passa a ser **a própria ata**: a superfície de transcrição das três folhas, que hoje não existe como ato único. As margens anotadas do kit são a especificação.
- **Revisitar quando:** o volume tornar o papel gargalo (aí o wizard e o funil acordam, por evidência); ou a primeira rodada mostrar que algum dos atos "adormecidos" fazia falta real.

---

## ADR-076 — Ensaio geral antes da estreia; o Curador coleta e inscreve, o administrador valida

- **Data:** 2026-08-21
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** emenda a decisão 1 da **ADR-074** (papéis da entrevista do profissional) · não altera a **ADR-073** — o ensaio não descongela nada · usa o kit de `docs/rede/` como instrumento.
- **Contexto:** os nomes citados no planejamento da primeira rodada (médicos e paciente) eram **exemplos**, não pessoas recrutadas. Isso muda o nome do primeiro passo: antes de haver gente real, há um ensaio.
- **Decisões:**
  1. **A primeira rodada é um ensaio geral.** Médicos e paciente de exemplo, kit no papel, e — se houver transcrição — ambiente local. **Produção não recebe pessoa fictícia**: o pool de produção fica limpo (a guarda de perfil de demonstração continua valendo, e perfil demo não publica). O ensaio serve para calibrar o kit, os tempos e o Diário de Observação. **O ensaio NÃO encerra a ADR-073** — o congelamento só termina com paciente real, Curador real, Rede real e relatório entregue.
  2. **O Curador entrevista e inscreve o profissional na Rede; o administrador valida** (registro profissional, área, fontes). Emenda a decisão 1 da ADR-074, que dizia "o administrador registra": quem colhe a informação passa a ser quem vai usá-la na Mesa, e o administrador vira verificador — papel de quem confere, não de quem escuta. **Consequência técnica registrada, não executada:** hoje a RLS só permite ao administrador escrever o Mapa do profissional; dar essa escrita ao Curador é trabalho do descongelamento. Até lá, na ata digital, o administrador transcreve o que o Curador colheu — e a autoria da coleta fica lavrada na proveniência (*entrevista de DD/MM, conduzida pelo Curador*).
  3. **O Termo de Veracidade atual vale para o piloto sem revisão jurídica prévia.** O Fundador aceita o risco; o advogado revisa em paralelo, e a versão revisada substitui a folha nas rodadas seguintes. Termos já assinados na versão anterior não são reassinados retroativamente, salvo orientação jurídica em contrário.
- **Revisitar quando:** o ensaio acontecer (as anotações do Diário calibram o kit); o termo revisado chegar; ou o descongelamento abrir a escrita do Mapa ao Curador (aí a decisão 2 vira permissão de verdade, não fluxo de papel).

---

## ADR-077 — A formação verificada aparece no card fechado do caminho

- **Data:** 2026-08-22
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** abertura pontual e mínima da **ADR-073** (uma linha de apresentação; zero mecânica nova) · usa a Formação Acadêmica v1 e o selo já existentes · não altera a doutrina anti-ranking (ADR-042, gramática do Sistema Visual).
- **Contexto:** a demonstração com dados reais (fixture local vestida, 22/08) mostrou que a carta aberta já apresenta formação verificada com selo, dimensões por extenso e leitura relacional — mas o **card fechado** trazia só nome e justificativa, e a formação, que é o fato que mais enche os olhos, só aparecia depois do clique.
- **Decisão:** o card fechado ganha UMA linha — *"Formação verificada pela equipe: {títulos na ordem da trajetória}"* — regida pelas mesmas regras do bloco aberto: fato, não mérito; mesmo tratamento nas três cartas; nada comparável ou somável; ausência nunca vira linha (sem formação confirmada, a linha não existe). No estado aberto a linha some — o bloco completo, com instituição e período, assume.
- **O que segue proibido:** régua, gráfico ou barra de compatibilidade por magnitude — foi pedido, avaliado e recusado nesta mesma conversa: é nota com outra roupa, e pune a lacuna honesta. O brilho vem da especificidade (formação como fato + correspondências nas palavras dela), nunca de quantidade.
- **Revisitar quando:** o ensaio/primeira rodada mostrar como a paciente lê os cards — o Diário pergunta o que impressionou e o que faltou.

---

## ADR-078 — A Landing veste a base visual do Fundador; a copy canônica fica

- **Data:** 2026-08-22
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data (mockup fornecido por ele como base).
- **Dependências:** abertura dirigida da **ADR-073** (a Landing é vitrine editorial — nenhuma mecânica de produto muda) · preserva a copy canônica das 12 seções (corpus de julho) e o contrato 34 §6 · a área da paciente recebe só a pele visual, em etapa posterior.
- **Decisões:**
  1. **A base visual é o mockup do Fundador:** faixa de pilares com ícones, jornada em cartões com fotografia, faixa institucional com fatos, Concierge com foto — sobre as cenas reais da casa (`public/scenes`).
  2. **A copy canônica não se reescreve** — as seções, a ordem relativa e as frases auditadas permanecem; o novo layout as veste.
  3. **Só verdades:** os números do mockup ("+200 especialistas", "98% de satisfação") **não entram** — a Rede real ainda não existe, e métrica não medida é promessa (contrato 34 §6.5). Entram apenas fatos verificáveis contra o produto (3 caminhos, 29 dimensões do Método, 1 Curador com nome, 0 algoritmos decidindo).
  4. **Depoimento só de gente real, com autorização** — a faixa de depoimento fica fora até existir paciente real que autorize por escrito.
  5. **"Os melhores médicos" não entra em superfície nenhuma** — a linguagem é a do Método: compatíveis com o seu caso. E o Concierge segue sem prometer agendamento ou intermediação (§4.1).
  6. Telefone, redes sociais e canais só entram quando existirem de verdade.
- **Revisitar quando:** a primeira paciente real autorizar um depoimento; ou a Rede tiver números reais que mereçam a faixa do mockup.

---

## ADR-079 — Mão humana é verificação: o lançamento carimba

- **Data:** 2026-08-22
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** ajusta o fluxo da Formação Acadêmica v1 · preserva a Política de Fontes (proveniência obrigatória) e a decisão vinculante 3 (instituição obrigatória) · coerente com a ADR-076 (o admin valida ANTES).
- **O princípio:** nada entra no sistema sem conferência humana prévia — principalmente sobre médicos. Logo, **o ato de lançar é o ato de verificar**: exigir um segundo clique de "confirmar" sobre o que a própria equipe digitou era burocracia duplicando a mesma conferência.
- **Decisões:**
  1. **Digitação manual de formação nasce `verificado`**, com autoria e data de quem lançou.
  2. **Edição pela equipe carimba, nunca rebaixa** — mão humana no conteúdo é conferência; a fonte original do documento permanece na proveniência.
  3. **Exceções que ficam de pé:** sem instituição não há carimbo (vinculante 3 — o caminho é a confirmação com justificativa); e o que o **robô extrai** de currículo continua nascendo `nao_verificado` até o olhar humano — ali a conferência ainda não aconteceu, e é ela que protege a paciente.
- **Efeito:** o que a equipe lança aparece de imediato nas superfícies da paciente (card fechado e coluna acadêmica da carta), com o selo "Formação verificada pela equipe" dizendo a verdade: gente conferiu.
- **Revisitar quando:** o volume exigir separação entre quem digita e quem confere (aí o segundo par de olhos volta como decisão, não como resíduo).

---

## ADR-080 — O Edifício Aliviar: a curadoria como percurso arquitetônico

- **Data:** 2026-08-22
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data (conceito redigido por ele; adaptações A e B propostas pelo arquiteto e aceitas).
- **Dependências:** estende a **ADR-078** (a base visual da Landing) · sujeita ao contrato 34 §6 e à regra "só verdades" (ADR-078 §3) · não altera copy canônica nem mecânica de produto.
- **O conceito:** o Edifício Aliviar é a representação visual do serviço — não uma sede física real. A pessoa entra cercada de dúvidas e sai com clareza: **Entrada** (acolhimento por um Curador, nunca por médico de jaleco) → **Escuta** (compreensão estruturada — nem consulta, nem terapia) → **Corredores** (análise independente de caminhos, linhas contínuas de luz) → **Sala de curadoria** (mesas de análise — a Mesa ganha sala) → **Espaço de decisão** (autonomia da pessoa) → **Saída iluminada** (a linha de luz continua: acompanhamento antes, durante e depois).
- **Linguagem visual vinculante:** marfim, madeira clara e luz natural; azul-marinho para estrutura; verde-sálvia para cuidado; **champagne restrito às linhas de luz e detalhes** (se vazar para painéis inteiros, vira spa). Seriedade médica sem aparência hospitalar; acolhimento sem parecer terapia, spa ou ioga; Curadores com roupa profissional, **sem jaleco nem símbolos médicos** — jaleco na Landing prometeria atendimento médico que não é o serviço. Hierarquia: mensagem → pessoa → ambiente → detalhes.
- **Aplicação na Landing (especificação do Fundador, mesma data — substitui a adaptação "fundo só nas pontas" proposta pelo arquiteto):** o ambiente ocupa 100% da largura e altura da seção, como cenário contínuo; o texto vai direto sobre ele, protegido por camada translúcida (marfim, azul ou verde) **apenas na região do texto**, nunca escurecendo a foto inteira; pessoas e mobiliário posicionados longe do conteúdo; as fotografias nascem com **áreas livres planejadas** para títulos, textos e botões. **Curva de intensidade ao longo da página:** hero nítido e expressivo → vídeo mais suave → método discreto → FAQ e textos longos com arquitetura quase abstrata (luz, textura, profundidade) → encerramento volta a ganhar presença. **Dois ou três ambientes reutilizados** com enquadramentos, recortes e intensidades distintas — não uma imagem nova por seção. No celular, cada ambiente pode ocupar quase a tela inteira; as linhas de luz costuram a continuidade entre seções.
- **Salvaguardas técnicas aceitas junto:** as áreas livres entram nos **prompts de geração** (espaço negativo pedido na imagem, não improvisado no CSS); a camada translúcida garante contraste mínimo **AA verificável por teste**, em qualquer recorte; a travessia se implementa com a imagem rolando junto da seção — `background-attachment: fixed` não entra (quebra no iOS).
- **(B) Cláusula de honestidade:** o edifício é metáfora — nunca ganha endereço, fachada, mapa ou copy que convide à visita física. Nada na Landing pode fazer alguém procurar o prédio.
- **Mapa nos passos publicados:** Entrada→passo 1 · Escuta→passo 2 · Corredores→passo 3 · Sala de curadoria→passo 4 (as três opções nascem ali) · Espaço de decisão→passo 5 · Saída iluminada→convite final da página (não é passo).
- **Revisitar quando:** as imagens dos seis ambientes forem geradas e testadas localmente (aprovação visual do Fundador antes de qualquer publicação); ou quando existir um endereço físico real — aí a cláusula B se reavalia por inteiro.

---

## ADR-081 — A vitrine enxuta: uma ideia por bloco

- **Data:** 2026-08-23
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data ("pode cortar!").
- **Dependências:** emenda a aplicação da **ADR-078** (a composição encolhe; a copy canônica dos blocos removidos permanece CONGELADA nos componentes) · apoia-se na **ADR-080** (4 capítulos — menos vidro por cena era o antídoto declarado à poluição) · reabre em voz alta, pela segunda vez, o perímetro do contrato 34 §6 na Landing.
- **Contexto:** a operação é simples — contar a história → definir o que importa → análise → três opções → decisão acompanhada — e a página a explicava em ~9 blocos que repetiam as mesmas quatro ideias 4–5 vezes ("você não está sozinha", "acompanhamento", "sem ranking", "independente"). Camadas boas, empilhadas, explicavam o simples como se fosse complexo.
- **Decisão:** saem da composição (componentes exportados, copy congelada): **ConfiancaStripSection** (pilares — resumo do que jornada e sala verde já dizem), **PrioridadesSection** (o passo 2 re-explicado: detalhe de produto, não de vitrine) e **ConciergeSection** (a sala verde já carrega "Concierge é tranquilidade"). Os itens de navegação "Para quem é" e "Concierge" saem junto — link sem destino é porta pintada.
- **O que fica, por decisão explícita:** a pergunta-manifesto ("nunca perguntamos qual é o melhor médico"), os fatos verificáveis 3/29/1/0, o "o que não fazemos", o Respiro (única pausa) e os dois CTAs da porta única.
- **Resultado:** 6 blocos, uma ideia por bloco, dentro dos 4 capítulos do Edifício.
- **Revisitar quando:** o Observatório mostrar visitantes procurando o que os blocos removidos respondiam (ex.: dúvida recorrente sobre preço/quem-é no primeiro contato).

---

### Emenda à ADR-081 — a 2ª passada do bisturi (mesma data)

O Fundador perguntou "dá pra resumir mais?" e aprovou os três cortes finais: **(1)** a sala verde perde as linhas editoriais e os diferenciais — dentro da própria seção repetiam os fatos ("independente" 3×, "a decisão é sua" 2×, "sem ranking" 2×); ficam título, abertura, os fatos 3/29/1/0 e "o que não fazemos". **(2)** O convite fica com UMA frase ("Quando você quiser começar…", a que diz o que acontece ao clicar) + o botão; "Cuidar é um caminho…" congela. **(3)** A introdução da jornada perde "São cinco passos…" — os cartões numerados já mostram. Todas as copies congeladas em constantes exportadas com guarda de teste. O osso declarado (não cortar sem nova decisão): Hero, os 5 passos, FAQ, "o que não fazemos" e o Respiro.

---

## ADR-082 — O roteiro dos quatro atos: Recepção, Curadoria, Escolha, Concierge

- **Data:** 2026-08-23
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** reorganiza a aplicação das **ADR-080/081** (os 4 capítulos ganham papel narrativo fixo) · coerente com "O essencial da Curadoria" (docs/rede/ — os quatro atos como régua) · emenda a ordem interna da composição (ADR-078 §2) pelo rito em voz alta.
- **Decisões:**
  1. **Todo o roteiro da Landing existe para explicar os quatro atos**, um por capítulo/ambiente: RECEPÇÃO (chegada) → CURADORIA (sala) → ESCOLHA (corredor dos três retratos) → CONCIERGE (mesa de trabalho).
  2. **O vídeo de apresentação sobe para a Recepção** — apresentação é chegada. Quando existir o vídeo do "como funciona", ele entra no ato da Curadoria.
  3. **O Curador ganha apresentação conceitual própria** no ato da Curadoria, com a copy do Fundador ("Você não precisa escolher sozinho. O Curador Aliviar escuta a sua história…"), fatos 3/29/1/0 e "o que não fazemos" dentro dela. Uma única adaptação de linguagem: "encontrar o cuidado certo" → "para você decidir com segurança e confiança" (L14/§6 — a Fachada não promete resultado). A copy antiga ("Curadores independentes…") segue congelada no componente QuemSomosSection.
  4. **A jornada atravessa os atos:** passos 01–03 na Curadoria, 04–05 na Escolha, com numeração contínua — a travessia É a jornada. Supera, em voz alta, a regra anterior da "jornada de um olhar".
  5. **O card do Curador é vidro branco como os demais** — a banda verde fugia da linguagem única do vidro dinâmico; o destaque vem de tamanho e posição, e os números falam o azul-marinho da marca.
- **Revisitar quando:** o vídeo do "como funciona" existir; ou o Observatório mostrar que a divisão 01–03/04–05 confunde a leitura da jornada.

---

## ADR-083 — A Landing Responsiva: quatro ambientes, mobile first

- **Data:** 2026-08-23
- **Status:** Decidida pelo Fundador, que forneceu o dossiê (`DOSSIE-ALIVIAR-LANDING-RESPONSIVA.pdf` + `PROMPT-PARA-CLAUDE.md` + oito ativos responsivos) como direção vinculante.
- **Dependências:** substitui a aplicação das **ADR-080/081/082** na Landing (o Edifício em capítulos, a vitrine enxuta e os quatro atos) · **terceira e última reabertura da D-1** · preserva o contrato 34 §6.5 (nada de métrica inventada) e §4.1 (fronteira do Concierge).
- **Decisões:**
  1. **Quatro ambientes fotográficos e nenhum a mais:** Recepção → Curadoria → Escolha médica → Concierge, cada um ocupando uma tela, com o conteúdo num card de vidro sobre a área livre planejada da cena.
  2. **Mobile first de verdade:** cada cena existe em duas versões geradas (alta 852×1846 para o celular, 16:9 para o computador) e o `<picture>` faz o aparelho baixar SÓ a que vai usar — antes as duas desciam. WebP com JPEG de reserva; só a Recepção carrega antecipadamente.
  3. **O EFEITO TRANSLÚCIDO PERMANECE** (escolha explícita do Fundador entre a spec e o efeito): o card nasce vidro quase incolor e clareia até branco na zona de leitura, em vez do vidro fixo de 88–94% que o dossiê propunha.
  4. **O vídeo sai da página e vira ação secundária**, em modal acessível (foco preso, Esc, clique fora, sem autoplay, `preload="none"`).
  5. **O Fio de Cuidado** costura as passagens em SVG: muitos caminhos se organizam em três, os três seguem paralelos, e convergem em um quando a decisão é tomada.
  6. **Saem da página, com copy CONGELADA e guarda de teste:** as Dúvidas frequentes, o Respiro, o card do Curador com os fatos 3/29/1/0 e "o que não fazemos", e os cinco passos da jornada. **Consequência dita em voz alta:** preço e proteção de dados deixam de ser respondidos na vitrine e passam a viver na conversa — o Fundador aceitou ao decidir "o restante segue o documento".
- **Ressalva do arquiteto, mantida contra a letra do dossiê:** o Card 4 pedia *"A Aliviar organiza consultas"* e o marcador *"Agenda e confirmações"*. **Não foi implementado assim.** O domínio registra que *a aproximação intermediada não existe* (F9): nenhum contato é feito pela Aliviar, e a decisão sobre intermediação segue aberta. O card fala do que a casa faz — documentos, etapas, alguém para responder e acompanhamento —, e uma guarda automática impede que a promessa volte por descuido.
- **Bloqueio relatado, como o dossiê manda:** o arquivo entregue como `logo-oficial.png` **não é um logotipo** — é uma peça de apresentação de marca (símbolo, assinatura, três ícones com slogans e rodapé azul, sobre fundo creme opaco), e um dos slogans ("o médico certo para você") é a promessa de resultado que a casa proíbe. O cabeçalho segue com a marca real do projeto até chegar o logotipo isolado com transparência.
- **Revisitar quando:** o logotipo isolado chegar; a política de privacidade for publicada (o dossiê acerta ao exigi-la antes de promover o formulário); ou o preço for definido, o que devolve à vitrine a resposta que o FAQ dava.

---

### Emenda à ADR-083 — o bloqueio do logotipo, resolvido (mesma data)

O Fundador enviou o **logotipo isolado** (`LOGO.zip`), e o bloqueio relatado nesta ADR está encerrado. Do JPEG saíram três variantes, com o fundo creme convertido em transparência por luminância (o antialias das curvas é preservado): `aliviar-simbolo.png` (o coração com as mãos — cabeçalho, tela de acesso e ícone do site), `aliviar-logo.png` (marca completa, para materiais) e `aliviar-logo-clara.png` (a mesma forma em uma cor só, para fundo escuro — o rodapé).

**Regra de aplicação:** onde a marca tem menos de ~48px de altura, entra só o **símbolo** e o nome vem em texto real — a assinatura "Curadoria Médica Independente" vira borrão nessa escala, e ela já aparece legível na parede da cena da recepção e no rodapé.

A varredura de coerência que acompanhou a troca corrigiu outros dois pontos que ninguém tinha visto: a **tela de acesso** ainda exibia a versão anterior da marca (duas identidades no mesmo produto, contra o que o próprio comentário do arquivo promete), e o **ícone do site** era um placeholder — um quadrado verde-azulado com as letras "AC" na aba de todo visitante. Ambos passam a usar o símbolo oficial.

---

## ADR-084 — O vidro entra na casa da paciente: a reabertura do Sistema Visual §3

- **Data:** 2026-08-23
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data ("a área do paciente tem cards de vidro também, mesma dinâmica") — e calibrada por ele em segunda passada ("não tá parecida com a landing").
- **Dependências:** reabre, em voz alta, o **Sistema Visual §3** ("papel, não vidro" na área autenticada) · estende a mecânica da **ADR-083 §3** (o efeito translúcido da vitrine) · não altera contrato de estado nem projeção alguma — é material, não informação.
- **Contexto:** com a Landing inteira falando a língua do vidro que clareia na leitura, a área da paciente — "a continuação da landing", nas palavras do Fundador — ficava de papel opaco: a pessoa atravessava a porta e entrava em outro software.
- **Decisão:** os cartões da casa da paciente usam **a mesma receita da vitrine, sem adaptação**: repouso quase incolor (piso ZERO — a primeira aplicação usou piso 0,55 "para proteger a leitura" e ficou com cara de papel; foi o Fundador quem apontou), camada sólida que cristaliza até **84%** na zona de leitura, brilho de borda e desfoque leve. O motor é o mesmo `VidroDinamico` da Landing, montado no shell, lendo os cards a cada quadro — superfícies novas entram sozinhas pela classe `patient-veu`.
- **O limite que fica da regra antiga:** quem protege a leitura não é um piso de opacidade — é a própria dinâmica: o card diante dos olhos É o sólido. Subcartões cristalizam um pouco menos (0,7) para o assunto em foco ganhar corpo sem virar parede; a carta já conhecida idem (serenidade por material, não por cor).
- **O que a segunda passada derrubou:** o "pino" de 0,97 que deixava o cartão do caminho escolhido sempre sólido — era exatamente o que descolava a casa da vitrine. O escolhido respira como todos.
- **Revisitar quando:** a primeira Curadoria real mostrar leitura difícil em algum estado do vidro (aí calibra-se o teto, nunca se volta ao piso alto sem decisão).

---

## ADR-085 — A casa essencial da paciente: um Início, três itens, cinco passos

- **Data:** 2026-08-23 (publicada em 2026-08-24, `main 6f2516a`)
- **Status:** Decidida pelo Fundador em série, na mesma conversa: "vamos manter apenas o que for essencial" → "corte fundo!" → "se for possível aplique todos os cortes" → "dá pra cortar mais se mexer na arquitetura, às vezes tem muita página".
- **Dependências:** aplica à área autenticada a régua de "O essencial da Curadoria" (docs/rede/ — toda tela responde a um dos quatro atos) · coerente com ADR-081/082 (a mesma cirurgia que a vitrine recebeu) · preserva o contrato de estado da Fundação (nenhuma projeção mudou — mudaram endereços) · mantém a doutrina da Sala da Decisão (SD-O1/SD-O2: as verdades antes do gesto, e o gesto é único — a implementação com duas confirmações é que a contrariava).
- **Contexto:** a operação tem quatro atos; a casa da paciente tinha oito páginas, seis itens de menu e seis blocos só na Home — que repetiam o que outras telas já diziam. No celular, cinco telas de rolagem para uma pergunta ("onde estou e o que faço agora?").
- **Decisões:**
  1. **O Início É a Curadoria.** O estado (saudação + macroestado + porquê) abre a página e a travessia inteira vem embaixo. `/paciente/curadoria` vira redirect; `/paciente/curadoria/imprimir` segue rota própria. O botão do hero some quando apontaria para a própria página.
  2. **Menu de 6 → 3:** Início · Minha história · Meus dados. Documentos é encontrado em Meus dados; os consentimentos viram dobra DENTRO de Documentos (rota antiga redireciona). **Consequência de governança dita em voz alta:** `/paciente/documentos` entra em `ROTAS_LIVRES_DO_GATE` — a superfície de consentimento não pode ficar atrás do próprio gate, e o acesso dela ao que é dela vai junto.
  3. **O Mapa de Prioridades sai da Home** (era o painel mais longo do produto abrindo dentro da primeira tela) e mora em Meus dados, com dobras — só o nível mais importante nasce aberto; nenhum nível some.
  4. **A carta do caminho vira dobras** (`<details>` nativo, o novo primitivo de Progressive Disclosure): só "Como responde ao seu Perfil" nasce aberta; a formação vira uma linha por item; o cabeçalho que repetia o nome do profissional saiu — e com ele o estouro de tela que nomes longos causavam.
  5. **A comparação perde o gesto:** sem checkbox, sem estado vazio — o painel mostra os três direto, uma dimensão por vez como sempre. O princípio (sem tabela, sem vencedor) fica; o mecanismo de quatro passos morre.
  6. **Pós-decisão sem cerimônia:** abrir o acompanhamento é UM cartão (as verdades antes do único botão) e o modo de contato vive no pé do mesmo cartão, separado por fio.
  7. **O wizard da história vai de 7 a 5 passos:** "para quem?" absorve o motivo; "há algo importante?" absorve a preferência de modalidade. As rotas antigas redirecionam — rascunho parado nelas retoma sem tela morta, zero migração.
  8. **Os documentos do caso vão pelo WhatsApp do Curador** (decisão do Fundador na mesma série): a casa não pede upload à paciente — o Curador ganha a tela que gera as peças preenchidas (consentimento e ficha da consulta inicial) para salvar em PDF e mandar na conversa; ela devolve pelo mesmo canal e ele anexa.
- **A régua dos cortes, registrada:** uso zero COM substituto vivo nomeado → o componente SAI (cinco saíram); sem substituto → allowlist do detector de órfãos COM motivo (a copy congelada do dossiê está lá). Nenhuma rota caiu: viraram redirects; nenhuma informação sumiu: mudou de endereço.
- **Revisitar quando:** a primeira Curadoria real mostrar alguém procurando o que saiu de vista (ex.: a régua dos marcos, o item de Documentos no menu); ou quando a aproximação intermediada existir, o que reabre o desenho do pós-decisão.

---

### Emenda à ADR-085 — o Concierge com presença de ferramenta (2026-08-24)

O Fundador, sobre o print do cartão do acompanhamento: *"o Concierge não teria que ter mais destaque? Ele deve funcionar como uma ferramenta e aqui ele está escondido."* A porta "Falar com a Aliviar" deixa de ser só a linha discreta do Track C e ganha duas formas com destaque: **(1)** o card **"Seu Concierge"** fecha o Início em qualquer estado da jornada — vidro, uma frase do que ele faz e botão de verdade; na Mesa ele vive ABAIXO da decisão, nunca no meio da leitura (a doutrina de não empurrar permanece). **(2)** Dentro do cartão do acompanhamento, o botão entra ao lado das ações de registro. As regras do canal seguem intactas: rótulo único, quem responde é a Aliviar, assunto tipado sem texto livre, nenhum horário/SLA, clique não registrado. A linha discreta continua legítima nos pontos de leitura (a guarda de alcançabilidade aceita as duas formas).

---

## ADR-086 — A mesa essencial do Curador: um medidor por tela, a fila leva ao ato

- **Data:** 2026-08-24
- **Status:** Decidida pelo Fundador em duas passadas, na mesma conversa: "o que dá pra cortar e resumir… ver se está intuitivo, se está fácil executar a curadoria" — e, sobre a primeira lista, "tem certeza que não dá pra enxugar mais?".
- **Dependências:** mesma régua da ADR-085 aplicada ao outro lado do balcão · preserva o COS intacto (nenhuma fase, projeção ou domínio mudou — mudaram superfícies) · a doutrina da Fila (contrato 36 §6: grupo não some) e a do copiloto (Experience §3) permanecem.
- **Contexto:** o caminho de executar uma Curadoria era bom no esqueleto (Painel → Caso → Acolher → Mesa → Relatório → Finalizar) e pesado nas paradas: **cinco sistemas de progresso simultâneos** (ConductionPanel + JourneyNavigator no hub; régua de etapas + timeline dupla + linha de investigação na Mesa), um aside de sete seções com duas duplicatas da própria tela, um hub de oito blocos abertos e uma etapa da Mesa que era só um aviso apontando para outra tela.
- **Decisões (1ª passada):**
  1. **Um progresso por tela.** O JourneyNavigator saiu do hub (o ConductionPanel responde "onde estou, o que falta, próximo passo"); o mapa completo segue no aside das etapas. A timeline dupla saiu da Mesa.
  2. **Aside da Mesa: 7 → 4.** "O caso" e "Prioridades do Case" saíram (duplicavam o briefing do hub e a etapa Mapa da própria Mesa — componentes apagados pela régua do substituto vivo); "Investigação" + "Hipóteses" fundiram em **"Leitura do Motor"**.
  3. **O beco do Relatório morreu.** A etapa na Mesa deixou de ser três frases apontando para outra tela e virou o botão "Abrir o Relatório". O estado dela segue na régua, vindo do domínio.
  4. **Hub enxuto.** A história inteira saiu (vive no Acolhimento; o Briefing resume); coluna única.
  5. **A Fila leva ao ato.** "Abrir o caso" virou "Continuar" e aterrissa na etapa devida (Acolhimento, Mesa ou Relatório, conforme o grupo — mapa na camada de tela, nunca no contrato). O hub fica a um "← voltar". Grupos sem ato do Curador seguem levando ao caso, só para ler.
- **Decisões (2ª passada):**
  6. **A "Linha de investigação" saiu** — era o quinto medidor, sem clique, derivado dos mesmos fatos das abas. O vocabulário (hipótese → evidências → conferência → conclusão) segue no domínio, com testes próprios.
  7. **Grupo vazio da Fila vira UMA linha** (título + "0"). A doutrina de não sumir fica; o que saiu foram as três linhas de texto de vazio × 7 grupos.
  8. **O hub recolhe o ocasional:** "Registrar alinhamento", "Registrar observação" e a "Memória da Curadoria" viram dobras fechadas, como o teste de reconstrução já era. Aberto fica o que é leitura de toda visita: condução e briefing.
- **O limite declarado:** o que sobrou é trabalho, não moldura — o juízo por conceito, a comparação do Motor, o Protocolo da Pessoa, as evidências e o editor do Relatório não encolhem sem nova decisão.
- **Revisitar quando:** a primeira Curadoria real mostrar o Curador procurando algo que recolheu (a Memória, um grupo vazio da Fila) — aí abre-se por padrão o que a operação provar que consulta sempre.

---

### 2ª emenda à ADR-085 — a cena da casa, e o Concierge no cabeçalho (2026-08-24)

O Fundador entregou a fotografia do Início (ela em casa, à noite, ao telefone com a pasta da Aliviar — em duas proporções geradas) e pediu "as configurações visuais da landing" na casa da paciente. Três consequências: **(1)** a cena entra em força total como cenário contínuo atrás de toda a área autenticada, servida por `<picture>` responsivo (retrato no celular, 16:9 no computador; WebP+JPEG) — o corredor a 16% de opacidade e a cena-por-etapa do hero saem; o hero vira card de vidro como os demais, e a mensagem da etapa segue carregando o Storytelling Ambiental. **(2)** Com foto em força total, **texto solto sobre a fotografia morreu como recurso**: tudo é card ou está dentro de card — a linha da Jornada entrou no hero; o selo, a data e o PDF entraram na carta do escolhido; o eco da Sala, o material de consulta e a frase final viraram vidro. Um véu de marfim leve (34→58%) protege o que o card não cobre. **(3)** O Concierge muda de casa pela segunda vez, agora em definitivo: *"eu não quero Concierge lá embaixo"* — o card do fim (1ª emenda) dá lugar ao **botão fixo no cabeçalho** do shell, presente em toda tela; o botão que ficava dentro do cartão do acompanhamento sai por redundância ("acho que isso não precisa"). As regras do canal seguem intactas. **Calibragem da mesma data, feita na aba local:** *"os cards podem começar dessa linha pra baixo"* — o conteúdo do shell começa **abaixo da dobra da fotografia** (cerca de metade da tela no celular; recuo menor no computador, onde a cena é 16:9), para quem chega VER o ambiente antes de qualquer leitura. É a gramática da vitrine aplicada à casa: a área livre da foto é planejada, o card pousa nela.

---

## ADR-087 — A visão essencial do Administrador: uma pergunta, seis números

- **Data:** 2026-08-24
- **Status:** Decidida pelo Fundador em duas passadas, na mesma conversa da ADR-086 ("agora vamos fazer outra auditoria de corte e resumo, dessa vez no administrador… sem card e arte" — e, sobre a primeira lista, "quer ver se dá pra enxugar mais?").
- **Dependências:** mesma régua das ADR-085/086 aplicada ao terceiro papel · executa no dashboard a lógica que a **ADR-075** já tinha executado no CRM (ferramenta de volume sem volume sai) · preserva o contrato 34 §6.5 (métrica só quando medida — e média com n=1 é ruído vestido de gestão) · o módulo de métricas (`dashboard-metrics`) fica INTEIRO no domínio, pronto para quando o Observatório tiver volume para desenhar.
- **Contexto:** a Visão geral era um cockpit de frota para uma operação de poucos casos — 16 números em 4 seções, 5 gráficos (funil, tendência, três de barras), pessoas por papel, log de auditoria, pendências e o Kit. As listas do admin já eram magras e o wizard do profissional já tinha ido de 6 a 4 etapas; o excesso morava numa tela só.
- **Decisões (1ª passada):**
  1. **Os 5 gráficos saem** — componentes apagados pela régua do substituto vivo (308 linhas); com volume ~zero, gráfico é decoração.
  2. **Aquisição e Tempos médios saem** (leads novos, em qualificação, conversão, e as duas médias de horas). O **seletor de período** sai junto: os números que ficaram são fotografias do agora, não séries.
  3. **"Pessoas por papel" (+ o aviso de acúmulo de níveis) e "Atividade recente" mudam para /admin/equipe** — papéis vivem onde papéis se concedem.
- **Decisões (2ª passada):**
  4. **A seção "Operação" some:** "Cases abertos" e "Pacientes ativos" eram as listas do menu disfarçadas de indicador; **"Documentos pendentes" sobe** para "Onde agir agora", com ênfase, porque é pendência de verdade.
  5. **Na ficha do contato (CRM), Tarefas e Agenda recolhem** em dobras fechadas com contador no título. A garantia da ADR-075 fica intacta — os atos comerciais vivem na ficha; deixam apenas de gritar em toda visita. Registro e Linha do tempo seguem abertos.
- **Resultado:** a Visão geral responde UMA pergunta — "o que precisa de alguém agora?" — com seis números (histórias aguardando Case, sem responsável, atrasados, tarefas vencidas, compromissos em 7 dias, documentos pendentes), a lista de publicações pendentes e o Kit da Curadoria.
- **Revisitar quando:** o Observatório tiver série real para desenhar (os gráficos voltam pelo módulo que ficou); ou o volume de leads fizer falta às métricas de aquisição.

---

## ADR-088 — Autodeclaração não elimina: a proveniência do fato entra no filtro obrigatório, e "onde atende" ganha a tela que nunca teve

- **Data:** 2026-08-25
- **Status:** Decidida pelo Fundador na conversa de fechamento da Curadoria simulada ("oq voce faria se fosse eu?" → recomendação apresentada nas duas frentes → "execute as outras duas"). As duas eram as únicas decisões de Método que a travessia devolveu a ele: os achados **SIM-07** e **SIM-08** do `REGISTRO_UNICO_DE_ACHADOS.md`.
- **Dependências:** nasce da Curadoria simulada de 25/08 · corrige pela raiz o remendo de 24/08 (ADR-079, que fez o filtro cair para o cadastro quando o levantamento está vazio) · preserva a ADR-041 (a leitura de compatibilidade é do Motor; nada aqui recalcula) e a ADR-042 (não há saldo nem nota) · **não abre a ADR-073**: ver "Sobre o congelamento", abaixo.

### Contexto

O filtro obrigatório da Mesa é o único mecanismo do produto que **elimina** alguém de uma Curadoria. Eliminar é o ato mais pesado que a Mesa pratica, e é o único cujo efeito a paciente nunca pode auditar: ela jamais fica sabendo do caminho que não lhe foi apresentado.

A travessia de 25/08 mostrou duas coisas sobre esse mecanismo, e as duas eram estruturais.

**Primeira (SIM-07): o filtro eliminava com base em autodeclaração, em silêncio.** O fato de "cuidado contínuo" vive em duas camadas — o Protocolo da Prática Profissional (29 perguntas, rico, alimentado, com fonte e nível declarados) e um booleano em `professional_care_model` (pobre, ligado ao filtro, escrito por tela nenhuma). O conserto de 24/08 fez o filtro cair para `professional_profiles.offers_continuous_care` quando o levantamento está vazio — o que destravou a Mesa, mas transferiu para uma autodeclaração o poder de eliminar. A pergunta que sobrou para o Fundador: **um filtro eliminatório pode ser satisfeito pela palavra do próprio profissional?**

**Segunda (SIM-08): "onde atende" não tinha tela.** As colunas `professional_care_model.states` e `.cities` existem desde 27/07, com selo de verificação e tudo. Nenhuma tela do produto as escrevia. Efeito na operação: qualquer Case que exigisse atendimento numa UF específica travava — todos os profissionais em "informação não localizada", para sempre, sem que clique algum pudesse resolver. O `crm_uf` do Cadastro **não** serve de substituto: é o estado do registro no conselho, que é outro fato — um médico registrado em SP pode atender só na Bahia.

### Decisões

1. **Só fato VERIFICADO elimina.** O filtro obrigatório passa a carregar a proveniência do fato que confere (`FilterFactOrigin`: `VERIFICADO` · `AUTODECLARADO` · `AUSENTE`). Eliminação exige fato conferido contra fonte, com proveniência registrada.

2. **Autodeclaração que contraria a exigência vira ressalva nomeada, nunca eliminação.** O profissional continua elegível, comparável e selecionável; a frase de estado diz o que foi declarado, por quem, e devolve o ato a quem é dele: *"o próprio profissional declarou não atender, e ninguém conferiu. Confirme com ele antes de compor, ou deixe de fora com a sua razão escrita."* As duas saídas são legítimas — o que deixa de existir é a terceira, que era sumir com ele sem que ninguém soubesse.

3. **A origem do fato aparece ao lado do fato, na tela do Curador.** Um "não atende" verificado e um "não atende" que o profissional disse de si levam a atos diferentes, e a Mesa mostrava os dois com a mesma cara. É o mesmo princípio que já separa `SEM_REGISTRO` de `NAO_INFORMADO` na comparação: a tela não achata distinção que muda a conduta.

4. **A ausência de informação continua sendo pendência, não ressalva.** Se falta o fato, o estado permanece `PENDENTE_DE_INFORMACAO` com a frase de sempre ("verificar o cadastro, não descartar") — e a ressalva autodeclarada, quando houver, é dita junto. Um verificado que elimina tem precedência sobre qualquer ressalva.

5. **"Onde atende" ganha bloco próprio na etapa Rede do cadastro**, ao lado da Área de Atuação, com UFs, cidades, fonte e selo de verificação. Mesmas duas regras da área: declaração vazia não é declaração (ao menos uma UF), e verificar exige fonte. A gravação é **parcial de propósito** — esta tela é dona de `states`, `cities` e da proveniência, e de mais nada: zerar colunas de outros atos foi exatamente como a edição de profissional apagou competências uma vez (FS-03).

6. **Sem UF, a porta diz o custo — e não tranca.** Igual ao aviso do Mapa (F-9): publicar continua permitido, mas quem publica lê o que isso custa na Mesa, em vez de o Curador descobrir no meio de uma Curadoria que não anda. Nenhuma pendência de publicação nova foi criada: apertar a porta seria decisão de outra natureza, e não foi esta que se tomou.

### Sobre o congelamento (ADR-073)

Nenhum dos dois é construção nova, e o Fundador foi avisado disso antes da execução:

- O item 1–4 **muda uma regra existente** que se provou errada no uso real — o filtro que eliminava por autodeclaração.
- O item 5 **não cria campo nenhum**: as colunas existem desde julho. O que faltava era a tela, e um dado obrigatório sem superfície de coleta é peça quebrada, não funcionalidade ausente.

A ADR-073 permite "corrigir defeito visto no uso real". É exatamente esta a leitura aplicada, e ela fica registrada aqui para não virar precedente frouxo: **o critério não é "seria útil", é "a operação travou e alguém viu travar"**.

### O que NÃO se decidiu

- **Não se decidiu que autodeclaração vale menos.** O Protocolo continua sendo a camada viva do Método, e é dele que sai a comparação rica. O que se decidiu é que autodeclaração não tem força de **eliminar**.
- **Não se ligou o Protocolo ao filtro.** Continua havendo dois modelos paralelos da mesma realidade, e a unificação é trabalho de desenho, para o descongelamento.
- **Não se apertou a porta de publicação.** Ver decisão 6.

### Revisitar quando

Um Case real for eliminado — ou deixar de ser — por um destes filtros, e o Curador contar o que aconteceu na conversa com o profissional. É o primeiro dado verdadeiro que este desenho vai receber; até lá, ele é a hipótese mais honesta disponível.

---

## ADR-089 — Medir a Curadoria: instrumento não é funcionalidade

- **Data:** 2026-08-25
- **Status:** Decidida pelo Fundador na conversa sobre o que melhorar na operação completa ("meça o tempo entao"), depois de eu apresentar a medição como a única melhoria que **transforma as outras quatro de opinião em decisão**.
- **Dependências:** nasce da Curadoria simulada de 25/08 · responde à pergunta aberta do Fundador de 24/08 ("será que cortando algumas coisas, simplificando, pode ajudar?") · **relação com a ADR-073 tratada explicitamente abaixo, não contornada**.

### Contexto

A operação da Aliviar nunca foi medida. Uma Curadoria completa exige da ordem de 56 atos de juízo — 29 subcritérios do Mapa, 15 conversas do Protocolo da Pessoa, as declarações de área, os juízos técnicos, as justificativas dos três caminhos — e não existe um único número sobre quanto isso custa em tempo.

O efeito prático dessa ausência apareceu numa conversa real: o Fundador perguntou se simplificar ajudaria, e a resposta honesta foi que ninguém sabe. Sem medição, "o Mapa de 29 é demais" e "o Mapa de 29 está certo" são a mesma frase com o sinal trocado. Pior: um corte feito sem medida tem chance alta de acertar a etapa que *parece* longa na tela em vez da que *consome* o tempo.

### Sobre a ADR-073 — dito em voz alta, não contornado

Medir não é conserto de defeito. É construção, e a ADR-073 congela construção. Isto foi dito ao Fundador antes da execução, e a leitura sob a qual se seguiu fica registrada aqui:

**Instrumento não é funcionalidade.** O congelamento existe para que a primeira Curadoria real aconteça e produza evidência. Instrumento que chega *depois* do fato não mede o fato — e a primeira Curadoria real é exatamente o evento que a ADR-073 está esperando. Construir a medição depois dela seria perder a única primeira vez que existe.

O critério que impede esta leitura de virar precedente frouxo: **vale para o que observa a operação sem alterá-la**. Nada aqui muda o que qualquer operador vê, faz ou pode fazer. Se uma construção futura se justificar por "é só instrumento" mas mudar o trabalho de alguém, não é este caso.

### Decisões

1. **Medir é ler, não instrumentar.** Cada ato da Curadoria já datava a si mesmo desde que foi construído: `case_priority_map.created_at` (um por subcritério), `case_needs.declared_at` (uma por conversa), `area_compatibility_declarations`, `criterion_declarations`, `consultation_records.understanding_confirmed_at`, `emitted_at`, `delivered_at`, `decided_at`. **Zero tabela nova, zero coluna nova, zero migration, zero escrita.** É a quarta vez nesta sessão que o banco se prova à frente das telas.

2. **Duas grandezas, nunca uma.** Um número só mentiria de um jeito difícil de perceber.
   - **Espera** — tempo de relógio entre o fim de uma etapa e o fim da seguinte. Inclui noite, fim de semana e a espera pela paciente. É o tempo que *ela* sente passando; não é esforço de ninguém.
   - **Janela** — do primeiro ao último registro dentro da etapa. É o mais perto de "quanto tempo alguém ficou nisso" que este dado permite, e é declarado como **piso, nunca medida de esforço**: quem abre a Mesa e almoça infla a janela; quem prepara no papel e registra de uma vez a esvazia.
   - **Atos** — quantos registros a etapa exigiu. É o único dos três sem ressalva.

3. **Ausência nunca vira zero.** Etapa que não aconteceu, data ilegível e relógio para trás devolvem "sem medida", não um instante plausível. Um relatório de tempo que se apresenta como exato é pior que nenhum — ele autoriza cortar o Método com falsa confiança. Travado em teste.

4. **Isto mede o Método, não a pessoa.** Cada Case tem um Curador, então o dado é inevitavelmente atribuível. As escolhas de desenho que fecham a porta da vigilância: o módulo não carrega autoria, não ordena por duração (ordenar por "quem demorou" é o primeiro passo da deriva) e não produz nenhum agregado por Curador. A pergunta é "quanto custa esta etapa", nunca "quem é lento".

5. **A superfície é do Administrador e NÃO do Curador.** Cronômetro à vista de quem exerce juízo clínico pressiona esse juízo, e pressa é o que o Método menos quer comprar. Além disso corromperia a própria medição: ninguém mede bem o que se sabe medido.

6. **Nenhum conteúdo clínico atravessa o módulo.** Os `select` pedem data e nada mais. A RLS continua sendo a autoridade — quem chama passa o próprio cliente, não há `service_role` e não há capability nova: a medição não enxerga mais do que quem a pediu.

### O que esta decisão NÃO autoriza

- **Não autoriza cortar nada do Método.** Ela produz o número; a decisão de simplificar continua sendo do Fundador, e agora com dado em vez de impressão.
- **Não é observabilidade de produto.** Não há série temporal, não há gráfico, não há painel — pela mesma régua da ADR-087: com volume próximo de zero, gráfico é decoração.
- **Não mede o Concierge.** O acompanhamento não tem atos datados suficientes para medir, e inventar marcos seria instrumentar — exatamente o que esta ADR diz que não se fez.

### Revisitar quando

Houver três Curadorias reais medidas. Aí o número deixa de ser anedota e a conversa sobre simplificar o Método pode acontecer de verdade — inclusive a análise de sobreposição entre os 29 do Mapa e as 15 conversas, que hoje é suspeita minha sem nenhuma evidência.

---

## ADR-090 — O contrato único de formulário: a tela conta a verdade sobre o que acabou de acontecer

- **Data:** 2026-08-25
- **Status:** **Decisão de desenho, aprovada pelo Fundador; execução adiada por escolha do engenheiro.** Ele autorizou ("pode alterar o que quiser se achar que vai ficar melhor"); a execução fica para sessão fresca, pelo motivo registrado em "Por que decidir hoje e construir depois".
- **Dependências:** nasce da Curadoria simulada de 25/08 · **supersede em substância** o tratamento caso-a-caso que `FS-02` e `FS-07` deram à mesma família em agosto · consome os achados **SIM-03** (7 formulários que não disparavam) e **SIM-22** (a recusa apaga o que foi digitado).

### Contexto — o defeito que já voltou três vezes

Em 25/08, quatro defeitos diferentes apareceram em quatro telas diferentes:

1. sete formulários cujo envio não fazia nada, sem erro (manhã);
2. o juízo técnico falhando com "não foi possível concluir o ato agora", enquanto a ação devolvia o motivo e a tela o descartava;
3. o limite de 280 caracteres da conclusão parando a digitação sem contador nem aviso — parede muda;
4. a recusa do "onde atende" apagando as UFs, as cidades e a fonte que o Administrador tinha acabado de digitar.

São quatro sintomas de **uma coisa só**: a tela não conta a verdade sobre o que acabou de acontecer.

E não é a primeira vez. A auditoria de agosto varreu esta família duas vezes — `FS-02` (autosave mentindo em sessão expirada) e `FS-07` (controle de fluxo por substring de mensagem) — e marcou as duas como resolvidas. Voltou.

**Quando o mesmo defeito volta pela terceira vez, não é descuido: é ausência de contrato.** Hoje o produto tem **18 formulários em 14 arquivos**, e cada um inventa como envia, como espera, como falha e como avisa. São dezoito invenções, cada uma com sua chance de errar — e o custo de cada erro recai sobre quem está operando, não sobre quem programou.

### Decisão — as cinco garantias

Fica instituído um contrato único de formulário. Todo formulário do produto passa a garantir, sem exceção:

1. **A recusa preserva o que foi digitado.** Campos controlados por padrão. `<form action>` do React 19 reseta campos não-controlados depois da ação — dê certo ou dê errado —, e isso transforma "corrija um campo" em "redigite tudo". O projeto já tinha essa doutrina escrita em outro lugar ("erro preserva o contexto: a escolha e a nota dela ficam onde estão"); ela passa a valer em todo lugar.

2. **A falha diz o motivo.** Quando a ação devolve uma causa sanitizada, a tela a mostra. Mensagem genérica sozinha é beco sem saída: quem opera perde o ato, não sabe o que corrigir e não sabe a quem recorrer. O motivo aparece **só na falha** — nos desfechos que não são erro, detalhe técnico é ruído.

3. **Todo limite é contado antes de ser atingido.** Campo com regra mostra a regra: contador desde o início, e no limite uma frase que diz **de quem é a regra**. Saber quanto cabe muda o que se escreve, e essa informação chega tarde demais no último caractere. Uma tela que tem regra e não a conta faz a regra parecer defeito de teclado.

4. **O estado de espera é um só, e termina.** Nenhum botão parado em "Aguarde…" para sempre. Sucesso, falha e espera são três estados nomeados — nunca a ausência de um deles.

5. **Sucesso idempotente não parece falha.** "Já estava gravado" é sucesso e se apresenta como tal.

### O que faz a decisão durar: a guarda

O componente não é a decisão — a **guarda** é. Um contrato sem teste que o imponha dura até a próxima pressa.

A guarda recusa formulário fora do contrato, no mesmo espírito das nove que barraram o engenheiro em 25/08 (publicação sem autoria, transição sem ator, policy larga, história enviada, devolução reconhecida, acoplamento ao Método, paleta, rastreabilidade). Nenhuma delas foi contornada, e é por isso que elas funcionam.

**Adoção incremental, com a lista explícita:** a guarda nasce com a relação dos formulários já conformes e falha quando um formulário NOVO aparece fora do contrato. Isso congela o problema no tamanho de hoje sem exigir que os 18 sejam migrados de uma vez — e cada migração remove uma linha da lista de exceções, que é o placar visível do trabalho.

### Por que decidir hoje e construir depois

A execução foi autorizada e mesmo assim adiada, e o motivo fica registrado porque ele vale mais que a pressa:

- São **18 formulários em 14 arquivos**, e cada um exige verificação na tela — não só suíte verde. Foi exatamente uma suíte verde que deixou passar os quatro defeitos acima.
- A decisão foi tomada no fim de uma sessão longa, em que o engenheiro errou várias vezes (todas apanhadas por guarda, banco ou pelo próprio Fundador). Erros se agrupam com cansaço, e esta refatoração toca **justamente a camada onde os defeitos nascem**.
- Um contrato mal executado é pior que nenhum: ele dá a sensação de proteção sem a proteção — que é o defeito que este produto combate desde o Bloco D.

O que esta ADR entrega é o que torna a construção barata e segura: o desenho decidido. Quem executar não começa explorando.

### Sobre a ADR-073

Isto é **construção**, e o congelamento a barra. A decisão de desenho não é construção e pode ser lavrada agora; a execução exige que o Fundador suspenda a ADR-073 para esta fatia, ou que ela aconteça já no descongelamento — que é o que se recomenda, por ser a primeira coisa a fazer quando ele vier.

### Revisitar quando

A guarda existir e a lista de exceções chegar a zero. Aí esta ADR deixa de ser plano e vira descrição — e a família de defeitos que voltou três vezes deixa de ter por onde voltar.

---

## ADR-091 — A posição do Case é derivada dos atos; `status` fica com o que só ele sabe dizer

- **Data:** 2026-08-25
- **Status:** **Decidida pelo Fundador** ("corrija e execute"). **Execução adiada pelo engenheiro**, com o escopo real apurado e registrado abaixo — a decisão está tomada; o que falta é a hora certa de executá-la.
- **Dependências:** resolve **`FUN-03`** (auditoria de agosto: "`cases.status` desconectado do fluxo real; 100% NEW em dado") e **`SIM-15`** (o mesmo defeito, agora visto acontecendo numa travessia) · aplica a doutrina da **ADR-066/11-08**: *nenhum fato tem duas fontes concorrentes*.

### Contexto

Durante a Curadoria percorrida em 25/08, o Case nasceu `NEW` e permaneceu `NEW` com o Acolhimento concluído, o Mapa dos 29 salvo e a Rede declarada. Não é defeito novo: é o `FUN-03`, que a auditoria de agosto mediu como "100% NEW em dado".

A investigação do mesmo dia mostrou o que faltava saber:

- `changeCaseStatus` existe, valida a transição e **ninguém o chama** durante a jornada;
- o produto **já deriva a posição dos atos**, e bem: a Fila do Curador agrupa em "Aguarda Acolhimento", "Aguarda o reconhecimento dela", "Curadoria em curso", "Aguarda entrega", "Aguarda a decisão dela", "Com o Concierge" — tudo derivado, e funcionando na tela;
- portanto `status` é uma **segunda fonte para o mesmo fato**.

E duas fontes para um fato é exatamente o que a ADR-066/11-08 proibiu, com a frase que este projeto já usou uma vez para consertar a decisão da paciente: *"nenhum fato tem duas fontes concorrentes"*. Quando existem duas, uma delas mente — e aqui a que mente é a que ninguém move.

### Decisão

**A posição de um Case na jornada é derivada dos atos do Método. Sempre, e só.** Nenhuma tela, nenhum papel e nenhum relatório lê `cases.status` para saber onde a Curadoria está.

**`status` fica com o que só ele sabe dizer:** os estados administrativos que não correspondem a ato nenhum do Método — o Case encerrado e o Case cancelado. Esses não são deriváveis, porque não nascem de um ato da Curadoria: nascem de uma decisão sobre o Case.

Os estados que espelham a jornada (`IN_REVIEW`, `WAITING_FOR_INFORMATION`, `READY_FOR_CURATION`, `IN_CURATION`, `HUMAN_REVIEW`, `DELIVERED`) saem — não porque estejam errados, mas porque são a segunda cópia de algo que os atos já dizem melhor e sem risco de divergir.

### O escopo real, apurado antes de prometer

A investigação corrigiu a premissa de que isto seria "apagar código morto". **Não é.** O conceito vive em quatro lugares, e a execução precisa tocar os quatro na ordem certa:

| Onde | O que é | Cuidado |
|---|---|---|
| Enum `curadoria.case_status` | nove valores | remover rótulo de enum é **migration em produção** |
| `enforce_case_status_transition_trigger` | o banco garante a máquina | a garantia precisa continuar valendo para o que ficar |
| `src/modules/cases/state-machine.ts` | a mesma máquina espelhada na aplicação (ADR-019: o banco garante, a aplicação explica) | a tabela de transições encolhe junto |
| `/admin/casos/[id]` | tela alcançável, com o controle de mudança de status | superfície que **ninguém percorreu**; mexer sem percorrer é consertar no escuro |

Por isso a execução foi adiada mesmo com a decisão tomada e autorizada: ela exige migration em produção e uma travessia da tela do Administrador. É a mesma régua aplicada à ADR-090 no mesmo dia — e aplicá-la aqui, logo depois de o Fundador dizer "execute", é a única forma de a régua valer.

### O que fecha esta ADR

1. A tela de `/admin/casos/[id]` percorrida, para saber o que o controle faz hoje e quem depende dele;
2. A migration que encolhe o enum, com o rollback escrito;
3. A máquina de estados e o trigger reduzidos aos estados administrativos;
4. `FUN-03` e `SIM-15` encerrados no registro, com a evidência.

### Revisitar quando

Aparecer um estado administrativo que os atos não expliquem — e a pergunta a fazer será a mesma: *isto é fato próprio, ou é a segunda cópia de algo que já existe?*

---

## ADR-092 — O Mapa do Profissional pertence à publicação: quem oferece já olhou

- **Data:** 2026-08-25
- **Status:** **Proposta pelo Engenheiro Líder, aguardando ratificação do Fundador.** A decisão é de Método; a execução da guarda fica para o descongelamento.
- **Dependências:** responde `SIM-31` · **ADR-040 item 6** (escrita do Mapa é do Administrador) · **ADR-041** (a matriz do Motor) · **ADR-060** ("quem avalia não atesta") · **ADR-068 item 6** (quem confirma o Mapa não julga o profissional no mesmo Case) · **ADR-073** (congelamento — por isso decide-se agora e constrói-se depois).

### Contexto

A Curadoria percorrida em 25/08 devolveu, para os três profissionais, a mesma leitura: *"0 altas · 0 médias · 23 lacunas de informação"*. A paciente abriu a comparação dos três caminhos e leu uma comparação que não comparava nada.

A investigação mostrou que **o Motor não estava quebrado — estava sem alimento**. `professional_subcriterion_map` estava vazia. Preenchido o Mapa de uma profissional pela tela que já existe, a leitura virou **7 altas · 3 médias · 13 lacunas**, com os outros dois inalterados ao lado. Nenhuma linha de código precisou mudar.

Restava a pergunta que nenhum dos cinco guias operacionais responde: **quem preenche o Mapa do Profissional, e quando?**

O "quem" já estava decidido e ninguém tinha percebido: a RLS `professional_subcriterion_map_write_admin` dá a escrita ao **Administrador**, e a ADR-040 item 6 diz o mesmo por extenso. O que faltava era o **quando** — e a ausência tinha uma consequência exata, encontrada no gatilho `assert_publication_requirements`:

> A publicação exige CRM e UF, registro regular no conselho, e área de atuação verificada. **Não exige o Mapa.**

Um profissional entra na Rede — torna-se oferecível a uma paciente real — com o Mapa em branco.

### Decisão

**O Mapa do Profissional é parte do que torna um profissional publicável.** Ele pertence ao mesmo momento das outras verificações: antes de a Rede poder oferecê-lo, não depois de um Case precisar dele.

A razão é o que a publicação significa. Publicar é declarar *"este profissional pode ser oferecido a alguém que está decidindo sobre a própria saúde"*. Oferecer sem Mapa não é oferecer com menos informação — é oferecer **um nome que o Método não consegue comparar com nada**, e deixar a paciente diante de uma tabela de lacunas assinada pela Aliviar.

**A exigência NÃO é completude.** A tela do Mapa já diz, e está certa: *"a completude é informação, não etapa obrigatória"*. Ela distingue duas coisas que não são a mesma:

- **"Ainda não avaliado"** — ninguém tratou o subcritério;
- **"Não informado"** — alguém tratou, e não havia informação suficiente.

**O que a publicação passa a exigir é que nenhum subcritério lido pelo Motor esteja em "ainda não avaliado".** `NAO_INFORMADO` é resposta legítima e continua sendo — ela diz "olhamos e não sabemos", que é informação verdadeira e útil ao Curador. O que deixa de ser aceitável é "ninguém olhou", disfarçado de lacuna.

Os quatro conceitos com `MOTOR_PARTICIPATION = NUNCA` (convênio, custo, preferências e restrições dela, condução de notícias difíceis) ficam fora da exigência, pela mesma razão que ficam fora do Motor.

### Consequências

1. **Trabalho de operação, dimensionado:** 25 juízos por profissional, feitos por quem verificou — não digitação. Para os profissionais já publicados, é dívida a pagar antes da primeira Curadoria real.
2. **A separação de papéis já está de pé:** o Administrador escreve o Mapa, o Curador julga e seleciona. É o que a ADR-068 item 6 exige, e a arquitetura já cumpre — o que ainda não se cumpre é a segunda conta da ADR-060, e essa exceção segue datada e visível.
3. **A guarda não entra agora.** Sob a ADR-073, esta ADR decide e não constrói. Acrescentar a exigência a `assert_publication_requirements` exige migration em produção e despublicaria profissionais já publicados — decisão de operação, não de código.

### O que fecha esta ADR

1. Ratificação do Fundador;
2. Os Mapas dos profissionais **já publicados** preenchidos à mão, com `SIM-31` encerrado;
3. No descongelamento, a exigência acrescentada a `assert_publication_requirements`, com teste que prove que um perfil sem Mapa tratado não publica;
4. Os cinco guias operacionais atualizados — hoje nenhum menciona o Mapa.

### Revisitar quando

A Camada de Derivação (`SIM-32`) passar a propor estados a partir de `practice_evidence`. Aí o Mapa deixa de ser 25 juízos digitados e passa a ser 25 confirmações informadas — e o custo desta decisão cai por um caminho que a ADR-068 já previu.

---

## ADR-093 — A Mesa se organiza pelas frases dela, não pela taxonomia do Método

- **Data:** 2026-08-25
- **Status:** **Decidida pelo Fundador** — "eu concordo em mudar pra sua ideia, pode executar da maneira que preferir". Proposta pelo Engenheiro Líder a partir da simulação do primeiro dia.
- **Congelamento:** **a ADR-073 fica suspensa para esta obra, por decisão expressa do Fundador em 25/08.** Ela permanece em vigor para todo o resto. Esta linha existe para que a suspensão tenha data, autor e escopo — e não vire precedente para contornar o congelamento em silêncio.
- **Dependências:** **ADR-041** (a matriz do Motor — intocada) · **ADR-068** ("28 digitações em 28 confirmações informadas") · **ADR-039/040** (as duas declarações que o Motor cruza) · responde ao desconforto que a travessia de 25/08 tornou visível.

### Contexto

A Mesa foi percorrida duas vezes. Da segunda, com os três Mapas do Profissional preenchidos antes — o que nunca havia acontecido.

O problema que apareceu não é defeito: é **ordem**. O trabalho do Curador tem cinco partes — entender o que importa para ela, saber o que é verdade sobre cada profissional, ver onde isso se encontra, escolher três, e escrever de modo que ela consiga decidir. **A terceira parte é a única mecânica, e é justamente a que o Motor faz sozinho.**

Mas a tela é dominada pela *entrada de dados* dessa parte mecânica: 29 classificações de importância, 29 estados por profissional, 18 juízos — quase oitenta atos, quase todos dentro de uma grade. O juízo humano, que é o produto, aparece depois, embaixo, em caixas de texto.

**A Mesa põe em primeiro plano a única coisa que não precisava de gente.**

E há uma perda concreta nisso. Ela escreveu, com as palavras dela: *"queria alguém que me explicasse as opções e que continuasse comigo depois, não só no dia da consulta"*. Alguém precisa decidir que essa frase significa `MODELO_ALTERNATIVAS` e `CONTINUIDADE_RETORNOS` como muito importantes. **Essa tradução é o ato mais valioso da etapa, e hoje ela não deixa rastro nenhum** — a grade guarda o resultado e perde o raciocínio. Ninguém consegue auditar, aprender, nem explicar a ela por que a coordenação entre profissionais ficou como relevante.

### Decisão

**A Mesa deixa de ser uma bancada e passa a ser o documento que ela vai ler, sendo escrito.**

**Colunas:** os candidatos. **Linhas: as preocupações dela, nas palavras dela** — vindas do Protocolo da Pessoa e da história, não da taxonomia.

Cada célula mostra o que se sabe, com procedência e com a lacuna visível. O Motor preenche o que alcança; o Curador escreve o juízo onde o Motor não alcança.

**Os 29 subcritérios não somem: viram o vocabulário atrás de cada linha.** "Que me expliquem as opções" é `MODELO_COMUNICACAO` + `MODELO_ALTERNATIVAS` + `MODELO_DECISAO_COMPARTILHADA`. O Curador trabalha na frase dela; o Método continua rodando embaixo.

**Quatro consequências:**

1. O Curador nunca perde a pessoa de vista — tudo o que ele faz está debaixo de algo que ela disse.
2. **A comparação que ela vai ler é literalmente o que está sendo construído.** Hoje existe uma tradução no fim, da matriz para os três caminhos, e é aí que o sentido se perde.
3. O tamanho passa a ser o do caso, não o da taxonomia. Ela trouxe quatro ou cinco preocupações — são quatro ou cinco linhas, não 29 das quais metade não a toca.
4. **As lacunas viram tarefa.** Em vez de *"23 lacunas de informação"*, a tela diz *"não sabemos se a Cecília acompanha depois — e é o que ela mais pediu"*. A primeira frase não é acionável; a segunda é.

### A objeção, e a resposta

**Os 29 subcritérios existem exatamente para o Curador não olhar só onde ele já pensaria em olhar.** Ela não sabe pedir "limites de atuação"; nenhuma paciente sabe. Linhas tiradas só das frases dela transformariam a Curadoria num espelho das preocupações dela — o oposto de curadoria, e um jeito novo de a Aliviar decidir com aparência de método.

Isso seria fatal se não fosse resolvido, e resolve-se sem inventar nada:

**Os 29 continuam rodando atrás, como conferência de completude.** Ao fim da etapa, a Mesa pergunta: *"estes oito subcritérios não correspondem a nada que ela disse. Confirma que não influenciam este caso?"* — que é precisamente a função de `NAO_INFLUENCIA`, já existente no Método e já no Motor.

A cobertura continua total. **O que muda é a ordem:** começa-se pela pessoa e termina-se pela conferência, em vez de começar pela taxonomia e terminar tentando lembrar dela.

### O que NÃO muda

Nada do Método. O Motor continua cruzando `Importância × Estado` com as mesmas quinze células e os mesmos quatro resultados. Continua devolvendo contagens e nunca notas. A conclusão continua sendo do Curador, registrada, versionada e auditável. `NAO_INFORMADO` continua significando "olhamos e não sabemos", e `null` continua sendo regime anterior à autoria.

**Esta ADR muda a superfície, não a doutrina.**

### O material: papel aqui, vidro lá

Perguntado em 25/08 se o vidro da **ADR-084** valia para esta tela, o Fundador
respondeu: *"na Mesa do Curador não, somente na visão do paciente"*.

A ADR-084 fica como está. O vidro é da casa dela — a área autenticada da
paciente é "a continuação da landing", e por isso reabriu o Sistema Visual §3.
**A Mesa do Curador é instrumento de trabalho: papel opaco, alto contraste, sem
efeito.** Isso não é omissão a corrigir depois; é a regra.

Eu escrevi aqui, na primeira redação, que esta ADR "passava a dever" o vidro na
saída da paciente. **Não devia: já estava feito.** `carta-caminho.tsx` monta
cada um dos três caminhos com `patient-carta patient-veu` desde a ADR-084.

Fica registrado porque o erro é do tipo que se repete: eu supus a dívida em vez
de conferir, e só fui olhar o arquivo quando chegou a hora de pagá-la. Conferir
custou uma consulta; construir por cima do que já existia teria custado uma
segunda superfície para o mesmo ato — exatamente o que a ADR-066/11-08 proíbe.

### O que fecha esta ADR

1. As linhas derivadas do Protocolo da Pessoa, com a frase dela visível em cada uma;
2. A conferência final de `NAO_INFLUENCIA` sobre os subcritérios órfãos, com teste que prove que nenhum dos 29 escapa da cobertura;
3. A Mesa antiga removida — não mantida em paralelo: duas superfícies para o mesmo ato é a segunda fonte que a ADR-066/11-08 proíbe;
4. **Os cinco guias operacionais reescritos** — eles ensinam a Mesa antiga passo a passo, e um guia que descreve uma tela que não existe mais é pior que guia nenhum: quem o segue conclui que o software quebrou. A revisão de 25/08 já achou um erro anterior a esta ADR (`SIM-40`);
5. Uma travessia completa na Mesa nova, com o resultado comparado ao que a Mesa velha produziria.

### Revisitar quando

Uma Curadoria real mostrar que as preocupações dela não cabem em linhas — que a pessoa não trouxe frases, e sim silêncio. Aí a pergunta muda: **o que a Mesa mostra quando ela não sabe o que pedir?**

---

## ADR-094 — O juízo humano é condição de emissão, ou o Método para de chamá-lo de exigido

- **Data:** 2026-08-25
- **Status:** **DECIDIDA PELO FUNDADOR em 2026-08-25 — saída A.** O juízo humano passa a ser condição de emissão. Nasce do `SIM-51`, achado na travessia da ADR-093.
- **Congelamento:** a ADR-073 fica suspensa para esta construção, pela mesma razão e no mesmo dia em que foi suspensa para a ADR-093. A suspensão é desta guarda e de mais nada.
- **Dependências:** **ADR-067 §5** (H8–H10 sempre exigidos; H11 quando o Case declarou grau) · **ADR-065** (condução de notícias difíceis exige cruzamento humano) · **ADR-092** (precedente direto: publicar passou a exigir o Mapa tratado) · **ADR-035** (a seleção é exclusivamente do Curador) · **ADR-073** (congelamento — por isso decide-se agora e constrói-se depois)

### O fato

Na travessia de 25/08, o caso `f347924a` estava assim:

| | |
| --- | --- |
| Relatório emitido | 25/08, 16:50 |
| Relatório entregue à paciente | 25/08, 16:51 |
| `curator_judgments` | **vazia** |

A ADR-067 §5 exige três juízos técnicos por profissional, **sempre**. Com três
profissionais, eram nove. Nenhum foi registrado, e a Curadoria chegou à
paciente.

**Não é regressão da Mesa nova, e isso foi verificado antes de escrever esta
ADR.** `validateMesaClosure`, a regra de encerramento da Mesa antiga — lida de
`HEAD~1` porque o arquivo já saiu —, exigia três opções, os pareceres de cada
uma e a razão da composição. **Nunca os juízos.** `emitReportAction` também não
os consulta. E `lacunasDeJuizo`, a função que sabe dizer o que falta, tem **um
único chamador em todo o `src/`**: o painel de atenção, nascido em 25/08.

O buraco é anterior às duas Mesas e sobreviveu a nove auditorias. Ele não foi
introduzido: foi **nunca fechado**, porque a regra vivia no Método e nada no
software a lia.

### Por que isto não é detalhe

A Curadoria Aliviar não vende uma lista de médicos. Vende **uma curadoria
explicada e validada por humano** — é o que a `ARCHITECTURE.md` afirma na
primeira linha do produto, e é a única coisa que a distingue de um diretório.

O juízo humano é onde essa promessa se materializa. Sem ele, o que a paciente
recebe são três nomes escolhidos por uma pessoa que não registrou por que — e
o Motor, que organiza e não escolhe, aparece como se tivesse escolhido.

**É pior do que uma lacuna: é a lacuna exatamente no lugar onde o produto
afirma que não há uma.**

### As duas saídas honestas

**A — O juízo passa a ser condição de emissão.** `emitReportAction` recusa
enquanto houver lacuna de juízo entre os três selecionados, com a frase
nomeando quem e o quê. É o desenho da ADR-092 aplicado ao outro portão: lá,
publicar exige o Mapa tratado; aqui, emitir exige o juízo dado.

**B — O Método deixa de chamá-los de "sempre exigidos".** A ADR-067 §5 é
emendada, os juízos viram recomendação, e o painel de atenção passa a dizer
"sugerido" em vez de "pendente".

**O que não é saída: continuar como está.** Hoje o Método afirma uma exigência
que o software não cobra e a operação não cumpriu nem uma vez. Isso não é
flexibilidade — é uma regra que existe só no papel, e regra assim ensina que as
outras também podem ser opcionais.

### Recomendação

**A.** E com um recorte, para não repetir o erro que a ADR-092 evitou:

1. **A exigência é sobre os TRÊS SELECIONADOS, não sobre a Rede inteira.**
   Julgar quem não foi escolhido é trabalho que não chega à paciente.
2. **Vale para os exigidos, não para os oferecidos.** Três técnicos sempre; os
   relacionais só onde o Case declarou grau (ADR-065). No caso da travessia,
   nove — não dezoito.
3. **`NAO_INFORMADO` do juízo não existe, e não deve passar a existir.** O
   equivalente honesto já é possível: o Curador escreve *"o que sei até aqui
   não me permite concluir mais do que…"* — que é um dos sete começos que a
   tela oferece. Juízo reservado é juízo; ausência de juízo não é.
4. **A guarda vive no banco, não só na action.** A fronteira real de
   autorização deste projeto é a RLS/gatilho, e uma regra que só a aplicação
   cobra é uma regra que a próxima tela esquece — que é exatamente a história
   deste achado.

### Sobre o congelamento (ADR-073)

Esta ADR **decide e não constrói**. A construção é a mesma natureza da ADR-092
item 3: acrescentar exigência a um portão exige migration, e despublicaria —
aqui, impediria de emitir — Curadorias em curso. É decisão de operação.

O que a ADR-073 permite hoje, e que já foi feito, é a Mesa **dizer** o que
falta: o painel de atenção nomeia os juízos pendentes por profissional.


### Nota de execução (25/08) — a guarda subiu na aplicação, e o item 4 encontrou uma objeção

A saída **A** foi construída no mesmo dia da decisão: `emissao-exige-juizo.ts`
(regra pura), `emissao-exige-juizo-repository.ts` (os fatos) e a recusa dentro
de `emitReportAction`, antes de aprovar e de emitir. Onze testes, dois deles
provados por mutação — um desliga a regra, outro desliga a chamada dela no
portão, e os dois derrubam a suíte.

**O item 4 desta ADR pedia a guarda também no banco**, com o argumento de que
"regra que só a aplicação cobra é regra que a próxima tela esquece". O
argumento continua de pé. A execução encontrou o custo dele:

Para cobrar isto num gatilho, o SQL teria de saber **quais** juízos são
exigidos — três técnicos sempre, mais os relacionais apenas onde o Case
declarou grau (ADR-065). Essa regra existe uma vez, em `lacunasDeJuizo`.
Reescrevê-la em PL/pgSQL criaria **duas implementações da mesma regra do
Método** — exatamente o que a `ADR-066/11-08` proíbe, e a forma de defeito que
esta sessão passou o dia inteiro removendo (`SIM-42`).

**Duas saídas, e nenhuma é óbvia:**

- **Backstop fraco, sem duplicar:** o banco recusa emitir quando não há
  **nenhum** juízo vigente para algum profissional selecionado. Não sabe
  contar três nem seis, e não precisa — pega o caso que aconteceu de verdade
  (`SIM-51`: zero) sem virar segunda fonte da regra.
- **Regra completa no banco, aceitando a duplicação**, com um teste que compare
  as duas implementações a cada mudança do Catálogo.

**Recomendo o backstop fraco.** Ele fecha o buraco observado, não inventa uma
segunda verdade, e deixa a regra fina onde ela já mora e é testada. Uma guarda
que cobre 90% sem mentir é melhor que uma que cobre 100% em dois idiomas que
vão divergir.

**Enquanto não houver decisão, a guarda é só de aplicação — e isto está dito
aqui para não virar a próxima linha que alguém acha que já foi feita.**


### A guarda exercitada (25/08) — Case novo, de ponta a ponta

A saída **A** foi testada no caminho real, num Case criado para isso: paciente
nova, história semeada e marcada como semeada, Case aberto pela tela do
Administrador, seis profissionais na Rede, quatro áreas declaradas, as 29
importâncias classificadas, três caminhos compostos com razão escrita, e o
relatório salvo — **com zero juízos registrados**, confirmado no banco antes do
clique.

A emissão recusou, e recusou dizendo:

> O Relatório não pode ser emitido: falta o seu juízo sobre **Dra. Helena
> Vasconcelos** (Formação Profissional, Experiência Profissional e Histórico
> Profissional), **Dra. Cecilia Andrade** (…) e **Dr. Otavio Lemos** (…). A
> ADR-067 §5 exige o juízo humano de cada caminho que ela vai receber — e se o
> que você sabe não permite concluir, isso também é juízo, e pode ser escrito
> assim.

Os quatro recortes da ADR se confirmaram na prática: **só os três
selecionados** (o quarto elegível não foi cobrado), **só os exigidos** (três
técnicos por profissional, e nenhum relacional — este Case não declarou grau
para eles), **nome humano do conceito** e **nada de código cru**.

E o estado depois da recusa: `emitted_at` nulo, `delivered_at` nulo, e
`approved_at` **também nulo** — a conferência roda antes de `approveReport`,
então a assinatura do Curador nem chegou a ser aplicada a um documento que não
podia sair.

**Um defeito encontrado no mesmo ato, e corrigido:** a recusa aparecia sem
`role="alert"`. Quem usa leitor de tela clicava em "Emitir", nada acontecia, e
nada era dito — justamente na frase mais importante que esta tela produz.

### O que fecha esta ADR

1. Decisão do Fundador entre **A** e **B**;
2. Se **A**: a exigência em `emitReportAction` **e** no banco, com teste
   provado por mutação de que um relatório sem juízo não emite;
3. A frase da recusa nomeando quem e o quê — nunca "faltam requisitos";
4. O caso `f347924a` regularizado, ou declarado como o que é: um ensaio.

### Revisitar quando

A primeira Curadoria real for emitida e alguém contar quanto tempo os nove
juízos levaram de verdade. Se for caro a ponto de o Curador escrever frase de
fachada para passar do portão, a exigência estará produzindo o oposto do que
pretende — e é a ADR-073 que manda decidir isso com uso, não com suposição.

---

## ADR-095 — O tamanho da Mesa: a decisão que espera uso, e o que se faz enquanto ela espera

- **Data:** 2026-08-25
- **Status:** **Proposta pelo Engenheiro Líder, aguardando decisão do Fundador.** Responde ao `SIM-13`, que a ADR-093 herdou agravado.
- **Dependências:** **ADR-093** (consertou a ordem da Mesa e não o tamanho) · **ADR-073** (a ordem depois do descongelamento é a dor, não o plano) · `SIM-13` · `SIM-56`

### A medição

A Mesa nova, no caso real, com os quatro painéis dentro:

| | |
| --- | --- |
| Altura | **11.865px** |
| Telas (viewport 960) | **~12** |
| Linhas de tabela | 32 |
| Botões | 178+ |
| Seções | 4, mais classificar, compor, relatório e entrega |

A Mesa antiga gerou o `SIM-13` com ~8.000px — **e ela tinha régua de etapas.**
A nova é rolagem contínua.

### A tentação, e por que ela está errada

A saída óbvia é voltar a paginar por etapas, como a Mesa antiga. **Não.** As
etapas antigas não eram navegação: eram a taxonomia mandando na tela, que é
exatamente o que a ADR-093 desfez. Reintroduzi-las traria de volta a ordem que
fazia a pessoa desaparecer atrás do Método.

A segunda tentação é partir em duas rotas. Também não, e a razão tem nome:
**foi ter duas superfícies para o mesmo ato que produziu o `SIM-42`.** Uma
Curadoria, uma URL, uma verdade.

### O que já foi feito, e é mitigação e não solução

O painel *"O que ainda depende de você"* entrou no topo como **índice das
pendências**, com salto por âncora para a seção onde cada uma se resolve —
medido: de `scrollY 0` para `4076`, com a seção a 16px do topo, nunca em região
vazia.

Isso responde *"o que falta"* e *"onde fica"*. **Não responde "onde estou"**, e
é essa a pergunta que doze telas tornam impossível.

### A proposta, se for para fazer agora

**Colapso por seção, com a seção da vez aberta** — e uma regra dura junto:

1. **Seção fechada nunca esconde em silêncio.** Cada uma mostra, na barra
   fechada, o próprio estado numa linha: quantos elegíveis, quantos juízos
   faltam, quantas linhas separam os candidatos. É a mesma regra do recorte da
   Rede, que nunca some com alguém sem dizer o número.
2. **O padrão de abertura é derivado, não decorado:** abre a seção da primeira
   pendência — a mesma derivação que já alimenta o índice do topo.
3. **Nada é bloqueado.** O Curador abre o que quiser, quando quiser: a
   investigação é dele. Colapso é economia de rolagem, nunca porta fechada.

Custo estimado: pequeno. Toda a informação de estado já é derivada e já está
na página — é apresentação, não domínio.

### Recomendação: decidir depois da primeira Curadoria real

E a razão é a própria ADR-073.

**O `SIM-13` nunca machucou ninguém.** Ele foi medido por mim, em travessia,
com uma paciente de teste. Nenhum Curador real percorreu doze telas ainda, e
"onde estou" é uma dor que só quem trabalha oito horas na tela sabe descrever.
Desenhar o colapso agora é decidir por suposição o formato de um alívio que
ninguém pediu — e a ADR-073 existe porque este projeto já tem três construções
corretas e desligadas por ter feito exatamente isso.

**O que a primeira Curadoria real precisa devolver sobre esta tela:** onde ele
rolou procurando, o que ele não achou, se abriu duas abas do mesmo Case, e se
usou o índice do topo ou ignorou. Quatro observações que valem mais que
qualquer maquete.

**Se o Fundador preferir fazer agora, a proposta acima está pronta e é
pequena.** Esta ADR não recomenda esperar por cautela — recomenda esperar
porque o dado que falta é barato e chega logo.

### O que fecha esta ADR

1. Decisão do Fundador: fazer agora, ou esperar a primeira Curadoria real;
2. Se esperar: as quatro observações acima anotadas durante ela;
3. Se fazer: o colapso com a regra 1 provada por teste — **nenhuma seção
   fechada sem dizer o que tem dentro**.

### Revisitar quando

A Mesa passar de quinze telas, ou um Curador real disser que se perdeu. O
primeiro é medida e eu aviso; o segundo é o que importa.

---

## ADR-096 — Adiamento formal da base de privacidade, assinado pelo responsável por LGPD

- **Data:** 2026-08-27
- **Status:** **Decidida pelo Fundador**, em conversa direta nesta data, na qualidade de **responsável por LGPD interino** (ADR-055, item 1) — que é exatamente a assinatura que o critério de encerramento do `PRIV-01` exige.
- **Dependências:** `PRIV-01` (P0) · **ADR-055** (nomeação do responsável) · **ADR-056** item 1 (Anthropic a declarar na política) · **ADR-073** (congelamento; "o que a lei exigir" é exceção permitida) · `GO_NO_GO_FINAL.md` (🔴 NO-GO de privacidade) · `SIM-60`

### O que existe, e é preciso dizer para não parecer omissão

A lacuna do `PRIV-01` **não é de engenharia**, e a formulação original do achado ("rota inexistente") está vencida:

1. **A infraestrutura está pronta e no ar.** `/privacidade`, `/termos`, `/consentimentos` e `/legal/[slug]/v/[versao]` existem. Os documentos não moram no código: moram em `legal_documents` com versão e vigência, de modo que o jurídico publica sem tocar em código e o aceite aponta para exatamente o que foi lido. Sem documento publicado, a página diz a verdade — que ele não existe.
2. **O texto está redigido.** `docs/privacidade/POLITICA_DE_PRIVACIDADE_RASCUNHO.md` (19/08), escrito a partir do código e do banco verificados, com o que não pôde ser verificado marcado entre colchetes.
3. **O que falta é decisão jurídica, e está com o advogado desde 03/08** — sete pontos reunidos na seção "Para o advogado" do rascunho, dos quais três travam de fato: base legal de cada tratamento (o sistema trata dado de saúde, art. 11), prazos de retenção (hoje não existe rotina de descarte, e o rascunho proíbe publicar prazo que o sistema não cumpre) e dados de terceiros no fluxo "para outra pessoa".
4. **Dois fatos dependem só do Fundador:** o e-mail do encarregado (hoje `[a confirmar]`) e a região de execução da Vercel. O repouso já está confirmado no Brasil (`sa-east-1`).

### A decisão

**A publicação da base de privacidade fica adiada.** Não há data.

Esta ADR é o **adiamento formal** previsto no critério de encerramento do `PRIV-01` — *"política publicada **ou adiamento formal assinado pelo responsável por LGPD**"*. Ela converte uma lacuna em decisão consciente, datada e assinada.

**Ela não torna a lacuna inexistente, e não é isso que se está afirmando aqui.**

### O risco aceito, nomeado

Enquanto durar: não há política, não há termos, não há consentimento colhido e não há canal de encarregado publicado. Toda pessoa atendida neste período tem dado pessoal — e, a partir da Curadoria, **dado de saúde** — tratado sem base informacional publicada. Pedido de titular que chegue neste período não tem superfície nem canal formal para ser atendido (`PRIV-05`).

Coerente com isso, e **de propósito**: o gate de aceite permanece desligado (`SIM-60`). Ligá-lo sem documento publicado cobraria aceite de coisa nenhuma, e o `redirect` dele aponta hoje para `/aceites`, que não existe. O gate e a publicação entram juntos ou não entram.

### O ponto que esta ADR NÃO decide, e que precisa ser decidido antes da primeira sessão

**Quem é a primeira paciente real.** O Fundador não se pronunciou sobre isto, e o registro não vai supor.

A distinção é material, e é ela que determina se este adiamento se sustenta:

- **paciente da própria equipe** — a exposição é interna, conhecida e consentida de fato; o adiamento se sustenta com folga;
- **pessoa de fora** — o tratamento de dado de saúde de terceiro sem base publicada é o cenário que o `GO_NO_GO_FINAL.md` marca como 🔴 NO-GO.

Este adiamento **não autoriza, por si só, o segundo caso.** Ele registra a decisão de não publicar ainda; não decide de quem serão os dados tratados enquanto não se publica.

### Revisitar quando — e qualquer um destes basta

1. O parecer do advogado chegar (é o caminho esperado e o mais curto);
2. Uma pessoa **de fora da equipe** for atendida — aí o adiamento deixa de se sustentar e a publicação volta a ser condição, não escolha;
3. Chegar pedido de titular (acesso, correção, exclusão ou portabilidade);
4. A primeira Curadoria real ser entregue — porque é o marco que a ADR-073 já usa para retomar tudo.

### Decisão complementar de 2026-08-27 — o ponto em aberto foi fechado no mesmo dia

O verbete acima registrou que esta ADR **não** decidia quem seria a primeira
paciente real. **O Fundador decidiu, horas depois, nesta mesma data: a primeira
Curadoria real será conduzida com uma pessoa da própria equipe Aliviar.**

**Consequência direta:** o adiamento se sustenta. Não há tratamento de dado de
saúde de terceiro sem base publicada — que era o único cenário em que este
adiamento deixaria de valer, e é o que o `GO_NO_GO_FINAL.md` marca como
🔴 NO-GO. O gatilho 2 de "revisitar quando" (*"uma pessoa de fora da equipe
for atendida"*) permanece armado para a segunda Curadoria em diante.

**O limite que isto impõe à observação, e que precisa estar escrito antes da
sessão para não ser esquecido depois.** A ADR-073 encomendou cinco observações,
e esta escolha **não** as devolve com o mesmo peso:

| O que a ADR-073 quer observar | Vale com paciente interna? |
| --- | --- |
| Onde o Curador improvisa por fora do sistema | **Sim, integralmente** — o trabalho do Curador é o mesmo |
| Quanto tempo cada ato leva de verdade | **Sim** |
| As quatro perguntas da Mesa (ADR-095) | **Sim** — quem trabalha na tela é o Curador, não a paciente |
| O que a equipe precisou explicar por fora da tela | **Parcialmente** — quem já conhece o produto não pergunta o que uma estranha perguntaria |
| **Onde a paciente hesita, relê ou pergunta** | **Não** — é a observação que esta escolha sacrifica |

Ou seja: **a primeira Curadoria devolve o lado do Curador com força total e o
lado da paciente enfraquecido.** Isso não a invalida — o gargalo que a ADR-073
nomeia é sobretudo operacional, e ele será medido. Mas significa que
**descongelar decisões sobre a experiência da paciente com base só nesta
sessão seria repetir o erro que a ADR-073 combate**, agora com evidência de
qualidade errada em vez de nenhuma evidência.

As decisões que dependem da hesitação da paciente esperam a primeira Curadoria
com pessoa de fora — que, por sua vez, exige a política publicada.

### O sinal de que esta ADR falhou

O adiamento durar por inércia, e não por decisão: nenhum dos quatro gatilhos disparar e a ausência de política simplesmente deixar de ser notada. Um adiamento formal que ninguém revisita é a mesma lacuna de antes, com assinatura.

---

## ADR-097 — A pessoa que a Aliviar acompanha chama-se assistido

- **Data:** 2026-08-27
- **Status:** **Decidida pelo Fundador**, em conversa direta nesta data, após ressalva registrada e mantida (ver "A ressalva" abaixo).
- **Dependências:** `LANDING_UX_WRITING.md` §190 (vocabulário canônico) · **ADR-064** (nenhuma superfície afirma o que o sistema não garante) · **ADR-073** (o congelamento; esta ADR não constrói nada — troca texto)

### A decisão

A pessoa que a Aliviar acompanha passa a se chamar **assistido** em tudo o que se lê. Não "paciente".

**Onde ela flexiona, e onde não flexiona.** "Paciente" é epiceno — *a paciente* e *o paciente* são a mesma palavra. "Assistido" não é. A regra, decidida junto:

1. **Substantivo só quando o texto precisa nomear o papel** — títulos, rótulos, colunas de tabela, filas do time: *"Assistido"*, *"Novo assistido"*, *"Dados do assistido"*.
2. **Onde a tela fala COM a pessoa, usa-se "você"** — que não tem gênero, e que o vocabulário canônico já preferia (§190: *"Pessoa/você (nunca 'usuário')"*).

Isso evita escolher um gênero genérico para toda a copy da casa — e a escolha era real: o código tinha **138 ocorrências no feminino contra 225 no masculino**, ou seja, já falava da mesma pessoa em dois gêneros. Com "paciente" isso passava despercebido, porque a palavra não denuncia.

### Três fronteiras que a troca NÃO atravessa

1. **O slug do papel `paciente` fica.** Ele é dado — vive em `user_roles`, em policies de RLS, em capabilities e em migrations. Renomeá-lo é mexer em banco, não em vocabulário, e não entrega nada a ninguém: nenhum assistido lê o nome de uma coluna.
2. **As rotas `/paciente/*` ficam**, e as tabelas `patient_*` também. Mesma razão.
3. **A palavra clínica "paciente" permanece onde ela é do médico.** Na entrevista do profissional, *"Como você costuma conduzir seus pacientes?"* continua certo: são os pacientes DELE, na relação clínica dele. "Assistido" é o nome de quem a **Aliviar** acompanha, não um sinônimo universal. Confundir os dois apagaria uma distinção real.

### A ressalva, registrada porque foi feita e mantida

O Engenheiro Líder apontou que o Método existe para **devolver a decisão** — *"a escolha continua sendo sua"* — e que "assistido" é gramaticalmente passivo (particípio: quem *é* assistido), com eco de assistencialismo em português; "a pessoa" entregaria agência melhor. **O Fundador manteve "assistido".** Fica registrado que a ressalva foi feita, ouvida e superada por decisão de quem responde pelo produto — não esquecida.

### O que foi trocado nesta rodada

Texto de tela em `src/**/*.tsx` e os três mapas de rótulo de papel (`display-identity.ts`, `team-table.tsx`, `app-shell.tsx`). **Não** foram tocados: `src/modules/**` (domínio), comentários de código (são para quem programa e documentam história), a documentação interna e os ADRs — este log é append-only por força da **ADR-062**, e verbete antigo não se reescreve.

**Uma pendência conhecida:** o PDF `/rede/Ficha-da-Paciente-Curadoria-Aliviar.pdf` teve o rótulo trocado para *"Ficha do Assistido"*, mas **o arquivo continua com o nome antigo**. Renomear ativo é outra tarefa; até lá, o rótulo e o arquivo divergem de propósito e por escrito.

### Revisitar quando

Alguém de fora da equipe — um assistido, um profissional — estranhar a palavra em voz alta. É o único teste que importa, e ele só existe depois da primeira Curadoria real.

---

## ADR-098 — O vidro entra na Fachada, e só no cabeçalho dela

- **Data:** 2026-08-27
- **Status:** **Decidida pelo Fundador**, em conversa direta nesta data, com a ressalva do Engenheiro Líder registrada e superada (ver abaixo).
- **Dependências:** **Sistema Visual §63** (vidro proibido como material) · **ADR-084** (a reabertura do §3 para a casa da pessoa atendida) · guarda `tests/unit/sistema-visual-consolidado.test.ts` · `SIM-61`

### O que muda

O **cabeçalho público da Fachada** — e nenhuma outra moldura — passa a poder usar vidro: transparência com desfoque de fundo.

Ele deixa de ser uma faixa creme colada no topo e passa a flutuar como **cápsula recuada e arredondada**, com a cena aparecendo em volta e através dele.

### Por quê

A Landing é fotográfica de tela cheia, e a tese do desenho é a cena atravessar o conteúdo (ADR-080/084). Uma barra opaca de ponta a ponta **corta a fotografia** logo na chegada — é a primeira coisa que se vê, e ela contradiz o que a página inteira tenta dizer.

A borda inferior contínua era o pior detalhe: uma linha horizontal atravessando a imagem de lado a lado.

### A ressalva, registrada porque foi feita e superada

O Engenheiro Líder tentou exatamente esta mudança na manhã de 27/08, **por conta própria**, e a guarda o barrou — corretamente. O teste chega a nomear a tentação: *"só um blurzinho no header"*. A regra existe para impedir que a casa inteira vire vidro por **somatório de decisões locais razoáveis**, cada uma defensável sozinha.

Ele propôs então a **cápsula sólida** — mesma silhueta, sem tocar na regra — argumentando que a forma agradava sem depender do material, e que só depois de a versão sólida falhar valeria reabrir o §63. **O Fundador decidiu pelo vidro direto.** Fica registrado que a alternativa conservadora existia, foi oferecida, e foi descartada por quem responde pelo produto.

### A fronteira, que é o que impede a exceção de dissolver a regra

1. **Um shell, nomeado.** Só `public-header.tsx`. Os outros quatro — `patient-shell`, `app-shell`, `portal-shell` e `mesa-curador.css` — continuam proibidos, e a guarda continua vigiando os quatro.
2. **A guarda ganhou um caso novo**, não perdeu um: `"a exceção de vidro é uma só, e é a que a ADR-098 nomeia"` afirma que a lista tem exatamente quatro shells e que o cabeçalho **usa** o vidro. Abrir a segunda exceção passa a exigir editar aquele teste — ou seja, passar por uma decisão, nunca por descuido.
3. **A exceção também se fecha sozinha:** se o vidro sair do cabeçalho, o teste falha e cobra o fechamento. Exceção que ninguém usa é dívida.

### O que a mudança NÃO pode custar

A legibilidade. O `SIM-61` foi encontrado nesta mesma data: texto sobre fotografia sem piso, sumindo nas manchas escuras. O cabeçalho carrega a marca e dois botões, e **não pode depender do enquadramento da foto** para ser lido. Por isso o vidro tem piso — 72% de linho em repouso, 88% ao rolar — e o descolamento vem também do fio dourado e da sombra, nunca só da transparência.

### Nota sobre as outras superfícies

O mesmo cabeçalho serve `/o-que-e`, `/privacidade` e `/termos`, que são linho liso. O desfoque de uma cor chapada devolve a mesma cor chapada: ali ele fica **neutro**, nunca turvo. Nenhum estado condicional foi necessário — o Engenheiro Líder levantou este risco e ele não se confirmou.

### Revisitar quando

Alguém pedir a segunda exceção. O pedido em si é o sinal: se o vidro começar a parecer necessário em outra moldura, a pergunta não é sobre aquela moldura — é sobre o §63 inteiro, e aí a decisão é de Sistema Visual, não de componente.

---

## ADR-099 — A casa escurece: a Fachada passa ao entardecer, e o vidro vira a linguagem única

- **Data:** 2026-08-27
- **Status:** **Decidida pelo Fundador**, em conversa direta nesta data, escolhendo entre três caminhos que o Engenheiro Líder apresentou com o custo de cada um.
- **Dependências:** **Sistema Visual** (materiais: papel algodão, pedra clara, linho) · **ADR-080/084** (os quatro ambientes, e o vidro na casa da pessoa atendida) · **ADR-098** (o vidro no cabeçalho) · `SIM-61` · **ADR-073**

### O que muda

A Landing passa do **dia para o entardecer**, e os cartões passam de papel claro com tinta escura para **vidro com tinta clara** — o mesmo material da porta de acesso. Uma casa, uma linguagem.

### Como se chegou aqui, porque o caminho é o argumento

O Fundador pediu, a partir de uma referência de vidro jateado, que o cartão da porta de acesso valesse para todos. A resposta honesta era que **não valia** — e a razão apareceu medida, três vezes seguidas na mesma sessão:

1. **No cabeçalho:** vidro creme sobre teto claro e uniforme. A transparência existia (`blur(12px)`, cena atrás) e **não se via** — o que passava era mais creme.
2. **No cartão do herói:** mesmo efeito sobre parede clara. Abrir o vidro não revelava nada, porque não havia nada distinto atrás.
3. **Na comparação com a referência:** ela funciona porque o fundo é folhagem escura ao entardecer — textura, contraste, cor.

A conclusão não é de gosto: **vidro só se vê contra fundo que tenha o que mostrar, e texto claro só é legível sobre fundo escuro.** O tratamento que o Fundador queria não é um estilo de cartão — é um **par cartão-claro + cena-escura**, e um não vive sem o outro.

### A escolha, entre três

Foram oferecidas: (a) escurecer a casa inteira; (b) copiar só a forma, mantendo tinta escura; (c) aplicar em um ambiente e olhar antes. **O Fundador escolheu (a).**

### O véu, e por que não fotografias novas

O mesmo recurso que a porta de acesso usou enquanto a cena do terraço não existia: um **véu quente** sobre cada cena, transformando-a em entardecer sem trocar um arquivo. Quente e nunca neutro — cinza sobre fotografia mata a cor e a cena vira chumbo; o verde profundo preserva o ouro das luzes e aprofunda os fundos.

### A medição, que é o que autoriza a decisão

Texto claro sobre o composto cena + véu + piso do cartão:

| Estado | Média | Pior ponto |
| --- | --- | --- |
| Repouso, base da cena | 11,61 | 5,03 |
| Repouso, topo da cena (véu a 34%) | 11,04 | **3,54** |
| Cristalizado | 12,5 | 8,56 |

O pior ponto no topo reprovava — e é justamente onde pousa o **cartão do Concierge**, o único com `posicaoCard="superior"`. O gradiente subiu para **44%→58%** e o piso do cartão para **24%→62%**: pior ponto medido **4,53**, e a área inteira passa.

**E o ganho é maior do que o empate:** o cartão claro anterior tinha pior ponto entre **1,66 e 2,70**, porque tinta escura sumia nas manchas escuras da foto — que foi o `SIM-61`. Escurecer a casa **melhorou a legibilidade**, não só a aparência. A decisão estética e a decisão de acessibilidade apontaram para o mesmo lado, o que é raro e vale registrar.

### O que a inversão obrigou, e não é cosmético

Tudo que vivia dentro do cartão nasceu para papel claro e precisou virar: a tinta do corpo e dos títulos, os **números dos passos** (círculo azul sobre vidro escuro afunda — vira linho cheio com algarismo azul), o **botão principal** (azul cheio vira linho cheio, a mesma inversão do cabeçalho), o **botão secundário**, o cartão do vídeo, e a **gravação do vidro**, que passa a clarear em vez de escurecer.

### O que esta ADR NÃO faz

Não toca nas superfícies internas — `/paciente`, `/coa`, os portais. A casa da pessoa atendida e os fundos operacionais continuam claros. Isto é decisão de **Fachada**.

### Revisitar quando

A primeira Curadoria real acontecer. Nenhuma pessoa percorreu esta Landing ainda, clara ou escura — e a ADR-073 diz que a ordem depois do descongelamento é a dor, não o plano. Se alguém disser que a página ficou pesada ou fúnebre, o véu é uma variável e volta em uma linha.

---

### Reversão de 2026-08-27, no mesmo dia

**O Fundador viu a Landing escura no ar e recusou.** A decisão acima fica no
log porque o log é append-only (ADR-062) e porque o caminho vale mais que o
resultado — mas **está revertida**: a Fachada volta ao dia, e os cartões
voltam a ser papel claro com tinta escura.

**O que a medição acertou e o que ela não alcançava.** Os números continuam
verdadeiros: escurecer melhorava a legibilidade (pior ponto de 1,66 para
4,53), e a decisão de acessibilidade apontava mesmo para o entardecer. O que
nenhuma medição diz é se quatro cenas escuras em sequência acolhem ou
pesam — e essa era a pergunta que importava. **Contraste não é clima.**

**Fica aprendido, e é o que sobra de útil:** a ADR-098 (o vidro no cabeçalho)
e a porta de acesso continuam de pé, porque ali o escuro tem função e não é
ambiente. O entardecer serve à **chegada** — uma tela, uma vez —, não à
travessia inteira.

**Revisitar quando:** houver fotografias de entardecer geradas de propósito,
e não um véu por cima de cenas diurnas. O véu simula penumbra; ele não
simula a luz que uma cena noturna teria de verdade, e pode ter sido essa
diferença que o Fundador viu.

---

## ADR-100 — O Atendente deixa de ser recepção e vira o Supervisor do processo

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** emenda o **Nível 1** de [`CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](CORRECAO_DOMINIO_PAPEIS_E_CASE.md) · aplica do lado do assistido o princípio que a **ADR-076** aplicou ao profissional · respeita a fronteira 1 da **ADR-097** (o slug do papel é dado, não vocabulário) · não altera a **ADR-073**: troca a definição de um papel, não constrói nada.

### A decisão

O **Atendente deixa de existir como etapa de recepção.** O papel passa a ser o **Supervisor do processo de cada assistido**: o primeiro contato já é com ele, e ele **não desaparece no repasse** — supervisiona do primeiro oi ao encerramento.

Não há triagem antes de conhecer quem acompanha. Quem atende o primeiro contato é quem estará lá no fim.

**O Curador continua conduzindo a Consulta Inicial** e a Curadoria. O Supervisor entrega o Case a ele — mas entrega dentro de um processo que segue sendo supervisionado, não para fora dele.

### A diferença entre etapa e espinha

O Nível 1 da Correção de Domínio era uma **etapa**: recebe, qualifica, abre o Case, encaminha — e sai. O Supervisor é uma **espinha**: atravessa os três níveis. O Case continua passando de nível; o que deixa de passar é a pessoa responsável por quem o Case é.

O `/admin/equipe` avisa hoje, em amarelo, quando alguém acumula níveis: *"o Case passa de nível sem trocar de gente — a separação entre Atendente, Curador e Concierge existe no sistema, mas não na prática."* Esse aviso descrevia um defeito. A partir daqui ele descreve, em parte, o desenho — e precisa ser reescrito para acusar só o que continua sendo acúmulo indevido.

### O que o Supervisor registra no primeiro contato — e o que ele NÃO registra

**Registra:** como procurar a pessoa, o que ela veio buscar em uma frase, e o combinado prático (o preço e o próximo passo).

**Não registra a história clínica.** Ela é colhida pelo Curador, na Consulta Inicial, com a Ficha do Assistido.

Isto não é preferência: é o que a própria vitrine promete. A `/solicitar-atendimento` diz, na tela, *"Conte só o essencial para a gente procurar você. Nada sobre saúde nesta página — isso a gente conversa depois, com uma pessoa."* O Supervisor **é** essa pessoa, e a conversa de saúde continua sendo depois.

E é o que a Ficha exige: *"a ficha só vale depois que ela reconhecer que é dela"*, *"a frase dela vale mais que a opção marcada"*, *"o que não foi dito fica em branco — nunca se presume"*. Um resumo clínico escrito no primeiro contato chegaria ao Curador como versão pronta, e ele passaria a **conferir** uma história em vez de ouvi-la.

### A ressalva, registrada porque foi feita antes da decisão

O Engenheiro Líder argumentou que o ganho maior da mudança seria acabar com **contar a história duas vezes** — e que isso só aconteceria se o Supervisor também conduzisse a Consulta Inicial. **O Fundador decidiu que ele entrega ao Curador.**

Fica dito, então, que a mudança **não resolve o segundo relato**: a pessoa continua contando ao Supervisor por que procurou a Aliviar, e depois contando a história ao Curador. O que ela entrega é outra coisa, e é o que o Fundador quis: **continuidade** — uma pessoa com nome que atende, acompanha e responde do começo ao fim, em vez de três desconhecidos em sequência.

A regra da seção anterior é o que mantém o segundo relato inofensivo: não são duas versões da mesma coisa, são duas conversas diferentes.

### O dinheiro, e por que ele entra nesta ADR

O Roteiro de Atendimento (`docs/guias/6-roteiro-de-atendimento.html`) carrega o preço, as parcelas e oito objeções. Com o papel unificado, **quem comunica o preço passa a ser a mesma pessoa que depois acompanha a decisão** — e o diferencial inteiro da Aliviar é independência (*"nenhum médico paga para aparecer aqui"*).

**O conflito não está em quem diz o número; está em quem ganha com a resposta.** Portanto, junto com a mudança de papel:

1. **Preço fixo**, sem margem de desconto dentro da conversa.
2. **Sem comissão por conversão** para o Supervisor.

Com as duas, o Supervisor **comunica** um preço; não vende um. Sem elas, a unificação coloca interesse comercial dentro da relação que existe justamente para não ter nenhum.

### O que NÃO se decidiu junto

- **O slug `atendente` fica**, e a rota `/atendimento` também. São dado: vivem em `user_roles`, em policies de RLS, em `RESPONSIBLE_ROLES` e `COA_RESPONSIBLE_ROLES`. É a fronteira 1 da ADR-097 — nenhum assistido lê o nome de uma coluna.
- **Se uma pessoa pode acumular Supervisor e Curador.** Hoje uma acumula os três, por falta de gente. Esta ADR decide o desenho dos papéis, não a escala da equipe.
- **Os números do parcelamento.** Continuam em branco no roteiro e continuam com o Fundador. Esta decisão só mudou de quem é o roteiro.

### Revisitar quando

O volume crescer a ponto de o Supervisor gastar tempo em contatos que não viram Case — a triagem era o que a recepção comprava, e ela volta a valer alguma coisa quando houver fila. Ou quando o Ensaio Geral medir o tempo de relógio do papel unificado: pode ser que primeiro contato, supervisão e preço não caibam na mesma pessoa que já carrega o acompanhamento.

---

## ADR-101 — O preço é fixo, e ninguém na operação ganha por conversão

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data. Promove a regra 2 da **ADR-100** a decisão própria, porque ela é política comercial e não corolário de um papel.
- **Dependências:** nasce da **ADR-100** (o Supervisor acompanha depois de comunicar o preço) · depende da **ADR-083 §1878**, que tirou o preço da vitrine e o mandou viver na conversa · protege a promessa da **ADR-064** (nenhuma superfície afirma o que o sistema não garante) e a frase canônica *"nenhum médico paga para aparecer aqui"* · não altera a **ADR-073**: decide política, não constrói.

### A decisão

**1 · O preço é fixo.** Quem conduz a conversa **não tem margem para desconto**. O número não se negocia dentro da ligação; ele muda por decisão do Fundador, para todo mundo, ou não muda.

**2 · Ninguém na operação ganha por conversão.** Não há comissão por contrato fechado, por Case aberto, nem por caminho escolhido — **para nenhum dos três papéis**, não só para o Supervisor.

### Por que isto é decisão, e não detalhe administrativo

A Aliviar vende uma coisa só: **que ninguém aqui ganha com a sua escolha.** É o que a Fachada afirma em voz alta — *"nenhum médico paga para aparecer aqui"*, *"a escolha continua sendo sua"* — e é o que o Roteiro do Curador protege quando manda apresentar três caminhos sem preferência e sair da sala.

A **ADR-100** mudou uma peça desse arranjo: quem comunica o preço passou a ser **quem depois acompanha a decisão**. Antes, quem convenceu ia embora antes da escolha existir. Agora fica na sala.

**O conflito nunca esteve em quem diz o número. Está em quem ganha com a resposta.** Sem estas duas regras, a unificação de papéis da ADR-100 colocaria interesse comercial dentro da única relação que existe para não ter nenhum — e a promessa da vitrine passaria a depender do caráter de quem está na ligação, em vez de depender do desenho.

Com as duas, **o Supervisor comunica um preço; não vende um.** É uma diferença de gênero de conversa, como a que o Roteiro já traça entre ele e o Curador.

### O que a decisão custa, dito antes de custar

**Ela perde vendas.** Alguém vai dizer que R$ 450 não cabe, e quem estiver na ligação **não vai poder ceder**. Isso é intencional, e a saída não é o desconto: é o **parcelamento** — que é exatamente por que os números da entrada e das parcelas, ainda em branco no Roteiro, deixam de ser pendência menor e viram bloqueador de operação.

E se o preço estiver errado, ele **muda como decisão**, registrada, valendo para todos — nunca como exceção concedida a quem insistiu mais. Preço que cede para quem insiste ensina a insistir, e cobra mais caro de quem não insistiu.

### Onde o número mora

Hoje, num lugar só: `docs/guias/6-roteiro-de-atendimento.html`, que declara a oferta vigente — **R$ 450 por um ano**, cobrindo a Curadoria, o Relatório e o acompanhamento; consulta com o profissional paga à parte, direto com ele. O próprio documento já carrega a guarda certa: *"se a oferta mudar, este documento muda no mesmo dia — um roteiro com preço velho é pior que roteiro nenhum."*

**O preço não está na vitrine por decisão da ADR-083**, que o mandou viver na conversa. Esta ADR é o que torna essa escolha sustentável: preço que só existe na conversa precisa ser o mesmo em todas as conversas, ou vira preço por freguês.

### O que NÃO se decide aqui

- **Se R$ 450 é o valor certo.** Esta ADR decide que ele não se negocia, não que ele está calibrado.
- **A entrada e as parcelas.** Continuam em branco e continuam com o Fundador.
- **Como se remunera quem opera.** Decide-se apenas que **não é por conversão**. Salário, pró-labore ou qualquer outro arranjo fica em aberto.

### Revisitar quando

As primeiras Curadorias reais mostrarem gente recusando **no preço** — e aí a pergunta é sobre o número ou sobre o parcelamento, nunca sobre abrir exceção. Ou quando a operação crescer a ponto de entrar alguém cuja função é vender: aí a regra 2 deixa de ser óbvia e passa a ser cara, e é exatamente nesse dia que ela mais vale.

---

## ADR-102 — A Consulta Inicial é conduzida pelo Curador, sempre

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data. Promove a decisão implícita na **ADR-100** a verbete próprio — e **corrige o argumento com que ela foi registrada lá**.
- **Dependências:** aplica o princípio da **ADR-076** (*"quem colhe a informação passa a ser quem vai usá-la"*) · é a outra face da regra da **ADR-100** sobre o que o Supervisor não registra · respeita a cadeia de entrada da **ADR-075** (*"qualificar É marcar a conversa"*) · sustenta a postura de privacidade da **ADR-096** enquanto a política não existe · não altera a **ADR-073**.

### A decisão

**A Consulta Inicial é conduzida pelo Curador. Sempre.** O Supervisor não a conduz, não a antecipa e não a resume.

### Três razões, e a primeira corrige o que eu escrevi na ADR-100

**1 · Quem colhe é quem usa — e aqui quem usa é o Curador.**

A **ADR-076** fixou o princípio do outro lado da Mesa: o Curador passou a entrevistar o profissional porque é ele quem vai usar aquela informação. O mesmo princípio, aplicado ao lado do assistido, aponta para a **mesma pessoa**: é o Curador quem pesa a história contra os 29 subcritérios do Mapa, quem conduz as conversas do Protocolo e quem assina o Relatório. Uma história colhida por outro chega a ele como **resumo que ele teria de confiar**, e não como matéria-prima que ele ouviu.

**Fica registrado que o Engenheiro Líder usou este mesmo princípio, na ADR-100, para argumentar o contrário** — e errou o alvo. Ele leu "quem colhe é quem usa" como "quem fala primeiro deve colher tudo", quando a regra fala de **uso**, não de ordem de chegada. A ADR-100 registrou esta decisão como um custo que o Fundador aceitou. Não é custo: é a aplicação correta de uma decisão que a casa já tinha tomado. A correção fica aqui porque o log de decisões é onde o raciocínio se mantém honesto, e verbete antigo não se reescreve (ADR-062).

**2 · É dado de saúde, e o Curador é médico.**

A Consulta Inicial colhe a história clínica. O Curador é médico — e isso não é detalhe interno: é **promessa escrita à pessoa**, em dois guias. O `9-para-voce-que-comecou.html` diz *"Seu Curador lê e conversa com você. **Ele é médico.**"*, e o Roteiro promete *"um curador — que é médico — vai sentar com você"*.

Concentrar a coleta de dado de saúde em quem tem dever profissional de sigilo é a escolha certa em qualquer cenário, e é especialmente a certa **enquanto a base de privacidade estiver adiada** (ADR-096): menos gente tocando o dado sensível, e a pessoa que toca sendo a que responde por ele.

**3 · A devolução só fecha com quem ouviu.**

A Ficha do Assistido exige que o Curador **leia de volta** o que entendeu: *"a ficha só vale depois que ela reconhecer que é dela"*. Ouvir e devolver são o mesmo ato, separados por minutos. Partir esse ato entre duas pessoas quebraria o reconhecimento — quem devolve estaria repetindo a leitura de outro.

### O que a decisão custa

**O segundo relato continua existindo**, como a ADR-100 já registrou: a pessoa conta ao Supervisor por que procurou a Aliviar, e conta a história ao Curador. A regra da ADR-100 — o Supervisor não colhe história clínica — é o que mantém isso inofensivo: **não são duas versões da mesma coisa, são duas conversas de gênero diferente.**

**E carrega o Curador.** Os ~50 atos de juízo por Curadoria, que o `REGISTRO_UNICO_DE_ACHADOS` já nomeia como carga operacional **não medida**, incluem a Consulta Inicial inteira. Esta ADR não aumenta a carga — ela confirma quem a leva, e torna a medição do Ensaio Geral mais necessária, não menos.

### O que NÃO se decidiu

**Se o Supervisor pode estar presente na Consulta Inicial, calado.** É o caminho do meio que ninguém testou: daria continuidade — a pessoa vê o mesmo rosto — sem mover a colheita para quem não vai usá-la. Fica **nomeado e não decidido**, porque presença muda a conversa, e ninguém sabe ainda se muda para melhor. É pergunta para o Diário de Observação do Ensaio.

### Revisitar quando

O Curador virar o gargalo — o tempo dele é o recurso escasso da operação, e a Consulta Inicial é a parte mais longa do que ele faz. Ou quando o Ensaio Geral medir o relógio e mostrar que a Consulta Inicial não cabe junto com o Mapa, o Protocolo e a Mesa na mesma pessoa. **Nesse dia a pergunta certa não é "quem conduz", é "o que sai da mão do Curador"** — e nenhuma das três razões acima autoriza tirar dele justamente a escuta.

---

## ADR-103 — O Supervisor assiste à Consulta Inicial, calado e com autorização da pessoa

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data. Responde a pergunta que a **ADR-102** deixou nomeada e não decidida.
- **Dependências:** completa a continuidade prometida pela **ADR-100** · **não altera** a **ADR-102** (a Consulta Inicial continua sendo conduzida pelo Curador) · a forma é imposta pelo **critério 20 do Formulário do Profissional** · toca a postura de privacidade da **ADR-096** e o custo está dito abaixo · não altera a **ADR-073**.

### A decisão

**O Supervisor assiste à Consulta Inicial**, presente e **calado**, desde que a pessoa autorize. Ele pode sair a qualquer momento, a pedido dela, sem que ela precise explicar por quê.

### Por que isto não contraria a ADR-102

Porque **ouvir não é colher.** As três razões da ADR-102 tratam de quem **colhe** e de quem **usa**: a Ficha continua na mão do Curador, a devolução — *"a ficha só vale depois que ela reconhecer que é dela"* — continua sendo dele, e o dado clínico continua sendo registrado por médico. Nada disso muda com um ouvinte na sala.

O que muda é o outro lado: **a história passa a ser contada uma vez só, para as duas pessoas que vão acompanhá-la.** É a tensão da ADR-100 resolvida sem quebrar a ADR-102 — e sem que ninguém tenha de repetir a parte difícil.

### O que a presença resolve

**A continuidade deixa de ser promessa e vira coisa vista.** A ADR-100 trocou a recepção pelo acompanhamento contínuo, mas um Supervisor que entrega o caso e reaparece semanas depois é continuidade no papel. Estar na sala no momento em que a pessoa conta o que a trouxe é onde a continuidade se torna visível **para ela**.

**E o Supervisor passa a acompanhar sabendo.** Ele vai destravar, responder e organizar o resto da jornada. Sem ter ouvido, faria isso a partir de um resumo — e quem trabalha por resumo ou pergunta duas vezes, ou inventa.

### A forma não foi escolhida: foi imposta pela própria régua da casa

O **critério 20 do Formulário do Profissional** — *"Participação de acompanhantes: como você conduz a presença de acompanhantes?"* — tem entre as respostas aceitas *"acompanhante mediante autorização da pessoa"*. A Aliviar **avalia médicos por isso**.

Não é possível cobrar de um profissional que peça autorização para uma terceira pessoa na sala e, na própria Consulta Inicial, colocar uma sem perguntar. Daí as regras:

1. **A pessoa autoriza, antes.** O Curador pergunta — e pergunta **explicando quem é**: não "posso trazer um colega", e sim *"quem vai te acompanhar do começo ao fim é [nome]; ela pode ouvir com a gente, se você quiser"*. Perguntar sem isso é pedir uma decisão que a pessoa não tem como tomar.
2. **Não é o padrão silencioso.** Presença não autorizada por omissão. Se ela não quiser, a Consulta acontece sem o Supervisor, e **ninguém pede justificativa**.
3. **Ele pode sair depois de ter entrado**, a qualquer momento, a pedido dela.

### O que "calado" quer dizer, exatamente

**Não pergunta, não corrige, não preenche, não registra.** Se tiver dúvida, leva ao Curador **depois**. Assunto prático — agenda, documento, próximo passo — também depois: dentro da Consulta, quem conduz é um só.

**É apresentado uma vez, por nome e papel, no começo** — e volta a ficar em silêncio. Pessoa na sala sem nome é vigilância; pessoa apresentada é companhia.

### O custo, dito porque é real

**O círculo de quem conhece a história de saúde cresce em uma pessoa** — e cresce enquanto a base de privacidade está **adiada** (ADR-096). Isso empurra na direção contrária da razão 2 da ADR-102, que argumentou concentrar o dado sensível em quem tem dever profissional de sigilo. Fica registrado que a decisão **aceita esse custo**, e que ele é mitigado, não eliminado: o Supervisor **ouve, não registra** — o registro continua sendo a Ficha, na mão do Curador.

**E é mais uma hora do Supervisor por Curadoria**, somada ao primeiro contato, ao preço e ao acompanhamento que a ADR-100 já lhe deu. Carga que ninguém mediu.

### A ressalva, registrada porque foi feita hoje e superada hoje

Vinte minutos antes desta decisão, na **ADR-102**, o Engenheiro Líder nomeou esta mesma pergunta e recomendou **não decidi-la**: *"presença muda a conversa, e ninguém sabe ainda se muda para melhor. É pergunta para o Diário de Observação do Ensaio."*

**O Fundador decidiu antes do teste.** Fica dito que o risco não foi medido: uma segunda pessoa na sala pode calar alguém que ia contar o que mais importa, e **isso não aparece em lugar nenhum** — a pessoa não reclama, ela só não conta. É exatamente o tipo de defeito que o Ensaio existe para pegar.

### Revisitar quando

**No primeiro "não".** A primeira pessoa que recusar a presença é o dado mais valioso desta decisão — e ela precisa ser registrada, não só respeitada. Ou no Diário do Ensaio, que agora tem uma pergunta a mais para responder: **com o Supervisor na sala, a pessoa contou menos?**

## ADR-104 — A Consulta Inicial não se observa

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data.
- **Dependências:** limita o observador previsto no pré-voo de `OPERACAO_PRIMEIRA_CURADORIA.md` · convive com a **ADR-103**, e a tensão entre as duas está dita abaixo · mantém a doutrina da Ficha (*a conversa em si não se grava*, P12) · não altera a **ADR-073**.

### A decisão

**O observador fica fora da Consulta Inicial.** Ele observa os outros atos — a entrevista do profissional, a Mesa, a apresentação — e não entra na conversa em que a pessoa conta a história dela.

### Por que

A **ADR-103** já colocou uma segunda pessoa da Aliviar naquela sala. Com o observador seriam **três estranhos e a pessoa**, na conversa mais íntima do processo inteiro — alguém contando dor, medo e história de família para uma plateia.

A Ficha já protege esse momento de outra forma: *"a conversa em si não se grava"* (P12). Um observador é uma gravação com olhos. **Observar a Consulta Inicial custaria exatamente o que ela existe para dar.**

### A tensão com a ADR-103, dita porque é séria

A ADR-103 aceitou, **sem medir**, o risco de que a presença do Supervisor faça a pessoa contar menos. Esta ADR tira da sala justamente quem teria por função notar isso.

**Juntas, as duas produzem isto: a regra mais nova e menos testada da operação vale na única sala que ninguém observa.** Não é motivo para reverter nenhuma das duas — é motivo para o risco ser medido por outro instrumento, e o instrumento existe:

**No Ensaio Geral, quem interpreta a pessoa é uma pessoa de confiança — e pode ser perguntada.** Um assistido real nunca vai dizer "eu ia contar mais se ele não estivesse ali"; uma pessoa que está atuando, sim. O **Diário de Observação** passa a exigir uma conversa com ela **depois** da Consulta Inicial simulada, com uma pergunta direta: *o que você teria dito se estivesse sozinha com o Curador?*

É a única leitura possível desse risco antes de ele custar alguém — e ela só existe porque o Ensaio é ensaio.

### O que NÃO se decidiu

**Se o Supervisor escreve algo no Diário sobre a Consulta Inicial.** Ele está na sala e ouviu; pedir que ele registre o que percebeu é tentador e perigoso — vira observação disfarçada, e a ADR-103 o definiu como quem **não registra**. Fica em aberto, e a resposta provável é que qualquer anotação dele seja sobre o **processo** (tempo, travas, o que faltou), nunca sobre o conteúdo da conversa.

### Revisitar quando

O Ensaio responder a pergunta da pessoa de confiança. Se ela disser que teria contado mais sozinha, é a **ADR-103** que volta à mesa, não esta.

## ADR-105 — O Supervisor anota no Diário: o processo, nunca a conversa

- **Data:** 2026-08-28
- **Status:** Decidida pelo Fundador, em conversa direta, nesta data. Fecha o que a **ADR-104** deixou explicitamente em aberto.
- **Dependências:** convive com a **ADR-103** (*ele ouve, não registra*) · preenche o vazio de medição que a **ADR-104** criou · **abre uma exceção** à regra do Guia da Primeira Rodada (*"Diário de Observação — preencher DURANTE, não depois"*) · não altera a **ADR-073**.

### A decisão

**O Supervisor anota no Diário de Observação.** O que ele anota é **o processo**: tempo, travas, o que faltou, o que precisou ser perguntado duas vezes, o que o roteiro não previu.

**Nunca o conteúdo da conversa.** Não o que a pessoa disse, não a história dela, não a condição, não as reações dela.

### Por que ele precisa anotar

A **ADR-104** tirou o observador da Consulta Inicial — e com isso **o ato mais longo da Curadoria passou a não produzir medição nenhuma**. Os ~50 atos de juízo que o `REGISTRO_UNICO_DE_ACHADOS` nomeia como carga não medida são mais densos justamente ali.

E há uma razão que só vale para ele: **é o único na sala com as mãos livres.** O Curador está conduzindo e preenchendo a Ficha — ele não pode observar a si mesmo enquanto escuta. O Supervisor está calado por definição. É o único que pode olhar o relógio e notar o atrito.

### Por que isto não contraria a ADR-103

A ADR-103 disse que ele *"ouve, não registra"*, e aquilo era sobre **o dado da pessoa**: o registro clínico é a Ficha, na mão do Curador. O Diário é outro objeto inteiramente.

**A Ficha é sobre a pessoa. O Diário é sobre a Aliviar.** Enquanto o Supervisor só escrever no segundo, a mitigação da ADR-103 continua de pé.

### A linha, e como conferir se ela foi cruzada

**O que ele escreve tem de ser verdade sem a pessoa dentro.**

Teste prático, para usar na hora: *esta anotação faria sentido sobre qualquer Consulta Inicial?* Se fizer, é processo. Se só fizer sentido por causa **desta** pessoa — do que ela contou, de como reagiu, do que ela tem —, é conteúdo, e não entra.

- ✅ *"A Parte 4 levou 22 minutos; o Curador voltou três vezes ao mesmo conceito porque a pergunta do formulário é ambígua."*
- ❌ *"Ela pareceu desconfortável ao falar da família."*

A segunda é observação disfarçada, e é exatamente o que a ADR-104 recusou.

### Ele anota DEPOIS, e isto contraria uma regra escrita

O Guia da Primeira Rodada manda, em título: *"Diário de Observação — preencher **DURANTE**, não depois"*. **Para esta sala, e só para ela, a regra se inverte.**

A regra existe por exatidão — memória inventa. Mas aqui ela custaria mais do que entrega: **uma pessoa que vê alguém anotando enquanto ela fala passa a editar o que fala.** É o mesmo risco que a ADR-103 aceitou sem medir, amplificado por um bloco de notas visível. Trocar um pouco de exatidão por não estragar o que se está medindo é a troca certa.

**Duas mitigações:** ele escreve **imediatamente ao sair**, antes de qualquer outra coisa; e o que ele registra resiste bem à memória curta — o relógio está no relógio, e atrito se lembra. **O tempo pode ser marcado discretamente durante**, que é o que o Guia já autoriza ao Curador (*"cronometrar discretamente"*).

### O que NÃO se decidiu

**Se ele anota também nos outros atos.** Nos atos 3, 4 e 5 há observador, e dois cadernos sobre a mesma cena produzem versão, não medida. Fica em aberto; a resposta provável é que o Diário da Consulta Inicial seja dele e o dos outros atos seja do observador, **cada folha assinada por quem escreveu**.

### Revisitar quando

Uma anotação dele cruzar a linha — é o sinal de que o teste acima é fino demais e precisa de exemplo, não de princípio. Ou quando o Ensaio mostrar que ele **não teve nada que escrever**: aí a sala não tem atrito que valha medir, e ele volta a só ouvir.
