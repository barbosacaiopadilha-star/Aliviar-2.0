# Ontologia Oficial do ACE

Vocabulário oficial e estável do Método Aliviar (ACE). Todo protocolo deve usar estes termos com o significado definido aqui — nenhum protocolo pode redefinir um termo já registrado nesta Ontologia (ver hierarquia de autoridade em `docs/ace/00-constitution/constitution.md`, seção 4).

## Entidades

**Cliente** — pessoa que busca cuidado através da Aliviar e interage com o ACE. Equivalente, no domínio de produto de `aliviar-conexao`, ao "paciente" de `docs/PRODUCT_VISION.md` — o termo "cliente" é preferido dentro do ACE por refletir a relação de Concierge de Saúde.

**História (Narrative)** — o relato do cliente sobre o que aconteceu, em linguagem natural, sem estruturação clínica ou classificação. Produzida pelo P001 (Intake). Nunca contém diagnóstico, interpretação de exame ou recomendação.

**Caso (DecisionCase)** — a estruturação formal da História para uso pelos protocolos seguintes. Nunca produzida pelo P001; responsabilidade do P002 (Case Builder). É imutável após criada, versionada, e referencia a História de origem sem copiá-la. Nunca contém diagnóstico, especialidade inferida, nível de confiança, compatibilidade, competências ou especialistas.

**Declaração de Decisão (DecisionStatement)** — o par decisão + objetivo do cliente, extraído da História e registrado dentro do Caso, sempre com indicação de fato relatado ou inferência estrutural e evidência de origem.

**Restrição Obrigatória** — condição não-negociável que o cliente relatou explicitamente na História (ex.: uma data que não pode ser comprometida). Registrada no Caso com evidência de origem; nunca inferida sem correspondência clara na História.

**Preferência** — condição desejável, porém flexível, relatada pelo cliente na História. Registrada no Caso com evidência de origem; distinta de Restrição Obrigatória por não ser não-negociável.

**Informação Ausente** — lacuna identificada pelo P002 quando uma informação essencial à Declaração de Decisão, Restrição ou Preferência não foi estabelecida na História. Nunca é preenchida por inferência — apenas sinalizada.

**Evidência de Origem** — referência rastreável (trecho da História) que sustenta um elemento estruturado do Caso. Garante auditabilidade e explicabilidade (Kernel, seção 4). Informações Ausentes não possuem Evidência de Origem, por definição.

**Decisão (do cliente)** — a decisão concreta e prática que o cliente precisa tomar (ex.: decidir se opera, decidir qual caminho de tratamento seguir). Identificada, nunca tomada, pelo ACE.

**Objetivo (do cliente)** — o resultado que o cliente espera obter ao buscar a Aliviar. Identificado, nunca prometido, pelo ACE.

**Curadoria Médica Independente** — o método proprietário da Aliviar de conectar cliente a cuidado com critério humano, nunca por posição paga (ver `docs/PRODUCT_VISION.md`). A curadoria em si é responsabilidade humana da equipe Aliviar, apoiada — nunca substituída — pelo ACE (Princípio 6, `docs/PRODUCT_PRINCIPLES.md`).

**Protocolo** — unidade de responsabilidade única do ACE (ex.: P001, P002). Ver `docs/ace/01-framework/framework.md`.

**Concierge de Saúde** — papel exercido pelo protocolo P001: primeiro contato entre cliente e Aliviar, responsável exclusivamente por compreender a História.

**Estado de Prontidão (ReadinessStatus)** — classificação do Caso quanto à sua adequação para prosseguir de forma responsável: `READY`, `READY_WITH_WARNINGS` ou `BLOCKED`. Atribuída exclusivamente pelo P003 (Case Audit); nunca pelo P002.

**Auditoria do Caso (CaseAudit)** — artefato produzido pelo P003 (Case Audit), avaliando se um Caso possui informação suficiente para prosseguir com responsabilidade. Nunca modifica o Caso auditado; nunca adiciona informação a ele — apenas relata seu Estado de Prontidão, referenciando o Caso auditado por id e versão.

**Bloqueio (BlockingIssue)** — lacuna ou problema identificado pelo P003 que impede uma análise responsável do Caso; sua presença determina o Estado de Prontidão `BLOCKED`.

**Aviso (Warning)** — lacuna ou limitação identificada pelo P003 que não impede a análise, mas é relevante; sua presença (na ausência de Bloqueios) determina o Estado de Prontidão `READY_WITH_WARNINGS`.

