# ACE Calibration Report

**Este documento não é normativo.** Em caso de qualquer divergência entre o conteúdo aqui registrado e as camadas oficiais do Método, prevalece sempre, nesta ordem (`docs/ace/00-constitution/constitution.md`, seção 4):

1. [Constituição](00-constitution/constitution.md)
2. [Framework](01-framework/framework.md)
3. [Ontologia](02-ontology/ontology.md)
4. [Kernel](03-kernel/kernel.md)
5. Especificações dos protocolos (`04-specs/`)
6. ADRs aplicáveis (`docs/DECISIONS.md`)

Este arquivo não constitui nova camada de autoridade, extensão da Constituição, do Framework, do Kernel, especificação de protocolo, nem substitui uma ADR. Ele fica deliberadamente fora da numeração `0X-camada/` — não é hierarquia, é histórico.

## 1. Propósito

O ACE está congelado na V1.0 (ADR-021) — nenhum desenvolvimento novo de produto ou arquitetura, só correção de bugs. Mesmo assim, a primeira execução real do Golden Set (`tests/golden/`, ver ADR-022) contra o modelo Anthropic revelou divergências entre o que a especificação de um protocolo exige, o que o `prompt.md` transmite, e o que o modelo de fato produz. Essas divergências precisam de um lugar para serem registradas, discutidas e rastreadas ao longo do tempo — sem, por si só, alterar nada.

**O que este documento registra:** cada calibração motivada por evidência empírica (Golden Set, produção, teste de integração, incidente operacional, revisão humana) — o que foi observado, a matriz de análise, e se/quando uma decisão normativa foi de fato tomada em outro lugar.

**O que este documento não decide:** nenhuma entrada aqui, por si só, altera Constituição, Framework, Ontologia, Kernel, `specification.md`, `prompt.md`, `examples.md`, `tests.md`, protocolo, artefato ou o próprio Golden Set. Uma entrada pode _propor_ ou _recomendar_, mas a mudança real só existe quando aplicada formalmente na camada correspondente (e, se for arquitetural, também registrada em `docs/DECISIONS.md`).

**Relação com o Golden Set:** o Golden Set (`tests/golden/`) é a fonte de evidência empírica mais comum para uma entrada aqui — ele mostra _o que o modelo realmente fez_; este documento registra _o que isso significa_ e _o que foi decidido a respeito_.

**Relação com ADRs:** nem toda entrada vira uma ADR. Uma entrada só referencia ou gera uma ADR quando a calibração de fato altera arquitetura, protocolo ou regra normativa — nunca por padrão.

**Relação com especificações:** as especificações (`docs/ace/04-specs/*/specification.md`) continuam sendo a única fonte de verdade sobre o que cada protocolo deve fazer. Este documento nunca as substitui, resume oficialmente, ou antecipa uma mudança nelas antes de ela ser aplicada de fato.

## 2. Regras de governança

- Nenhuma entrada deste documento altera o Método por si só.
- Mudanças normativas exigem alteração formal na camada correspondente (Constituição, Framework, Ontologia, Kernel, `specification.md`, `prompt.md`, conforme o caso) — nunca só o registro aqui.
- Mudanças arquiteturais relevantes exigem uma ADR própria em `docs/DECISIONS.md`.
- Toda evidência registrada deve ser sanitizada — nunca chave, nunca prompt integral, nunca dado pessoal ou payload sensível (mesmo padrão de `tests/golden/sanitize-for-log.ts`).
- Decisões pendentes permanecem explicitamente marcadas como pendentes (`Status: Em análise`) até serem de fato resolvidas em outro lugar.
- Uma entrada histórica nunca é reescrita para apagar a decisão (ou a ausência de decisão) anterior — uma correção de entendimento vira uma **nova entrada** ou um **adendo rastreável** à entrada original, nunca uma edição silenciosa.

## 3. Modelo de entrada

