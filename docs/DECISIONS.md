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
- **Contexto:** ao auditar o módulo `story` para o Épico 1/Sprint 1, identifiquei que `docs/PRODUCT_ARCHITECTURE.md` §4.2 descrevia a jornada do Concierge como se, ao concluir "sua história", *"a pessoa cria conta (ou associa a uma já existente)"* — o que contradiz diretamente §21 (correção definitiva, mais recente): *"a equipe Aliviar realiza o cadastro inicial do paciente... não existe, e não deve existir, signup público."* Levei a contradição ao usuário antes de implementar. Decisão do usuário: a regra de §21 prevalece integralmente — "sua história" nunca cria nem associa conta; passa a exigir sessão autenticada com papel "paciente" desde o primeiro acesso ao wizard.
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

## ADR-024 — Content Invariant no P003: rejeitar `severity: "blocking"` para restrição prática opcional (formalização de CAL-002)

- **Status:** Definitiva quanto à decisão, à taxonomia e ao comportamento em caso de violação; **implementação não autorizada nesta ADR** — depende de aprovação explícita e separada do arquiteto do projeto.

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

| Conceito | Definição | Pode ser `blocking`? |
|---|---|---|
| Ausência (`category: "ausencia"`) | Informação que deveria existir mas não foi relatada | Depende do que se refere — ver abaixo |
| Insuficiência (`category: "insuficiencia"`) | Informação existe mas está incompleta para avaliação responsável | Depende do que se refere — ver abaixo |
| Contradição (`category: "contradicao"`) | Dois elementos do Caso logicamente incompatíveis | **Sim, sempre** |
| Ambiguidade (`category: "ambiguidade"`) | Elemento presente, mas sem leitura única | Sim — `specification.md` já deixa a critério de "a ambiguidade impedir ou não uma análise responsável"; **fora do escopo deste invariant** |
| Ausência de decisão | `decisionStatement.decision === null` | **Sim, sempre** — já garantido deterministicamente por `auditDecisionStatement()`/`missingInformation` (`relatedField: "decision"`), sem depender do modelo |
| Ausência de objetivo | `decisionStatement.goal === null` | **Sim, sempre** — mesma garantia determinística, `relatedField: "goal"` |
| Restrição/preferência prática opcional | Ausência ou insuficiência não relacionada a decisão nem objetivo (ex.: localização, modalidade, horário, orçamento) | **Nunca** — é exatamente a regra que este invariant mecaniza |

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

| Alternativa | Vantagem | Risco | Decisão |
|---|---|---|---|
| Confiar só no prompt | Simples, sem código novo | Já provado insuficiente (CAL-002, 4 execuções reais) | Rejeitada, com evidência |
| Corrigir silenciosamente `blocking` → `warning` | Resolveria o sintoma imediatamente | Mascara o julgamento do modelo; viola Constituição (Princípio 3) e o próprio conceito de Method Invariant (ADR-023: "nunca corrige") | Rejeitada por princípio |
| Validar no Concierge (`orchestrator.ts`) | Um único lugar para regras futuras | Vaza regra de negócio do Método para a camada de orquestração, que hoje não conhece nenhuma regra do ACE | Rejeitada — quebra separação já estabelecida |
| Validar dentro do P003 | Mantém a regra onde a especificação já vive | Nenhum risco relevante identificado | **Aceita** |
| Mecanismo genérico de invariants em `core/` | Reutilizável desde já | Abstração prematura sem um segundo caso de uso concreto ainda | Rejeitada nesta ADR — só a instância do P003 agora |
| Hardcode textual por palavra-chave em `description` | Não exige mudança de schema | Frágil, sujeito a falso positivo/negativo por variação de fraseado — exatamente o que esta investigação rejeita | Rejeitada |
| Evoluir o schema estruturado do achado (`relatedField`) | Torna a distinção determinística, sem depender de texto | Exige tocar `anthropic-language-model.ts`, `prompt.md`, `specification.md` e o tipo `P003AdditionalFinding` | **Aceita como pré-condição** |

### 6. Consequências