**Pergunta Recomendada (RecommendedQuestion)** — pergunta específica, em linguagem clara e não indutiva, recomendada pelo P003 para resolver exatamente um Bloqueio ou Aviso — nunca uma pergunta de escopo geral ou não vinculada a um item identificado.

**Contexto de Decisão (DecisionContext)** — artefato produzido pelo P004 (Decision Context Modeler), organizando o contexto necessário para que protocolos futuros identifiquem competência, elegibilidade e compatibilidade. **Nunca se chama "Clinical Context"** (ADR-011, `docs/DECISIONS.md`) — nomeia-se sempre em torno da decisão do cliente, nunca de uma condição de saúde. Referencia o Caso e a Auditoria do Caso que o originaram, por id e versão, sem alterá-los. Nunca contém diagnóstico, especialidade inferida, competência ou especialista.

**Tipo de Decisão (DecisionType)** — classificação da natureza da decisão que o cliente enfrenta (ex.: buscar avaliação inicial, decidir sobre uma intervenção específica, buscar acompanhamento contínuo, esclarecer uma dúvida pontual). Descreve a forma da decisão, nunca uma condição de saúde ou especialidade.

**Domínio (ClinicalDomain)** — categoria ampla de vida/saúde já evidente na História (ex.: saúde emocional/mental, saúde física), atribuída pelo P004. **Nunca uma especialidade médica** — permanece no nível de abstração de uma pessoa leiga descrevendo sua própria preocupação, não uma taxonomia clínica.

**Complexidade (ComplexityLevel)** — estimativa de quão complexo é o Caso para ser conduzido (baixa/média/alta), atribuída pelo P004 a partir de sinais estruturais do Caso e da Auditoria (quantidade de restrições, preferências, lacunas).

**Urgência (UrgencyLevel)** — estimativa de quão sensível ao tempo é a decisão (baixa/média/alta/não determinada), atribuída pelo P004 **apenas a partir de sinais já relatados pelo cliente** no Caso (ex.: uma restrição de prazo) — nunca fabricada para criar senso de urgência artificial (`docs/BRAND_GUIDELINES.md`).

**Estratégia (Strategy)** — orientação de alto nível sobre como a curadoria deve prosseguir a partir deste Contexto de Decisão (ex.: conexão direta, aprofundamento prévio, avaliação inicial) — nunca especifica quem, apenas como proceder estruturalmente.

**Artefato de Análise (AnalysisArtifact)** — categoria estrutural de todo artefato produzido entre P001 e P008 (Constituição, Princípio 9; Kernel, seção 6). Nenhum Artefato de Análise possui valor decisório — carrega sempre `decisional: false`, imutável. Um Artefato de Análise pode listar, classificar ou pontuar candidatos (ex.: um futuro Shortlist), mas isso nunca constitui uma recomendação final por si só.

**Curadoria Validada** — *(nome reservado, sem protocolo próprio especificado ainda)* o resultado da revisão humana da equipe Aliviar sobre as análises acumuladas do pipeline, produzida pelo P009 (Human Review). É o primeiro artefato do ACE com valor decisório.

**Curadoria Final** — *(nome reservado, sem protocolo próprio especificado ainda)* o artefato final apresentado ao cliente, originado exclusivamente a partir da Curadoria Validada — nunca diretamente de um Artefato de Análise.

**Perfil de Competência (CompetencyProfile)** — artefato produzido pelo P005 (Competency Profile Builder), traduzindo o Contexto de Decisão em uma descrição de competência relevante (foco + nível de experiência). Artefato de Análise — nunca contém especialidade médica, nunca nomeia um especialista.

**Foco de Competência (CompetencyFocus)** — dimensão do Perfil de Competência derivada do Tipo de Decisão (ex.: avaliação, intervenção, acompanhamento contínuo, esclarecimento) — descreve a natureza do apoio necessário, nunca uma especialidade.

**Nível de Experiência (ExperienceLevel)** — dimensão do Perfil de Competência derivada da Complexidade do Contexto de Decisão (geral, experiente, altamente experiente).

**Care Provider** — termo oficial do ACE para quem provê cuidado (indivíduo, instituição ou equipe). **Nunca "Specialist"** (ADR-013, `docs/DECISIONS.md`) — o Método permanece desacoplado da estrutura atual da Rede da Aliviar, para poder evoluir sem exigir mudança na Ontologia. Esta é uma decisão puramente arquitetural interna; não altera a terminologia usada com o cliente.