```
## [Data] — [Protocolo(s)] — [Resumo do gatilho]

**Categoria:** Evolução do Método | Correção de implementação | Adaptação ao comportamento do modelo

**Status:** Em análise | Aprovada | Implementada | Rejeitada | Substituída

**Gatilho:**
Origem da evidência (Golden Set, produção, teste de integração, incidente operacional, revisão humana).

**Evidência observada:**
Descrição sanitizada, sem prompt integral, chave, dado real ou payload sensível.

**Matriz de calibração:**
- Filosofia desejada
- Regra normativa anterior
- Regra normativa proposta (quando aplicável)
- Implementação anterior
- Comportamento observado do modelo
- Divergência encontrada
- Menor ajuste possível
- Impacto em produção
- Impacto no Human Review
- Impacto em futuras trocas de modelo

**Decisão tomada:**
Nenhuma decisão ainda | Decisão aprovada | Decisão rejeitada | Implementação concluída

**Arquivos normativos afetados:**
Só listar quando houver mudança de fato aprovada.

**ADR relacionada:**
Só referenciar se existir ou for realmente necessária — nunca criar uma por padrão.

**Validação:**
Testes determinísticos | Golden Set | produção | validação humana | resultado conhecido.

**Revisitar quando:**
Condição objetiva para reavaliação.
```

---

## Entradas

## 2026-07-14 — P010 (Final Curadoria Delivery) — Golden Set rejeitou negações legítimas de "ranking"

**Categoria:** Adaptação ao comportamento do modelo e possível correção de implementação.

**Status:** Implementada (ver Adendo — 2026-07-15 — abaixo).

**Gatilho:** Golden Set (`tests/golden/fixtures/p010-final-curadoria-delivery.ts`), primeira execução real contra o modelo Anthropic.

**Evidência observada:** `specification.md` do P010 exige que `comparisonSummary` explique que não há ranking entre os três providers. O mecanismo de verificação (`assertNoForbiddenLanguage`, `final-curadoria.ts`) rejeitava qualquer ocorrência da palavra "ranking", inclusive dentro de uma negação fiel ao que a especificação pede. Uma primeira correção (padrões de negação auditáveis: "sem ranking", "não há/existe/constitui/configura/representa/cria/gera... ranking", "nunca construímos/criamos/fazemos/geramos... ranking") resolveu o caso originalmente relatado. Uma segunda execução real, na mesma sessão, produziu uma nova amostra do modelo com a construção "não funciona como um ranking" — uma negação legítima, mas não coberta pelos padrões existentes — e voltou a ser rejeitada.

**Matriz de calibração:**

- Filosofia desejada: nunca apresentar a curadoria como ranking/vencedor; a escolha final é sempre do cliente.
- Regra normativa anterior: `specification.md` exige negar ranking no texto; Kernel proíbe permanentemente vocabulário de ranking. Nenhuma das duas muda.
- Regra normativa proposta: nenhuma — a regra em si está correta; o que está em aberto é só o mecanismo de verificação.
- Implementação anterior: lista única de substring, sem distinguir negação de afirmação (bug original); depois, 4 padrões de negação auditáveis (correção parcial).
- Comportamento observado do modelo: duas amostras reais — uma aceita ("nunca construindo um ranking"), uma rejeitada por padrão não coberto ("não funciona como um ranking").
- Divergência encontrada: verificação determinística por padrão finito vs. uma propriedade semântica aberta (variação natural de linguagem) — o prompt.md incentiva corretamente frases variadas e humanas, o que estruturalmente escapa de qualquer lista finita de padrões.
- Menor ajuste possível: não decidido — ampliar a lista de padrões resolve o caso observado, mas não fecha a classe do problema; a alternativa (aceitar uma taxa residual de falso-positivo como salvaguarda) é uma decisão de trade-off, não uma correção técnica.
- Impacto em produção: baixo/médio — um falso positivo bloqueia a entrega (retry operacional), nunca deixa passar uma afirmação real de ranking.
- Impacto no Human Review: nenhum direto (P009 ocorre antes do P010); um bloqueio recorrente pode empacar casos já aprovados.
- Impacto em futuras trocas de modelo: alto — os padrões foram calibrados contra o fraseado observado do Claude; um provider diferente exigiria recalibração.

**Decisão tomada:** nenhuma decisão ainda — o problema permanece parcialmente aberto.