- Fecha definitivamente CAL-002 sem depender de o modelo "aprender" — a garantia passa a ser determinística.
- Custo de manutenção: uma função nova e pequena, testada; mais um valor no enum de erro; um campo novo no schema/prompt/especificação do P003.
- Risco de falso positivo (rejeitar uma resposta que era aceitável): baixo, se a taxonomia da seção 3 for seguida à risca — decisão/objetivo ausentes e contradições continuam podendo bloquear.
- Risco de falso negativo (deixar passar uma violação real): baixo — depende do modelo preencher `relatedField` corretamente, mas Zod já torna esse campo obrigatório, então uma resposta sem ele falha na validação de forma antes mesmo do invariant rodar.
- Observabilidade: novo código de falha pesquisável (`CONTENT_INVARIANT_VIOLATION`), distinto de `CASE_AUDIT_BLOCKED` — melhora, não piora, a distinção entre "Caso com pendência real" e "resposta do modelo inválida".
- Custo de API: uma violação exige nova chamada manual ao modelo, mesmo custo de qualquer outra falha hoje — não introduz custo recorrente automático.
- Adoção futura por outros protocolos é possível (P010 já tem um Content Invariant equivalente, `assertNoForbiddenLanguage`; P004 tem um candidato condicional a CAL-003), mas cada um exige sua própria calibração e evidência — esta ADR não generaliza automaticamente.
- **Limites explícitos:** esta ADR não resolve CAL-001 nem CAL-003; não introduz um framework genérico de invariants; não adiciona retry automático; não implementa o invariant.

### 7. Estratégia de implementação (não executada nesta ADR)

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

### 8. Estratégia de testes (não executada nesta ADR)

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

**Golden Set** (critério de aprovação, sem execução real nesta etapa):
- Mínimo 3 execuções reais da fixture de "caso limpo" pós-implementação: todas `status: "READY"`, nenhuma com achado `category` em (`ausencia`, `insuficiencia`) + `relatedField: "other"` + `severity: "blocking"`.
- Fixture de contradição real deve continuar `BLOCKED` nas mesmas execuções (checagem negativa, já existente).

### Documentos afetados por esta ADR

- `docs/ace/CALIBRATION_REPORT.md` — entrada CAL-002 recebe um adendo referenciando esta ADR (evidência histórica preservada, não reescrita).
- `docs/ace/METHOD_INVARIANTS_DESIGN.md` — mapeamento do P003 atualizado para referenciar esta ADR como a instância formalizada.

- **Revisitar quando:** o arquiteto do projeto autorizar explicitamente a implementação (seção 7) — até lá, nenhum código, schema, prompt ou especificação é alterado por esta ADR.

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

| Alternativa | Por que foi descartada |
|---|---|
| Somente pre-check em memória | Janela TOCTOU real — comprovada nesta auditoria; nunca fecha a corrida sozinha |
| Lock explícito (`SELECT ... FOR UPDATE` ou advisory lock) | Mais complexo, exige disciplina em todo caminho de escrita futuro; um índice único é mais simples e à prova de esquecimento |
| Serialização na aplicação (fila, mutex em memória) | Não funciona entre múltiplas instâncias/processos do servidor; a garantia precisa ser no banco, não no processo |
| Unique constraint não parcial (`case_id` único na tabela inteira) | Quebraria o histórico append-only intencional — impediria até `REJECTED`/`INFORMATION_REQUESTED` repetidos, que são esperados e corretos |
| Sobrescrever a decisão anterior em vez de rejeitar a nova | Violaria a imutabilidade do histórico humano (Kernel, seção 6) e apagaria a auditoria de quem decidiu o quê |
| **Índice único parcial sobre `case_id`, predicado `VALIDATED`** | **Aceita** — fecha a corrida no banco, preserva o histórico dos demais estados, sem exigir nenhuma disciplina adicional de aplicação |

### Dependências

- `docs/ace/04-specs/P009-human-review/specification.md` — define `reviewStatus`/`VALIDATED`, mas não formalizava (antes desta ADR) a multiplicidade por Caso; esta ADR preenche essa lacuna normativa.
- Migration `20260712140000_human_review_results.sql` (tabela base, append-only, sem UPDATE/DELETE) e `20260714000000_human_review_results_one_validated_per_case.sql` (o índice desta ADR).
- `src/modules/concierge/human-review-repository.ts` (`submitHumanReview`) — pre-check e tratamento de `23505`.

- **Revisitar quando:** houver uma decisão de produto explícita para permitir revalidar um Caso já validado (revogação ou supersessão) — nesse momento, uma nova ADR define esse fluxo, sem alterar retroativamente a garantia de unicidade aqui estabelecida.