**Provider Repository** — porta de infraestrutura (não um conceito do Método em si) que expõe candidatos a Care Provider por domínio. O P006 conhece apenas seu contrato, nunca uma implementação concreta. Vive em `src/modules/ace/ports/`, não em `core/`.

**Conjunto de Providers Elegíveis (EligibleProviderSet)** — artefato produzido pelo P006 (Eligible Provider Set Builder): o subconjunto de Care Providers candidatos que atendem aos requisitos mínimos do Perfil de Competência. Artefato de Análise — semanticamente um conjunto, nunca uma lista ordenada por relevância; onde a serialização exige ordem, ela é estável por identificador, nunca um ranking.

**Avaliação de Elegibilidade** — registro, para cada Care Provider candidato considerado pelo P006, se é elegível ou não e por quê. Cobre todo candidato avaliado, não apenas os elegíveis — garante explicabilidade tanto da inclusão quanto da exclusão.

**Matriz de Compatibilidade (CompatibilityMatrix)** — artefato produzido pelo P007 (Compatibility Matrix Builder): uma avaliação individual, comparável e explicável de cada Care Provider do Conjunto de Providers Elegíveis, em seis dimensões qualitativas. Artefato de Análise — nunca contém score numérico, percentual ou ranking; nunca escolhe, destaca ou recomenda um Care Provider específico.

**Nível de Alinhamento (AlignmentLevel)** — escala qualitativa fechada usada por cada dimensão da Matriz de Compatibilidade: `STRONG` (excede o requisito), `ADEQUATE` (atende exatamente), `PARTIAL` (correspondência incompleta), `INSUFFICIENT` (não atende, ou dado insuficiente para confirmar — a distinção fica sempre na justificativa textual, nunca no valor do nível), `NOT_APPLICABLE` (dimensão não pertinente a este caso). Consistente com o estilo já usado pelo Estado de Prontidão (P003).

**Dimensões da Matriz de Compatibilidade** — seis avaliações por Care Provider: Alinhamento de Competência, Alinhamento de Experiência, Alinhamento de Contexto (urgência), Alinhamento de Estratégia, Alinhamento de Restrições, Alinhamento de Continuidade. Cada uma é atribuída pelo P007 a partir do que já está modelado no Contexto de Decisão, no Perfil de Competência e no perfil completo do Care Provider — nunca inventada. Cada dimensão é registrada como um resultado próprio (classificação + justificativa + evidências utilizadas) — nunca apenas um rótulo solto.

**Informação Ausente da Matriz de Compatibilidade (missingInformation)** — lista, por Care Provider avaliado, das dimensões cujo dado necessário não foi encontrado (classificação `INSUFFICIENT`). Distinta de uma limitação: uma limitação é uma qualidade parcialmente atendida com dado presente (`PARTIAL`); informação ausente é a inexistência do dado em si. Mesmo vocabulário já usado pelo Caso de Decisão (P002) para o mesmo propósito — declarar explicitamente o que não se sabe, nunca inventar.

**Provider Profile Repository** — porta de infraestrutura (não um conceito do Método em si), distinta do Provider Repository (P006): expõe o perfil completo de Care Providers já identificados como elegíveis, por id. O P007 conhece apenas seu contrato, nunca uma implementação concreta. Vive em `src/modules/ace/ports/`, não em `core/`.

**Shortlist** — artefato produzido pelo P008 (Shortlist Builder): uma proposta de exatamente três Care Providers, composta a partir da Matriz de Compatibilidade. Artefato de Análise — nunca uma escolha final, nunca um ranking; só se torna decisória após validação humana (Curadoria Validada, P009).

**Status da Shortlist** — `COMPOSED` (exatamente três Care Providers qualificados existem e foram preservados) ou `BLOCKED` (o Método nunca reduz o padrão de qualidade, nem desempata arbitrariamente, apenas para completar três nomes). Todo bloqueio distingue sua causa exata: opções insuficientes, evidências insuficientes, ou composição ambígua (mais de três providers igualmente fundamentados, sem critério legítimo de desempate — resolvido apenas por revisão humana, P009).

**Justificativa Individual (providerRationales)** — explicação, por Care Provider selecionado, do porquê de sua presença na Shortlist, derivada exclusivamente do que já está na Matriz de Compatibilidade.

**Justificativa da Composição (compositionRationale)** — explicação do conjunto como um todo: por que estes três (ou por que a Shortlist está bloqueada).