**Arquivos normativos afetados:** nenhum (nenhuma mudança aprovada ainda).

**ADR relacionada:** nenhuma — não criada nesta etapa.

**Validação:** Golden Set (2 execuções reais, 1 aceita, 1 rejeitada); testes determinísticos de afirmação/negação (`tests/unit/ace-final-curadoria.test.ts`, 24 casos, todos passando para os padrões já cobertos).

**Revisitar quando:** o arquiteto do projeto decidir entre ampliar a lista de padrões, aceitar uma taxa residual de falso-positivo como salvaguarda deliberada, ou outra abordagem ainda não avaliada.

### Adendo — 2026-07-15 — Implementação aprovada e concluída

**Decisão tomada pelo arquiteto:** aceitar a taxa residual de falso-positivo como salvaguarda deliberada (alternativa já nomeada na entrada original) — trocando a estratégia de "enumerar verbos de negação específicos" por "detectar qualquer gatilho de negação pequeno e fechado (`não`/`nunca`/`sem`/`nenhum`+flexões/`jamais`) dentro da mesma cláusula semântica local da ocorrência de 'ranking'". Deixa de depender de prever a variação exata de verbo que o modelo vai usar; passa a depender apenas de existir _algum_ marcador de negação na mesma oração.

**Implementação:** `hasUnnegatedRanking` (`final-curadoria.ts`) reescrita em funções pequenas e nomeadas — `findRankingOccurrenceIndices`, `extractLocalClauseBefore`, `isRankingOccurrenceNegated` — cada ocorrência de "ranking" é avaliada isoladamente contra a cláusula local que a precede, delimitada por pontuação forte (`. ? ! \n ; :`) e por conjunções adversativas (`mas`, `porém`, `contudo`, `entretanto`, `todavia`, `no entanto`) — nunca por vírgula isolada, para não bloquear negações estilisticamente pontuadas. `RANKING_NEGATION_PATTERNS` (lista fechada de padrões de verbo) foi removida — substituída por este mecanismo. `ABSOLUTE_FORBIDDEN_PHRASES` e a ordem de verificação (frases absolutas antes de "ranking") permanecem inalteradas.

**Validação:** 34 testes determinísticos em `tests/unit/ace-final-curadoria.test.ts` (24 anteriores + 10 novos) — incluindo a amostra real que motivou esta entrada ("não funciona como um ranking", agora aceita) e 4 casos adversariais de ruptura de oração (ex.: "Não sei se você reparou, mas este é o primeiro no ranking." — corretamente rejeitado, a negação de uma oração anterior não "alcança" a afirmação de ranking na oração seguinte). Suíte unitária completa (381 testes), `npx tsc --noEmit`, `npm run lint` e `npm run build` limpos.

**Achado novo durante a validação (fora do escopo desta calibração):** uma execução real do Golden Set após esta implementação falhou no cenário P010 por um motivo não relacionado a "ranking" — ver nova entrada "2026-07-15 — P010 — possível falso positivo em 'mais indicado'" abaixo.

**Arquivos normativos afetados:** nenhum — confirmado; `specification.md` e `prompt.md` do P010 permanecem inalterados.

---

## 2026-07-15 — P010 (Final Curadoria Delivery) — possível falso positivo em "mais indicado" (ABSOLUTE_FORBIDDEN_PHRASES)

**Categoria:** Adaptação ao comportamento do modelo (possível correção de implementação — ainda não avaliada).

**Status:** Em análise.

**Gatilho:** Golden Set (`tests/golden/fixtures/p010-final-curadoria-delivery.ts`), execução real realizada durante a validação da implementação de CAL-001 (ver Adendo acima).

**Evidência observada:** uma execução real do modelo Anthropic contra o cenário "entrega após APPROVE" produziu um texto contendo a expressão "mais indicado" — presente em `ABSOLUTE_FORBIDDEN_PHRASES`, uma lista sem qualquer tratamento de negação (ao contrário de "ranking", que tem o mecanismo de cláusula descrito acima). A execução foi corretamente bloqueada (`ProtocolError`), mas não foi determinado, nesta rodada, se o texto gerado era uma afirmação real de superioridade (comportamento correto do guardrail) ou uma negação legítima da mesma família de CAL-001 (ex.: "não é necessariamente o mais indicado, apenas o mais alinhado ao caso"). Investigação fora do escopo autorizado da TASK que tratava exclusivamente do mecanismo de "ranking" — registrado aqui em vez de corrigido silenciosamente, conforme a regra de segurança dessa TASK.