**Artefato de Decisão Humana (HumanDecisionArtifact)** — categoria de artefato distinta de Artefato de Análise: possui valor decisório real (`decisional: true`), e modela explicitamente, na própria base do contrato, quem decidiu e quando. Introduzida pelo P009 (Human Review) — o primeiro e único estágio do ACE com essa autoridade.

**Resultado da Revisão Humana (HumanReviewResult)** — artefato produzido pelo P009: registra a ação de um revisor humano sobre a Shortlist (aprovar, ajustar, rejeitar, ou solicitar mais informação), com rastreabilidade completa (quem, quando, com base em quê). Um Artefato de Decisão Humana, nunca um Artefato de Análise.

**Ação de Revisão (reviewAction)** — a ação que o revisor humano efetivamente tomou: `APPROVE`, `ADJUST`, `REJECT` ou `REQUEST_MORE_INFORMATION`. Nunca escolhida ou simulada pelo software.

**Status da Revisão (reviewStatus)** — o que a Ação de Revisão significa para o restante do pipeline: `VALIDATED` (originado por `APPROVE` ou por um `ADJUST` válido — único estado que pode originar uma Curadoria Validada), `REJECTED`, ou `INFORMATION_REQUESTED`.

**Alteração de Provider (ProviderChange)** — registro individual de uma adição ou remoção de Care Provider durante um `ADJUST`, sempre com justificativa e evidências próprias — nunca uma alteração silenciosa.

**Artefato de Entrega (DeliveryArtifact)** — categoria de artefato distinta de Artefato de Análise e de Artefato de Decisão Humana: `decisional: false`, mas preserva na própria base a proveniência de uma decisão humana já registrada (quem validou, quando, a partir de qual Resultado da Revisão Humana). Introduzida pelo P010 (ADR-016) — o produto final entregável do ACE, que comunica uma decisão já tomada, nunca toma uma nova.

**Curadoria Final (FinalCuradoria)** — artefato produzido pelo P010: materializa e comunica ao cliente a curadoria validada no P009, com a apresentação dos três Care Providers aprovados, resumo do caso e do contexto, explicação do Método, e disclaimer obrigatório. Um Artefato de Entrega, nunca decisório — a decisão já ocorreu antes dele.

**Apresentação de Provider (ProviderPresentation)** — estrutura visual e semântica única para cada um dos três Care Providers na Curadoria Final: identidade, resumo profissional, por que foi incluído, forças para este caso, limitações relevantes, considerações práticas. Nunca usa linguagem de ranking (primeiro/segundo/terceiro lugar, melhor, vencedor) ou score.

**Provider Presentation Repository** — porta de infraestrutura (não um conceito do Método em si), distinta do Provider Profile Repository (P007): expõe apenas os dados institucionais de apresentação de um Care Provider (identidade, resumo profissional, considerações práticas) — nunca dado de análise. Preserva a separação entre dado usado para análise e dado usado para apresentação ao cliente.

## Relações entre entidades