**Matriz de calibração:** não preenchida — este achado não foi investigado além do registro.

**Decisão tomada:** nenhuma — aguardando triagem do arquiteto do projeto: (a) investigar se "mais indicado" (e possivelmente outras frases de `ABSOLUTE_FORBIDDEN_PHRASES`) merece o mesmo tratamento de negação por cláusula já aplicado a "ranking"; ou (b) tratar como comportamento correto do guardrail (o texto realmente afirmava superioridade) e não fazer nada.

**Arquivos normativos afetados:** nenhum.

**ADR relacionada:** nenhuma.

**Validação:** nenhuma — achado registrado, não investigado.

**Revisitar quando:** o arquiteto decidir se este achado justifica sua própria calibração (candidato a CAL-004) ou se é comportamento correto do guardrail, já esperado e sem ação necessária.

---

## 2026-07-14 — P003 (Case Audit) — lacuna não essencial classificada como bloqueio

**Categoria:** Correção de implementação ou calibração de prompt — ainda pendente de decisão.

**Status:** Em análise.

**Gatilho:** Golden Set (`tests/golden/fixtures/p003-case-audit.ts`), execução real contra o modelo Anthropic, reproduzida uma segunda vez com a observabilidade segura já instrumentada.

**Evidência observada:** para um DecisionCase com decisão e objetivo claros e `mandatoryConstraints` vazio, o modelo produziu um achado adicional com `severity: "blocking"` sobre a ausência de informação prática (localização/formato/horário/orçamento), resultando em `status: "BLOCKED"`. `specification.md` do P003 (Casos de Exceção) determina, sem ambiguidade, que uma lacuna não relacionada a decisão/objetivo é sempre `Warning`, nunca bloqueante.

**Matriz de calibração:**

- Filosofia desejada: nunca atrasar ou bloquear o cliente por uma lacuna não essencial.
- Regra normativa anterior: `specification.md`, Casos de Exceção — lacuna não essencial = sempre Warning. Permanece inalterada.
- Regra normativa proposta: nenhuma — a regra normativa já está correta; a divergência é de fidelidade do `prompt.md` a ela.
- Implementação anterior: `prompt.md` define BLOCKED só por um exemplo (decisão/objetivo ausentes), sem reafirmar explicitamente a regra inversa que `specification.md` já tem.
- Comportamento observado do modelo: classificou ausência de restrição prática como `blocking`, contrariando a especificação.
- Divergência encontrada: fidelidade prompt↔especificação — o prompt não transmite uma regra que a especificação já decidiu com clareza.
- Menor ajuste possível: uma linha em `prompt.md` (seção Regras), espelhando literalmente o Caso de Exceção já existente em `specification.md`. Não aplicado ainda.
- Impacto em produção: alto se não calibrado — casos prontos podem ser devolvidos ao cliente pedindo informação desnecessária.
- Impacto no Human Review: indireto — um caso erroneamente BLOCKED no P003 nem chega ao P004-P009.
- Impacto em futuras trocas de modelo: baixo-médio — uma regra explícita no prompt é mais portável entre modelos do que depender de inferência.

**Decisão tomada:** nenhuma decisão ainda — nenhuma correção de prompt ou protocolo foi aprovada.

**Arquivos normativos afetados:** nenhum.

**ADR relacionada:** nenhuma.

**Validação:** Golden Set (2 execuções reais, ambas reproduzindo o `BLOCKED`); artefato de diagnóstico sanitizado (`.golden-results/`) confirmou o achado exato que causou a divergência.

**Revisitar quando:** o arquiteto do projeto aprovar (ou rejeitar) o ajuste mínimo proposto em `prompt.md`.

### Adendo — 2026-07-15 — Reforço de prompt testado e insuficiente; formalização como Content Invariant (ADR-024)

O ajuste mínimo de prompt (Opção B, citado acima) foi implementado e testado 3 vezes contra a API Anthropic real — as 3 execuções reproduziram identicamente a mesma classificação incorreta (`severity: "blocking"` para ausência de restrição prática). Um traço completo de `p003-case-audit.ts` confirmou que nenhuma transformação de código toca `severity` — a causa é comprovadamente comportamento do modelo, não prompt, código ou especificação.

**Evidência adicional:** o payload da execução real de produção ("Curisco1") que originalmente motivou esta investigação **não existe mais** — foi removido durante a limpeza de dados de teste autorizada na mesma sessão (Etapa 3 do Go-Live). A evidência disponível a partir deste adendo é composta pelas execuções documentadas nesta entrada e nas reexecuções do Golden Set (estruturalmente equivalentes), nunca o payload específico já apagado.

Esta calibração foi formalizada em **ADR-024** (`docs/DECISIONS.md`): decisão de implementar um Content Invariant no P003 que rejeita deterministicamente (nunca corrige) uma resposta do modelo classificando restrição prática opcional como bloqueante — incluindo taxonomia completa, comportamento de erro (`ProtocolErrorCode: "CONTENT_INVARIANT_VIOLATION"`, distinto de `CASE_AUDIT_BLOCKED`), pré-condição de schema (`relatedField`) e estratégia de implementação/testes. **Status desta entrada permanece "Em análise" quanto à implementação** — a ADR-024 documenta a decisão e o desenho; a implementação em si aguarda autorização explícita separada.

---

## 2026-07-14 — P004 (Decision Context Modeler) — urgência instável frente a prazo operacional

**Categoria:** Evolução do Método, caso a interpretação normativa seja alterada.

**Status:** Em análise.

**Gatilho:** Golden Set (`tests/golden/fixtures/p004-decision-context-modeler.ts`), a mesma entrada executada duas vezes contra o modelo Anthropic.

**Evidência observada:** para um DecisionCase com uma restrição obrigatória de prazo (viagem de trabalho em três meses), duas execuções idênticas produziram `urgency` diferente entre si (`"nao_determinado"`, depois `"baixa"`), e nenhuma das duas correspondeu ao exemplo já documentado em `examples.md` (`"media"`). `specification.md` nunca operacionaliza a relação entre um sinal de prazo relatado e o nível de urgência resultante.

**Matriz de calibração:**

- Filosofia desejada: em aberto entre duas alternativas.
  - **A.** Prazo operacional influencia obrigatoriamente a classificação de urgência.
  - **B.** Prazo operacional é uma restrição de contexto e não implica necessariamente urgência clínica.
- Regra normativa anterior: `specification.md` não formaliza nenhuma das duas — só exige que `urgency` seja rastreável a um sinal já relatado, e permite `"nao_determinado"` quando o sinal não é claramente determinável.
- Regra normativa proposta: **Alternativa B foi recomendada tecnicamente** (mais coerente com o Kernel — "urgency nunca cria senso de urgência artificial" — e com o Princípio 5 da Constituição, tom nunca alarmista) — mas nenhuma decisão normativa final foi tomada. `specification.md`, `tests.md` e `examples.md` permanecem inalterados.
- Implementação anterior: `prompt.md` espelha a mesma vagueza de `specification.md`, sem regra adicional.
- Comportamento observado do modelo: duas respostas diferentes para a mesma entrada, nenhuma igual ao exemplo publicado.
- Divergência encontrada: o Golden Set (via `tests.md` T03) valida uma implementação específica assumida em `examples.md`, nunca formalmente promovida a regra da especificação.
- Menor ajuste possível: não existe ajuste mínimo de código — exige decisão normativa (A ou B) do arquiteto antes de qualquer mudança em `specification.md`/`tests.md`/`examples.md`.
- Impacto em produção: médio — `urgency` alimenta `contextAlignment` no P007; classificação instável pode variar a avaliação de compatibilidade sem mudança real no caso do cliente.
- Impacto no Human Review: baixo-médio — a autoridade final do Curador (Kernel, seção 6) já amortece o risco de uma classificação inconsistente chegando a ele.
- Impacto em futuras trocas de modelo: alto — sem uma regra clara, cada novo modelo resolve a ambiguidade à sua maneira, parecendo deriva quando na verdade é a ausência de uma regra formal sendo exposta.