- Um **Cliente** relata uma **História** ao **Concierge de Saúde** (P001).
- A **História** é a entrada do **Caso**, construído pelo P002 (Case Builder).
- O **Caso** contém exatamente uma **Declaração de Decisão**, zero ou mais **Restrições Obrigatórias**, zero ou mais **Preferências**, e zero ou mais **Informações Ausentes**.
- Toda **Restrição Obrigatória** e **Preferência** (e a **Declaração de Decisão**, quando aplicável) carrega uma **Evidência de Origem** rastreável até a **História**.
- O **Caso** é avaliado pelo P003 (Case Audit), que produz uma **Auditoria do Caso** referenciando o Caso por id e versão, sem alterá-lo.
- A **Auditoria do Caso** contém zero ou mais **Bloqueios**, zero ou mais **Avisos**, e uma **Pergunta Recomendada** para cada Bloqueio/Aviso identificado.
- O **Estado de Prontidão** da Auditoria é `BLOCKED` se há ao menos um Bloqueio; `READY_WITH_WARNINGS` se não há Bloqueio mas há ao menos um Aviso; `READY` caso contrário.
- O **Caso** informa a **Curadoria Médica Independente**, conduzida por humanos da equipe Aliviar.
- A **Decisão** e o **Objetivo** do cliente são identificados durante a História e carregados adiante, dentro da Declaração de Decisão do Caso — nunca resolvidos pelo ACE.
- O **Caso** e a **Auditoria do Caso** juntos são a entrada do P004 (Decision Context Modeler), que produz um **Contexto de Decisão** referenciando ambos por id e versão, sem alterá-los.
- O **Contexto de Decisão** contém um **Tipo de Decisão**, um **Domínio**, uma **Complexidade**, uma **Urgência** e uma **Estratégia** — todos atribuídos pelo P004 a partir do que já está no Caso e na Auditoria, nunca inventados. Também preserva as **Restrições Obrigatórias** já existentes no Caso (ADR-015) — o P004 não as cria nem as reinterpreta, apenas as transporta de forma rastreável, para que o P007 possa avaliar o Alinhamento de Restrições com dado real.
- O **Contexto de Decisão** é a entrada do P005 (Competency Profile Builder), que produz um **Perfil de Competência** contendo um **Foco de Competência** (derivado do Tipo de Decisão) e um **Nível de Experiência** (derivado da Complexidade).
- **Caso**, **Auditoria do Caso**, **Contexto de Decisão** e **Perfil de Competência** são todos **Artefatos de Análise** — nenhum possui valor decisório. Apenas a **Curadoria Validada** (produzida pelo P009, ainda não especificado) pode originar a **Curadoria Final**.
- O **Perfil de Competência** é a entrada do P006 (Eligible Provider Set Builder), junto com o **Provider Repository**, que produz um **Conjunto de Providers Elegíveis** contendo uma **Avaliação de Elegibilidade** para cada **Care Provider** candidato — também um **Artefato de Análise**.
- O **Contexto de Decisão**, o **Perfil de Competência** e o **Conjunto de Providers Elegíveis**, junto com o **Provider Profile Repository**, são a entrada do P007 (Compatibility Matrix Builder), que produz uma **Matriz de Compatibilidade** contendo, para cada Care Provider do Conjunto, seis **Dimensões** em **Nível de Alinhamento** — também um **Artefato de Análise**, nunca uma escolha ou ranking.
- A **Matriz de Compatibilidade** é a entrada do P008 (Shortlist Builder), que produz uma **Shortlist** com **Status** `COMPOSED` (três Care Providers, cada um com sua **Justificativa Individual**) ou `BLOCKED` (quando não há três opções suficientemente fundamentadas, ou quando há mais de três sem critério legítimo de desempate) — sempre com uma **Justificativa da Composição**. Também um **Artefato de Análise**: só a validação humana do P009 pode originar a Curadoria Validada a partir dela.
- A **Shortlist** e a **Matriz de Compatibilidade** são a entrada do P009 (Human Review), junto com a identidade autenticada do revisor humano, que produz um **Resultado da Revisão Humana** contendo a **Ação de Revisão** tomada, o **Status da Revisão** resultante, e — quando a ação é `ADJUST` — uma ou mais **Alterações de Provider**. O Resultado da Revisão Humana é o primeiro **Artefato de Decisão Humana** do ACE, nunca um Artefato de Análise: somente um Status da Revisão `VALIDATED` pode originar a Curadoria Final.
- O **Resultado da Revisão Humana** (com Status `VALIDATED`), a **Matriz de Compatibilidade**, os dados do **Provider Presentation Repository**, e — quando necessários para os resumos — o **Caso** e o **Contexto de Decisão**, são a entrada do P010 (Final Curadoria Delivery), que produz a **Curadoria Final**: um **Artefato de Entrega**, nunca decisório e nunca um Artefato de Análise — a decisão já ocorreu no P009, o P010 apenas a materializa e comunica, com uma **Apresentação de Provider** para cada um dos três Care Providers aprovados. Com o P010, o pipeline do ACE (P001-P010) está estruturalmente completo.

## Termos explicitamente fora do vocabulário do ACE nesta fase

- **Diagnóstico** — não é um conceito que o ACE produz; pertence exclusivamente a profissionais de saúde humanos.
- **Especialidade médica** (como taxonomia formal) — ainda não modelada no produto (`aliviar-conexao`); nenhum protocolo deve presumir uma taxonomia de especialidades que ainda não existe. O **Domínio** do P004 é deliberadamente mais amplo que uma especialidade e nunca deve ser confundido com ela (ADR-011).
- **"Clinical Context"** — nome descartado antes de qualquer formalização (ADR-011); o artefato correspondente é sempre **Contexto de Decisão (DecisionContext)**.
- **"Specialist"** — termo descartado no vocabulário interno do ACE (ADR-013); o conceito correspondente é sempre **Care Provider**. Isso não afeta a terminologia usada com o cliente em `aliviar-conexao`.

## Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão — vocabulário extraído da especificação do P001 (Intake) e de `docs/PRODUCT_VISION.md`. |
| 0.2 | 2026-07-12 | Adicionados os conceitos necessários ao P002 (Case Builder): Caso (DecisionCase), Declaração de Decisão, Restrição Obrigatória, Preferência, Informação Ausente, Evidência de Origem. Nenhum conceito de P003 em diante foi antecipado. |
| 0.3 | 2026-07-12 | Adicionados os conceitos necessários ao P003 (Case Audit): Estado de Prontidão (ReadinessStatus), Auditoria do Caso (CaseAudit), Bloqueio (BlockingIssue), Aviso (Warning), Pergunta Recomendada (RecommendedQuestion). Nenhum conceito de P004 em diante foi antecipado. |
| 0.4 | 2026-07-12 | Adicionados os conceitos necessários ao P004 (Decision Context Modeler): Contexto de Decisão (DecisionContext), Tipo de Decisão, Domínio, Complexidade, Urgência, Estratégia. Registrado (ADR-011) que "Clinical Context" é nome descartado, nunca formalizado. Nenhum conceito de P005 em diante foi antecipado. |
| 0.5 | 2026-07-12 | Adicionado o Artefato de Análise (Princípio 9 da Constituição), com registro de Curadoria Validada e Curadoria Final como nomes reservados (sem protocolo próprio ainda). Adicionados os conceitos do P005 (Competency Profile Builder): Perfil de Competência, Foco de Competência, Nível de Experiência. Nenhum conceito de P006 em diante foi antecipado. |
| 0.6 | 2026-07-12 | Adicionados os conceitos necessários ao P006 (Eligible Provider Set Builder): Care Provider, Provider Repository, Conjunto de Providers Elegíveis (EligibleProviderSet), Avaliação de Elegibilidade. Registrado (ADR-013) que "Specialist" é termo descartado no vocabulário interno do ACE — nunca afeta a terminologia usada com o cliente. Nenhum conceito de P007 em diante foi antecipado. |
| 0.7 | 2026-07-12 | Adicionados os conceitos necessários ao P007 (Compatibility Matrix Builder): Matriz de Compatibilidade (CompatibilityMatrix), Nível de Alinhamento (AlignmentLevel), as seis Dimensões, Provider Profile Repository. Nenhum conceito de P008 em diante foi antecipado. |
| 0.8 | 2026-07-12 | Sprint 8: refinamento (não expansão) do vocabulário do P007 — Dimensões passaram a ser registradas como resultado próprio (classificação + justificativa + evidências); adicionado Informação Ausente da Matriz de Compatibilidade (missingInformation), distinta de limitação. |
| 0.9 | 2026-07-12 | Sprint 9 (ADR-015): registrado que o Contexto de Decisão preserva as Restrições Obrigatórias do Caso, corrigindo a lacuna que fazia o Alinhamento de Restrições ser sempre não aplicável. Nenhum conceito novo — apenas uma relação já implícita, agora explícita. |
| 0.10 | 2026-07-12 | Sprint 9: adicionados os conceitos necessários ao P008 (Shortlist Builder): Shortlist, Status da Shortlist, Justificativa Individual, Justificativa da Composição. Nenhum conceito de P009 em diante foi antecipado. |
| 0.11 | 2026-07-12 | Sprint 10, correção obrigatória: Status da Shortlist passa a distinguir explicitamente as três causas de bloqueio, incluindo composição ambígua (mais de três providers igualmente fundamentados). |
| 0.12 | 2026-07-12 | Sprint 10: adicionados os conceitos necessários ao P009 (Human Review): Artefato de Decisão Humana (HumanDecisionArtifact), Resultado da Revisão Humana (HumanReviewResult), Ação de Revisão, Status da Revisão, Alteração de Provider. Primeira categoria de artefato do ACE com valor decisório real. Nenhum conceito de P010 foi antecipado. |
| 0.13 | 2026-07-12 | Sprint 11 (ADR-016): adicionados os conceitos necessários ao P010 (Final Curadoria Delivery): Artefato de Entrega (DeliveryArtifact), Curadoria Final (FinalCuradoria), Apresentação de Provider, Provider Presentation Repository. Último protocolo do pipeline — nenhum conceito além do P010 foi antecipado. Pipeline P001-P010 estruturalmente completo. |