**Decisão tomada:** nenhuma decisão normativa final tomada. `specification.md`, `tests.md` e `examples.md` permanecem inalterados.

**Arquivos normativos afetados:** nenhum.

**ADR relacionada:** nenhuma — só seria criada se/quando a Alternativa A ou B for formalmente adotada.

**Validação:** Golden Set (2 execuções reais da mesma entrada, respostas divergentes entre si e frente ao exemplo documentado).

**Revisitar quando:** o arquiteto do projeto decidir entre a Alternativa A e a Alternativa B.

### Adendo — 2026-07-23 — Alternativa A adotada (Calibration Board / ADR-032)

**Decisão do responsável (Calibration Board, PROGRAM-34):** adotada a **Alternativa A** — um prazo relatado (data-limite, viagem, compromisso com data) É um sinal relatado de urgência e deve gerar uma `urgency` classificada (tipicamente baixa/média), nunca `"nao_determinado"`, com o prazo citado em `rationale`/`assumptions`. Esta decisão **inverte** a recomendação técnica anterior (Alternativa B, registrada acima) — registrada como adendo rastreável, sem reescrever a entrada original (regra de governança §2).

**Fundamento (fontes canônicas):** `specification.md` linha 15 já usa "restrição de prazo" como **o exemplo** de sinal válido de urgência; Critério de Aceitação (linha 92) exige urgência rastreável a um sinal presente; `tests.md` T03 operacionaliza exatamente isso. A Alternativa A **afirma a intenção já vigente** — por isso `specification.md`/`tests.md`/`examples.md` **não** foram alterados. Reconciliação com o Kernel/BRAND: classificar urgência a partir de um prazo real relatado não é "senso de urgência artificial" — artificial seria inventar urgência sem sinal.

**Evidência que motivou:** Golden Set `2026-07-23` (`claude-sonnet-5`) — o modelo devolveu `urgency: nao_determinado` para o caso da viagem em três meses, divergindo de T03. Adjudicação (PROGRAM-33): responsável = modelo (interpretação estreita "só urgência clínica").

**Implementação (ADR-032):** único ajuste em `prompt.md` do P004 (seções "O QUE VOCÊ DEVE PRODUZIR" → urgency, e "REGRAS") + sincronização da cópia fiel `P004_SYSTEM_PROMPT` em `src/modules/concierge/anthropic-language-model.ts`. Nenhuma `specification.md`/`tests.md`/`examples.md`/fixture alterada.

**Arquivos normativos afetados:** `docs/ace/04-specs/P004-decision-context-modeler/prompt.md`.

**ADR relacionada:** ADR-032.

**Validação:** reexecução do Golden Set (registrada abaixo, seção "2026-07-23").

**Status:** Implementada.

---

## 2026-07-23 — P010 (Final Curadoria Delivery) — "melhor opção" negada rejeitada (CAL-005)

**Categoria:** Adaptação ao comportamento do modelo / correção de implementação.

**Status:** Implementada.

**Gatilho:** Golden Set (`tests/golden/fixtures/p010-final-curadoria-delivery.ts`), execução oficial `2026-07-23`, `claude-sonnet-5`.

**Evidência observada:** o modelo produziu `"melhor opção"` **apenas em forma negada/protetora** — amostra real (decisionSummary): _"Essa aprovação não representa um ranking nem uma recomendação de 'melhor opção'"_ — exatamente o enquadramento anti-ranking que a `specification.md` do P010 exige. `"melhor opção"` estava em `ABSOLUTE_FORBIDDEN_PHRASES` (proibida mesmo negada), então `assertNoForbiddenLanguage` bloqueou (`VALIDATION_FAILED`). Defesa em profundidade funcionou (artefato nunca criado), mas o bloqueio incidiu sobre linguagem segura.

**Matriz de calibração:**

- Filosofia desejada: nunca apresentar a curadoria como "melhor opção"; a escolha é do cliente.
- Regra normativa: inalterada — `specification.md`/Kernel proíbem vocabulário de ranking; ambos exigem/permitem **negá-lo** no texto.
- Divergência: verificação por substring absoluta vs. negação legítima — mesma classe de CAL-001 ("ranking") e CAL-004 ("mais indicado").
- Menor ajuste: mover `"melhor opção"` de `ABSOLUTE_FORBIDDEN_PHRASES` para `CONTEXTUAL_FORBIDDEN_PHRASES`, reutilizando a infraestrutura de cláusula local existente (nenhuma lógica nova).
- Impacto em produção: baixo — uso afirmado continua bloqueado; só a negação explícita passa.

**Decisão tomada (Calibration Board / ADR-032):** Alternativa B do board — promover para CONTEXTUAL, por paridade com CAL-001/CAL-004.

**Implementação:** `final-curadoria.ts` — `"melhor opção"` removido de `ABSOLUTE_FORBIDDEN_PHRASES`, adicionado a `CONTEXTUAL_FORBIDDEN_PHRASES`. Comentários atualizados. `tests/unit/ace-final-curadoria.test.ts` — 8 novos casos (negação aceita; afirmação e ruptura de oração rejeitadas). O teste existente de uso afirmado permanece verde.

**Arquivos normativos afetados:** nenhum — `specification.md`/`prompt.md` do P010 inalterados; a mudança é só no mecanismo de verificação.

**ADR relacionada:** ADR-032.

**Validação:** testes determinísticos (`ace-final-curadoria.test.ts`) + reexecução do Golden Set (abaixo).

**Revisitar quando:** o mesmo padrão (frase da lista negada legitimamente) aparecer para outra entrada de `ABSOLUTE_FORBIDDEN_PHRASES` — cada promoção exige sua própria calibração, nunca em lote.

---

## 2026-07-23 — P003 (Case Audit) — saída fora do schema (ACE_MODEL_INVALID_RESPONSE)

**Categoria:** Adaptação ao comportamento do modelo (robustez de formato).

**Status:** Aprovada — sem alteração (robustez aceitável).

**Gatilho:** Golden Set (`tests/golden/fixtures/p003-case-audit.ts`, "caso limpo"), execução oficial `2026-07-23`, `claude-sonnet-5`.

**Evidência observada:** para o caso limpo, a resposta do modelo não passou o `P003_RESPONSE_SCHEMA` (Zod) — `ACE_MODEL_INVALID_RESPONSE`, `output: null`. Falha estocástica de **forma**, não de conteúdo; o guard funcionou (status `error`, protocolo não avançou, nada persistido).

**Decisão tomada (Calibration Board / ADR-032):** **nenhuma alteração** — robustez aceitável, não bloqueador. Em produção resolve por reexecução idempotente (RUNBOOK §6.1), sob vigília humana no Shadow Launch. Distinta da entrada P003 de 2026-07-14 (classificação incorreta de bloqueio → ADR-024); esta é robustez de schema.

**Arquivos normativos afetados:** nenhum.

**ADR relacionada:** ADR-032 (registro da decisão; nenhuma implementação).

**Validação:** Golden Set (a falha é estocástica — pode ou não reaparecer em reexecuções).

**Revisitar quando:** a taxa de `ACE_MODEL_INVALID_RESPONSE` do P003 se mostrar sistemática no Shadow Launch (Command Center) — aí sim seria robustez de `prompt.md` a investigar.

---

## 2026-07-23 (reexecução pós-ADR-032) — P010 — fixture do disclaimer é literal demais (`/não substitui/`)

**Categoria:** Correção de fixture (fragilidade de asserção) — ainda pendente de decisão.

**Status:** Em análise. **Fora do escopo do ADR-032** (que autorizou só o guard do P010, nunca fixtures).

**Gatilho:** reexecução do Golden Set (`2026-07-23T08-13-28`, `claude-sonnet-5`) após implementar CAL-005. Com o guard corrigido, a FinalCuradoria foi **construída com sucesso** — a falha migrou para a asserção da fixture.

**Evidência observada:** `p010-final-curadoria-delivery.ts` verifica `disclaimer.toMatch(/não substitui/)`. O modelo produziu um disclaimer **semanticamente equivalente e conforme** — _"não constitui diagnóstico, indicação de tratamento ou substituto de consulta médica"_ — mas com "substituto de" em vez da literal "não substitui". A exigência do Método (disclaimer de que a curadoria não substitui consulta/diagnóstico/tratamento) está **cumprida**; a asserção é que é frágil (match literal). Mesma classe de fragilidade que o `types.ts` das fixtures adverte: _"assert verifica REGRA, nunca igualdade textual"_.

**Decisão tomada:** nenhuma — aguarda o responsável. Candidata a ajuste da fixture para verificar a **regra** (menção a não-substituição de consulta/diagnóstico/tratamento) por um padrão semântico mais robusto (ex.: `/substitu/` cobrindo "substitui"/"substituto"), nunca uma nova literal frágil.

**Arquivos normativos afetados:** nenhum. **ADR relacionada:** nenhuma (fixture, não guard/prompt/spec).

**Revisitar quando:** o responsável autorizar um ajuste de fixture (fora do ADR-032).

---

## 2026-07-23 (reexecução pós-ADR-032) — P003 — "caso limpo" produz warnings válidos (READY_WITH_WARNINGS)

**Categoria:** Fidelidade prompt↔fixture — ainda pendente de decisão.

**Status:** Em análise. **Fora do escopo do ADR-032** (autorizou só P004 e P010).

**Gatilho:** reexecução do Golden Set (`2026-07-23T08-13-28`, `claude-sonnet-5`).

**Evidência observada:** para o caso limpo, o modelo devolveu `status: READY_WITH_WARNINGS` com 5 achados, **todos `severity: warning`** e `relatedField: other`/`goal` (modalidade, localização, horário, orçamento ausentes + uma ambiguidade sobre o objetivo). Isso é **conforme** à `specification.md` do P003 (Casos de Exceção: lacuna opcional ausente = Warning, nunca bloqueio — e o Content Invariant ADR-024 **não** foi violado nesta rodada). A fixture, porém, espera `READY` com **zero** achados (_"o modelo não deve inventar achado"_). Divergência: a fixture assume que o caso limpo não deve sinalizar lacunas práticas opcionais; a spec permite sinalizá-las como warnings. Estocástico (rodada anterior falhou por schema inválido; esta por warnings válidos).

**Decisão tomada:** nenhuma — aguarda o responsável decidir se o caso limpo deve ser estritamente `READY` (ajuste de `prompt.md` para não emitir warnings opcionais não solicitados) **ou** se `READY_WITH_WARNINGS` com warnings válidos é aceitável (ajuste da fixture). Relaciona-se à entrada P003 de 2026-07-14 (fidelidade prompt↔spec) e ao ADR-024.

**Arquivos normativos afetados:** nenhum. **ADR relacionada:** relacionada a ADR-024 (não implementada).

**Revisitar quando:** o responsável autorizar (fora do ADR-032) a decisão acima.

---

## Relação com ADR-022

A ADR-022 (`docs/DECISIONS.md`) torna o Golden Set (`tests/golden/`) um requisito obrigatório de governança para qualquer mudança futura de prompt, modelo, SDK ou provider dos protocolos P002/P003/P004/P010. Este Calibration Report não substitui nem estende essa ADR — ele registra o que foi _aprendido_ a partir do gate que a ADR-022 formalizou.

Divisão de responsabilidade:

- **Golden Set** produz evidência empírica (o que o modelo realmente fez, contra um caso conhecido).
- **ACE Calibration Report** registra a interpretação dessa evidência e o histórico de cada calibração — inclusive quando a conclusão é "nenhuma decisão ainda".
- **Camadas normativas** (Constituição, Framework, Ontologia, Kernel, `specification.md`, `prompt.md`) continuam sendo o único lugar onde uma regra do Método de fato muda — nenhuma entrada deste documento, por si só, altera qualquer uma delas.
